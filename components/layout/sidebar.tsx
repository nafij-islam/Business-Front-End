'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useBusinessSettings } from '@/providers/theme-provider';
import {
  BarChart3,
  Boxes,
  CalendarDays,
  ClipboardList,
  DollarSign,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { settings } = useBusinessSettings();

  const businessName = settings?.information?.businessName || 'Apex Enterprise';

  const navGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'INVENTORY',
      items: [
        { label: 'Products', href: '/products', icon: Package },
        { label: 'Categories', href: '/categories', icon: FolderTree },
        { label: 'Current Inventory', href: '/inventory', icon: Boxes },
      ],
    },
    {
      title: 'BUSINESS',
      items: [
        { label: 'Sales & Invoices', href: '/sales', icon: ShoppingCart },
        { label: 'Purchases', href: '/purchases', icon: Truck },
        { label: 'Customers', href: '/customers', icon: Users },
        { label: 'Suppliers', href: '/suppliers', icon: Users },
        { label: 'Expenses', href: '/expenses', icon: Receipt },
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        { label: 'Financial Reports', href: '/reports', icon: BarChart3 },
        { label: 'Monthly Report', href: '/reports/monthly', icon: CalendarDays },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Activity Logs', href: '/audit-logs', icon: ClipboardList },
        { label: 'Business Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: 'var(--theme-sidebar, #0f172a)',
        }}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md font-bold text-base"
              style={{ backgroundColor: 'var(--theme-primary, #0d9488)' }}
            >
              {businessName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h2 className="truncate text-sm font-bold text-white tracking-tight">{businessName}</h2>
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onClose()}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition ${
                        isActive
                          ? 'text-white shadow-sm'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                      style={{
                        backgroundColor: isActive ? 'var(--theme-primary, #0d9488)' : undefined,
                      }}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center justify-between rounded-xl bg-white/5 p-2.5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
                {user?.firstName?.charAt(0) || 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-xs font-medium text-white">
                  {user ? `${user.firstName} ${user.lastName}` : 'Administrator'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user?.role || 'OWNER'}</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
