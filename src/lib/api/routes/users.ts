import { Hono } from 'hono'
import { prisma } from '@/lib/db/client'
import bcrypt from 'bcryptjs'
import type { CreateUserRequest, UpdateUserRequest, ChangePasswordRequest } from '@/types'

export const users = new Hono()

// GET /api/users - ユーザー一覧取得 (#23)
// 権限: 上長のみ
users.get('/', async (c) => {
  // TODO: 認証実装後、上長権限チェック
  const { role, page = '1', limit = '20' } = c.req.query()

  const pageNum = parseInt(page, 10)
  const limitNum = parseInt(limit, 10)
  const skip = (pageNum - 1) * limitNum

  // Build where clause
  const where: {
    role?: 'SALES' | 'MANAGER'
  } = {}

  if (role && (role === 'SALES' || role === 'MANAGER')) {
    where.role = role
  }

  // Get total count
  const total = await prisma.user.count({ where })

  // Get users
  const usersData = await prisma.user.findMany({
    where,
    skip,
    take: limitNum,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return c.json({
    success: true,
    data: {
      users: usersData,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  })
})

// GET /api/users/:id - ユーザー詳細取得 (#24)
// 権限: 上長のみ
users.get('/:id', async (c) => {
  // TODO: 認証実装後、上長権限チェック
  const { id } = c.req.param()

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) {
    return c.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ユーザーが見つかりません',
        },
      },
      404
    )
  }

  return c.json({
    success: true,
    data: user,
  })
})

// POST /api/users - ユーザー登録 (#25)
// 権限: 上長のみ
users.post('/', async (c) => {
  // TODO: 認証実装後、上長権限チェック
  const body = await c.req.json<CreateUserRequest>()

  // Validate required fields
  if (!body.name || !body.email || !body.password || !body.role) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容に誤りがあります',
          details: [
            ...(!body.name ? [{ field: 'name', message: '氏名は必須です' }] : []),
            ...(!body.email ? [{ field: 'email', message: 'メールアドレスは必須です' }] : []),
            ...(!body.password ? [{ field: 'password', message: 'パスワードは必須です' }] : []),
            ...(!body.role ? [{ field: 'role', message: '役職は必須です' }] : []),
          ],
        },
      },
      400
    )
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(body.email)) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容に誤りがあります',
          details: [{ field: 'email', message: 'メールアドレスの形式が正しくありません' }],
        },
      },
      400
    )
  }

  // Validate password length
  if (body.password.length < 8) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容に誤りがあります',
          details: [{ field: 'password', message: 'パスワードは8文字以上である必要があります' }],
        },
      },
      400
    )
  }

  // Validate role
  if (body.role !== 'SALES' && body.role !== 'MANAGER') {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容に誤りがあります',
          details: [{ field: 'role', message: '役職はSALESまたはMANAGERである必要があります' }],
        },
      },
      400
    )
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: body.email },
  })

  if (existingUser) {
    return c.json(
      {
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'このメールアドレスは既に登録されています',
        },
      },
      400
    )
  }

  // Hash password
  const passwordHash = await bcrypt.hash(body.password, 10)

  // Create user
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash,
      department: body.department ?? null,
      role: body.role,
    },
  })

  return c.json(
    {
      success: true,
      data: {
        id: user.id,
        message: 'ユーザーを登録しました',
      },
    },
    201
  )
})

// PUT /api/users/:id - ユーザー更新 (#26)
// 権限: 上長のみ
users.put('/:id', async (c) => {
  // TODO: 認証実装後、上長権限チェック
  const { id } = c.req.param()
  const body = await c.req.json<UpdateUserRequest>()

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  })

  if (!existingUser) {
    return c.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ユーザーが見つかりません',
        },
      },
      404
    )
  }

  // Validate email format if provided
  if (body.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '入力内容に誤りがあります',
            details: [{ field: 'email', message: 'メールアドレスの形式が正しくありません' }],
          },
        },
        400
      )
    }

    // Check if email is already used by another user
    if (body.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: body.email },
      })

      if (emailExists) {
        return c.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_ENTRY',
              message: 'このメールアドレスは既に登録されています',
            },
          },
          400
        )
      }
    }
  }

  // Validate role if provided
  if (body.role && body.role !== 'SALES' && body.role !== 'MANAGER') {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容に誤りがあります',
          details: [{ field: 'role', message: '役職はSALESまたはMANAGERである必要があります' }],
        },
      },
      400
    )
  }

  // Update user
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.email && { email: body.email }),
      ...(body.department !== undefined && { department: body.department }),
      ...(body.role && { role: body.role }),
    },
  })

  return c.json({
    success: true,
    data: {
      id: user.id,
      message: 'ユーザー情報を更新しました',
    },
  })
})

// DELETE /api/users/:id - ユーザー削除 (#27)
// 権限: 上長のみ
users.delete('/:id', async (c) => {
  // TODO: 認証実装後、上長権限チェック
  const { id } = c.req.param()

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  })

  if (!existingUser) {
    return c.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ユーザーが見つかりません',
        },
      },
      404
    )
  }

  // Delete user
  await prisma.user.delete({
    where: { id },
  })

  return c.json({
    success: true,
    data: {
      message: 'ユーザーを削除しました',
    },
  })
})

// PUT /api/users/:id/password - パスワード変更 (#28)
// 権限: 本人または上長
users.put('/:id/password', async (c) => {
  // TODO: 認証実装後、本人または上長の権限チェック
  const { id } = c.req.param()
  const body = await c.req.json<ChangePasswordRequest>()

  // Validate required fields
  if (!body.currentPassword || !body.newPassword) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容に誤りがあります',
          details: [
            ...(!body.currentPassword
              ? [{ field: 'currentPassword', message: '現在のパスワードは必須です' }]
              : []),
            ...(!body.newPassword
              ? [{ field: 'newPassword', message: '新しいパスワードは必須です' }]
              : []),
          ],
        },
      },
      400
    )
  }

  // Validate new password length
  if (body.newPassword.length < 8) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容に誤りがあります',
          details: [
            { field: 'newPassword', message: '新しいパスワードは8文字以上である必要があります' },
          ],
        },
      },
      400
    )
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user) {
    return c.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ユーザーが見つかりません',
        },
      },
      404
    )
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(body.currentPassword, user.passwordHash)

  if (!isValidPassword) {
    return c.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '現在のパスワードが正しくありません',
        },
      },
      401
    )
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(body.newPassword, 10)

  // Update password
  await prisma.user.update({
    where: { id },
    data: {
      passwordHash: newPasswordHash,
    },
  })

  return c.json({
    success: true,
    data: {
      message: 'パスワードを変更しました',
    },
  })
})
