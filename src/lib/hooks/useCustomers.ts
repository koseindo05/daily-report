'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

interface Customer {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  contact_person?: string;
}

interface CustomersResponse {
  customers: Customer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

/**
 * 顧客一覧取得フック
 */
export function useCustomers(params?: {
  keyword?: string;
  page?: number;
  limit?: number;
}) {
  const [data, setData] = useState<CustomersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        const query = new URLSearchParams(
          Object.entries(params || {})
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)])
        );
        const response = await apiClient.get<CustomersResponse>(
          `/customers?${query.toString()}`
        );
        setData(response);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [params?.keyword, params?.page, params?.limit]);

  return { data, isLoading, error };
}

/**
 * 顧客詳細取得フック
 */
export function useCustomer(id: string) {
  const [data, setData] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<Customer>(`/customers/${id}`);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCustomer();
    }
  }, [id]);

  return { data, isLoading, error };
}
