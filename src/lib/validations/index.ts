/**
 * バリデーションスキーマ
 *
 * Zodを使用したAPI・フォームのバリデーションスキーマを提供
 */

// 認証関連
export {
  loginSchema,
  passwordChangeSchema,
  type LoginInput,
  type PasswordChangeInput,
} from './auth';

// 日報関連
export {
  visitSchema,
  reportCreateSchema,
  reportUpdateSchema,
  type VisitInput,
  type ReportCreateInput,
  type ReportUpdateInput,
} from './report';

// コメント関連
export {
  CommentTargetType,
  commentCreateSchema,
  type CommentTargetType as CommentTargetTypeEnum,
  type CommentCreateInput,
} from './comment';

// 顧客関連
export {
  customerCreateSchema,
  customerUpdateSchema,
  type CustomerCreateInput,
  type CustomerUpdateInput,
} from './customer';

// ユーザー関連
export {
  UserRole,
  userCreateSchema,
  userUpdateSchema,
  type UserRole as UserRoleEnum,
  type UserCreateInput,
  type UserUpdateInput,
} from './user';
