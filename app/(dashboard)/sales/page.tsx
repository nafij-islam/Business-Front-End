'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useBusinessSettings } from '@/providers/theme-provider';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { StatCard } from '@/components/ui/stat-card';
import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  RotateCcw,
  Printer,
  Trash2,
  CheckCircle2,
  DollarSign,
  User,
  CreditCard,
  Barcode,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface SaleItem {
  product: { _id: string; name: string; sku: string };
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  purchaseCostAtSale: number;
}

interface Sale {
  _id: string;
  invoiceNumber: string;
  customer?: { _id: string; name: string; phone?: string; email?: string };
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  discountType: 'fixed' | 'percentage';
  taxAmount: number;
  taxRate: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  status: 'completed' | 'cancelled' | 'refunded' | 'partially_refunded';
  notes?: string;
  createdAt: string;
}

interface ProductItem {
  _id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  currentStock: number;
}

interface CustomerItem {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
}

export default function SalesPage() {
  const queryClient = useQueryClient();
  const { settings } = useBusinessSettings();
  const currency = settings?.localization?.currencySymbol || '$';

  // Filters & State
  const [search, setSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modals
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
  const [returnTargetSale, setReturnTargetSale] = useState<Sale | null>(null);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  // New Sale POS Form State
  const [customerMode, setCustomerMode] = useState<'walk_in' | 'registered'>('walk_in');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [walkInName, setWalkInName] = useState('Walk-in Customer');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [cartItems, setCartItems] = useState<
    { productId: string; name: string; sku: string; price: number; quantity: number; maxStock: number }[]
  >([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [taxRate, setTaxRate] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [saleNotes, setSaleNotes] = useState('');

  // Return modal state
  const [returnItems, setReturnItems] = useState<{ productId: string; quantity: number; restock: boolean }[]>([]);
  const [refundAmount, setRefundAmount] = useState(0);
  const [returnReason, setReturnReason] = useState('Customer return');

  // Inline New Customer form
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', email: '', company: '' });

  // Query: Sales List
  const { data: salesData, isLoading: isLoadingSales } = useQuery({
    queryKey: ['sales', { search, paymentStatusFilter, page }],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit };
      if (search) params.search = search;
      if (paymentStatusFilter) params.paymentStatus = paymentStatusFilter;
      const res: any = await api.get('/sales', { params });
      return res.data;
    },
  });

  // Query: Products for fast POS lookup
  const { data: productsList } = useQuery<ProductItem[]>({
    queryKey: ['products-for-sales'],
    queryFn: async () => {
      const res: any = await api.get('/products', { params: { limit: 500, isActive: true } });
      return res.data?.items || [];
    },
  });

  // Query: Customers
  const { data: customersList } = useQuery<CustomerItem[]>({
    queryKey: ['customers-for-sales'],
    queryFn: async () => {
      const res: any = await api.get('/customers', { params: { limit: 200 } });
      return res.data?.items || [];
    },
  });

  // Mutations
  const createSaleMutation = useMutation({
    mutationFn: (payload: any) => api.post('/sales', payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-inventory'] });
      setIsNewSaleOpen(false);
      resetSaleForm();
      if (res?.data) {
        setSelectedInvoice(res.data);
      }
    },
  });

  const processReturnMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      api.post(`/sales/${id}/returns`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setReturnTargetSale(null);
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: (payload: any) => api.post('/customers', payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['customers-for-sales'] });
      setIsNewCustomerModalOpen(false);
      if (res?.data?._id) {
        setSelectedCustomerId(res.data._id);
        setCustomerMode('registered');
      }
      setNewCustomerForm({ name: '', phone: '', email: '', company: '' });
    },
  });

  // Cart Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount =
    discountType === 'percentage' ? (subtotal * (overallDiscount || 0)) / 100 : Number(overallDiscount || 0);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * (taxRate || 0)) / 100;
  const grandTotal = Math.max(0, taxableAmount + taxAmount);
  const dueAmount = Math.max(0, grandTotal - (amountPaid || 0));

  const resetSaleForm = () => {
    setCartItems([]);
    setWalkInName('Walk-in Customer');
    setWalkInPhone('');
    setSelectedCustomerId('');
    setOverallDiscount(0);
    setTaxRate(0);
    setAmountPaid(0);
    setSaleNotes('');
    setProductSearchTerm('');
  };

  const handleAddToCart = (product: ProductItem) => {
    const existing = cartItems.find((item) => item.productId === product._id);
    if (existing) {
      if (existing.quantity < product.currentStock || settings?.inventory?.allowNegativeStock) {
        setCartItems(
          cartItems.map((item) =>
            item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
          )
        );
      }
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: product._id,
          name: product.name,
          sku: product.sku,
          price: product.sellingPrice,
          quantity: 1,
          maxStock: product.currentStock,
        },
      ]);
    }
  };

  const updateCartItemQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCartItems(cartItems.filter((i) => i.productId !== productId));
    } else {
      setCartItems(
        cartItems.map((item) => (item.productId === productId ? { ...item, quantity: qty } : item))
      );
    }
  };

  const updateCartItemPrice = (productId: string, price: number) => {
    setCartItems(
      cartItems.map((item) => (item.productId === productId ? { ...item, price } : item))
    );
  };

  const handleCompleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    const payload: any = {
      items: cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price,
        discount: 0,
      })),
      discount: discountAmount,
      discountType,
      taxRate: Number(taxRate) || 0,
      paidAmount: Number(amountPaid) || 0,
      paymentMethod,
      notes: saleNotes || undefined,
    };

    if (customerMode === 'registered' && selectedCustomerId) {
      payload.customerId = selectedCustomerId;
    } else {
      payload.customerName = walkInName;
      if (walkInPhone) payload.customerPhone = walkInPhone;
    }

    createSaleMutation.mutate(payload);
  };

  const handleOpenReturnModal = (sale: Sale) => {
    setReturnTargetSale(sale);
    setReturnItems(
      sale.items.map((item) => ({
        productId: item.product._id,
        quantity: 0,
        restock: true,
      }))
    );
    setRefundAmount(0);
  };

  const sales: Sale[] = salesData?.items || [];
  const totalSalesCount = salesData?.total || 0;
  const totalPages = Math.ceil(totalSalesCount / limit) || 1;

  // Filter products for POS quick search
  const filteredProducts = productSearchTerm.trim()
    ? productsList?.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
          p.sku.toLowerCase().includes(productSearchTerm.toLowerCase())
      ) || []
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sales & Invoicing
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fast POS checkout, professional branded invoices, customer receivables, and returns.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            resetSaleForm();
            setIsNewSaleOpen(true);
          }}
        >
          <ShoppingCart className="w-4 h-4 mr-1.5" />
          New Sale / POS
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice number, customer name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
          />
        </div>

        <select
          value={paymentStatusFilter}
          onChange={(e) => {
            setPaymentStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-48 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
        >
          <option value="">All Payment Statuses</option>
          <option value="paid">Paid in Full</option>
          <option value="partial">Partially Paid (Due)</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {/* Sales Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Invoice #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4 text-center">Items</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Due Balance</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoadingSales ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading sales history...</span>
                    </div>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No sales invoices found.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr
                    key={sale._id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6 font-mono font-semibold text-teal-600 dark:text-teal-400">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {sale.customer?.name || sale.customerName || 'Walk-in Customer'}
                      </p>
                      {(sale.customer?.phone || sale.customerPhone) && (
                        <p className="text-xs text-slate-400">
                          {sale.customer?.phone || sale.customerPhone}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {sale.items?.length || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(sale.totalAmount, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-emerald-600 font-medium">
                      {formatCurrency(sale.paidAmount, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {sale.dueAmount > 0 ? (
                        <span className="text-rose-600 font-bold">
                          {formatCurrency(sale.dueAmount, currency)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">$0.00</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          sale.paymentStatus === 'paid'
                            ? 'success'
                            : sale.paymentStatus === 'partial'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {sale.paymentStatus.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvoice(sale)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors"
                          title="View & Print Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {sale.status !== 'refunded' && (
                          <button
                            onClick={() => handleOpenReturnModal(sale)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                            title="Process Return"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalSalesCount > limit && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-xs text-slate-500">
            <span>
              Showing {Math.min((page - 1) * limit + 1, totalSalesCount)} -{' '}
              {Math.min(page * limit, totalSalesCount)} of {totalSalesCount} invoices
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

      {/* POS / New Sale Modal */}
      <Modal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        title="Point of Sale (POS Checkout)"
        description="Select products, apply discounts/taxes, specify payment, and issue invoice."
        maxWidth="4xl"
      >
        <form onSubmit={handleCompleteSale} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Product Selection & Cart Items (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Product Search / Barcode Input */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type product name or scan SKU/barcode..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
                />

                {/* Instant Search Results Dropdown */}
                {filteredProducts.length > 0 && (
                  <div className="absolute left-0 right-0 top-11 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredProducts.map((prod) => (
                      <button
                        type="button"
                        key={prod._id}
                        onClick={() => {
                          handleAddToCart(prod);
                          setProductSearchTerm('');
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-xs text-slate-900 dark:text-white">
                            {prod.name}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {prod.sku} &bull; In stock: {prod.currentStock}
                          </p>
                        </div>
                        <span className="font-bold text-sm text-teal-600 dark:text-teal-400">
                          {formatCurrency(prod.sellingPrice, currency)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Items Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/40 px-3 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between">
                  <span>Selected Items ({cartItems.length})</span>
                  <span>Price / Total</span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                  {cartItems.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Cart is empty. Search products above to add to cart.
                    </div>
                  ) : (
                    cartItems.map((item) => (
                      <div
                        key={item.productId}
                        className="p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400">{item.sku}</p>
                        </div>

                        {/* Quantity Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                            className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-slate-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                            className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300"
                          >
                            +
                          </button>
                        </div>

                        {/* Price & Subtotal */}
                        <div className="text-right">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(item.price * item.quantity, currency)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            @{formatCurrency(item.price, currency)}
                          </p>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => updateCartItemQuantity(item.productId, 0)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Customer Info & Financial Settlement (5 cols) */}
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3.5 text-xs">
              {/* Customer Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Customer</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomerMode('walk_in')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        customerMode === 'walk_in'
                          ? 'bg-teal-600 text-white'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Walk-in
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerMode('registered')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        customerMode === 'registered'
                          ? 'bg-teal-600 text-white'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Registered
                    </button>
                  </div>
                </div>

                {customerMode === 'registered' ? (
                  <div className="space-y-1.5">
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      <option value="">-- Choose Customer --</option>
                      {customersList?.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} {c.phone ? `(${c.phone})` : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsNewCustomerModalOpen(true)}
                      className="text-[11px] text-teal-600 hover:text-teal-700 font-medium"
                    >
                      + Create New Customer
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Name (e.g. Walk-in)"
                      value={walkInName}
                      onChange={(e) => setWalkInName(e.target.value)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Phone (Optional)"
                      value={walkInPhone}
                      onChange={(e) => setWalkInPhone(e.target.value)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Discounts & Tax */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-0.5">Discount</label>
                  <div className="flex">
                    <input
                      type="number"
                      min="0"
                      value={overallDiscount}
                      onChange={(e) => setOverallDiscount(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-l-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setDiscountType(discountType === 'fixed' ? 'percentage' : 'fixed')}
                      className="px-2 bg-slate-200 dark:bg-slate-700 border border-l-0 border-slate-200 dark:border-slate-700 rounded-r-lg font-bold"
                    >
                      {discountType === 'fixed' ? currency : '%'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-0.5">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal, currency)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountAmount, currency)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Tax ({taxRate}%)</span>
                    <span>+{formatCurrency(taxAmount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Grand Total</span>
                  <span className="text-teal-600 dark:text-teal-400">
                    {formatCurrency(grandTotal, currency)}
                  </span>
                </div>
              </div>

              {/* Payment Settlement */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold">
                      Paid Amount
                    </label>
                    <button
                      type="button"
                      onClick={() => setAmountPaid(grandTotal)}
                      className="text-[10px] text-teal-600 hover:text-teal-700 font-semibold"
                    >
                      Exact Total
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 font-bold text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Banking / Wallet</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {dueAmount > 0 && (
                  <div className="p-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-lg flex items-center justify-between text-rose-700 dark:text-rose-400 font-medium">
                    <span>Due Balance:</span>
                    <span className="font-bold">{formatCurrency(dueAmount, currency)}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-3"
                disabled={cartItems.length === 0}
                isLoading={createSaleMutation.isPending}
              >
                Complete Sale ({formatCurrency(grandTotal, currency)})
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Invoice Details & Printable View Modal */}
      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={`Invoice ${selectedInvoice?.invoiceNumber || ''}`}
        maxWidth="2xl"
      >
        {selectedInvoice && (
          <div className="space-y-6" id="printable-invoice">
            {/* Invoice Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {settings?.information?.businessName || 'Apex Enterprise'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {settings?.information?.address || ''}, {settings?.information?.city || ''}
                </p>
                <p className="text-xs text-slate-500">
                  Phone: {settings?.information?.phone || ''} &bull; Email: {settings?.information?.email || ''}
                </p>
                {settings?.invoice?.businessTaxId && (
                  <p className="text-xs text-slate-500">Tax ID: {settings?.invoice?.businessTaxId}</p>
                )}
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 font-mono text-sm font-bold rounded-lg border border-teal-200 dark:border-teal-800">
                  {selectedInvoice.invoiceNumber}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Date: {formatDate(selectedInvoice.createdAt)}
                </p>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedInvoice.paymentStatus === 'paid'
                        ? 'success'
                        : selectedInvoice.paymentStatus === 'partial'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {selectedInvoice.paymentStatus.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Billed To
              </span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {selectedInvoice.customer?.name || selectedInvoice.customerName || 'Walk-in Customer'}
              </p>
              {(selectedInvoice.customer?.phone || selectedInvoice.customerPhone) && (
                <p className="text-slate-500">
                  Phone: {selectedInvoice.customer?.phone || selectedInvoice.customerPhone}
                </p>
              )}
              {selectedInvoice.customer?.email && (
                <p className="text-slate-500">Email: {selectedInvoice.customer.email}</p>
              )}
            </div>

            {/* Line Items Table */}
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-500">
                  <th className="py-2">Item</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedInvoice.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {item.product?.name || 'Product'}
                      </p>
                      <p className="font-mono text-[10px] text-slate-400">{item.product?.sku}</p>
                    </td>
                    <td className="py-2.5 text-center font-bold">{item.quantity}</td>
                    <td className="py-2.5 text-right">{formatCurrency(item.unitPrice, currency)}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(item.total, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Summary */}
            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="w-60 space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.subtotal, currency)}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedInvoice.discount, currency)}</span>
                  </div>
                )}
                {selectedInvoice.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax</span>
                    <span>+{formatCurrency(selectedInvoice.taxAmount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Total Due</span>
                  <span>{formatCurrency(selectedInvoice.totalAmount, currency)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Amount Paid</span>
                  <span>{formatCurrency(selectedInvoice.paidAmount, currency)}</span>
                </div>
                {selectedInvoice.dueAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Outstanding Due</span>
                    <span>{formatCurrency(selectedInvoice.dueAmount, currency)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer / Terms */}
            {settings?.invoice?.invoiceFooter && (
              <p className="text-center text-xs text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                {settings.invoice.invoiceFooter}
              </p>
            )}

            {/* Print Action */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  window.print();
                }}
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print Invoice
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Process Return Modal */}
      <Modal
        isOpen={!!returnTargetSale}
        onClose={() => setReturnTargetSale(null)}
        title="Process Sale Return"
        description="Select returned units to issue a refund and optionally restock the inventory."
        maxWidth="md"
      >
        {returnTargetSale && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const validItems = returnItems.filter((i) => i.quantity > 0);
              if (validItems.length === 0) return;
              processReturnMutation.mutate({
                id: returnTargetSale._id,
                payload: {
                  items: validItems,
                  refundAmount: Number(refundAmount),
                  notes: returnReason,
                },
              });
            }}
            className="space-y-4 text-xs"
          >
            <div className="space-y-2">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Original Items in Invoice #{returnTargetSale.invoiceNumber}:
              </p>
              {returnTargetSale.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between gap-3 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 dark:text-white">{item.product.name}</p>
                    <p className="text-slate-400">Sold: {item.quantity} units @ {formatCurrency(item.unitPrice, currency)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-slate-500">Return Qty:</label>
                    <input
                      type="number"
                      min="0"
                      max={item.quantity}
                      value={returnItems.find((r) => r.productId === item.product._id)?.quantity || 0}
                      onChange={(e) => {
                        const val = Math.min(item.quantity, Math.max(0, Number(e.target.value)));
                        const updated = returnItems.map((r) =>
                          r.productId === item.product._id ? { ...r, quantity: val } : r
                        );
                        setReturnItems(updated);
                        // Auto-calculate suggested refund
                        const totalReturnVal = updated.reduce((sum, r) => {
                          const orig = returnTargetSale.items.find((i) => i.product._id === r.productId);
                          return sum + (orig ? orig.unitPrice * r.quantity : 0);
                        }, 0);
                        setRefundAmount(totalReturnVal);
                      }}
                      className="w-16 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Refund Amount ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Return
              </label>
              <input
                type="text"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReturnTargetSale(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                isLoading={processReturnMutation.isPending}
              >
                Process Refund & Restock
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Quick Customer Creation Modal */}
      <Modal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        title="Add Customer"
        maxWidth="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createCustomerMutation.mutate(newCustomerForm);
          }}
          className="space-y-3 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Customer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newCustomerForm.name}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={newCustomerForm.phone}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={newCustomerForm.email}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewCustomerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createCustomerMutation.isPending}
            >
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
