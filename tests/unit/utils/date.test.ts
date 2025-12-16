import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, isFuture, parseDate } from '@/lib/utils';

describe('Date Utils', () => {
  describe('UT-UTIL-001: 日付フォーマット', () => {
    it('Dateオブジェクトを「2024年12月15日（日）」形式にフォーマット', () => {
      const date = new Date('2024-12-15T00:00:00Z');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/2024年12月15日（[日月火水木金土]）/);
    });

    it('文字列を「2024年12月15日（日）」形式にフォーマット', () => {
      const formatted = formatDate('2024-12-15');
      expect(formatted).toMatch(/2024年12月15日（[日月火水木金土]）/);
    });
  });

  describe('formatDateTime', () => {
    it('日時を「2024/12/15 18:30」形式にフォーマット', () => {
      // ローカルタイムゾーンで日付を作成
      const date = new Date(2024, 11, 15, 18, 30, 0); // 月は0始まり
      const formatted = formatDateTime(date);
      expect(formatted).toBe('2024/12/15 18:30');
    });

    it('一桁の月日を0埋めする', () => {
      // ローカルタイムゾーンで日付を作成
      const date = new Date(2024, 0, 5, 9, 5, 0); // 1月5日 09:05
      const formatted = formatDateTime(date);
      expect(formatted).toBe('2024/01/05 09:05');
    });
  });

  describe('isFuture', () => {
    it('未来日の場合trueを返す', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isFuture(futureDate)).toBe(true);
    });

    it('過去日の場合falseを返す', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isFuture(pastDate)).toBe(false);
    });

    it('今日の開始時刻(0:00:00)の場合falseを返す', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(isFuture(today)).toBe(false);
    });

    it('文字列形式の日付も処理できる', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateString = futureDate.toISOString().split('T')[0];
      expect(isFuture(dateString)).toBe(true);
    });
  });

  describe('parseDate', () => {
    it('YYYY-MM-DD形式の文字列からDateオブジェクトを生成', () => {
      const date = parseDate('2024-12-15');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2024);
    });
  });
});
