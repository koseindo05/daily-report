/**
 * ページネーション関連のユーティリティ関数
 */

export interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  offset: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * ページネーション情報を計算
 * @param total - 総件数
 * @param page - 現在のページ番号（1始まり）
 * @param limit - 1ページあたりの件数
 * @returns ページネーション情報
 */
export function calcPagination(
  total: number,
  page: number = 1,
  limit: number = 20
): PaginationResult {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));
  const offset = (currentPage - 1) * limit;

  return {
    total,
    page: currentPage,
    limit,
    totalPages,
    offset,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}
