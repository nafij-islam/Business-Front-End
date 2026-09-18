'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useBusinessSettings } from '@/providers/theme-provider';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import {
  BarChart3,
  Calendar,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  FileSpreadsheet,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  const { settings } = useBusinessSettings();
  const currency = settings?.localization?.currencySymbol || '$';

  // Date Presets
  const [preset, setPreset] = useState<'today' | 'last_7_days' | 'this_month' | 'this_year' | 'custom'>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Calculate actual dates based on preset
  const getDateRange = () => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (preset === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (preset === 'last_7_days') {
      start.setDate(now.getDate() - 7);
    } else if (preset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (preset === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (preset === 'custom' && customStart && customEnd) {
      start = new Date(customStart);
      end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

  const { startDate, endDate } = getDateRange();

  // Query: Profit & Loss Statement
  const { data: plData, isLoading: isLoadingPL } = useQuery({
    queryKey: ['profit-loss', { startDate, endDate }],
    queryFn: async () => {
      const res: any = await api.get('/reports/profit-loss', {
        params: { startDate, endDate },
      });
      return res.data;
    },
  });

  // Query: Top Products
  const { data: topProducts, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['report-products', { startDate, endDate }],
    queryFn: async () => {
      const res: any = await api.get('/reports/product-performance', {
        params: { startDate, endDate, limit: 5 },
      });
      return res.data || [];
    },
  });

  // Query: Category Performance
  const { data: topCategories } = useQuery({
    queryKey: ['report-categories', { startDate, endDate }],
    queryFn: async () => {
      const res: any = await api.get('/reports/category-performance', {
        params: { startDate, endDate },
      });
      return res.data || [];
    },
  });

  const handleExport = (type: 'sales' | 'inventory') => {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || 'https://business-back-end-5kc1.vercel.app/api/v1';
    window.open(`${baseUrl}/export/${type}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Financial & Profit Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Certified multi-step Profit & Loss statement based on exact historic cost of goods sold.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/reports/monthly">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-1.5" />
              Monthly Report View
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('sales')}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export Sales CSV
          </Button>
        </div>
      </div>

      {/* Date Presets Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['today', 'last_7_days', 'this_month', 'this_year', 'custom'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 font-semibold rounded-lg capitalize transition-all ${
                preset === p
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {p.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net Invoiced Sales"
          value={formatCurrency(plData?.netSales || 0, currency)}
          subtitle={`Gross: ${formatCurrency(plData?.grossSales || 0, currency)}`}
          icon={TrendingUp}
          color="teal"
        />
        <StatCard
          title="Cost of Goods Sold (COGS)"
          value={formatCurrency(plData?.costOfGoodsSold || 0, currency)}
          subtitle="Historic purchase cost at sale"
          icon={TrendingDown}
          color="indigo"
        />
        <StatCard
          title="Gross Profit"
          value={formatCurrency(plData?.grossProfit || 0, currency)}
          subtitle={`${plData?.grossProfitMargin?.toFixed(1) || 0}% Gross Margin`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Net Operating Profit"
          value={formatCurrency(plData?.netOperatingProfit || 0, currency)}
          subtitle={`${plData?.netProfitMargin?.toFixed(1) || 0}% Net Margin`}
          icon={Percent}
          color={plData?.netOperatingProfit >= 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* Certified P&L Statement Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Income Statement (Profit & Loss)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-step standard income statement formula: Net Sales - COGS = Gross Profit; Gross Profit - Expenses = Net Operating Profit.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            Selected Period
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm mt-4">
          {/* Revenue */}
          <div className="py-3 flex justify-between items-center">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Gross Sales Revenue
            </span>
            <span className="font-medium text-slate-900 dark:text-white">
              {formatCurrency(plData?.grossSales || 0, currency)}
            </span>
          </div>

          <div className="py-2.5 flex justify-between items-center text-slate-500 text-xs pl-4">
            <span>Less: Customer Sales Returns & Refunds</span>
            <span className="text-rose-600">
              -{formatCurrency(plData?.salesReturns || 0, currency)}
            </span>
          </div>

          <div className="py-3 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/30 px-3 rounded-lg font-semibold text-slate-900 dark:text-white">
            <span>= Net Sales Revenue</span>
            <span>{formatCurrency(plData?.netSales || 0, currency)}</span>
          </div>

          {/* COGS */}
          <div className="py-3 flex justify-between items-center pl-4 text-slate-600 dark:text-slate-400">
            <span>Less: Cost of Goods Sold (COGS)</span>
            <span className="text-rose-600">
              -{formatCurrency(plData?.costOfGoodsSold || 0, currency)}
            </span>
          </div>

          {/* Gross Profit */}
          <div className="py-3 flex justify-between items-center bg-teal-50/60 dark:bg-teal-950/30 px-3 rounded-lg font-bold text-teal-900 dark:text-teal-300">
            <span>= Gross Profit</span>
            <div className="text-right">
              <span>{formatCurrency(plData?.grossProfit || 0, currency)}</span>
              <span className="text-xs font-normal text-teal-600 dark:text-teal-400 block">
                {plData?.grossProfitMargin?.toFixed(1) || 0}% margin
              </span>
            </div>
          </div>

          {/* Operating Expenses */}
          <div className="py-3 flex justify-between items-center pl-4 text-slate-600 dark:text-slate-400">
            <span>Less: Total Operating Expenses (Rent, Utilities, Admin)</span>
            <span className="text-rose-600">
              -{formatCurrency(plData?.totalExpenses || 0, currency)}
            </span>
          </div>

          {/* Net Operating Profit */}
          <div
            className={`py-4 flex justify-between items-center px-4 rounded-xl font-bold text-base ${
              (plData?.netOperatingProfit || 0) >= 0
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
            }`}
          >
            <div>
              <span>= Net Operating Profit</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                Final bottom line after all cost of goods and operating expenditures
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl">
                {formatCurrency(plData?.netOperatingProfit || 0, currency)}
              </span>
              <span className="text-xs block">
                {plData?.netProfitMargin?.toFixed(1) || 0}% net margin
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products and Categories Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Products */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-teal-600" />
              Top Performing Products
            </h3>
            <span className="text-xs text-slate-400">By Revenue</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {isLoadingProducts ? (
              <p className="text-slate-400 py-6 text-center">Loading product performance...</p>
            ) : topProducts.length === 0 ? (
              <p className="text-slate-400 py-6 text-center">No sales recorded for this timeframe.</p>
            ) : (
              topProducts.map((p: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{p.productName}</p>
                    <p className="text-slate-400 font-mono text-[10px]">{p.sku} &bull; {p.unitsSold} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(p.totalRevenue, currency)}
                    </p>
                    <p className="text-emerald-600 font-medium">
                      +{formatCurrency(p.grossProfit, currency)} profit
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Category Breakdown
            </h3>
            <span className="text-xs text-slate-400">By Revenue</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {topCategories.length === 0 ? (
              <p className="text-slate-400 py-6 text-center">No category data recorded for this timeframe.</p>
            ) : (
              topCategories.map((c: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{c.categoryName || 'General'}</p>
                    <p className="text-slate-400">{c.unitsSold} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(c.totalRevenue, currency)}
                    </p>
                    <p className="text-emerald-600 font-medium">
                      +{formatCurrency(c.grossProfit, currency)} profit
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
