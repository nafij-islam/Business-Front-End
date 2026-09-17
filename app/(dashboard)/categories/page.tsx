'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FolderTree, Tag, Layers, Plus, Trash2, Edit2 } from 'lucide-react';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'categories' | 'brands' | 'units'>('categories');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [symbol, setSymbol] = useState('');

  // Queries
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res: any = await api.get('/categories');
      return res.data || [];
    },
  });

  const { data: brands = [], isLoading: isLoadingBrands } = useQuery<any[]>({
    queryKey: ['brands'],
    queryFn: async () => {
      const res: any = await api.get('/brands');
      return res.data || [];
    },
  });

  const { data: units = [], isLoading: isLoadingUnits } = useQuery<any[]>({
    queryKey: ['units'],
    queryFn: async () => {
      const res: any = await api.get('/units');
      return res.data || [];
    },
  });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => api.post('/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeModal();
    },
  });

  const createBrandMutation = useMutation({
    mutationFn: (data: any) => api.post('/brands', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      closeModal();
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: (data: any) => api.post('/units', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (target: { type: string; id: string }) => api.delete(`/${target.type}/${target.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setDeleteTarget(null);
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setName('');
    setDescription('');
    setSymbol('');
  };

  const handleOpenAdd = () => {
    closeModal();
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (activeTab === 'categories') {
      createCategoryMutation.mutate({ name, description });
    } else if (activeTab === 'brands') {
      createBrandMutation.mutate({ name, description });
    } else if (activeTab === 'units') {
      createUnitMutation.mutate({ name, symbol: symbol || name.slice(0, 3).toLowerCase() });
    }
  };

  const currentItems =
    activeTab === 'categories' ? categories : activeTab === 'brands' ? brands : units;

  const isLoading =
    activeTab === 'categories'
      ? isLoadingCategories
      : activeTab === 'brands'
      ? isLoadingBrands
      : isLoadingUnits;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Categories, Brands & Units
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize catalog hierarchy, brand trademarks, and measurement standards.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add{' '}
          {activeTab === 'categories'
            ? 'Category'
            : activeTab === 'brands'
            ? 'Brand'
            : 'Unit of Measure'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('brands')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'brands'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          Brands ({brands.length})
        </button>
        <button
          onClick={() => setActiveTab('units')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'units'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Units of Measure ({units.length})
        </button>
      </div>

      {/* Content Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Name</th>
                <th className="py-3 px-4">
                  {activeTab === 'units' ? 'Symbol / Abbreviation' : 'Description'}
                </th>
                <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400">
                    No items defined. Click Add to create one.
                  </td>
                </tr>
              ) : (
                currentItems.map((item: any) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 sm:px-6 font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">
                      {activeTab === 'units' ? item.symbol : item.description || '-'}
                    </td>
                    <td className="py-3 px-4 sm:px-6 text-right">
                      <button
                        onClick={() => setDeleteTarget({ type: activeTab, id: item._id, name: item.name })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={`Add New ${
          activeTab === 'categories'
            ? 'Category'
            : activeTab === 'brands'
            ? 'Brand'
            : 'Unit of Measure'
        }`}
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                activeTab === 'categories'
                  ? 'e.g. Perishables, Electronics'
                  : activeTab === 'brands'
                  ? 'e.g. Sony, Samsung, Apple'
                  : 'e.g. Kilogram, Piece, Box'
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          {activeTab === 'units' ? (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Symbol / Abbreviation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. kg, pcs, box, ltr"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={
                createCategoryMutation.isPending ||
                createBrandMutation.isPending ||
                createUnitMutation.isPending
              }
            >
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget);
        }}
      />
    </div>
  );
}
