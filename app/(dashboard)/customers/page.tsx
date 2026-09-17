'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useBusinessSettings } from '@/providers/theme-provider';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Edit2,
  Trash2,
  DollarSign,
} from 'lucide-react';

interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  company?: string;
  totalReceivable: number;
  totalPurchased: number;
  createdAt: string;
}

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const { settings } = useBusinessSettings();
  const currency = settings?.localization?.currencySymbol || '$';

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [viewLedgerCustomer, setViewLedgerCustomer] = useState<Customer | null>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    address: '',
  });

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', { search, page }],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit };
      if (search) params.search = search;
      const res: any = await api.get('/customers', { params });
      return res.data;
    },
  });

  // Query Customer Ledger
  const { data: ledgerData, isLoading: isLoadingLedger } = useQuery({
    queryKey: ['customer-ledger', viewLedgerCustomer?._id],
    enabled: !!viewLedgerCustomer,
    queryFn: async () => {
      const res: any = await api.get(`/customers/${viewLedgerCustomer?._id}/ledger`);
      return res.data;
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: any) => api.post('/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteTarget(null);
    },
  });

  const resetForm = () => {
    setEditingCustomer(null);
    setForm({ name: '', phone: '', email: '', company: '', address: '' });
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      company: customer.company || '',
      address: customer.address || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer._id, data: form });
    } else {
      createCustomerMutation.mutate(form);
    }
  };

  const customers: Customer[] = customersData?.items || [];
  const totalCount = customersData?.total || 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Customers Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track customer contact information, purchase history, and outstanding receivables balance.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Customer
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers by name, phone, email, company..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Customer Name</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Address / Location</th>
                <th className="py-3.5 px-4 text-right">Total Purchased</th>
                <th className="py-3.5 px-4 text-right">Outstanding Due</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading customers...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6">
                      <p className="font-semibold text-slate-900 dark:text-white">{c.name}</p>
                      {c.company && (
                        <p className="text-xs text-slate-400">{c.company}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {c.phone}
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {c.email}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                      {c.address ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-xs">{c.address}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(c.totalPurchased || 0, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {c.totalReceivable > 0 ? (
                        <span className="font-bold text-rose-600">
                          {formatCurrency(c.totalReceivable, currency)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">$0.00</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewLedgerCustomer(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors"
                          title="View Ledger Statement"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalCount > limit && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs text-slate-500">
            <span>
              Showing {Math.min((page - 1) * limit + 1, totalCount)} -{' '}
              {Math.min(page * limit, totalCount)} of {totalCount} customers
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

      {/* Customer Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company / Business Name
            </label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Physical / Billing Address
            </label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createCustomerMutation.isPending || updateCustomerMutation.isPending}
            >
              {editingCustomer ? 'Update Customer' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer Ledger Statement Drawer/Modal */}
      <Modal
        isOpen={!!viewLedgerCustomer}
        onClose={() => setViewLedgerCustomer(null)}
        title={`Statement for ${viewLedgerCustomer?.name || ''}`}
        maxWidth="2xl"
      >
        {viewLedgerCustomer && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {viewLedgerCustomer.name}
                </p>
                <p className="text-slate-500">{viewLedgerCustomer.phone || viewLedgerCustomer.email || '-'}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Total Due Receivable</span>
                <span className="text-lg font-bold text-rose-600">
                  {formatCurrency(viewLedgerCustomer.totalReceivable, currency)}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Type / Invoice</th>
                    <th className="p-2.5 text-right">Debit / Billed</th>
                    <th className="p-2.5 text-right">Credit / Paid</th>
                    <th className="p-2.5 text-right">Due Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoadingLedger ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Loading statement records...
                      </td>
                    </tr>
                  ) : !ledgerData?.entries || ledgerData.entries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No transactions found for this customer.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.entries.map((entry: any, i: number) => (
                      <tr key={i}>
                        <td className="p-2.5 text-slate-500 font-mono">{formatDate(entry.date)}</td>
                        <td className="p-2.5 font-medium">{entry.reference || entry.type}</td>
                        <td className="p-2.5 text-right font-semibold">
                          {entry.debit ? formatCurrency(entry.debit, currency) : '-'}
                        </td>
                        <td className="p-2.5 text-right font-semibold text-emerald-600">
                          {entry.credit ? formatCurrency(entry.credit, currency) : '-'}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(entry.balance, currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setViewLedgerCustomer(null)}>
                Close Statement
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Customer"
        message={`Are you sure you want to remove customer "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteCustomerMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteCustomerMutation.mutate(deleteTarget._id);
        }}
      />
    </div>
  );
}
