/**
 * Integration Tests: Authentication API
 *
 * Test IDs:
 * - IT-AUTH-001: Login success
 * - IT-AUTH-002: Login failure (wrong password)
 * - IT-AUTH-003: Login failure (user not found)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { TEST_USERS, makeRequest, parseResponse } from './helpers'
import type { ApiResponse } from '@/types'

// Mock Prisma - use vi.hoisted to avoid hoisting issues
const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
}))

vi.mock('@/lib/db/client', () => ({
  prisma: mockPrisma,
}))

// Import after mocking
import { auth } from '@/lib/api/routes/auth'

describe('Authentication API Integration Tests', () => {
  let app: Hono

  beforeEach(() => {
    vi.clearAllMocks()

    // Create a fresh Hono app for each test
    app = new Hono().basePath('/api')
    app.route('/auth', auth)
  })

  describe('IT-AUTH-001: Login Success', () => {
    it('should return token and user data when credentials are valid', async () => {
      // Arrange
      const validPassword = 'password123'
      const hashedPassword = await bcrypt.hash(validPassword, 10)
      const mockUser = {
        ...TEST_USERS.salesUser,
        passwordHash: hashedPassword,
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      // Act
      const response = await makeRequest(app, 'POST', '/api/auth/login', {
        body: {
          email: mockUser.email,
          password: validPassword,
        },
      })

      // Assert
      expect(response.status).toBe(200)

      const data = await parseResponse<ApiResponse<{ token: string; user: unknown }>>(response)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data?.token).toBeDefined()
      expect(typeof data.data?.token).toBe('string')
      expect(data.data?.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        department: mockUser.department,
      })

      // Verify Prisma was called correctly
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      })
    })

    it('should set auth-token cookie on successful login', async () => {
      // Arrange
      const validPassword = 'password123'
      const hashedPassword = await bcrypt.hash(validPassword, 10)
      const mockUser = {
        ...TEST_USERS.salesUser,
        passwordHash: hashedPassword,
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      // Act
      const response = await makeRequest(app, 'POST', '/api/auth/login', {
        body: {
          email: mockUser.email,
          password: validPassword,
        },
      })

      // Assert
      expect(response.status).toBe(200)
      const setCookie = response.headers.get('Set-Cookie')
      expect(setCookie).toBeDefined()
      expect(setCookie).toContain('auth-token=')
      expect(setCookie).toContain('HttpOnly')
    })
  })

  describe('IT-AUTH-002: Login Failure (Wrong Password)', () => {
    it('should return 401 when password is incorrect', async () => {
      // Arrange
      const correctPassword = 'password123'
      const wrongPassword = 'wrongpassword'
      const hashedPassword = await bcrypt.hash(correctPassword, 10)
      const mockUser = {
        ...TEST_USERS.salesUser,
        passwordHash: hashedPassword,
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      // Act
      const response = await makeRequest(app, 'POST', '/api/auth/login', {
        body: {
          email: mockUser.email,
          password: wrongPassword,
        },
      })

      // Assert
      expect(response.status).toBe(401)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
      expect(data.error?.code).toBe('UNAUTHORIZED')
      expect(data.error?.message).toContain('パスワード')
    })

    it('should not expose whether email exists when password is wrong', async () => {
      // Arrange
      const correctPassword = 'password123'
      const wrongPassword = 'wrongpassword'
      const hashedPassword = await bcrypt.hash(correctPassword, 10)
      const mockUser = {
        ...TEST_USERS.salesUser,
        passwordHash: hashedPassword,
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      // Act
      const response = await makeRequest(app, 'POST', '/api/auth/login', {
        body: {
          email: mockUser.email,
          password: wrongPassword,
        },
      })

      // Assert
      const data = await parseResponse<ApiResponse<never>>(response)
      // Error message should be generic and not reveal if email exists
      expect(data.error?.message).toBe('メールアドレスまたはパスワードが正しくありません')
    })
  })

  describe('IT-AUTH-003: Login Failure (User Not Found)', () => {
    it('should return 401 when user does not exist', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null)

      // Act
      const response = await makeRequest(app, 'POST', '/api/auth/login', {
        body: {
          email: 'nonexistent@example.com',
          password: 'anypassword',
        },
      })

      // Assert
      expect(response.status).toBe(401)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
      expect(data.error?.code).toBe('UNAUTHORIZED')
    })

    it('should not expose whether email exists when user not found', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null)

      // Act
      const response = await makeRequest(app, 'POST', '/api/auth/login', {
        body: {
          email: 'nonexistent@example.com',
          password: 'anypassword',
        },
      })

      // Assert
      const data = await parseResponse<ApiResponse<never>>(response)
      // Error message should be the same as wrong password case
      expect(data.error?.message).toBe('メールアドレスまたはパスワードが正しくありません')
    })
  })

  describe('Validation Tests', () => {
    it('should return 400 when email is missing', async () => {
      // Act
      const response = await makeRequest(app, 'POST', '/api/auth/login', {
        body: {
          password: 'password123',
        },
      })

      // Assert
      expect(response.status).toBe(400)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('VALIDATION_ERROR')
      expect(data.error?.details).toContainEqual(
        expect.objectContaining({ field: 'email' })
      )
    })

    it('should return 400 when password is missing', async () => {
      // Act
      const response = await makeRequest(app, 'POST', '/api/auth/login', {
        body: {
          email: 'test@example.com',
        },
      })

      // Assert
      expect(response.status).toBe(400)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('VALIDATION_ERROR')
      expect(data.error?.details).toContainEqual(
        expect.objectContaining({ field: 'password' })
      )
    })

    it('should return 400 when both email and password are missing', async () => {
      // Act
      const response = await makeRequest(app, 'POST', '/api/auth/login', {
        body: {},
      })

      // Assert
      expect(response.status).toBe(400)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('VALIDATION_ERROR')
      expect(data.error?.details?.length).toBe(2)
    })
  })
})
