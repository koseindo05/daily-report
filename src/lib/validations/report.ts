import { z } from 'zod';

/**
 * 日付が未来でないことを検証するヘルパー関数
 */
const isFuture = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
};

/**
 * 訪問記録スキーマ
 */
export const visitSchema = z.object({
  id: z.string().optional(), // 更新時に使用
  customer_id: z.string().min(1, '顧客を選択してください'),
  visit_time: z.string().optional().nullable(),
  content: z.string().min(1, '訪問内容を入力してください').max(1000, '訪問内容は1000文字以内で入力してください'),
});

/**
 * 日報作成スキーマ
 */
export const reportCreateSchema = z.object({
  report_date: z.string()
    .refine(dateStr => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    }, '有効な日付を入力してください')
    .refine(dateStr => !isFuture(dateStr), '未来の日付は指定できません'),
  visits: z.array(visitSchema).min(1, '訪問記録は最低1件必要です'),
  problem: z.string().max(2000, '課題・相談は2000文字以内で入力してください').optional().nullable(),
  plan: z.string().max(2000, '明日やることは2000文字以内で入力してください').optional().nullable(),
});

/**
 * 日報更新スキーマ
 */
export const reportUpdateSchema = z.object({
  visits: z.array(visitSchema).min(1, '訪問記録は最低1件必要です').optional(),
  problem: z.string().max(2000, '課題・相談は2000文字以内で入力してください').optional().nullable(),
  plan: z.string().max(2000, '明日やることは2000文字以内で入力してください').optional().nullable(),
});

// 型エクスポート
export type VisitInput = z.infer<typeof visitSchema>;
export type ReportCreateInput = z.infer<typeof reportCreateSchema>;
export type ReportUpdateInput = z.infer<typeof reportUpdateSchema>;
