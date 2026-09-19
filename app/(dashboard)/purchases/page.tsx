'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, extractPaginationData } from '@/lib/api';
import { useBusinessSettings } from '@/providers/theme-provider';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  Truck,
  Plus,
  Search,
  FileText,
  RotateCcw,
  Trash2,
  Boxes,
  User,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface PurchaseItem {
  product: { _id: string; name: string; sku?: string; SKU?: string };
  productName?: string;
  productSku?: string;
  quantity: number;
  unitCost: number;
  total?: number;
  subtotal?: number;
}

interface Purchase {
  _id: string;
  purchaseNumber: string;
  supplier: { _id: string; name: string; phone?: string; email?: string; company?: string; companyName?: string };
  items: PurchaseItem[];
  subtotal: number;
  tax?: number;
  taxAmount?: number;
  shippingCost: number;
  grandTotal?: number;
  totalAmount?: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  status: string;
  note?: string;
  notes?: string;
  purchaseDate?: string;
  createdAt: string;
}

interface ProductItem {
  _id: string;
  name: string;
  sku: string;
  purchasePrice: number;
  currentStock: number;
}

interface SupplierItem {
  _id: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
}

export default function PurchasesPage() {
  const queryClient = useQueryClient();
  const { settings } = useBusinessSettings();
  const currency = settings?.localization?.currencySymbol || '$';

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [returnTargetPurchase, setReturnTargetPurchase] = useState<Purchase | null>(null);
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);

  // New Purchase Form State
  const [supplierId, setSupplierId] = useState('');
  const [purchaseLines, setPurchaseLines] = useState<
    { productId: string; name: string; sku: string; quantity: number; unitCost: number }[]
  >([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('');

  // Return Form State
  const [returnItems, setReturnItems] = useState<{ productId: string; quantity: number; reason: string }[]>([]);
  const [refundAmount, setRefundAmount] = useState(0);

  // Quick Supplier Form
  const [newSupplierForm, setNewSupplierForm] = useState({ name: '', company: '', phone: '', email: '' });

  // Query: Purchases
  const { data: purchasesData, isLoading } = useQuery({
    queryKey: ['purchases', { search, page }],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit };
      if (search) params.search = search;
      const res: any = await api.get('/purchases', { params });
      return extractPaginationData<Purchase>(res);
    },
  });

  // Query: Suppliers
  const { data: suppliersList } = useQuery<SupplierItem[]>({
    queryKey: ['suppliers-list'],
    queryFn: async () => {
      const res: any = await api.get('/suppliers', { params: { limit: 200 } });
      return extractPaginationData<SupplierItem>(res).items;
    },
  });

  // Query: Products
  const { data: productsList } = useQuery<ProductItem[]>({
    queryKey: ['products-for-purchases'],
    queryFn: async () => {
      const res: any = await api.get('/products', { params: { limit: 500, isActive: true } });
      return extractPaginationData<ProductItem>(res).items;
    },
  });

  // Mutations
  const createPurchaseMutation = useMutation({
    mutationFn: (payload: any) => api.post('/purchases', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-valuation'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
      setIsNewPurchaseOpen(false);
      resetPurchaseForm();
    },
  });

  const processPurchaseReturnMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      api.post(`/purchases/${id}/returns`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-inventory'] });
      setReturnTargetPurchase(null);
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: (payload: any) =>
      api.post('/suppliers', {
        name: payload.name?.trim(),
        phone: payload.phone?.trim(),
        companyName: payload.company?.trim() || undefined,
        email: payload.email?.trim() || undefined,
      }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
      setIsNewSupplierModalOpen(false);
      if (res?.data?._id) {
        setSupplierId(res.data._id);
      }
      setNewSupplierForm({ name: '', company: '', phone: '', email: '' });
    },
  });

  // Calculations
  const subtotal = purchaseLines.reduce((acc, l) => acc + l.unitCost * l.quantity, 0);
  const totalAmount = subtotal + Number(shippingCost || 0) + Number(taxAmount || 0);
  const dueAmount = Math.max(0, totalAmount - (paidAmount || 0));

  const resetPurchaseForm = () => {
    setSupplierId('');
    setPurchaseLines([]);
    setShippingCost(0);
    setTaxAmount(0);
    setPaidAmount(0);
    setNotes('');
  };

  const handleAddProductLine = (productId: string) => {
    const prod = productsList?.find((p) => p._id === productId);
    if (!prod) return;
    if (purchaseLines.some((l) => l.productId === productId)) return;

    setPurchaseLines([
      ...purchaseLines,
      {
        productId: prod._id,
        name: prod.name,
        sku: prod.sku,
        quantity: 1,
        unitCost: prod.purchasePrice || 0,
      },
    ]);
  };

  const handleCreatePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || purchaseLines.length === 0) return;

    const payload = {
      supplier: supplierId,
      items: purchaseLines.map((l) => ({
        product: l.productId,
        quantity: Number(l.quantity),
        unitCost: Number(l.unitCost),
      })),
      shippingCost: Number(shippingCost) || 0,
      tax: Number(taxAmount) || 0,
      paidAmount: Number(paidAmount) || 0,
      paymentMethod: (paymentMethod || 'CASH').toUpperCase(),
      note: notes || undefined,
    };

    createPurchaseMutation.mutate(payload);
  };

  const purchases: Purchase[] = purchasesData?.items || [];
  const totalCount = purchasesData?.total || 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Procurement & Purchases
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage vendor purchase orders, inventory restocking, and supplier payables.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            resetPurchaseForm();
            setIsNewPurchaseOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Record Purchase
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search purchase number, supplier..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Purchase #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4 text-center">Items</th>
                <th className="py-3.5 px-4 text-right">Total Cost</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Due Balance</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading purchase orders...</span>
                    </div>
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No purchase orders recorded yet.
                  </td>
                </tr>
              ) : (
                purchases.map((pur) => (
                  <tr
                    key={pur._id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6 font-mono font-semibold text-teal-600 dark:text-teal-400">
                      {pur.purchaseNumber}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatDate(pur.purchaseDate || pur.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {pur.supplier?.name}
                      </p>
                      {(pur.supplier?.company || pur.supplier?.companyName) && (
                        <p className="text-xs text-slate-400">
                          {pur.supplier?.company || pur.supplier?.companyName}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {pur.items?.length || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(pur.grandTotal ?? pur.totalAmount ?? 0, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-600 font-medium">
                      {formatCurrency(pur.paidAmount, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {pur.dueAmount > 0 ? (
                        <span className="text-rose-600 font-bold">
                          {formatCurrency(pur.dueAmount, currency)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">$0.00</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          pur.paymentStatus?.toLowerCase() === 'paid'
                            ? 'success'
                            : pur.paymentStatus?.toLowerCase() === 'partial'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {(pur.paymentStatus || 'UNPAID').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPurchase(pur)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors"
                          title="View Order Details"
                        >
                          <FileText className="w-4 h-4" />
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

      {/* Record Purchase Modal */}
      <Modal
        isOpen={isNewPurchaseOpen}
        onClose={() => setIsNewPurchaseOpen(false)}
        title="Record Supplier Purchase Order"
        description="Restock products automatically and track vendor payable balance."
        maxWidth="3xl"
      >
        <form onSubmit={handleCreatePurchaseSubmit} className="space-y-4 text-xs">
          {/* Supplier Row */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supplier <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliersList?.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.company ? `(${s.company})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewSupplierModalOpen(true)}
              >
                + New Supplier
              </Button>
            </div>
          </div>

          {/* Add Line Item selector */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Add Products to Order
            </label>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) handleAddProductLine(e.target.value);
              }}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <option value="">-- Click to add product item --</option>
              {productsList?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku}) - Current Stock: {p.currentStock}
                </option>
              ))}
            </select>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-500">
                <tr>
                  <th className="p-2.5">Item</th>
                  <th className="p-2.5 text-center w-28">Quantity</th>
                  <th className="p-2.5 text-right w-32">Unit Cost ({currency})</th>
                  <th className="p-2.5 text-right w-28">Total</th>
                  <th className="p-2.5 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {purchaseLines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No products added. Select a product above.
                    </td>
                  </tr>
                ) : (
                  purchaseLines.map((line, idx) => (
                    <tr key={line.productId}>
                      <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                        {line.name} <span className="font-mono text-slate-400 text-[10px]">({line.sku})</span>
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => {
                            const updated = [...purchaseLines];
                            updated[idx].quantity = Math.max(1, Number(e.target.value));
                            setPurchaseLines(updated);
                          }}
                          className="w-full px-2 py-1 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                        />
                      </td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.unitCost}
                          onChange={(e) => {
                            const updated = [...purchaseLines];
                            updated[idx].unitCost = Number(e.target.value);
                            setPurchaseLines(updated);
                          }}
                          className="w-full px-2 py-1 text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                        />
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(line.quantity * line.unitCost, currency)}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => setPurchaseLines(purchaseLines.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700"
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

          {/* Totals & Settlement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile_money">Mobile Wallet</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Supplier Invoice Reference
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. PO-9874 / Warehouse Dock 2"
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Shipping / Freight</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(Number(e.target.value))}
                  className="w-24 px-2 py-0.5 text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Tax</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(Number(e.target.value))}
                  className="w-24 px-2 py-0.5 text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                />
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Total Payable</span>
                <span className="text-teal-600 dark:text-teal-400">
                  {formatCurrency(totalAmount, currency)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Amount Paid Now</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-28 px-2 py-1 text-right font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-emerald-600"
                />
              </div>
              {dueAmount > 0 && (
                <div className="flex justify-between font-semibold text-rose-600 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Balance Due to Supplier</span>
                  <span>{formatCurrency(dueAmount, currency)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewPurchaseOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={purchaseLines.length === 0 || !supplierId}
              isLoading={createPurchaseMutation.isPending}
            >
              Confirm Purchase & Restock
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Supplier Creation Modal */}
      <Modal
        isOpen={isNewSupplierModalOpen}
        onClose={() => setIsNewSupplierModalOpen(false)}
        title="Add New Supplier"
        maxWidth="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createSupplierMutation.mutate(newSupplierForm);
          }}
          className="space-y-3 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contact / Supplier Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newSupplierForm.name}
              onChange={(e) => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={newSupplierForm.company}
              onChange={(e) => setNewSupplierForm({ ...newSupplierForm, company: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={newSupplierForm.phone}
              onChange={(e) => setNewSupplierForm({ ...newSupplierForm, phone: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={newSupplierForm.email}
              onChange={(e) => setNewSupplierForm({ ...newSupplierForm, email: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewSupplierModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createSupplierMutation.isPending}
            >
              Save Supplier
            </Button>
          </div>
        </form>
      </Modal>

      {/* Purchase Details Modal */}
      <Modal
        isOpen={!!selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
        title={`Purchase Order ${selectedPurchase?.purchaseNumber || ''}`}
        maxWidth="lg"
      >
        {selectedPurchase && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  Supplier: {selectedPurchase.supplier?.name}
                </p>
                {selectedPurchase.supplier?.company && (
                  <p className="text-slate-500">{selectedPurchase.supplier.company}</p>
                )}
                {selectedPurchase.supplier?.phone && (
                  <p className="text-slate-500">Phone: {selectedPurchase.supplier.phone}</p>
                )}
              </div>
              <div className="text-right">
                <Badge
                  variant={
                    selectedPurchase.paymentStatus?.toLowerCase() === 'paid'
                      ? 'success'
                      : selectedPurchase.paymentStatus?.toLowerCase() === 'partial'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {(selectedPurchase.paymentStatus || 'UNPAID').toUpperCase()}
                </Badge>
                <p className="text-slate-400 mt-1">
                  {formatDateTime(selectedPurchase.purchaseDate || selectedPurchase.createdAt)}
                </p>
              </div>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-500">
                  <th className="py-2">Item</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Unit Cost</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedPurchase.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 font-medium text-slate-900 dark:text-white">
                      {item.productName || item.product?.name || 'Product'}
                    </td>
                    <td className="py-2 text-center font-bold">{item.quantity}</td>
                    <td className="py-2 text-right">{formatCurrency(item.unitCost, currency)}</td>
                    <td className="py-2 text-right font-semibold">
                      {formatCurrency(item.subtotal ?? item.total ?? item.quantity * item.unitCost, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedPurchase.subtotal, currency)}</span>
              </div>
              {(selectedPurchase.shippingCost || 0) > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Shipping</span>
                  <span>+{formatCurrency(selectedPurchase.shippingCost, currency)}</span>
                </div>
              )}
              {(selectedPurchase.tax ?? selectedPurchase.taxAmount ?? 0) > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Tax</span>
                  <span>+{formatCurrency(selectedPurchase.tax ?? selectedPurchase.taxAmount ?? 0, currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Total Amount</span>
                <span>{formatCurrency(selectedPurchase.grandTotal ?? selectedPurchase.totalAmount ?? 0, currency)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Paid</span>
                <span>{formatCurrency(selectedPurchase.paidAmount, currency)}</span>
              </div>
              {selectedPurchase.dueAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Due to Supplier</span>
                  <span>{formatCurrency(selectedPurchase.dueAmount, currency)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedPurchase(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
