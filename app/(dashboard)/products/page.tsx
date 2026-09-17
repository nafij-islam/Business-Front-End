'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useBusinessSettings } from '@/providers/theme-provider';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Barcode,
  Layers,
  CheckCircle2,
  Tag,
  Boxes,
} from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  category?: { _id: string; name: string };
  brand?: { _id: string; name: string };
  unit?: { _id: string; name: string; symbol: string };
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  lowStockAlert: number;
  isActive: boolean;
  notes?: string;
  customAttributes?: { key: string; value: string }[];
}

interface Category {
  _id: string;
  name: string;
}

interface Brand {
  _id: string;
  name: string;
}

interface Unit {
  _id: string;
  name: string;
  symbol: string;
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { settings } = useBusinessSettings();
  const currency = settings?.localization?.currencySymbol || '$';

  // Filters & Pagination state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [stockStatus, setStockStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'archived'>('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);
  const [restoreProductTarget, setRestoreProductTarget] = useState<Product | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brandId: '',
    unitId: '',
    purchasePrice: 0,
    sellingPrice: 0,
    openingStock: 0,
    lowStockAlert: settings?.inventory?.defaultLowStockThreshold || 5,
    notes: '',
    customAttributes: [] as { key: string; value: string }[],
  });

  const [newCategoryName, setNewCategoryName] = useState('');

  // Fetch Products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { search, selectedCategory, selectedBrand, stockStatus, page }],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit };
      if (search) params.search = search;
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedBrand) params.brandId = selectedBrand;
      if (stockStatus === 'archived') {
        params.isActive = false;
      } else if (stockStatus === 'low_stock') {
        params.lowStockOnly = true;
      } else if (stockStatus === 'out_of_stock') {
        params.outOfStockOnly = true;
      } else if (stockStatus === 'in_stock') {
        params.inStockOnly = true;
      }
      const res: any = await api.get('/products', { params });
      return res.data;
    },
  });

  // Fetch Supporting Dropdowns
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res: any = await api.get('/categories');
      return res.data || [];
    },
  });

  const { data: brands } = useQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: async () => {
      const res: any = await api.get('/brands');
      return res.data || [];
    },
  });

  const { data: units } = useQuery<Unit[]>({
    queryKey: ['units'],
    queryFn: async () => {
      const res: any = await api.get('/units');
      return res.data || [];
    },
  });

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: (data: any) => api.post('/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsProductModalOpen(false);
      resetForm();
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsProductModalOpen(false);
      resetForm();
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteProductTarget(null);
    },
  });

  const restoreProductMutation = useMutation({
    mutationFn: (id: string) => api.post(`/products/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setRestoreProductTarget(null);
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => api.post('/categories', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
    },
  });

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      categoryId: '',
      brandId: '',
      unitId: '',
      purchasePrice: 0,
      sellingPrice: 0,
      openingStock: 0,
      lowStockAlert: settings?.inventory?.defaultLowStockThreshold || 5,
      notes: '',
      customAttributes: [],
    });
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      categoryId: product.category?._id || '',
      brandId: product.brand?._id || '',
      unitId: product.unit?._id || '',
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      openingStock: 0, // Opening stock only applicable on creation
      lowStockAlert: product.lowStockAlert,
      notes: product.notes || '',
      customAttributes: product.customAttributes || [],
    });
    setIsProductModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: formData.name,
      sku: formData.sku,
      barcode: formData.barcode || undefined,
      category: formData.categoryId || undefined,
      brand: formData.brandId || undefined,
      unit: formData.unitId || undefined,
      purchasePrice: Number(formData.purchasePrice),
      sellingPrice: Number(formData.sellingPrice),
      lowStockAlert: Number(formData.lowStockAlert),
      notes: formData.notes || undefined,
      customAttributes: formData.customAttributes.filter((attr) => attr.key.trim() && attr.value.trim()),
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct._id, data: payload });
    } else {
      payload.openingStock = Number(formData.openingStock) || 0;
      createProductMutation.mutate(payload);
    }
  };

  const addCustomAttribute = () => {
    setFormData({
      ...formData,
      customAttributes: [...formData.customAttributes, { key: '', value: '' }],
    });
  };

  const updateCustomAttribute = (index: number, key: string, value: string) => {
    const updated = [...formData.customAttributes];
    updated[index] = { key, value };
    setFormData({ ...formData, customAttributes: updated });
  };

  const removeCustomAttribute = (index: number) => {
    setFormData({
      ...formData,
      customAttributes: formData.customAttributes.filter((_, i) => i !== index),
    });
  };

  const products: Product[] = productsData?.items || productsData?.products || [];
  const total = productsData?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Product Catalog
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your master inventory items, pricing, SKU codes, and stock thresholds.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCategoryModalOpen(true)}
          >
            <Tag className="w-4 h-4 mr-1.5" />
            Categories
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, SKU, barcode..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900 dark:text-white"
            >
              <option value="">All Brands</option>
              {brands?.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div>
            <select
              value={stockStatus}
              onChange={(e: any) => {
                setStockStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="in_stock">In Stock (&gt; Low Threshold)</option>
              <option value="low_stock">⚠️ Low Stock</option>
              <option value="out_of_stock">🚫 Out of Stock (0)</option>
              <option value="archived">Archived Products</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Product Details</th>
                <th className="py-3.5 px-4">SKU / Barcode</th>
                <th className="py-3.5 px-4">Category / Brand</th>
                <th className="py-3.5 px-4 text-right">Cost Price</th>
                <th className="py-3.5 px-4 text-right">Selling Price</th>
                <th className="py-3.5 px-4 text-center">Stock Level</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading products catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="w-10 h-10 text-slate-300" />
                      <p className="font-medium text-slate-600 dark:text-slate-300">No products found</p>
                      <p className="text-xs text-slate-400">Try adjusting your filters or click Add Product to create one.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isLow = product.currentStock > 0 && product.currentStock <= product.lowStockAlert;
                  const isOut = product.currentStock <= 0;

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {product.name}
                          </p>
                          {product.notes && (
                            <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                              {product.notes}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="text-slate-900 dark:text-slate-200 font-medium">
                          {product.sku}
                        </div>
                        {product.barcode && (
                          <div className="text-slate-400 flex items-center gap-1 mt-0.5">
                            <Barcode className="w-3 h-3" />
                            {product.barcode}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {product.category?.name || 'Uncategorized'}
                        </div>
                        {product.brand?.name && (
                          <div className="text-xs text-slate-400 mt-0.5">
                            {product.brand.name}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-400">
                        {formatCurrency(product.purchasePrice, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(product.sellingPrice, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            isOut
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                              : isLow
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          }`}
                        >
                          {product.currentStock} {product.unit?.symbol || 'units'}
                        </span>
                        {isLow && (
                          <span className="block text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                            Alert &le; {product.lowStockAlert}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {product.isActive ? (
                          <Badge variant="success" size="sm">Active</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">Archived</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {product.isActive ? (
                            <button
                              onClick={() => setDeleteProductTarget(product)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                              title="Archive Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setRestoreProductTarget(product)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                              title="Restore Product"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {total > limit && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs text-slate-500">
            <span>
              Showing {Math.min((page - 1) * limit + 1, total)} -{' '}
              {Math.min(page * limit, total)} of {total} products
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-300">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Product Add/Edit Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        description={
          editingProduct
            ? `Update details for SKU ${editingProduct.sku}`
            : 'Fill in the specifications to add a new inventory item.'
        }
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Wireless Ergonomic Mouse"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SKU / Item Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="e.g. LOGI-M720"
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Barcode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Barcode / UPC / EAN
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="e.g. 097855123456"
                className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="">Select Category</option>
                {categories?.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Brand
              </label>
              <select
                value={formData.brandId}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="">Select Brand</option>
                {brands?.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit of Measurement
              </label>
              <select
                value={formData.unitId}
                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="">Select Unit</option>
                {units?.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Low Stock Alert */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="0"
                value={formData.lowStockAlert}
                onChange={(e) => setFormData({ ...formData, lowStockAlert: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            {/* Cost Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cost Price ({currency}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Selling Price ({currency}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            {/* Opening Stock (Only for new products) */}
            {!editingProduct && (
              <div className="sm:col-span-2 bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 rounded-xl p-3">
                <label className="block text-xs font-semibold text-teal-900 dark:text-teal-300 mb-1">
                  Opening Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.openingStock}
                  onChange={(e) => setFormData({ ...formData, openingStock: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800 rounded-lg text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-teal-700 dark:text-teal-400 mt-1">
                  If set, an automatic opening stock transaction will be recorded upon creation.
                </p>
              </div>
            )}

            {/* Custom Attributes */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Custom Industry Attributes (Color, Size, Expiry, Specs, etc.)
                </span>
                <button
                  type="button"
                  onClick={addCustomAttribute}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  + Add Attribute
                </button>
              </div>
              {formData.customAttributes.map((attr, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Attribute name (e.g. Color)"
                    value={attr.key}
                    onChange={(e) => updateCustomAttribute(idx, e.target.value, attr.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Midnight Blue)"
                    value={attr.value}
                    onChange={(e) => updateCustomAttribute(idx, attr.key, e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeCustomAttribute(idx)}
                    className="text-rose-500 hover:text-rose-700 text-xs px-2 py-1"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsProductModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createProductMutation.isPending || updateProductMutation.isPending}
            >
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Quick Add Category"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category Name
            </label>
            <input
              type="text"
              placeholder="e.g. Electronics, Perishables, Apparel"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!newCategoryName.trim()}
              isLoading={createCategoryMutation.isPending}
              onClick={() => createCategoryMutation.mutate(newCategoryName)}
            >
              Add Category
            </Button>
          </div>
        </div>
      </Modal>

      {/* Archive Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteProductTarget}
        onClose={() => setDeleteProductTarget(null)}
        title="Archive Product"
        message={`Are you sure you want to archive "${deleteProductTarget?.name}"? It will be hidden from new sales and purchases, but its historical audit logs and reports will be preserved.`}
        confirmLabel="Archive"
        variant="danger"
        isLoading={deleteProductMutation.isPending}
        onConfirm={() => {
          if (deleteProductTarget) {
            deleteProductMutation.mutate(deleteProductTarget._id);
          }
        }}
      />

      {/* Restore Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!restoreProductTarget}
        onClose={() => setRestoreProductTarget(null)}
        title="Restore Product"
        message={`Restore "${restoreProductTarget?.name}" to active status? It will be available for new transactions.`}
        confirmLabel="Restore"
        variant="primary"
        isLoading={restoreProductMutation.isPending}
        onConfirm={() => {
          if (restoreProductTarget) {
            restoreProductMutation.mutate(restoreProductTarget._id);
          }
        }}
      />
    </div>
  );
}
