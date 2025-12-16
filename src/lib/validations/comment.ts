import { z } from 'zod';

/**
 * コメント対象区分
 */
export const CommentTargetType = z.enum(['PROBLEM', 'PLAN']);

/**
 * コメント作成スキーマ
 */
export const commentCreateSchema = z.object({
  target_type: CommentTargetType,
  content: z.string().min(1, 'コメント内容を入力してください').max(1000, 'コメントは1000文字以内で入力してください'),
});

// 型エクスポート
export type CommentTargetType = z.infer<typeof CommentTargetType>;
export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
