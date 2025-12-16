import { z } from 'zod';

/**
 * ユーザー役職
 */
export const UserRole = z.enum(['SALES', 'MANAGER']);

/**
 * ユーザー作成スキーマ
 */
export const userCreateSchema = z.object({
  name: z.string().min(1, '氏名を入力してください').max(50, '氏名は50文字以内で入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
  department: z.string().max(50, '部署名は50文字以内で入力してください').optional().nullable(),
  role: UserRole,
});

/**
 * ユーザー更新スキーマ
 */
export const userUpdateSchema = z.object({
  name: z.string().min(1, '氏名を入力してください').max(50, '氏名は50文字以内で入力してください').optional(),
  email: z.string().email('有効なメールアドレスを入力してください').optional(),
  department: z.string().max(50, '部署名は50文字以内で入力してください').optional().nullable(),
  role: UserRole.optional(),
});

// 型エクスポート
export type UserRole = z.infer<typeof UserRole>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
