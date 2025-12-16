/**
 * APIレスポンス関連のユーティリティ関数
 */

/**
 * エラーコード定義
 */
export const ErrorCodes = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * 成功レスポンスの型
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/**
 * エラーレスポンスの型
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

/**
 * APIレスポンスの型
 */
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * 成功レスポンスを生成
 * @param data - レスポンスデータ
 * @returns 成功レスポンス
 */
export function successResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * エラーレスポンスを生成
 * @param code - エラーコード
 * @param message - エラーメッセージ
 * @param details - 詳細情報（オプション）
 * @returns エラーレスポンス
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown
): ErrorResponse {
  const error: { code: ErrorCode; message: string; details?: unknown } = {
    code,
    message,
  };
  if (details !== undefined) {
    error.details = details;
  }
  return {
    success: false,
    error,
  };
}
