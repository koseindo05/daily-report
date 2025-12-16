'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

interface User {
  id: string;
  name: string;
  email: string;
  department?: string;
  role: 'SALES' | 'MANAGER';
}

interface UsersResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

/**
 * ユーザー一覧取得フック（上長のみ）
 */
export function useUsers(params?: {
  role?: 'SALES' | 'MANAGER';
  page?: number;
  limit?: number;
}) {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const query = new URLSearchParams(
          Object.entries(params || {})
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)])
        );
        const response = await apiClient.get<UsersResponse>(
          `/users?${query.toString()}`
        );
        setData(response);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [params?.role, params?.page, params?.limit]);

  return { data, isLoading, error };
}

/**
 * ユーザー詳細取得フック（上長のみ）
 */
export function useUser(id: string) {
  const [data, setData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<User>(`/users/${id}`);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id]);

  return { data, isLoading, error };
}
