import { Hono } from 'hono'
import { prisma } from '@/lib/db/client'
import type { CreateReportRequest, UpdateReportRequest } from '@/types'

export const reports = new Hono()

// GET /api/reports - 日報一覧取得
reports.get('/', async (c) => {
  const { date_from, date_to, user_id, page = '1', limit = '20' } = c.req.query()

  const pageNum = parseInt(page, 10)
  const limitNum = parseInt(limit, 10)
  const skip = (pageNum - 1) * limitNum

  // Build where clause
  const where: {
    reportDate?: { gte?: Date; lte?: Date }
    userId?: string
  } = {}

  if (date_from || date_to) {
    where.reportDate = {}
    if (date_from) where.reportDate.gte = new Date(date_from)
    if (date_to) where.reportDate.lte = new Date(date_to)
  }

  if (user_id) {
    where.userId = user_id
  }

  // Get total count
  const total = await prisma.dailyReport.count({ where })

  // Get reports with aggregation
  const reportsData = await prisma.dailyReport.findMany({
    where,
    skip,
    take: limitNum,
    orderBy: { reportDate: 'desc' },
    include: {
      user: {
        select: { id: true, name: true },
      },
      _count: {
        select: { visits: true, comments: true },
      },
    },
  })

  const reports = reportsData.map((r) => ({
    id: r.id,
    reportDate: r.reportDate.toISOString().split('T')[0],
    user: r.user,
    visitCount: r._count.visits,
    commentCount: r._count.comments,
    createdAt: r.createdAt.toISOString(),
  }))

  return c.json({
    success: true,
    data: {
      reports,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  })
})

// GET /api/reports/:id - 日報詳細取得
reports.get('/:id', async (c) => {
  const { id } = c.req.param()

  const report = await prisma.dailyReport.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, department: true },
      },
      visits: {
        include: {
          customer: {
            select: { id: true, name: true },
          },
        },
        orderBy: { visitTime: 'asc' },
      },
      comments: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!report) {
    return c.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '日報が見つかりません',
        },
      },
      404
    )
  }

  return c.json({
    success: true,
    data: {
      id: report.id,
      reportDate: report.reportDate.toISOString().split('T')[0],
      user: report.user,
      visits: report.visits.map((v) => ({
        id: v.id,
        customer: v.customer,
        visitTime: v.visitTime,
        content: v.content,
      })),
      problem: report.problem,
      plan: report.plan,
      comments: report.comments.map((c) => ({
        id: c.id,
        targetType: c.targetType,
        content: c.content,
        user: c.user,
        createdAt: c.createdAt.toISOString(),
      })),
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    },
  })
})

// POST /api/reports - 日報作成
reports.post('/', async (c) => {
  const body = await c.req.json<CreateReportRequest>()

  // 認証から取得
  const user = c.get('user')
  const userId = user.userId

  // Validate report date (not future)
  const reportDate = new Date(body.reportDate)
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  if (reportDate > today) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容に誤りがあります',
          details: [{ field: 'report_date', message: '未来の日付は指定できません' }],
        },
      },
      400
    )
  }

  // Check for duplicate
  const existing = await prisma.dailyReport.findFirst({
    where: {
      userId,
      reportDate: {
        gte: new Date(body.reportDate),
        lt: new Date(new Date(body.reportDate).getTime() + 24 * 60 * 60 * 1000),
      },
    },
  })

  if (existing) {
    return c.json(
      {
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'この日付の日報は既に存在します',
        },
      },
      400
    )
  }

  // Create report with visits
  const report = await prisma.dailyReport.create({
    data: {
      userId,
      reportDate: new Date(body.reportDate),
      problem: body.problem ?? null,
      plan: body.plan ?? null,
      visits: {
        create: body.visits.map((v) => ({
          customerId: v.customerId,
          content: v.content,
          visitTime: v.visitTime ?? null,
        })),
      },
    },
  })

  return c.json(
    {
      success: true,
      data: {
        id: report.id,
        reportDate: report.reportDate.toISOString().split('T')[0],
        message: '日報を作成しました',
      },
    },
    201
  )
})

// PUT /api/reports/:id - 日報更新
reports.put('/:id', async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json<UpdateReportRequest>()

  // 認証から取得
  const user = c.get('user')
  const userId = user.userId

  // Check if report exists and belongs to user
  const existing = await prisma.dailyReport.findUnique({
    where: { id },
  })

  if (!existing) {
    return c.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '日報が見つかりません',
        },
      },
      404
    )
  }

  // 本人確認（本人またはマネージャーのみ編集可能）
  if (existing.userId !== userId && user.role !== 'MANAGER') {
    return c.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'この日報を編集する権限がありません',
        },
      },
      403
    )
  }

  // Delete existing visits and create new ones
  await prisma.visit.deleteMany({
    where: { dailyReportId: id },
  })

  // Update report with new visits
  const report = await prisma.dailyReport.update({
    where: { id },
    data: {
      problem: body.problem ?? null,
      plan: body.plan ?? null,
      visits: {
        create: body.visits.map((v) => ({
          customerId: v.customerId,
          content: v.content,
          visitTime: v.visitTime ?? null,
        })),
      },
    },
  })

  return c.json({
    success: true,
    data: {
      id: report.id,
      message: '日報を更新しました',
    },
  })
})

// DELETE /api/reports/:id - 日報削除
reports.delete('/:id', async (c) => {
  const { id } = c.req.param()

  // 認証から取得
  const user = c.get('user')
  const userId = user.userId

  // Check if report exists
  const existing = await prisma.dailyReport.findUnique({
    where: { id },
  })

  if (!existing) {
    return c.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '日報が見つかりません',
        },
      },
      404
    )
  }

  // 本人確認（本人またはマネージャーのみ削除可能）
  if (existing.userId !== userId && user.role !== 'MANAGER') {
    return c.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'この日報を削除する権限がありません',
        },
      },
      403
    )
  }

  // Delete report (visits and comments will cascade)
  await prisma.dailyReport.delete({
    where: { id },
  })

  return c.json({
    success: true,
    data: {
      message: '日報を削除しました',
    },
  })
})
