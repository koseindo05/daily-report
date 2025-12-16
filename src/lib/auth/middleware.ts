import type { Context, Next } from 'hono'
import { verifyToken, extractTokenFromHeader, extractTokenFromCookie, type JwtPayload } from './jwt'
import type { Role } from '@/types'

// Honoのコンテキストに認証情報を追加するための型拡張
declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload
  }
}

/**
 * JWT認証ミドルウェア
 * Authorization HeaderまたはCookieからトークンを取得して検証する
 */
export async function authMiddleware(c: Context, next: Next) {
  // Authorizationヘッダーから取得を試みる
  let token = extractTokenFromHeader(c.req.header('Authorization'))

  // Cookieから取得を試みる
  if (!token) {
    token = extractTokenFromCookie(c.req.header('Cookie'))
  }

  if (!token) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '認証が必要です',
        },
      },
      401
    )
  }

  const payload = verifyToken(token)

  if (!payload) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'トークンが無効または期限切れです',
        },
      },
      401
    )
  }

  // コンテキストにユーザー情報を設定
  c.set('user', payload)

  await next()
}

/**
 * ロールベースの権限制御ミドルウェア
 * 指定されたロールを持つユーザーのみアクセスを許可する
 */
export function requireRole(...allowedRoles: Role[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user')

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '認証が必要です',
          },
        },
        401
      )
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'この操作を行う権限がありません',
          },
        },
        403
      )
    }

    await next()
  }
}

/**
 * マネージャー専用ミドルウェア
 */
export const requireManager = requireRole('MANAGER')

/**
 * 自分自身またはマネージャーのみアクセス可能なリソース用ミドルウェア
 */
export function requireSelfOrManager(getUserIdFromParams: (c: Context) => string) {
  return async (c: Context, next: Next) => {
    const user = c.get('user')

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '認証が必要です',
          },
        },
        401
      )
    }

    const targetUserId = getUserIdFromParams(c)

    // 自分自身またはマネージャーならアクセス可能
    if (user.userId === targetUserId || user.role === 'MANAGER') {
      await next()
      return
    }

    return c.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'この操作を行う権限がありません',
        },
      },
      403
    )
  }
}
