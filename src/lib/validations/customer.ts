import { z } from 'zod';

/**
 * 電話番号形式の検証（日本の電話番号形式）
 */
const phoneRegex = /^0\d{1,4}-?\d{1,4}-?\d{4}$/;

/**
 * 顧客作成スキーマ
 */
export const customerCreateSchema = z.object({
  name: z.string().min(1, '顧客名を入力してください').max(100, '顧客名は100文字以内で入力してください'),
  address: z.string().max(200, '住所は200文字以内で入力してください').optional().nullable(),
  phone: z.string()
    .refine((val) => !val || phoneRegex.test(val), '有効な電話番号を入力してください（例: 03-1234-5678）')
    .optional()
    .nullable(),
  contact_person: z.string().max(50, '担当者名は50文字以内で入力してください').optional().nullable(),
});

/**
 * 顧客更新スキーマ
 */
export const customerUpdateSchema = z.object({
  name: z.string().min(1, '顧客名を入力してください').max(100, '顧客名は100文字以内で入力してください').optional(),
  address: z.string().max(200, '住所は200文字以内で入力してください').optional().nullable(),
  phone: z.string()
    .refine((val) => !val || phoneRegex.test(val), '有効な電話番号を入力してください（例: 03-1234-5678）')
    .optional()
    .nullable(),
  contact_person: z.string().max(50, '担当者名は50文字以内で入力してください').optional().nullable(),
});

// 型エクスポート
export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
