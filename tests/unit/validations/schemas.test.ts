import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  reportCreateSchema,
  visitSchema,
  commentCreateSchema,
  customerCreateSchema,
  userCreateSchema,
} from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('UT-VAL-001: メールアドレス形式検証', () => {
    it('有効なメールアドレスを受け入れる', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('無効なメールアドレスを拒否する', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('空のメールアドレスを拒否する', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UT-VAL-002: 日報日付検証', () => {
    it('過去日を受け入れる', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const dateString = pastDate.toISOString().split('T')[0];

      const result = reportCreateSchema.safeParse({
        report_date: dateString,
        visits: [
          {
            customer_id: 'customer_001',
            content: 'テスト訪問',
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('今日の日付を受け入れる', () => {
      const today = new Date().toISOString().split('T')[0];

      const result = reportCreateSchema.safeParse({
        report_date: today,
        visits: [
          {
            customer_id: 'customer_001',
            content: 'テスト訪問',
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('未来日を拒否する', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateString = futureDate.toISOString().split('T')[0];

      const result = reportCreateSchema.safeParse({
        report_date: dateString,
        visits: [
          {
            customer_id: 'customer_001',
            content: 'テスト訪問',
          },
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UT-VAL-003: 訪問内容文字数検証', () => {
    it('1〜1000文字の訪問内容を受け入れる', () => {
      const result = visitSchema.safeParse({
        customer_id: 'customer_001',
        content: 'テスト訪問内容',
      });
      expect(result.success).toBe(true);
    });

    it('空文字を拒否する', () => {
      const result = visitSchema.safeParse({
        customer_id: 'customer_001',
        content: '',
      });
      expect(result.success).toBe(false);
    });

    it('1001文字以上を拒否する', () => {
      const longContent = 'あ'.repeat(1001);
      const result = visitSchema.safeParse({
        customer_id: 'customer_001',
        content: longContent,
      });
      expect(result.success).toBe(false);
    });

    it('1000文字ちょうどを受け入れる', () => {
      const content = 'あ'.repeat(1000);
      const result = visitSchema.safeParse({
        customer_id: 'customer_001',
        content: content,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Additional Validations', () => {
    it('パスワードは8文字以上必要', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('コメント対象区分はPROBLEMまたはPLAN', () => {
      const validResult = commentCreateSchema.safeParse({
        target_type: 'PROBLEM',
        content: 'テストコメント',
      });
      expect(validResult.success).toBe(true);

      const invalidResult = commentCreateSchema.safeParse({
        target_type: 'INVALID',
        content: 'テストコメント',
      });
      expect(invalidResult.success).toBe(false);
    });

    it('顧客名は必須', () => {
      const result = customerCreateSchema.safeParse({
        name: '',
      });
      expect(result.success).toBe(false);
    });

    it('ユーザー役職はSALESまたはMANAGER', () => {
      const validResult = userCreateSchema.safeParse({
        name: '山田太郎',
        email: 'yamada@example.com',
        password: 'password123',
        role: 'SALES',
      });
      expect(validResult.success).toBe(true);

      const invalidResult = userCreateSchema.safeParse({
        name: '山田太郎',
        email: 'yamada@example.com',
        password: 'password123',
        role: 'INVALID',
      });
      expect(invalidResult.success).toBe(false);
    });
  });
});
