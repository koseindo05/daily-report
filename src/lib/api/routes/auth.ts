import { Hono } from 'hono'
import { prisma } from '@/lib/db/client'
import { hashPassword, verifyPassword, generateToken, authMiddleware } from '@/lib/auth'
import type { ApiResponse } from '@/types'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: 'SALES' | 'MANAGER'
    department: string | null
  }
}

interface MeResponse {
  id: string
  email: string
  name: string
  role: 'SALES' | 'MANAGER'
  department: string | null
}

const auth = new Hono()

// POST /api/auth/login - ログイン
auth.post('/login', async (c) => {
  const body = await c.req.json<LoginRequest>()

  // バリデーション
  if (!body.email || !body.password) {
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '入力内容に誤りがあります',
        details: [
          ...(!body.email ? [{ field: 'email', message: 'メールアドレスは必須です' }] : []),
          ...(!body.password ? [{ field: 'password', message: 'パスワードは必須です' }] : []),
        ],
      },
    }
    return c.json(response, 400)
  }

  try {
    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (!user) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'メールアドレスまたはパスワードが正しくありません',
        },
      }
      return c.json(response, 401)
    }

    // パスワード検証
    const isValid = await verifyPassword(body.password, user.passwordHash)

    if (!isValid) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'メールアドレスまたはパスワードが正しくありません',
        },
      }
      return c.json(response, 401)
    }

    // JWTトークン生成
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Cookie設定
    c.header(
      'Set-Cookie',
      `auth-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24}`
    )

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
        },
      },
    }
    return c.json(response)
  } catch (error) {
    console.error('Login error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'ログインに失敗しました',
      },
    }
    return c.json(response, 500)
  }
})

// POST /api/auth/logout - ログアウト
auth.post('/logout', async (c) => {
  // Cookieを削除
  c.header('Set-Cookie', 'auth-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0')

  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: {
      message: 'ログアウトしました',
    },
  }
  return c.json(response)
})

// GET /api/auth/me - ログインユーザー情報取得
auth.get('/me', authMiddleware, async (c) => {
  const userPayload = c.get('user')

  try {
    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
      },
    })

    if (!user) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ユーザーが見つかりません',
        },
      }
      return c.json(response, 404)
    }

    const response: ApiResponse<MeResponse> = {
      success: true,
      data: user,
    }
    return c.json(response)
  } catch (error) {
    console.error('Get me error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'ユーザー情報の取得に失敗しました',
      },
    }
    return c.json(response, 500)
  }
})

// パスワードハッシュ化ヘルパー（シードデータ作成用にエクスポート）
export { hashPassword }

export { auth }
