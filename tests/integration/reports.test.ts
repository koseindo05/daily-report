/**
 * Integration Tests: Reports API
 *
 * Test IDs:
 * - IT-REPORT-001: Report list retrieval
 * - IT-REPORT-002: Report list with date filter
 * - IT-REPORT-003: Report detail retrieval
 * - IT-REPORT-004: Report detail (not found)
 * - IT-REPORT-005: Report creation success
 * - IT-REPORT-006: Report creation failure (future date)
 * - IT-REPORT-007: Report creation failure (duplicate same day)
 * - IT-REPORT-008: Report update success
 * - IT-REPORT-009: Report update failure (another user's report)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import {
  TEST_USERS,
  TEST_CUSTOMERS,
  TEST_REPORTS,
  generateTestToken,
  createAuthHeader,
  makeRequest,
  parseResponse,
  getYesterdayString,
  getTomorrowString,
} from './helpers'
import type { ApiResponse } from '@/types'
import { authMiddleware } from '@/lib/auth'

// Mock Prisma - use vi.hoisted to avoid hoisting issues
const mockPrisma = vi.hoisted(() => ({
  dailyReport: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  visit: {
    deleteMany: vi.fn(),
  },
}))

vi.mock('@/lib/db/client', () => ({
  prisma: mockPrisma,
}))

// Import after mocking
import { reports } from '@/lib/api/routes/reports'

describe('Reports API Integration Tests', () => {
  let app: Hono
  let salesToken: string
  let managerToken: string
  let anotherSalesToken: string

  beforeEach(() => {
    vi.clearAllMocks()

    // Generate tokens
    salesToken = generateTestToken(TEST_USERS.salesUser)
    managerToken = generateTestToken(TEST_USERS.managerUser)
    anotherSalesToken = generateTestToken(TEST_USERS.anotherSalesUser)

    // Create a fresh Hono app for each test
    app = new Hono().basePath('/api')
    app.use('/reports/*', authMiddleware)
    app.route('/reports', reports)
  })

  describe('IT-REPORT-001: Report List Retrieval', () => {
    it('should return paginated list of reports', async () => {
      // Arrange
      const mockReports = [
        {
          ...TEST_REPORTS.report1,
          user: { id: TEST_USERS.salesUser.id, name: TEST_USERS.salesUser.name },
          _count: { visits: 2, comments: 1 },
        },
        {
          ...TEST_REPORTS.report2,
          user: { id: TEST_USERS.anotherSalesUser.id, name: TEST_USERS.anotherSalesUser.name },
          _count: { visits: 1, comments: 0 },
        },
      ]

      mockPrisma.dailyReport.count.mockResolvedValue(2)
      mockPrisma.dailyReport.findMany.mockResolvedValue(mockReports)

      // Act
      const response = await makeRequest(app, 'GET', '/api/reports', {
        headers: createAuthHeader(salesToken),
      })

      // Assert
      expect(response.status).toBe(200)

      const data = await parseResponse<ApiResponse<{ reports: unknown[]; pagination: unknown }>>(response)
      expect(data.success).toBe(true)
      expect(data.data?.reports).toHaveLength(2)
      expect(data.data?.pagination).toBeDefined()
    })

    it('should return empty list when no reports exist', async () => {
      // Arrange
      mockPrisma.dailyReport.count.mockResolvedValue(0)
      mockPrisma.dailyReport.findMany.mockResolvedValue([])

      // Act
      const response = await makeRequest(app, 'GET', '/api/reports', {
        headers: createAuthHeader(salesToken),
      })

      // Assert
      expect(response.status).toBe(200)

      const data = await parseResponse<ApiResponse<{ reports: unknown[]; pagination: { total: number } }>>(response)
      expect(data.success).toBe(true)
      expect(data.data?.reports).toHaveLength(0)
      expect(data.data?.pagination.total).toBe(0)
    })

    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await makeRequest(app, 'GET', '/api/reports', {})

      // Assert
      expect(response.status).toBe(401)
    })
  })

  describe('IT-REPORT-002: Report List with Date Filter', () => {
    it('should filter reports by date range', async () => {
      // Arrange
      const mockReports = [
        {
          ...TEST_REPORTS.report1,
          user: { id: TEST_USERS.salesUser.id, name: TEST_USERS.salesUser.name },
          _count: { visits: 2, comments: 1 },
        },
      ]

      mockPrisma.dailyReport.count.mockResolvedValue(1)
      mockPrisma.dailyReport.findMany.mockResolvedValue(mockReports)

      // Act
      const response = await makeRequest(
        app,
        'GET',
        '/api/reports?date_from=2024-12-01&date_to=2024-12-31',
        {
          headers: createAuthHeader(salesToken),
        }
      )

      // Assert
      expect(response.status).toBe(200)

      const data = await parseResponse<ApiResponse<{ reports: unknown[] }>>(response)
      expect(data.success).toBe(true)

      // Verify Prisma was called with date filter
      expect(mockPrisma.dailyReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reportDate: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      )
    })

    it('should filter reports by user_id', async () => {
      // Arrange
      mockPrisma.dailyReport.count.mockResolvedValue(1)
      mockPrisma.dailyReport.findMany.mockResolvedValue([])

      // Act
      const response = await makeRequest(
        app,
        'GET',
        `/api/reports?user_id=${TEST_USERS.salesUser.id}`,
        {
          headers: createAuthHeader(salesToken),
        }
      )

      // Assert
      expect(response.status).toBe(200)

      // Verify Prisma was called with user filter
      expect(mockPrisma.dailyReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: TEST_USERS.salesUser.id,
          }),
        })
      )
    })
  })

  describe('IT-REPORT-003: Report Detail Retrieval', () => {
    it('should return report detail with visits and comments', async () => {
      // Arrange
      const mockReport = {
        ...TEST_REPORTS.report1,
        user: {
          id: TEST_USERS.salesUser.id,
          name: TEST_USERS.salesUser.name,
          department: TEST_USERS.salesUser.department,
        },
        visits: [
          {
            id: 'visit1',
            customer: { id: TEST_CUSTOMERS.customer1.id, name: TEST_CUSTOMERS.customer1.name },
            visitTime: '10:00',
            content: 'Test visit content',
          },
        ],
        comments: [
          {
            id: 'comment1',
            targetType: 'PROBLEM',
            content: 'Test comment',
            user: { id: TEST_USERS.managerUser.id, name: TEST_USERS.managerUser.name },
            createdAt: new Date('2024-12-15'),
          },
        ],
      }

      mockPrisma.dailyReport.findUnique.mockResolvedValue(mockReport)

      // Act
      const response = await makeRequest(app, 'GET', `/api/reports/${TEST_REPORTS.report1.id}`, {
        headers: createAuthHeader(salesToken),
      })

      // Assert
      expect(response.status).toBe(200)

      const data = await parseResponse<ApiResponse<{ id: string; visits: unknown[]; comments: unknown[] }>>(response)
      expect(data.success).toBe(true)
      expect(data.data?.id).toBe(TEST_REPORTS.report1.id)
      expect(data.data?.visits).toHaveLength(1)
      expect(data.data?.comments).toHaveLength(1)
    })
  })

  describe('IT-REPORT-004: Report Detail (Not Found)', () => {
    it('should return 404 when report does not exist', async () => {
      // Arrange
      mockPrisma.dailyReport.findUnique.mockResolvedValue(null)

      // Act
      const response = await makeRequest(app, 'GET', '/api/reports/nonexistent-id', {
        headers: createAuthHeader(salesToken),
      })

      // Assert
      expect(response.status).toBe(404)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('NOT_FOUND')
    })
  })

  describe('IT-REPORT-005: Report Creation Success', () => {
    it('should create report with visits', async () => {
      // Arrange
      const reportDate = getYesterdayString()
      const newReport = {
        id: 'new-report-id',
        userId: TEST_USERS.salesUser.id,
        reportDate: new Date(reportDate),
        problem: 'New problem',
        plan: 'New plan',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.dailyReport.findFirst.mockResolvedValue(null) // No duplicate
      mockPrisma.dailyReport.create.mockResolvedValue(newReport)

      // Act
      const response = await makeRequest(app, 'POST', '/api/reports', {
        headers: createAuthHeader(salesToken),
        body: {
          reportDate,
          visits: [
            {
              customerId: TEST_CUSTOMERS.customer1.id,
              visitTime: '10:00',
              content: 'Visit content',
            },
          ],
          problem: 'New problem',
          plan: 'New plan',
        },
      })

      // Assert
      expect(response.status).toBe(201)

      const data = await parseResponse<ApiResponse<{ id: string; message: string }>>(response)
      expect(data.success).toBe(true)
      expect(data.data?.id).toBeDefined()
      expect(data.data?.message).toContain('作成')
    })
  })

  describe('IT-REPORT-006: Report Creation Failure (Future Date)', () => {
    it('should return 400 when report date is in the future', async () => {
      // Arrange
      const futureDate = getTomorrowString()

      // Act
      const response = await makeRequest(app, 'POST', '/api/reports', {
        headers: createAuthHeader(salesToken),
        body: {
          reportDate: futureDate,
          visits: [
            {
              customerId: TEST_CUSTOMERS.customer1.id,
              content: 'Visit content',
            },
          ],
        },
      })

      // Assert
      expect(response.status).toBe(400)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('VALIDATION_ERROR')
      expect(data.error?.details).toContainEqual(
        expect.objectContaining({
          field: 'report_date',
          message: expect.stringContaining('未来'),
        })
      )
    })
  })

  describe('IT-REPORT-007: Report Creation Failure (Duplicate Same Day)', () => {
    it('should return 400 when report for the same day already exists', async () => {
      // Arrange
      const reportDate = getYesterdayString()

      mockPrisma.dailyReport.findFirst.mockResolvedValue({
        ...TEST_REPORTS.report1,
        reportDate: new Date(reportDate),
      })

      // Act
      const response = await makeRequest(app, 'POST', '/api/reports', {
        headers: createAuthHeader(salesToken),
        body: {
          reportDate,
          visits: [
            {
              customerId: TEST_CUSTOMERS.customer1.id,
              content: 'Visit content',
            },
          ],
        },
      })

      // Assert
      expect(response.status).toBe(400)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('DUPLICATE_ENTRY')
    })
  })

  describe('IT-REPORT-008: Report Update Success', () => {
    it('should update own report successfully', async () => {
      // Arrange
      mockPrisma.dailyReport.findUnique.mockResolvedValue({
        ...TEST_REPORTS.report1,
        userId: TEST_USERS.salesUser.id,
      })
      mockPrisma.visit.deleteMany.mockResolvedValue({ count: 1 })
      mockPrisma.dailyReport.update.mockResolvedValue({
        ...TEST_REPORTS.report1,
        problem: 'Updated problem',
        plan: 'Updated plan',
      })

      // Act
      const response = await makeRequest(app, 'PUT', `/api/reports/${TEST_REPORTS.report1.id}`, {
        headers: createAuthHeader(salesToken),
        body: {
          visits: [
            {
              customerId: TEST_CUSTOMERS.customer1.id,
              content: 'Updated visit content',
            },
          ],
          problem: 'Updated problem',
          plan: 'Updated plan',
        },
      })

      // Assert
      expect(response.status).toBe(200)

      const data = await parseResponse<ApiResponse<{ id: string; message: string }>>(response)
      expect(data.success).toBe(true)
      expect(data.data?.message).toContain('更新')
    })

    it('should allow manager to update any report', async () => {
      // Arrange
      mockPrisma.dailyReport.findUnique.mockResolvedValue({
        ...TEST_REPORTS.report1,
        userId: TEST_USERS.salesUser.id, // Not the manager's report
      })
      mockPrisma.visit.deleteMany.mockResolvedValue({ count: 1 })
      mockPrisma.dailyReport.update.mockResolvedValue(TEST_REPORTS.report1)

      // Act
      const response = await makeRequest(app, 'PUT', `/api/reports/${TEST_REPORTS.report1.id}`, {
        headers: createAuthHeader(managerToken),
        body: {
          visits: [
            {
              customerId: TEST_CUSTOMERS.customer1.id,
              content: 'Manager updated content',
            },
          ],
        },
      })

      // Assert
      expect(response.status).toBe(200)
    })
  })

  describe('IT-REPORT-009: Report Update Failure (Another User Report)', () => {
    it('should return 403 when trying to update another users report', async () => {
      // Arrange
      mockPrisma.dailyReport.findUnique.mockResolvedValue({
        ...TEST_REPORTS.report1,
        userId: TEST_USERS.salesUser.id, // Not anotherSalesUser's report
      })

      // Act
      const response = await makeRequest(app, 'PUT', `/api/reports/${TEST_REPORTS.report1.id}`, {
        headers: createAuthHeader(anotherSalesToken),
        body: {
          visits: [
            {
              customerId: TEST_CUSTOMERS.customer1.id,
              content: 'Trying to update',
            },
          ],
        },
      })

      // Assert
      expect(response.status).toBe(403)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('FORBIDDEN')
    })
  })

  describe('Report Not Found on Update', () => {
    it('should return 404 when updating non-existent report', async () => {
      // Arrange
      mockPrisma.dailyReport.findUnique.mockResolvedValue(null)

      // Act
      const response = await makeRequest(app, 'PUT', '/api/reports/nonexistent-id', {
        headers: createAuthHeader(salesToken),
        body: {
          visits: [
            {
              customerId: TEST_CUSTOMERS.customer1.id,
              content: 'Content',
            },
          ],
        },
      })

      // Assert
      expect(response.status).toBe(404)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.error?.code).toBe('NOT_FOUND')
    })
  })
})
