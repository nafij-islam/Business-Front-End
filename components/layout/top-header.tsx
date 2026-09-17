'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { useBusinessSettings } from '@/providers/theme-provider';
import { Bell, Menu, Plus, ShoppingCart, PackagePlus, ArrowDownLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface TopHeaderProps {
  onMenuClick: () => void;
}

export function TopHeader({ onMenuClick }: TopHeaderProps) {
  const { user } = useAuth();
  const { settings } = useBusinessSettings();
  const [showNotifications, setShowNotifications] = useState(false);

  // Poll unread notifications count every 30s
  const { data: notificationData } = useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: async () => {
      const res: any = await api.get('/notifications/unread-count');
      return res?.data?.count || 0;
    },
    refetchInterval: 30000,
  });

  const unreadCount = notificationData || 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-8">
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-slate-800">
            {settings?.information?.businessName || 'Apex Business Management'}
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            {settings?.localization?.currencyCode} &bull; {settings?.localization?.timezone}
          </p>
        </div>
      </div>

      {/* Right section: Quick actions & Notifications & Profile */}
      <div className="flex items-center gap-2.5">
        {/* Quick New Sale button */}
        <Link
          href="/sales"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition"
          style={{ backgroundColor: 'var(--theme-primary, #0d9488)' }}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>New Sale</span>
        </Link>

        {/* Quick Stock In button */}
        <Link
          href="/inventory"
          className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
          <span>Stock In</span>
        </Link>

        {/* Notification Bell */}
        <Link
          href="/notifications"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Admin profile pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs text-white"
            style={{ backgroundColor: 'var(--theme-primary, #0d9488)' }}
          >
            {user?.firstName?.charAt(0) || 'A'}
          </div>
          <span className="text-xs font-medium text-slate-700 hidden sm:inline">
            {user?.firstName || 'Admin'}
          </span>
        </div>
      </div>
    </header>
  );
}
