/**
 * Integration Tests: Comments API
 *
 * Test IDs:
 * - IT-COMMENT-001: Comment creation success
 * - IT-COMMENT-002: Comment creation failure (sales user - no special restriction currently, but test manager flow)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import {
  TEST_USERS,
  TEST_REPORTS,
  generateTestToken,
  createAuthHeader,
  makeRequest,
  parseResponse,
} from './helpers'
import type { ApiResponse, CommentResponse } from '@/types'
import { authMiddleware } from '@/lib/auth'

// Mock Prisma - use vi.hoisted to avoid hoisting issues
const mockPrisma = vi.hoisted(() => ({
  dailyReport: {
    findUnique: vi.fn(),
  },
  comment: {
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/lib/db/client', () => ({
  prisma: mockPrisma,
}))

// Import after mocking
import { comments } from '@/lib/api/routes/comments'

describe('Comments API Integration Tests', () => {
  let app: Hono
  let salesToken: string
  let managerToken: string

  beforeEach(() => {
    vi.clearAllMocks()

    // Generate tokens
    salesToken = generateTestToken(TEST_USERS.salesUser)
    managerToken = generateTestToken(TEST_USERS.managerUser)

    // Create a fresh Hono app for each test
    app = new Hono().basePath('/api')
    app.use('/reports/*', authMiddleware)
    app.route('/reports', comments)
  })

  describe('IT-COMMENT-001: Comment Creation Success', () => {
    it('should create comment successfully as manager', async () => {
      // Arrange
      const reportId = TEST_REPORTS.report1.id
      const commentContent = 'This is a manager feedback comment'

      mockPrisma.dailyReport.findUnique.mockResolvedValue(TEST_REPORTS.report1)
      mockPrisma.comment.create.mockResolvedValue({
        id: 'new-comment-id',
        dailyReportId: reportId,
        userId: TEST_USERS.managerUser.id,
        targetType: 'PROBLEM',
        content: commentContent,
        createdAt: new Date(),
        user: {
          id: TEST_USERS.managerUser.id,
          name: TEST_USERS.managerUser.name,
        },
      })

      // Act
      const response = await makeRequest(app, 'POST', `/api/reports/${reportId}/comments`, {
        headers: createAuthHeader(managerToken),
        body: {
          content: commentContent,
        },
      })

      // Assert
      expect(response.status).toBe(201)

      const data = await parseResponse<ApiResponse<CommentResponse>>(response)
      expect(data.success).toBe(true)
      expect(data.data?.id).toBeDefined()
      expect(data.data?.content).toBe(commentContent)
      expect(data.data?.user.id).toBe(TEST_USERS.managerUser.id)
    })

    it('should create comment with trimmed content', async () => {
      // Arrange
      const reportId = TEST_REPORTS.report1.id
      const commentContent = '  Comment with spaces  '

      mockPrisma.dailyReport.findUnique.mockResolvedValue(TEST_REPORTS.report1)
      mockPrisma.comment.create.mockResolvedValue({
        id: 'new-comment-id',
        dailyReportId: reportId,
        userId: TEST_USERS.managerUser.id,
        targetType: 'PROBLEM',
        content: 'Comment with spaces',
        createdAt: new Date(),
        user: {
          id: TEST_USERS.managerUser.id,
          name: TEST_USERS.managerUser.name,
        },
      })

      // Act
      const response = await makeRequest(app, 'POST', `/api/reports/${reportId}/comments`, {
        headers: createAuthHeader(managerToken),
        body: {
          content: commentContent,
        },
      })

      // Assert
      expect(response.status).toBe(201)

      // Verify Prisma was called with trimmed content
      expect(mockPrisma.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'Comment with spaces',
          }),
        })
      )
    })
  })

  describe('IT-COMMENT-002: Comment Creation by Sales User', () => {
    it('should allow sales user to create comment (current implementation)', async () => {
      // Note: Current implementation allows any authenticated user to comment
      // This test documents the current behavior
      // Arrange
      const reportId = TEST_REPORTS.report1.id
      const commentContent = 'Sales user comment'

      mockPrisma.dailyReport.findUnique.mockResolvedValue(TEST_REPORTS.report1)
      mockPrisma.comment.create.mockResolvedValue({
        id: 'new-comment-id',
        dailyReportId: reportId,
        userId: TEST_USERS.salesUser.id,
        targetType: 'PROBLEM',
        content: commentContent,
        createdAt: new Date(),
        user: {
          id: TEST_USERS.salesUser.id,
          name: TEST_USERS.salesUser.name,
        },
      })

      // Act
      const response = await makeRequest(app, 'POST', `/api/reports/${reportId}/comments`, {
        headers: createAuthHeader(salesToken),
        body: {
          content: commentContent,
        },
      })

      // Assert
      // Note: If the requirement is to restrict sales users from commenting,
      // this should return 403. Current implementation allows it.
      expect(response.status).toBe(201)
    })
  })

  describe('Validation Tests', () => {
    it('should return 400 when content is empty', async () => {
      // Arrange
      const reportId = TEST_REPORTS.report1.id

      // Act
      const response = await makeRequest(app, 'POST', `/api/reports/${reportId}/comments`, {
        headers: createAuthHeader(managerToken),
        body: {
          content: '',
        },
      })

      // Assert
      expect(response.status).toBe(400)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 when content is only whitespace', async () => {
      // Arrange
      const reportId = TEST_REPORTS.report1.id

      // Act
      const response = await makeRequest(app, 'POST', `/api/reports/${reportId}/comments`, {
        headers: createAuthHeader(managerToken),
        body: {
          content: '   ',
        },
      })

      // Assert
      expect(response.status).toBe(400)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('VALIDATION_ERROR')
    })

    it('should return 404 when report does not exist', async () => {
      // Arrange
      mockPrisma.dailyReport.findUnique.mockResolvedValue(null)

      // Act
      const response = await makeRequest(app, 'POST', '/api/reports/nonexistent-id/comments', {
        headers: createAuthHeader(managerToken),
        body: {
          content: 'Comment on nonexistent report',
        },
      })

      // Assert
      expect(response.status).toBe(404)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('NOT_FOUND')
    })
  })

  describe('Authentication Tests', () => {
    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await makeRequest(
        app,
        'POST',
        `/api/reports/${TEST_REPORTS.report1.id}/comments`,
        {
          body: {
            content: 'Comment without auth',
          },
        }
      )

      // Assert
      expect(response.status).toBe(401)
    })
  })

  describe('Comment Deletion Tests', () => {
    it('should allow comment author to delete their own comment', async () => {
      // Arrange
      const reportId = TEST_REPORTS.report1.id
      const commentId = 'comment-to-delete'

      mockPrisma.comment.findUnique.mockResolvedValue({
        id: commentId,
        dailyReportId: reportId,
        userId: TEST_USERS.managerUser.id,
        targetType: 'PROBLEM',
        content: 'Comment to delete',
        createdAt: new Date(),
      })
      mockPrisma.comment.delete.mockResolvedValue({})

      // Act
      const response = await makeRequest(
        app,
        'DELETE',
        `/api/reports/${reportId}/comments/${commentId}`,
        {
          headers: createAuthHeader(managerToken),
        }
      )

      // Assert
      expect(response.status).toBe(200)

      const data = await parseResponse<ApiResponse<void>>(response)
      expect(data.success).toBe(true)
    })

    it('should return 403 when sales user tries to delete managers comment', async () => {
      // Arrange
      const reportId = TEST_REPORTS.report1.id
      const commentId = 'manager-comment'

      mockPrisma.comment.findUnique.mockResolvedValue({
        id: commentId,
        dailyReportId: reportId,
        userId: TEST_USERS.managerUser.id, // Manager's comment
        targetType: 'PROBLEM',
        content: 'Manager comment',
        createdAt: new Date(),
      })

      // Act
      const response = await makeRequest(
        app,
        'DELETE',
        `/api/reports/${reportId}/comments/${commentId}`,
        {
          headers: createAuthHeader(salesToken), // Sales user trying to delete
        }
      )

      // Assert
      expect(response.status).toBe(403)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('FORBIDDEN')
    })

    it('should return 404 when comment does not exist', async () => {
      // Arrange
      mockPrisma.comment.findUnique.mockResolvedValue(null)

      // Act
      const response = await makeRequest(
        app,
        'DELETE',
        `/api/reports/${TEST_REPORTS.report1.id}/comments/nonexistent-comment`,
        {
          headers: createAuthHeader(managerToken),
        }
      )

      // Assert
      expect(response.status).toBe(404)
    })
  })
})
