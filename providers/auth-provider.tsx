'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (token: string, refreshToken: string, user: UserProfile) => void;
  logout: () => Promise<void>;
  updateUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadSession = async () => {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user_profile');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify with /auth/me in background
          const res: any = await api.get('/auth/me');
          if (res?.data) {
            setUser(res.data);
            localStorage.setItem('user_profile', JSON.stringify(res.data));
          }
        } catch {
          // api interceptor handles refresh or logout if expired
        }
      }
      setIsLoading(false);
    };

    loadSession();
  }, []);

  const login = (token: string, refreshToken: string, userProfile: UserProfile) => {
    localStorage.setItem('access_token', token);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    localStorage.setItem('user_profile', JSON.stringify(userProfile));
    setUser(userProfile);
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_profile');
      setUser(null);
      router.push('/login');
    }
  };

  const updateUser = (updated: UserProfile) => {
    setUser(updated);
    localStorage.setItem('user_profile', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
