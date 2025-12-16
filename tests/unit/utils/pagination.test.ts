import { describe, it, expect } from 'vitest';
import { calcPagination } from '@/lib/utils';

describe('Pagination Utils', () => {
  describe('UT-UTIL-002: ページネーション計算', () => {
    it('total=100, page=1, limit=20の場合、totalPages=5', () => {
      const result = calcPagination(100, 1, 20);
      expect(result.totalPages).toBe(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    it('total=0, page=1, limit=20の場合、totalPages=0', () => {
      const result = calcPagination(0, 1, 20);
      expect(result.totalPages).toBe(0);
      expect(result.page).toBe(1);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });

    it('2ページ目の場合、offset=20', () => {
      const result = calcPagination(100, 2, 20);
      expect(result.offset).toBe(20);
      expect(result.page).toBe(2);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });

    it('最終ページの場合、hasNext=false', () => {
      const result = calcPagination(100, 5, 20);
      expect(result.page).toBe(5);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });

    it('ページ数を超える場合、最終ページに補正', () => {
      const result = calcPagination(100, 99, 20);
      expect(result.page).toBe(5);
      expect(result.totalPages).toBe(5);
    });

    it('デフォルト値：page=1, limit=20', () => {
      const result = calcPagination(100);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('端数がある場合、切り上げてtotalPagesを計算', () => {
      const result = calcPagination(95, 1, 20);
      expect(result.totalPages).toBe(5); // Math.ceil(95/20) = 5
    });
  });
});
