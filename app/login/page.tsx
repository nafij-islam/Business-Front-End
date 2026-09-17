'use client';

import React, { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useBusinessSettings } from '@/providers/theme-provider';
import { api } from '@/lib/api';
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { settings } = useBusinessSettings();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res: any = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = res.data || res;
      if (accessToken && user) {
        login(accessToken, refreshToken, user);
      } else {
        setErrorMessage('Invalid authentication response from server.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const businessName = settings?.information?.businessName || 'Apex Enterprise';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200">
        {/* Top Accent Header */}
        <div
          className="p-8 text-white text-center"
          style={{
            background: `linear-gradient(135deg, var(--theme-sidebar, #0f172a) 0%, var(--theme-primary, #0d9488) 100%)`,
          }}
        >
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur border border-white/20 shadow-inner">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{businessName}</h1>
          <p className="mt-1 text-xs text-white/80 font-medium">Business Management System</p>
        </div>

        {/* Login Form */}
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Administrator Sign In</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter your credentials to access business operations</p>
          </div>

          {errorMessage && (
            <div className="mb-5 rounded-lg bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-200">
              <span className="font-semibold">Access Error:</span> {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@apexenterprise.com"
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                <span className="text-xs text-slate-600">Remember session</span>
              </label>
            </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg py-2.5 px-4 font-semibold text-sm text-white shadow-md transition disabled:opacity-50 mt-2 hover:opacity-90 active:scale-[0.99]"
                style={{
                  backgroundColor: 'var(--theme-primary, #0d9488)',
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Verifying Session...</span>
                  </div>
                ) : (
                  'Sign In to Management Console'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  login('demo-access-token', 'demo-refresh-token', {
                    id: 'demo-user-id',
                    firstName: 'Business',
                    lastName: 'Owner',
                    email: 'admin@apexenterprise.com',
                    role: 'OWNER',
                  });
                }}
                className="w-full rounded-lg py-2 px-4 font-medium text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition text-center border border-slate-200 dark:border-slate-700 mt-1"
              >
                👁️ Explore All Designs (Instant Demo Preview)
              </button>
            </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 text-center">
          <p className="text-[11px] text-slate-400">
            Private Dedicated Installation &bull; ACID Encrypted Architecture
          </p>
        </div>
      </div>
    </div>
  );
}
