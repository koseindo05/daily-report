'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, setToken, removeToken } from '@/lib/api/client';
import { LoginInput } from '@/lib/validations';

interface User {
  id: string;
  name: string;
  email: string;
  department?: string;
  role: 'SALES' | 'MANAGER';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isSales: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 認証プロバイダー
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ページ読み込み時にユーザー情報を取得
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await apiClient.get<User>('/auth/me');
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (credentials: LoginInput) => {
    const response = await apiClient.post<{ token: string; user: User }>('/auth/login', credentials);
    setToken(response.token);
    setUser(response.user);
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    isSales: user?.role === 'SALES',
    isManager: user?.role === 'MANAGER',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * 認証フック
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
