'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useBusinessSettings } from '@/providers/theme-provider';
import { useAuth } from '@/providers/auth-provider';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Calendar,
  CreditCard,
  DollarSign,
  Package,
  Plus,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const { settings } = useBusinessSettings();
  const currencySymbol = settings?.localization?.currencySymbol || '$';

  const {
    data: summaryData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res: any = await api.get('/dashboard/summary');
      return res?.data;
    },
  });

  const { data: healthData } = useQuery({
    queryKey: ['dashboard-health'],
    queryFn: async () => {
      const res: any = await api.get('/dashboard/health-metrics');
      return res?.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 p-5 shadow-sm animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse" />
      </div>
    );
  }

  const s = summaryData || {};
  const today = s.today || {};
  const thisMonth = s.thisMonth || {};
  const inventory = s.inventory || {};
  const ledger = s.ledger || {};
  const counts = s.counts || {};
  const chartData = s.chartData || [];
  const recentSales = s.recent?.sales || [];
  const recentPurchases = s.recent?.purchases || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Welcome back, {user?.firstName} &bull; Here is your real-time business performance overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin text-teal-600' : ''}`} />
            <span>{isRefetching ? 'Syncing...' : 'Refresh'}</span>
          </button>
          <Link
            href="/sales"
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition"
            style={{ backgroundColor: 'var(--theme-primary, #0d9488)' }}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>New Sale Invoice</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today&apos;s Sales</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(today.sales, currencySymbol)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Today Net Profit:</span>
            <span className="font-semibold text-emerald-600">
              {formatCurrency(today.netProfit, currencySymbol)}
            </span>
          </div>
        </div>

        {/* Monthly Sales */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">This Month Sales</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(thisMonth.sales, currencySymbol)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs">
            {healthData?.salesChangePercent !== undefined && (
              <span
                className={`font-semibold flex items-center ${
                  healthData.salesChangePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {healthData.salesChangePercent >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {healthData.salesChangePercent}% vs last period
              </span>
            )}
          </div>
        </div>

        {/* Monthly Net Profit */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Month Net Profit</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(thisMonth.netProfit, currencySymbol)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Gross Profit:</span>
            <span className="font-semibold text-slate-700">
              {formatCurrency(thisMonth.grossProfit, currencySymbol)}
            </span>
          </div>
        </div>

        {/* Inventory Valuation */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Valuation</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(inventory.purchaseValue, currencySymbol)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Selling Value:</span>
            <span className="font-semibold text-indigo-600">
              {formatCurrency(inventory.potentialSellingValue, currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <span className="text-[11px] text-slate-500 uppercase font-bold">Total Products</span>
          <p className="text-lg font-bold text-slate-800 mt-1">{counts.totalProducts || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <span className="text-[11px] text-slate-500 uppercase font-bold">Low Stock Alerts</span>
          <p className="text-lg font-bold text-amber-600 mt-1">{inventory.lowStockCount || 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <span className="text-[11px] text-slate-500 uppercase font-bold">Customer Receivable</span>
          <p className="text-lg font-bold text-slate-800 mt-1">{formatCurrency(ledger.customerReceivable, currencySymbol)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <span className="text-[11px] text-slate-500 uppercase font-bold">Supplier Payable</span>
          <p className="text-lg font-bold text-slate-800 mt-1">{formatCurrency(ledger.supplierPayable, currencySymbol)}</p>
        </div>
      </div>

      {/* Main 30-Day Financial Performance Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">30-Day Sales, Purchases & Profit Trend</h3>
            <p className="text-xs text-slate-500">Day-by-day revenue velocity and gross profit tracking</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-500" /> Sales
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Profit
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Purchases
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(val) => val.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(value: any) => [formatCurrency(Number(value), currencySymbol)]}
              />
              <Area type="monotone" dataKey="sales" name="Sales" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
              <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#profitGrad)" />
              <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#94a3b8" strokeWidth={1.5} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Section: Recent Sales & Recent Purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Sales Invoices</h3>
            <Link href="/sales" className="text-xs font-semibold text-teal-600 hover:underline">
              View All
            </Link>
          </div>
          {recentSales.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No recent sales records.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentSales.map((sale: any) => (
                <div key={sale._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{sale.saleNumber}</p>
                    <p className="text-[11px] text-slate-400">
                      {sale.customer?.name || 'Guest / Walk-in'} &bull; {formatDate(sale.saleDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">
                      {formatCurrency(sale.grandTotal, currencySymbol)}
                    </p>
                    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      {sale.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Purchases */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Purchases</h3>
            <Link href="/purchases" className="text-xs font-semibold text-teal-600 hover:underline">
              View All
            </Link>
          </div>
          {recentPurchases.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No recent purchase orders.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentPurchases.map((purchase: any) => (
                <div key={purchase._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{purchase.purchaseNumber}</p>
                    <p className="text-[11px] text-slate-400">
                      {purchase.supplier?.companyName || purchase.supplier?.name || 'Unknown Supplier'} &bull; {formatDate(purchase.purchaseDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">
                      {formatCurrency(purchase.grandTotal, currencySymbol)}
                    </p>
                    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700">
                      {purchase.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
