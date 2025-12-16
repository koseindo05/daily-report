import { z } from 'zod';

/**
 * ログインリクエストスキーマ
 */
export const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
});

/**
 * パスワード変更スキーマ
 */
export const passwordChangeSchema = z.object({
  current_password: z.string().min(1, '現在のパスワードを入力してください'),
  new_password: z.string().min(8, '新しいパスワードは8文字以上である必要があります'),
});

// 型エクスポート
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
