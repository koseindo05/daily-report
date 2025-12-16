'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

interface Report {
  id: string;
  report_date: string;
  user: {
    id: string;
    name: string;
  };
  visit_count: number;
  comment_count: number;
  created_at: string;
}

interface ReportDetail extends Report {
  visits: Array<{
    id: string;
    customer: {
      id: string;
      name: string;
    };
    visit_time?: string;
    content: string;
  }>;
  problem?: string;
  plan?: string;
  comments: Array<{
    id: string;
    target_type: 'PROBLEM' | 'PLAN';
    content: string;
    user: {
      id: string;
      name: string;
    };
    created_at: string;
  }>;
}

interface ReportsResponse {
  reports: Report[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

/**
 * 日報一覧取得フック
 */
export function useReports(params?: {
  date_from?: string;
  date_to?: string;
  user_id?: string;
  page?: number;
  limit?: number;
}) {
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true);
        const query = new URLSearchParams(
          Object.entries(params || {})
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)])
        );
        const response = await apiClient.get<ReportsResponse>(
          `/reports?${query.toString()}`
        );
        setData(response);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [params?.date_from, params?.date_to, params?.user_id, params?.page, params?.limit]);

  return { data, isLoading, error };
}

/**
 * 日報詳細取得フック
 */
export function useReport(id: string) {
  const [data, setData] = useState<ReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<ReportDetail>(`/reports/${id}`);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  return { data, isLoading, error };
}
