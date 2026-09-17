'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useBusinessSettings } from '@/providers/theme-provider';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { StatCard } from '@/components/ui/stat-card';
import {
  CreditCard,
  Plus,
  Search,
  Tag,
  TrendingDown,
  Receipt,
  Calendar,
  Layers,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ExpenseItem {
  _id: string;
  title: string;
  amount: number;
  category: { _id: string; name: string };
  paymentMethod: string;
  date: string;
  reference?: string;
  notes?: string;
  recordedBy?: { name: string };
}

interface ExpenseCategory {
  _id: string;
  name: string;
}

const COLORS = ['#0d9488', '#0284c7', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#64748b'];

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const { settings } = useBusinessSettings();
  const currency = settings?.localization?.currencySymbol || '$';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Add Expense Form
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: 0,
    categoryId: '',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
  });

  // Query: Expenses List
  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses', { search, selectedCategory, page }],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit };
      if (search) params.search = search;
      if (selectedCategory) params.categoryId = selectedCategory;
      const res: any = await api.get('/expenses', { params });
      return res.data;
    },
  });

  // Query: Expense Summary (Breakdown)
  const { data: summaryData } = useQuery({
    queryKey: ['expenses-summary'],
    queryFn: async () => {
      const res: any = await api.get('/expenses/summary');
      return res.data;
    },
  });

  // Query: Categories
  const { data: categories } = useQuery<ExpenseCategory[]>({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res: any = await api.get('/expenses/categories');
      return res.data || [];
    },
  });

  // Mutations
  const createExpenseMutation = useMutation({
    mutationFn: (payload: any) => api.post('/expenses', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsAddExpenseOpen(false);
      resetForm();
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => api.post('/expenses/categories', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
    },
  });

  const resetForm = () => {
    setExpenseForm({
      title: '',
      amount: 0,
      categoryId: '',
      paymentMethod: 'cash',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.categoryId || expenseForm.amount <= 0) return;

    createExpenseMutation.mutate({
      title: expenseForm.title,
      amount: Number(expenseForm.amount),
      categoryId: expenseForm.categoryId,
      paymentMethod: expenseForm.paymentMethod,
      date: expenseForm.date,
      reference: expenseForm.reference || undefined,
      notes: expenseForm.notes || undefined,
    });
  };

  const expenses: ExpenseItem[] = expensesData?.items || [];
  const totalCount = expensesData?.total || 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  const breakdown = summaryData?.categoryBreakdown || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Operational Expenses
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track utilities, rent, salaries, packaging, and overhead costs affecting net operating profit.
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
            onClick={() => {
              resetForm();
              setIsAddExpenseOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Top Cards & Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 space-y-4">
          <StatCard
            title="Total Operating Expenses"
            value={formatCurrency(summaryData?.totalExpenses || 0, currency)}
            subtitle={`Across ${summaryData?.count || 0} recorded vouchers`}
            icon={TrendingDown}
            color="rose"
          />
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Expense Categories Breakdown
            </h3>
            <div className="space-y-2 text-xs">
              {breakdown.length === 0 ? (
                <p className="text-slate-400 py-3 text-center">No category breakdown data.</p>
              ) : (
                breakdown.map((b: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {b.categoryName || 'General'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(b.totalAmount, currency)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Expense Distribution by Category
          </h3>
          {breakdown.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown}
                    dataKey="totalAmount"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {breakdown.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => formatCurrency(val, currency)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs">
              Add your first expense to see the visual category distribution.
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search expense description, reference..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-56 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
        >
          <option value="">All Expense Categories</option>
          {categories?.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Date</th>
                <th className="py-3.5 px-4">Title / Description</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Reference</th>
                <th className="py-3.5 px-4 sm:px-6">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading expense vouchers...</span>
                    </div>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                expenses.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-500 font-mono">
                      {formatDate(item.date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      {item.notes && (
                        <p className="text-xs text-slate-400 mt-0.5">{item.notes}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="purple" size="sm">
                        {item.category?.name || 'General'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                      {formatCurrency(item.amount, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {item.paymentMethod.replace(/_/g, ' ').toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                      {item.reference || '-'}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-500">
                      {item.recordedBy?.name || 'Admin'}
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
              {Math.min(page * limit, totalCount)} of {totalCount} records
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

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="Record Operating Expense"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Electricity Bill, Store Rent, Packaging Materials"
              value={expenseForm.title}
              onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount ({currency}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 font-bold text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={expenseForm.categoryId}
                onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="">-- Choose Category --</option>
                {categories?.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={expenseForm.paymentMethod}
                onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Company Card</option>
                <option value="mobile_money">Mobile Wallet</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reference / Receipt Voucher #
            </label>
            <input
              type="text"
              placeholder="e.g. REC-89211"
              value={expenseForm.reference}
              onChange={(e) => setExpenseForm({ ...expenseForm, reference: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={expenseForm.notes}
              onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddExpenseOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createExpenseMutation.isPending}
            >
              Record Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Expense Categories"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
            <Button
              variant="primary"
              size="sm"
              disabled={!newCategoryName.trim()}
              isLoading={createCategoryMutation.isPending}
              onClick={() => createCategoryMutation.mutate(newCategoryName)}
            >
              Add
            </Button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
            {categories?.map((cat) => (
              <div key={cat._id} className="p-2.5 flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
