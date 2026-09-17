'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useBusinessSettings } from '@/providers/theme-provider';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function MonthlyReportPage() {
  const { settings } = useBusinessSettings();
  const currency = settings?.localization?.currencySymbol || '$';

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  // Query: Monthly Report
  const { data: monthlyData, isLoading } = useQuery({
    queryKey: ['monthly-report', { year, month }],
    queryFn: async () => {
      const res: any = await api.get('/reports/monthly', {
        params: { year, month },
      });
      return res.data;
    },
  });

  const summary = monthlyData?.financialSummary || {};
  const daily = monthlyData?.dailyBreakdown || [];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/reports">
              <Button variant="ghost" size="sm" className="px-2 py-1 h-7">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to Reports
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Monthly Business Breakdown
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Day-by-day operational and financial trajectory for {months[month - 1]} {year}.
          </p>
        </div>

        {/* Month / Year Selectors */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            {months.map((m, idx) => (
              <option key={idx} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            {[2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Monthly Sales"
          value={formatCurrency(summary.totalSales || 0, currency)}
          subtitle="Net sales recorded"
          icon={TrendingUp}
          color="teal"
        />
        <StatCard
          title="Total Cost of Goods"
          value={formatCurrency(summary.totalCostOfGoodsSold || 0, currency)}
          subtitle="Direct inventory cost"
          icon={TrendingDown}
          color="indigo"
        />
        <StatCard
          title="Gross Profit"
          value={formatCurrency(summary.grossProfit || 0, currency)}
          subtitle="Sales minus COGS"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(summary.netProfit || 0, currency)}
          subtitle={`After ${formatCurrency(summary.totalExpenses || 0, currency)} expenses`}
          icon={Percent}
          color={(summary.netProfit || 0) >= 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* Interactive 30-Day Multi-line Performance Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Daily Trajectory ({months[month - 1]} {year})
        </h3>

        <div className="h-72 w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Loading daily metrics...
            </div>
          ) : daily.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              No daily data recorded for this month.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => val.split('-')[2]}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => formatCurrency(val, currency)}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="sales"
                  name="Sales"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cogs"
                  name="COGS"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="netProfit"
                  name="Net Profit"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Daily Financial Records
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Date</th>
                <th className="py-3 px-4 text-right">Sales</th>
                <th className="py-3 px-4 text-right">Cost of Goods</th>
                <th className="py-3 px-4 text-right">Gross Profit</th>
                <th className="py-3 px-4 text-right">Expenses</th>
                <th className="py-3 px-4 sm:px-6 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {daily.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No data for this month.
                  </td>
                </tr>
              ) : (
                daily.map((d: any, idx: number) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-4 sm:px-6 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {d.date}
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium text-slate-900 dark:text-white">
                      {formatCurrency(d.sales || 0, currency)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-500">
                      {formatCurrency(d.cogs || 0, currency)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium text-emerald-600">
                      {formatCurrency(d.grossProfit || 0, currency)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-rose-600">
                      {formatCurrency(d.expenses || 0, currency)}
                    </td>
                    <td className="py-2.5 px-4 sm:px-6 text-right font-bold">
                      <span
                        className={
                          (d.netProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }
                      >
                        {formatCurrency(d.netProfit || 0, currency)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
