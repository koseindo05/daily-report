import { ERROR_CODES, ERROR_STATUS_MAP, ERROR_MESSAGES, type ErrorCode } from './codes';

/**
 * APIエラークラス
 */
export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message?: string,
    details?: unknown
  ) {
    super(message || ERROR_MESSAGES[code]);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = ERROR_STATUS_MAP[code];
    this.details = details;

    // TypeScriptのビルトインErrorとの互換性のため
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * JSON形式でエラーを返す
   */
  toJSON() {
    const error: { code: ErrorCode; message: string; details?: unknown } = {
      code: this.code,
      message: this.message,
    };
    if (this.details !== undefined) {
      error.details = this.details;
    }
    return {
      success: false,
      error,
    };
  }

  /**
   * 便利なファクトリーメソッド
   */
  static invalidRequest(message?: string, details?: unknown) {
    return new ApiError(ERROR_CODES.INVALID_REQUEST, message, details);
  }

  static unauthorized(message?: string) {
    return new ApiError(ERROR_CODES.UNAUTHORIZED, message);
  }

  static forbidden(message?: string) {
    return new ApiError(ERROR_CODES.FORBIDDEN, message);
  }

  static notFound(message?: string) {
    return new ApiError(ERROR_CODES.NOT_FOUND, message);
  }

  static duplicateEntry(message?: string) {
    return new ApiError(ERROR_CODES.DUPLICATE_ENTRY, message);
  }

  static validationError(message?: string, details?: unknown) {
    return new ApiError(ERROR_CODES.VALIDATION_ERROR, message, details);
  }

  static internalError(message?: string) {
    return new ApiError(ERROR_CODES.INTERNAL_ERROR, message);
  }
}
