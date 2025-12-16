/**
 * APIクライアント
 */

import { ApiError } from '@/lib/errors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * トークンを取得
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * トークンを保存
 */
export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

/**
 * トークンを削除
 */
export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}

/**
 * 共通リクエスト処理
 */
async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const error = data.error || {};
    throw new ApiError(
      error.code || 'INTERNAL_ERROR',
      error.message || 'エラーが発生しました',
      error.details
    );
  }

  return data.data;
}

/**
 * APIクライアント
 */
export const apiClient = {
  /**
   * GETリクエスト
   */
  get: <T>(url: string): Promise<T> => {
    return request<T>(url, { method: 'GET' });
  },

  /**
   * POSTリクエスト
   */
  post: <T>(url: string, data?: unknown): Promise<T> => {
    return request<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * PUTリクエスト
   */
  put: <T>(url: string, data?: unknown): Promise<T> => {
    return request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * DELETEリクエスト
   */
  delete: <T>(url: string): Promise<T> => {
    return request<T>(url, { method: 'DELETE' });
  },
};
