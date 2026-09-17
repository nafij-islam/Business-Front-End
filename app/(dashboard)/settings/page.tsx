'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useBusinessSettings, BusinessSettingsData } from '@/providers/theme-provider';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Building2,
  Palette,
  Globe,
  Sliders,
  FileText,
  Save,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { settings, refreshSettings, updateSettingsState } = useBusinessSettings();

  const [activeTab, setActiveTab] = useState<
    'general' | 'branding' | 'localization' | 'inventory' | 'invoice'
  >('general');

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Local form state cloned from settings
  const [form, setForm] = useState<BusinessSettingsData>(settings);

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  // Mutations for each section
  const updateGeneralMutation = useMutation({
    mutationFn: (data: any) => api.patch('/settings/general', data),
    onSuccess: (res: any) => handleSuccess(res.data),
  });

  const updateBrandingMutation = useMutation({
    mutationFn: (data: any) => api.patch('/settings/branding', data),
    onSuccess: (res: any) => handleSuccess(res.data),
  });

  const updateLocalizationMutation = useMutation({
    mutationFn: (data: any) => api.patch('/settings/localization', data),
    onSuccess: (res: any) => handleSuccess(res.data),
  });

  const updateInventoryMutation = useMutation({
    mutationFn: (data: any) => api.patch('/settings/inventory', data),
    onSuccess: (res: any) => handleSuccess(res.data),
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: (data: any) => api.patch('/settings/invoice', data),
    onSuccess: (res: any) => handleSuccess(res.data),
  });

  const resetThemeMutation = useMutation({
    mutationFn: () => api.post('/settings/reset-theme'),
    onSuccess: (res: any) => handleSuccess(res.data),
  });

  const handleSuccess = (updatedData?: any) => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    if (updatedData) {
      updateSettingsState(updatedData);
    }
    refreshSettings();
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateGeneralMutation.mutate(form.information);
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    updateBrandingMutation.mutate(form.branding);
  };

  const handleSaveLocalization = (e: React.FormEvent) => {
    e.preventDefault();
    updateLocalizationMutation.mutate(form.localization);
  };

  const handleSaveInventory = (e: React.FormEvent) => {
    e.preventDefault();
    updateInventoryMutation.mutate(form.inventory);
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    updateInvoiceMutation.mutate(form.invoice);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            System & Business Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure business identity, dynamic theme colors, inventory rules, and invoice terms.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Changes saved successfully!
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Business Info
        </button>

        <button
          onClick={() => setActiveTab('branding')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'branding'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          Theme & Branding
        </button>

        <button
          onClick={() => setActiveTab('localization')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'localization'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          Currency & Region
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'inventory'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Inventory Rules
        </button>

        <button
          onClick={() => setActiveTab('invoice')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'invoice'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Invoices & Receipts
        </button>
      </div>

      {/* Tab 1: General Business Information */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business Display Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.information?.businessName || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    information: { ...form.information, businessName: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Legal / Registered Name
              </label>
              <input
                type="text"
                value={form.information?.legalName || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    information: { ...form.information, legalName: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business Phone
              </label>
              <input
                type="text"
                value={form.information?.phone || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    information: { ...form.information, phone: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business Email
              </label>
              <input
                type="email"
                value={form.information?.email || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    information: { ...form.information, email: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={form.information?.address || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    information: { ...form.information, address: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City / State
              </label>
              <input
                type="text"
                value={form.information?.city || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    information: { ...form.information, city: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Country
              </label>
              <input
                type="text"
                value={form.information?.country || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    information: { ...form.information, country: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Website URL
              </label>
              <input
                type="text"
                value={form.information?.website || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    information: { ...form.information, website: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={updateGeneralMutation.isPending}
            >
              <Save className="w-4 h-4 mr-1.5" />
              Save Information
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Theme & Branding */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSaveBranding} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Brand Colors & Visual Identity
              </h3>
              <p className="text-slate-500">
                Pick your custom corporate brand colors. The application dynamically re-themes immediately without recompilation.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => resetThemeMutation.mutate()}
              isLoading={resetThemeMutation.isPending}
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset to Defaults
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Primary Color */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Primary Brand Color
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.branding?.primaryColor || '#0d9488'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      branding: { ...form.branding, primaryColor: e.target.value },
                    })
                  }
                  className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                />
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  {form.branding?.primaryColor}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Buttons, active tabs, header icons</p>
            </div>

            {/* Secondary Color */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Secondary / Hover Color
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.branding?.secondaryColor || '#0f766e'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      branding: { ...form.branding, secondaryColor: e.target.value },
                    })
                  }
                  className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                />
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  {form.branding?.secondaryColor}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Hover states and gradient tones</p>
            </div>

            {/* Sidebar Color */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Sidebar Dark Base
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.branding?.sidebarColor || '#0f172a'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      branding: { ...form.branding, sidebarColor: e.target.value },
                    })
                  }
                  className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                />
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  {form.branding?.sidebarColor}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Left navigation sidebar background</p>
            </div>

            {/* Accent Color */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Accent / Badge Color
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.branding?.accentColor || '#10b981'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      branding: { ...form.branding, accentColor: e.target.value },
                    })
                  }
                  className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                />
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  {form.branding?.accentColor}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Success indicators, highlights</p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={updateBrandingMutation.isPending}
            >
              <Save className="w-4 h-4 mr-1.5" />
              Apply Branding Colors
            </Button>
          </div>
        </form>
      )}

      {/* Tab 3: Currency & Localization */}
      {activeTab === 'localization' && (
        <form onSubmit={handleSaveLocalization} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Currency Symbol <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.localization?.currencySymbol || '$'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    localization: { ...form.localization, currencySymbol: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">e.g. $, €, £, ৳, ₹, د.إ, ¥</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ISO Currency Code
              </label>
              <input
                type="text"
                value={form.localization?.currencyCode || 'USD'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    localization: { ...form.localization, currencyCode: e.target.value.toUpperCase() },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">e.g. USD, EUR, GBP, BDT, INR</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={form.localization?.timezone || 'UTC'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    localization: { ...form.localization, timezone: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date Format
              </label>
              <select
                value={form.localization?.dateFormat || 'YYYY-MM-DD'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    localization: { ...form.localization, dateFormat: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-17)</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY (e.g. 17-09-2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/17/2026)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={updateLocalizationMutation.isPending}
            >
              <Save className="w-4 h-4 mr-1.5" />
              Save Localization
            </Button>
          </div>
        </form>
      )}

      {/* Tab 4: Inventory Rules */}
      {activeTab === 'inventory' && (
        <form onSubmit={handleSaveInventory} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Default Low-Stock Alert Threshold
            </label>
            <input
              type="number"
              min="0"
              value={form.inventory?.defaultLowStockThreshold ?? 5}
              onChange={(e) =>
                setForm({
                  ...form,
                  inventory: {
                    ...form.inventory,
                    defaultLowStockThreshold: Number(e.target.value),
                  },
                })
              }
              className="w-36 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Triggers a dashboard notification when any product falls to or below this count.
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.inventory?.allowNegativeStock || false}
                onChange={(e) =>
                  setForm({
                    ...form,
                    inventory: { ...form.inventory, allowNegativeStock: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Allow Negative Stock Sales
                </span>
                <span className="text-[11px] text-slate-400">
                  If disabled (recommended), the system rejects any sale that exceeds stock on hand.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.inventory?.enableBrands || false}
                onChange={(e) =>
                  setForm({
                    ...form,
                    inventory: { ...form.inventory, enableBrands: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Enable Brand Management
                </span>
                <span className="text-[11px] text-slate-400">
                  Allow assigning manufacturers/brands to product items.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.inventory?.enableCustomAttributes || false}
                onChange={(e) =>
                  setForm({
                    ...form,
                    inventory: { ...form.inventory, enableCustomAttributes: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Enable Custom Industry Attributes
                </span>
                <span className="text-[11px] text-slate-400">
                  Support arbitrary key-value pairs (e.g. Size, Color, Expiry, Technical Specs).
                </span>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={updateInventoryMutation.isPending}
            >
              <Save className="w-4 h-4 mr-1.5" />
              Save Inventory Rules
            </Button>
          </div>
        </form>
      )}

      {/* Tab 5: Invoices & Receipts */}
      {activeTab === 'invoice' && (
        <form onSubmit={handleSaveInvoice} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sales Invoice Prefix
              </label>
              <input
                type="text"
                value={form.invoice?.invoicePrefix || 'INV-'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    invoice: { ...form.invoice, invoicePrefix: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Purchase Order Prefix
              </label>
              <input
                type="text"
                value={form.invoice?.purchasePrefix || 'PUR-'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    invoice: { ...form.invoice, purchasePrefix: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business Tax / VAT / TIN ID
              </label>
              <input
                type="text"
                placeholder="e.g. TAX-9847291-US"
                value={form.invoice?.businessTaxId || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    invoice: { ...form.invoice, businessTaxId: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Invoice Terms & Conditions
              </label>
              <textarea
                rows={2}
                value={form.invoice?.invoiceTerms || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    invoice: { ...form.invoice, invoiceTerms: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Invoice Footer Note
              </label>
              <input
                type="text"
                value={form.invoice?.invoiceFooter || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    invoice: { ...form.invoice, invoiceFooter: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={updateInvoiceMutation.isPending}
            >
              <Save className="w-4 h-4 mr-1.5" />
              Save Invoice Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
