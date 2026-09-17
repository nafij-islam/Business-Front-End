'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  DollarSign,
  Package,
  Clock,
} from 'lucide-react';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications-page'],
    queryFn: async () => {
      const res: any = await api.get('/notifications', { params: { limit: 50 } });
      return res.data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const notifications: NotificationItem[] = notificationsData?.items || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'payment_due':
        return <DollarSign className="w-5 h-5 text-rose-500" />;
      case 'order_received':
        return <Package className="w-5 h-5 text-teal-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            System Notifications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time low-stock alerts, customer due balance reminders, and system event triggers.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            isLoading={markAllAsReadMutation.isPending}
          >
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
              <Bell className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">
              All caught up! No notifications.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`p-4 flex items-start gap-3.5 transition-colors ${
                  notif.isRead
                    ? 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                    : 'bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50/70'
                }`}
              >
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                  {getTypeIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm font-semibold truncate ${
                        notif.isRead
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {notif.title}
                    </p>
                    <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {!notif.isRead && (
                  <button
                    onClick={() => markAsReadMutation.mutate(notif._id)}
                    className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                    title="Mark as Read"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
