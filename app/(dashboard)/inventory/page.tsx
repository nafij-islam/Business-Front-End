'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useBusinessSettings } from '@/providers/theme-provider';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { StatCard } from '@/components/ui/stat-card';
import {
  Boxes,
  ArrowDownRight,
  ArrowUpRight,
  Sliders,
  History,
  Search,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle,
  Package,
} from 'lucide-react';

interface ProductItem {
  _id: string;
  name: string;
  sku: string;
  category?: { name: string };
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  lowStockAlert: number;
  unit?: { symbol: string };
}

interface StockTransaction {
  _id: string;
  product: { _id: string; name: string; sku: string };
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  reason?: string;
  performedBy?: { name: string };
  createdAt: string;
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { settings } = useBusinessSettings();
  const currency = settings?.localization?.currencySymbol || '$';

  const [activeTab, setActiveTab] = useState<'stock' | 'transactions'>('stock');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals state
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedProductForAction, setSelectedProductForAction] = useState<ProductItem | null>(null);

  // Forms
  const [stockInForm, setStockInForm] = useState({
    productId: '',
    quantity: 1,
    unitCost: 0,
    note: '',
    batchNumber: '',
  });

  const [stockOutForm, setStockOutForm] = useState({
    productId: '',
    quantity: 1,
    reason: 'damage',
    note: '',
  });

  const [adjustForm, setAdjustForm] = useState({
    productId: '',
    actualQuantity: 0,
    reason: 'Physical count audit',
    note: '',
  });

  // Query: Inventory Valuation KPIs
  const { data: valuationData } = useQuery({
    queryKey: ['inventory-valuation'],
    queryFn: async () => {
      const res: any = await api.get('/inventory/valuation');
      return res.data;
    },
  });

  // Query: Products for Stock Table
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-inventory', { search, page }],
    queryFn: async () => {
      const res: any = await api.get('/products', {
        params: { page, limit, search: search || undefined },
      });
      return res.data;
    },
  });

  // Query: All active products for dropdown selection
  const { data: allProducts } = useQuery<ProductItem[]>({
    queryKey: ['all-products-dropdown'],
    queryFn: async () => {
      const res: any = await api.get('/products', { params: { limit: 500, isActive: true } });
      return res.data?.items || [];
    },
  });

  // Query: Stock Movement Transactions
  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['inventory-transactions', { page }],
    enabled: activeTab === 'transactions',
    queryFn: async () => {
      const res: any = await api.get('/inventory/transactions', {
        params: { page, limit },
      });
      return res.data;
    },
  });

  // Mutations
  const stockInMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/stock-in', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-valuation'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsStockInOpen(false);
      setStockInForm({ productId: '', quantity: 1, unitCost: 0, note: '', batchNumber: '' });
    },
  });

  const stockOutMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/stock-out', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-valuation'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsStockOutOpen(false);
      setStockOutForm({ productId: '', quantity: 1, reason: 'damage', note: '' });
    },
  });

  const adjustMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/adjust', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-valuation'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsAdjustOpen(false);
      setAdjustForm({ productId: '', actualQuantity: 0, reason: 'Physical count audit', note: '' });
    },
  });

  const handleOpenStockIn = (product?: ProductItem) => {
    if (product) {
      setStockInForm({
        productId: product._id,
        quantity: 1,
        unitCost: product.purchasePrice || 0,
        note: '',
        batchNumber: '',
      });
    }
    setIsStockInOpen(true);
  };

  const handleOpenStockOut = (product?: ProductItem) => {
    if (product) {
      setStockOutForm({
        productId: product._id,
        quantity: 1,
        reason: 'damage',
        note: '',
      });
    }
    setIsStockOutOpen(true);
  };

  const handleOpenAdjust = (product?: ProductItem) => {
    if (product) {
      setAdjustForm({
        productId: product._id,
        actualQuantity: product.currentStock,
        reason: 'Physical count verification',
        note: '',
      });
    }
    setIsAdjustOpen(true);
  };

  const products: ProductItem[] = productsData?.items || [];
  const totalProducts = productsData?.total || 0;
  const totalPages = Math.ceil(totalProducts / limit) || 1;

  const transactions: StockTransaction[] = transactionsData?.items || [];
  const totalTransactions = transactionsData?.total || 0;
  const totalTransPages = Math.ceil(totalTransactions / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Inventory & Stock Control
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time stock valuation, manual movements, adjustments, and immutable audit ledger.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenStockIn()}
          >
            <ArrowDownRight className="w-4 h-4 text-emerald-600 mr-1.5" />
            Stock In
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenStockOut()}
          >
            <ArrowUpRight className="w-4 h-4 text-rose-600 mr-1.5" />
            Stock Out
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenAdjust()}
          >
            <Sliders className="w-4 h-4 mr-1.5" />
            Adjust Stock
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Stock Valuation (Cost)"
          value={formatCurrency(valuationData?.totalValuationCost || 0, currency)}
          subtitle="At actual purchase cost"
          icon={Boxes}
          color="teal"
        />
        <StatCard
          title="Potential Sales Value"
          value={formatCurrency(valuationData?.totalValuationRetail || 0, currency)}
          subtitle="At current retail pricing"
          icon={Boxes}
          color="indigo"
        />
        <StatCard
          title="Total Stock Units"
          value={valuationData?.totalUnitsInStock || 0}
          subtitle="Cumulative items on hand"
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Low Stock Warnings"
          value={valuationData?.lowStockCount || 0}
          subtitle="Products below reorder threshold"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => {
            setActiveTab('stock');
            setPage(1);
          }}
          className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'stock'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Current Stock Levels
        </button>
        <button
          onClick={() => {
            setActiveTab('transactions');
            setPage(1);
          }}
          className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'transactions'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          Stock Movement Ledger
        </button>
      </div>

      {activeTab === 'stock' ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search inventory by product name or SKU..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Current Stock Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Product / SKU</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-right">Cost Price</th>
                    <th className="py-3.5 px-4 text-center">Available Stock</th>
                    <th className="py-3.5 px-4 text-right">Total Cost Value</th>
                    <th className="py-3.5 px-4 text-right">Total Retail Value</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {isLoadingProducts ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                          <span>Loading inventory levels...</span>
                        </div>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No inventory matching your query.
                      </td>
                    </tr>
                  ) : (
                    products.map((item) => {
                      const totalCost = item.currentStock * item.purchasePrice;
                      const totalRetail = item.currentStock * item.sellingPrice;
                      const isLow = item.currentStock > 0 && item.currentStock <= item.lowStockAlert;
                      const isOut = item.currentStock <= 0;

                      return (
                        <tr
                          key={item._id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 sm:px-6">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {item.name}
                            </p>
                            <p className="text-xs font-mono text-slate-400 mt-0.5">
                              {item.sku}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            {item.category?.name || 'General'}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-400">
                            {formatCurrency(item.purchasePrice, currency)}
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
                              {item.currentStock} {item.unit?.symbol || 'units'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium text-slate-800 dark:text-slate-200">
                            {formatCurrency(totalCost, currency)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(totalRetail, currency)}
                          </td>
                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenStockIn(item)}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                                title="Stock In"
                              >
                                <ArrowDownRight className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenStockOut(item)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                                title="Stock Out"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenAdjust(item)}
                                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Adjust"
                              >
                                <Sliders className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalProducts > limit && (
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs text-slate-500">
                <span>
                  Showing {Math.min((page - 1) * limit + 1, totalProducts)} -{' '}
                  {Math.min(page * limit, totalProducts)} of {totalProducts} items
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
        </div>
      ) : (
        /* Stock Movement Ledger Table */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Date & Time</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Movement Type</th>
                  <th className="py-3.5 px-4 text-center">Change Qty</th>
                  <th className="py-3.5 px-4 text-center">Balance Before / After</th>
                  <th className="py-3.5 px-4">Reason / Notes</th>
                  <th className="py-3.5 px-4 sm:px-6">Handled By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {isLoadingTransactions ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                        <span>Loading movement history...</span>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No stock movement records found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isPositive = tx.quantity > 0;
                    return (
                      <tr
                        key={tx._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-500 font-mono">
                          {formatDateTime(tx.createdAt)}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {tx.product?.name || 'Deleted Product'}
                          </p>
                          <p className="text-xs font-mono text-slate-400">
                            {tx.product?.sku}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              tx.type.includes('in') || tx.type.includes('purchase')
                                ? 'success'
                                : tx.type.includes('sale') || tx.type.includes('out')
                                ? 'danger'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {tx.type.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isPositive ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isPositive ? `+${tx.quantity}` : tx.quantity}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-600 dark:text-slate-300">
                          {tx.previousStock} &rarr; <strong className="text-slate-900 dark:text-white">{tx.newStock}</strong>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                          <div>{tx.reason || tx.notes || '-'}</div>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-500">
                          {tx.performedBy?.name || 'System'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalTransactions > limit && (
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs text-slate-500">
              <span>
                Showing {Math.min((page - 1) * limit + 1, totalTransactions)} -{' '}
                {Math.min(page * limit, totalTransactions)} of {totalTransactions} records
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
                  Page {page} of {totalTransPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalTransPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stock In Modal */}
      <Modal
        isOpen={isStockInOpen}
        onClose={() => setIsStockInOpen(false)}
        title="Stock In (Manual Receipt)"
        description="Receive stock units directly into inventory with automatic ledger tracking."
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            stockInMutation.mutate({
              productId: stockInForm.productId,
              quantity: Number(stockInForm.quantity),
              unitCost: Number(stockInForm.unitCost),
              note: stockInForm.note || undefined,
              batchNumber: stockInForm.batchNumber || undefined,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Product <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={stockInForm.productId}
              onChange={(e) => {
                const prod = allProducts?.find((p) => p._id === e.target.value);
                setStockInForm({
                  ...stockInForm,
                  productId: e.target.value,
                  unitCost: prod?.purchasePrice || stockInForm.unitCost,
                });
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="">-- Choose Product --</option>
              {allProducts?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku}) - Current Stock: {p.currentStock}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantity to Inward <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={stockInForm.quantity}
                onChange={(e) => setStockInForm({ ...stockInForm, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit Cost ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={stockInForm.unitCost}
                onChange={(e) => setStockInForm({ ...stockInForm, unitCost: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Batch / Lot Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. BATCH-2026-09"
              value={stockInForm.batchNumber}
              onChange={(e) => setStockInForm({ ...stockInForm, batchNumber: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes / Reference
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Received shipment from warehouse"
              value={stockInForm.note}
              onChange={(e) => setStockInForm({ ...stockInForm, note: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsStockInOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={stockInMutation.isPending}
            >
              Confirm Stock In
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock Out Modal */}
      <Modal
        isOpen={isStockOutOpen}
        onClose={() => setIsStockOutOpen(false)}
        title="Stock Out (Manual Removal)"
        description="Remove stock units due to damage, expiration, internal consumption, or loss."
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            stockOutMutation.mutate({
              productId: stockOutForm.productId,
              quantity: Number(stockOutForm.quantity),
              reason: stockOutForm.reason,
              note: stockOutForm.note || undefined,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Product <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={stockOutForm.productId}
              onChange={(e) => setStockOutForm({ ...stockOutForm, productId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="">-- Choose Product --</option>
              {allProducts?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku}) - Current Stock: {p.currentStock}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quantity to Deduct <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={stockOutForm.quantity}
                onChange={(e) => setStockOutForm({ ...stockOutForm, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason <span className="text-rose-500">*</span>
              </label>
              <select
                value={stockOutForm.reason}
                onChange={(e) => setStockOutForm({ ...stockOutForm, reason: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="damage">Damaged / Broken</option>
                <option value="expired">Expired Stock</option>
                <option value="lost">Lost / Stolen</option>
                <option value="internal_use">Internal Business Use</option>
                <option value="correction">Inventory Correction</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Water damage during storage"
              value={stockOutForm.note}
              onChange={(e) => setStockOutForm({ ...stockOutForm, note: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsStockOutOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={stockOutMutation.isPending}
            >
              Confirm Deduction
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title="Physical Stock Adjustment"
        description="Sync system inventory with physical shelf count audit."
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            adjustMutation.mutate({
              productId: adjustForm.productId,
              actualQuantity: Number(adjustForm.actualQuantity),
              reason: adjustForm.reason,
              note: adjustForm.note || undefined,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Product <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={adjustForm.productId}
              onChange={(e) => {
                const prod = allProducts?.find((p) => p._id === e.target.value);
                setAdjustForm({
                  ...adjustForm,
                  productId: e.target.value,
                  actualQuantity: prod?.currentStock ?? 0,
                });
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option value="">-- Choose Product --</option>
              {allProducts?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku}) - Current System Count: {p.currentStock}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Verified Physical Count <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              required
              value={adjustForm.actualQuantity}
              onChange={(e) => setAdjustForm({ ...adjustForm, actualQuantity: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason / Audit Reference
            </label>
            <input
              type="text"
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdjustOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={adjustMutation.isPending}
            >
              Apply Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
