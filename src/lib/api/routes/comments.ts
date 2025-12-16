import { Hono } from 'hono'
import { prisma } from '@/lib/db/client'
import type { ApiResponse, CommentResponse } from '@/types'

const comments = new Hono()

// POST /api/reports/:reportId/comments - コメント追加
comments.post('/:reportId/comments', async (c) => {
  const reportId = c.req.param('reportId')
  const { content } = await c.req.json<{ content: string }>()

  // 認証から取得
  const user = c.get('user')
  const userId = user.userId

  if (!content || content.trim().length === 0) {
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '入力内容に誤りがあります',
        details: [{ field: 'content', message: 'コメント内容は必須です' }],
      },
    }
    return c.json(response, 400)
  }

  try {
    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
    })

    if (!report) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '日報が見つかりません',
        },
      }
      return c.json(response, 404)
    }

    const comment = await prisma.comment.create({
      data: {
        dailyReportId: reportId,
        userId,
        targetType: 'PROBLEM',
        content: content.trim(),
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    })

    const response: ApiResponse<CommentResponse> = {
      success: true,
      data: {
        id: comment.id,
        content: comment.content,
        user: comment.user,
        createdAt: comment.createdAt.toISOString(),
      },
    }
    return c.json(response, 201)
  } catch (error) {
    console.error('Failed to create comment:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'コメントの作成に失敗しました',
      },
    }
    return c.json(response, 500)
  }
})

// DELETE /api/reports/:reportId/comments/:commentId - コメント削除
comments.delete('/:reportId/comments/:commentId', async (c) => {
  const reportId = c.req.param('reportId')
  const commentId = c.req.param('commentId')

  // 認証から取得
  const user = c.get('user')
  const userId = user.userId

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    })

    if (!comment || comment.dailyReportId !== reportId) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'コメントが見つかりません',
        },
      }
      return c.json(response, 404)
    }

    // 権限チェック（投稿者本人またはマネージャーのみ削除可能）
    if (comment.userId !== userId && user.role !== 'MANAGER') {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'このコメントを削除する権限がありません',
        },
      }
      return c.json(response, 403)
    }

    await prisma.comment.delete({
      where: { id: commentId },
    })

    const response: ApiResponse<void> = {
      success: true,
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to delete comment:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'コメントの削除に失敗しました',
      },
    }
    return c.json(response, 500)
  }
})

export { comments }
