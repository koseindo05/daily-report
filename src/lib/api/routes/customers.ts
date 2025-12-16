import { Hono } from 'hono'
import { prisma } from '@/lib/db/client'
import type { ApiResponse, Customer, PaginationInfo } from '@/types'

const customers = new Hono()

interface CustomersResponse {
  customers: Customer[]
  pagination: PaginationInfo
}

// GET /api/customers - 顧客一覧取得
customers.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const search = c.req.query('search')

  const skip = (page - 1) * limit

  try {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { address: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [customerList, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.customer.count({ where }),
    ])

    const response: ApiResponse<CustomersResponse> = {
      success: true,
      data: {
        customers: customerList.map((cust) => ({
          id: cust.id,
          name: cust.name,
          address: cust.address ?? undefined,
          phone: cust.phone ?? undefined,
          contactPerson: cust.contactPerson ?? undefined,
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to fetch customers:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '顧客一覧の取得に失敗しました',
      },
    }
    return c.json(response, 500)
  }
})

// GET /api/customers/:id - 顧客詳細取得
customers.get('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!customer) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '顧客が見つかりません',
        },
      }
      return c.json(response, 404)
    }

    const response: ApiResponse<Customer> = {
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        address: customer.address ?? undefined,
        phone: customer.phone ?? undefined,
        contactPerson: customer.contactPerson ?? undefined,
      },
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to fetch customer:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '顧客の取得に失敗しました',
      },
    }
    return c.json(response, 500)
  }
})

// POST /api/customers - 顧客作成
customers.post('/', async (c) => {
  const body = await c.req.json<{
    name: string
    address?: string
    phone?: string
    contactPerson?: string
  }>()

  const errors: Array<{ field: string; message: string }> = []

  if (!body.name || body.name.trim().length === 0) {
    errors.push({ field: 'name', message: '顧客名は必須です' })
  }

  if (errors.length > 0) {
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '入力内容に誤りがあります',
        details: errors,
      },
    }
    return c.json(response, 400)
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        name: body.name.trim(),
        address: body.address?.trim() || null,
        phone: body.phone?.trim() || null,
        contactPerson: body.contactPerson?.trim() || null,
      },
    })

    const response: ApiResponse<Customer> = {
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        address: customer.address ?? undefined,
        phone: customer.phone ?? undefined,
        contactPerson: customer.contactPerson ?? undefined,
      },
    }
    return c.json(response, 201)
  } catch (error) {
    console.error('Failed to create customer:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '顧客の作成に失敗しました',
      },
    }
    return c.json(response, 500)
  }
})

// PUT /api/customers/:id - 顧客更新
customers.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{
    name?: string
    address?: string
    phone?: string
    contactPerson?: string
  }>()

  const errors: Array<{ field: string; message: string }> = []

  if (body.name !== undefined && body.name.trim().length === 0) {
    errors.push({ field: 'name', message: '顧客名は必須です' })
  }

  if (errors.length > 0) {
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '入力内容に誤りがあります',
        details: errors,
      },
    }
    return c.json(response, 400)
  }

  try {
    const existing = await prisma.customer.findUnique({
      where: { id },
    })

    if (!existing) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '顧客が見つかりません',
        },
      }
      return c.json(response, 404)
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.address !== undefined && { address: body.address.trim() || null }),
        ...(body.phone !== undefined && { phone: body.phone.trim() || null }),
        ...(body.contactPerson !== undefined && { contactPerson: body.contactPerson.trim() || null }),
      },
    })

    const response: ApiResponse<Customer> = {
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        address: customer.address ?? undefined,
        phone: customer.phone ?? undefined,
        contactPerson: customer.contactPerson ?? undefined,
      },
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to update customer:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '顧客の更新に失敗しました',
      },
    }
    return c.json(response, 500)
  }
})

// DELETE /api/customers/:id - 顧客削除
customers.delete('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    const existing = await prisma.customer.findUnique({
      where: { id },
    })

    if (!existing) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '顧客が見つかりません',
        },
      }
      return c.json(response, 404)
    }

    // 訪問記録がある場合は削除不可
    const visitCount = await prisma.visit.count({
      where: { customerId: id },
    })

    if (visitCount > 0) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'この顧客には訪問記録があるため削除できません',
        },
      }
      return c.json(response, 409)
    }

    await prisma.customer.delete({
      where: { id },
    })

    const response: ApiResponse<void> = {
      success: true,
    }
    return c.json(response)
  } catch (error) {
    console.error('Failed to delete customer:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '顧客の削除に失敗しました',
      },
    }
    return c.json(response, 500)
  }
})

export { customers }
