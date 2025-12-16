/**
 * Integration Test Helpers
 * 結合テスト用のヘルパー関数とモックデータ
 */

import { vi } from 'vitest'
import { generateToken } from '@/lib/auth/jwt'
import type { Role } from '@/types'

// =============================================================================
// Test User Data
// =============================================================================

export const TEST_USERS = {
  salesUser: {
    id: '507f1f77bcf86cd799439011',
    email: 'sales@example.com',
    name: 'Sales User',
    department: 'Sales Department',
    role: 'SALES' as Role,
    passwordHash: '$2a$10$dK8vz1u.O3LJbHG9FJ7rQ.7tIHQFB1h.qFJ.tT5VYYJq9K1lE6hGe', // password: 'password123'
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  managerUser: {
    id: '507f1f77bcf86cd799439012',
    email: 'manager@example.com',
    name: 'Manager User',
    department: 'Management',
    role: 'MANAGER' as Role,
    passwordHash: '$2a$10$dK8vz1u.O3LJbHG9FJ7rQ.7tIHQFB1h.qFJ.tT5VYYJq9K1lE6hGe', // password: 'password123'
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  anotherSalesUser: {
    id: '507f1f77bcf86cd799439013',
    email: 'another-sales@example.com',
    name: 'Another Sales User',
    department: 'Sales Department',
    role: 'SALES' as Role,
    passwordHash: '$2a$10$dK8vz1u.O3LJbHG9FJ7rQ.7tIHQFB1h.qFJ.tT5VYYJq9K1lE6hGe',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
}

// =============================================================================
// Test Customer Data
// =============================================================================

export const TEST_CUSTOMERS = {
  customer1: {
    id: '507f1f77bcf86cd799439021',
    name: 'Test Customer 1',
    address: 'Tokyo, Japan',
    phone: '03-1234-5678',
    contactPerson: 'Tanaka',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  customer2: {
    id: '507f1f77bcf86cd799439022',
    name: 'Test Customer 2',
    address: 'Osaka, Japan',
    phone: '06-1234-5678',
    contactPerson: 'Yamada',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
}

// =============================================================================
// Test Report Data
// =============================================================================

export const TEST_REPORTS = {
  report1: {
    id: '507f1f77bcf86cd799439031',
    userId: TEST_USERS.salesUser.id,
    reportDate: new Date('2024-12-15'),
    problem: 'Test problem',
    plan: 'Test plan',
    createdAt: new Date('2024-12-15'),
    updatedAt: new Date('2024-12-15'),
  },
  report2: {
    id: '507f1f77bcf86cd799439032',
    userId: TEST_USERS.anotherSalesUser.id,
    reportDate: new Date('2024-12-14'),
    problem: 'Another problem',
    plan: 'Another plan',
    createdAt: new Date('2024-12-14'),
    updatedAt: new Date('2024-12-14'),
  },
}

// =============================================================================
// Test Comment Data
// =============================================================================

export const TEST_COMMENTS = {
  comment1: {
    id: '507f1f77bcf86cd799439041',
    dailyReportId: TEST_REPORTS.report1.id,
    userId: TEST_USERS.managerUser.id,
    targetType: 'PROBLEM' as const,
    content: 'Test comment',
    createdAt: new Date('2024-12-15'),
  },
}

// =============================================================================
// Auth Helpers
// =============================================================================

/**
 * Generate auth token for testing
 */
export function generateTestToken(user: typeof TEST_USERS.salesUser): string {
  return generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })
}

/**
 * Create Authorization header
 */
export function createAuthHeader(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  }
}

// =============================================================================
// Prisma Mock Setup
// =============================================================================

/**
 * Create a mock Prisma client for testing
 */
export function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
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
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    comment: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  }
}

// =============================================================================
// Request Helpers
// =============================================================================

/**
 * Make a request to the Hono app
 */
export async function makeRequest(
  app: { fetch: (request: Request) => Promise<Response> },
  method: string,
  path: string,
  options: {
    body?: unknown
    headers?: Record<string, string>
  } = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const request = new Request(`http://localhost${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  return app.fetch(request)
}

/**
 * Parse JSON response
 */
export async function parseResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>
}

// =============================================================================
// Date Helpers
// =============================================================================

/**
 * Get today's date string in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Get yesterday's date string in YYYY-MM-DD format
 */
export function getYesterdayString(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0]
}

/**
 * Get tomorrow's date string in YYYY-MM-DD format
 */
export function getTomorrowString(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}
