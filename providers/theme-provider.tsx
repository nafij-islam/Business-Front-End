'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface BusinessSettingsData {
  information: {
    businessName: string;
    legalName?: string;
    logo?: string;
    favicon?: string;
    phone: string;
    email: string;
    website?: string;
    address: string;
    city: string;
    country: string;
  };
  localization: {
    currencyCode: string;
    currencySymbol: string;
    timezone: string;
    dateFormat: string;
    numberFormat: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    sidebarColor: string;
    accentColor: string;
    loginLogo?: string;
    dashboardLogo?: string;
  };
  inventory: {
    defaultLowStockThreshold: number;
    allowNegativeStock: boolean;
    enableExpiryTracking: boolean;
    enableBatchTracking: boolean;
    enableBrands: boolean;
    enableCustomAttributes: boolean;
  };
  modules: {
    enableSales: boolean;
    enablePurchases: boolean;
    enableSuppliers: boolean;
    enableCustomers: boolean;
    enableExpenses: boolean;
    enableProfitReports: boolean;
  };
  invoice: {
    invoicePrefix: string;
    purchasePrefix: string;
    businessTaxId?: string;
    invoiceFooter: string;
    invoiceTerms: string;
  };
}

const defaultSettings: BusinessSettingsData = {
  information: {
    businessName: 'Apex Enterprise',
    phone: '+1 (555) 019-2834',
    email: 'contact@apexenterprise.com',
    address: '100 Business Parkway, Suite 400',
    city: 'New York',
    country: 'United States',
  },
  localization: {
    currencyCode: 'USD',
    currencySymbol: '$',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    numberFormat: 'en-US',
  },
  branding: {
    primaryColor: '#0d9488',
    secondaryColor: '#0f766e',
    sidebarColor: '#0f172a',
    accentColor: '#10b981',
  },
  inventory: {
    defaultLowStockThreshold: 5,
    allowNegativeStock: false,
    enableExpiryTracking: false,
    enableBatchTracking: false,
    enableBrands: true,
    enableCustomAttributes: true,
  },
  modules: {
    enableSales: true,
    enablePurchases: true,
    enableSuppliers: true,
    enableCustomers: true,
    enableExpenses: true,
    enableProfitReports: true,
  },
  invoice: {
    invoicePrefix: 'INV-',
    purchasePrefix: 'PUR-',
    invoiceFooter: 'Thank you for your business!',
    invoiceTerms: 'Goods once sold are non-refundable unless defective within 7 days.',
  },
};

interface ThemeContextType {
  settings: BusinessSettingsData;
  refreshSettings: () => Promise<void>;
  updateSettingsState: (newSettings: BusinessSettingsData) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  settings: defaultSettings,
  refreshSettings: async () => {},
  updateSettingsState: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<BusinessSettingsData>(defaultSettings);

  const applyColorsToCssVariables = (branding: BusinessSettingsData['branding']) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (branding.primaryColor) {
        root.style.setProperty('--theme-primary', branding.primaryColor);
        // Calculate hover state slightly darker
        root.style.setProperty('--theme-primary-hover', branding.secondaryColor || branding.primaryColor);
      }
      if (branding.secondaryColor) {
        root.style.setProperty('--theme-secondary', branding.secondaryColor);
      }
      if (branding.sidebarColor) {
        root.style.setProperty('--theme-sidebar', branding.sidebarColor);
      }
      if (branding.accentColor) {
        root.style.setProperty('--theme-accent', branding.accentColor);
      }
    }
  };

  const fetchSettings = async () => {
    try {
      const res: any = await api.get('/settings');
      if (res?.data) {
        setSettings(res.data);
        if (res.data.branding) {
          applyColorsToCssVariables(res.data.branding);
        }
      }
    } catch {
      // Use defaults if backend offline
      applyColorsToCssVariables(defaultSettings.branding);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettingsState = (newSettings: BusinessSettingsData) => {
    setSettings(newSettings);
    if (newSettings.branding) {
      applyColorsToCssVariables(newSettings.branding);
    }
  };

  return (
    <ThemeContext.Provider value={{ settings, refreshSettings: fetchSettings, updateSettingsState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useBusinessSettings = () => useContext(ThemeContext);
