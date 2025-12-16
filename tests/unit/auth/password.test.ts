import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('Auth - Password Utils', () => {
  describe('UT-AUTH-001: パスワードハッシュ化', () => {
    it('平文パスワードをハッシュ化する', async () => {
      const password = 'password123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true); // bcrypt形式
    });

    it('同じ入力でも異なるハッシュが生成される', async () => {
      const password = 'password123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('UT-AUTH-002: パスワード検証', () => {
    it('正しいパスワードの場合trueを返す', async () => {
      const password = 'password123';
      const hash = await hashPassword(password);
      const result = await verifyPassword(password, hash);

      expect(result).toBe(true);
    });

    it('誤ったパスワードの場合falseを返す', async () => {
      const password = 'password123';
      const hash = await hashPassword(password);
      const result = await verifyPassword('wrongpassword', hash);

      expect(result).toBe(false);
    });
  });
});
