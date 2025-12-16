/**
 * Integration Tests: Customers API
 *
 * Test IDs:
 * - IT-CUSTOMER-001: Customer list retrieval
 * - IT-CUSTOMER-002: Customer search
 * - IT-CUSTOMER-003: Customer registration success
 * - IT-CUSTOMER-004: Customer registration failure (no permission - tested via auth)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import {
  TEST_USERS,
  TEST_CUSTOMERS,
  generateTestToken,
  createAuthHeader,
  makeRequest,
  parseResponse,
} from './helpers'
import type { ApiResponse, Customer, PaginationInfo } from '@/types'
import { authMiddleware } from '@/lib/auth'

// Mock Prisma - use vi.hoisted to avoid hoisting issues
const mockPrisma = vi.hoisted(() => ({
  customer: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  visit: {
    count: vi.fn(),
  },
}))

vi.mock('@/lib/db/client', () => ({
  prisma: mockPrisma,
}))

// Import after mocking
import { customers } from '@/lib/api/routes/customers'

describe('Customers API Integration Tests', () => {
  let app: Hono
  let salesToken: string
  let _managerToken: string

  beforeEach(() => {
    vi.clearAllMocks()

    // Generate tokens
    salesToken = generateTestToken(TEST_USERS.salesUser)
    _managerToken = generateTestToken(TEST_USERS.managerUser)

    // Create a fresh Hono app for each test
    app = new Hono().basePath('/api')
    app.use('/customers/*', authMiddleware)
    app.route('/customers', customers)
  })

  describe('IT-CUSTOMER-001: Customer List Retrieval', () => {
    it('should return paginated list of customers', async () => {
      // Arrange
      const mockCustomers = [TEST_CUSTOMERS.customer1, TEST_CUSTOMERS.customer2]

      mockPrisma.customer.findMany.mockResolvedValue(mockCustomers)
      mockPrisma.customer.count.mockResolvedValue(2)

      // Act
      const response = await makeRequest(app, 'GET', '/api/customers', {
        headers: createAuthHeader(salesToken),
      })

      // Assert
      expect(response.status).toBe(200)

      const data = await parseResponse<
        ApiResponse<{ customers: Customer[]; pagination: PaginationInfo }>
      >(response)
      expect(data.success).toBe(true)
      expect(data.data?.customers).toHaveLength(2)
      expect(data.data?.pagination).toBeDefined()
      expect(data.data?.pagination.total).toBe(2)
    })

    it('should return empty list when no customers exist', async () => {
      // Arrange
      mockPrisma.customer.findMany.mockResolvedValue([])
      mockPrisma.customer.count.mockResolvedValue(0)

      // Act
      const response = await makeRequest(app, 'GET', '/api/customers', {
        headers: createAuthHeader(salesToken),
      })

      // Assert
      expect(response.status).toBe(200)

      const data = await parseResponse<
        ApiResponse<{ customers: Customer[]; pagination: PaginationInfo }>
      >(response)
      expect(data.success).toBe(true)
      expect(data.data?.customers).toHaveLength(0)
      expect(data.data?.pagination.total).toBe(0)
    })

    it('should support pagination parameters', async () => {
      // Arrange
      mockPrisma.customer.findMany.mockResolvedValue([TEST_CUSTOMERS.customer1])
      mockPrisma.customer.count.mockResolvedValue(10)

      // Act
      const response = await makeRequest(app, 'GET', '/api/customers?page=2&limit=5', {
        headers: createAuthHeader(salesToken),
      })

      // Assert
      expect(response.status).toBe(200)

      const data = await parseResponse<
        ApiResponse<{ customers: Customer[]; pagination: PaginationInfo }>
      >(response)
      expect(data.data?.pagination.page).toBe(2)
      expect(data.data?.pagination.limit).toBe(5)
      expect(data.data?.pagination.totalPages).toBe(2)

      // Verify Prisma was called with correct skip
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page - 1) * limit = (2 - 1) * 5
          take: 5,
        })
      )
    })
  })

  describe('IT-CUSTOMER-002: Customer Search', () => {
    it('should filter customers by search query', async () => {
      // Arrange
      const searchQuery = 'Tokyo'
      mockPrisma.customer.findMany.mockResolvedValue([TEST_CUSTOMERS.customer1])
      mockPrisma.customer.count.mockResolvedValue(1)

      // Act
      const response = await makeRequest(app, 'GET', `/api/customers?search=${searchQuery}`, {
        headers: createAuthHeader(salesToken),
      })

      // Assert
      expect(response.status).toBe(200)

      const data = await parseResponse<ApiResponse<{ customers: Customer[] }>>(response)
      expect(data.success).toBe(true)

      // Verify Prisma was called with search filter
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.any(Object) }),
              expect.objectContaining({ address: expect.any(Object) }),
            ]),
          }),
        })
      )
    })

    it('should return empty list when no customers match search', async () => {
      // Arrange
      mockPrisma.customer.findMany.mockResolvedValue([])
      mockPrisma.customer.count.mockResolvedValue(0)

      // Act
      const response = await makeRequest(
        app,
        'GET',
        '/api/customers?search=NonExistentCustomer',
        {
          headers: createAuthHeader(salesToken),
        }
      )

      // Assert
      expect(response.status).toBe(200)

      const data = await parseResponse<ApiResponse<{ customers: Customer[] }>>(response)
      expect(data.success).toBe(true)
      expect(data.data?.customers).toHaveLength(0)
    })
  })

  describe('IT-CUSTOMER-003: Customer Registration Success', () => {
    it('should create customer with all fields', async () => {
      // Arrange
      const newCustomer = {
        name: 'New Customer',
        address: 'Nagoya, Japan',
        phone: '052-123-4567',
        contactPerson: 'Suzuki',
      }

      const createdCustomer = {
        id: 'new-customer-id',
        ...newCustomer,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.customer.create.mockResolvedValue(createdCustomer)

      // Act
      const response = await makeRequest(app, 'POST', '/api/customers', {
        headers: createAuthHeader(salesToken),
        body: newCustomer,
      })

      // Assert
      expect(response.status).toBe(201)

      const data = await parseResponse<ApiResponse<Customer>>(response)
      expect(data.success).toBe(true)
      expect(data.data?.id).toBeDefined()
      expect(data.data?.name).toBe(newCustomer.name)
      expect(data.data?.address).toBe(newCustomer.address)
    })

    it('should create customer with only required fields (name)', async () => {
      // Arrange
      const newCustomer = {
        name: 'Minimal Customer',
      }

      const createdCustomer = {
        id: 'new-customer-id',
        name: newCustomer.name,
        address: null,
        phone: null,
        contactPerson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.customer.create.mockResolvedValue(createdCustomer)

      // Act
      const response = await makeRequest(app, 'POST', '/api/customers', {
        headers: createAuthHeader(salesToken),
        body: newCustomer,
      })

      // Assert
      expect(response.status).toBe(201)

      const data = await parseResponse<ApiResponse<Customer>>(response)
      expect(data.success).toBe(true)
      expect(data.data?.name).toBe(newCustomer.name)
    })

    it('should trim whitespace from customer name', async () => {
      // Arrange
      const newCustomer = {
        name: '  Customer with spaces  ',
      }

      mockPrisma.customer.create.mockResolvedValue({
        id: 'new-customer-id',
        name: 'Customer with spaces',
        address: null,
        phone: null,
        contactPerson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Act
      const response = await makeRequest(app, 'POST', '/api/customers', {
        headers: createAuthHeader(salesToken),
        body: newCustomer,
      })

      // Assert
      expect(response.status).toBe(201)

      // Verify Prisma was called with trimmed name
      expect(mockPrisma.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Customer with spaces',
          }),
        })
      )
    })
  })

  describe('IT-CUSTOMER-004: Customer Registration Failure (No Permission)', () => {
    it('should return 401 when not authenticated', async () => {
      // Act
      const response = await makeRequest(app, 'POST', '/api/customers', {
        body: {
          name: 'New Customer',
        },
      })

      // Assert
      expect(response.status).toBe(401)
    })
  })

  describe('Validation Tests', () => {
    it('should return 400 when name is missing', async () => {
      // Act
      const response = await makeRequest(app, 'POST', '/api/customers', {
        headers: createAuthHeader(salesToken),
        body: {
          address: 'Address without name',
        },
      })

      // Assert
      expect(response.status).toBe(400)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('VALIDATION_ERROR')
      expect(data.error?.details).toContainEqual(
        expect.objectContaining({ field: 'name' })
      )
    })

    it('should return 400 when name is empty string', async () => {
      // Act
      const response = await makeRequest(app, 'POST', '/api/customers', {
        headers: createAuthHeader(salesToken),
        body: {
          name: '',
        },
      })

      // Assert
      expect(response.status).toBe(400)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 when name is only whitespace', async () => {
      // Act
      const response = await makeRequest(app, 'POST', '/api/customers', {
        headers: createAuthHeader(salesToken),
        body: {
          name: '   ',
        },
      })

      // Assert
      expect(response.status).toBe(400)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('Customer Detail Tests', () => {
    it('should return customer detail by id', async () => {
      // Arrange
      mockPrisma.customer.findUnique.mockResolvedValue(TEST_CUSTOMERS.customer1)

      // Act
      const response = await makeRequest(
        app,
        'GET',
        `/api/customers/${TEST_CUSTOMERS.customer1.id}`,
        {
          headers: createAuthHeader(salesToken),
        }
      )

      // Assert
      expect(response.status).toBe(200)

      const data = await parseResponse<ApiResponse<Customer>>(response)
      expect(data.success).toBe(true)
      expect(data.data?.id).toBe(TEST_CUSTOMERS.customer1.id)
      expect(data.data?.name).toBe(TEST_CUSTOMERS.customer1.name)
    })

    it('should return 404 when customer not found', async () => {
      // Arrange
      mockPrisma.customer.findUnique.mockResolvedValue(null)

      // Act
      const response = await makeRequest(app, 'GET', '/api/customers/nonexistent-id', {
        headers: createAuthHeader(salesToken),
      })

      // Assert
      expect(response.status).toBe(404)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('NOT_FOUND')
    })
  })

  describe('Customer Update Tests', () => {
    it('should update customer successfully', async () => {
      // Arrange
      mockPrisma.customer.findUnique.mockResolvedValue(TEST_CUSTOMERS.customer1)
      mockPrisma.customer.update.mockResolvedValue({
        ...TEST_CUSTOMERS.customer1,
        name: 'Updated Customer Name',
      })

      // Act
      const response = await makeRequest(
        app,
        'PUT',
        `/api/customers/${TEST_CUSTOMERS.customer1.id}`,
        {
          headers: createAuthHeader(salesToken),
          body: {
            name: 'Updated Customer Name',
          },
        }
      )

      // Assert
      expect(response.status).toBe(200)

      const data = await parseResponse<ApiResponse<Customer>>(response)
      expect(data.success).toBe(true)
      expect(data.data?.name).toBe('Updated Customer Name')
    })
  })

  describe('Customer Deletion Tests', () => {
    it('should delete customer without visits', async () => {
      // Arrange
      mockPrisma.customer.findUnique.mockResolvedValue(TEST_CUSTOMERS.customer1)
      mockPrisma.visit.count.mockResolvedValue(0) // No visits
      mockPrisma.customer.delete.mockResolvedValue(TEST_CUSTOMERS.customer1)

      // Act
      const response = await makeRequest(
        app,
        'DELETE',
        `/api/customers/${TEST_CUSTOMERS.customer1.id}`,
        {
          headers: createAuthHeader(salesToken),
        }
      )

      // Assert
      expect(response.status).toBe(200)

      const data = await parseResponse<ApiResponse<void>>(response)
      expect(data.success).toBe(true)
    })

    it('should return 409 when customer has visits', async () => {
      // Arrange
      mockPrisma.customer.findUnique.mockResolvedValue(TEST_CUSTOMERS.customer1)
      mockPrisma.visit.count.mockResolvedValue(5) // Has visits

      // Act
      const response = await makeRequest(
        app,
        'DELETE',
        `/api/customers/${TEST_CUSTOMERS.customer1.id}`,
        {
          headers: createAuthHeader(salesToken),
        }
      )

      // Assert
      expect(response.status).toBe(409)

      const data = await parseResponse<ApiResponse<never>>(response)
      expect(data.success).toBe(false)
      expect(data.error?.code).toBe('CONFLICT')
    })
  })
})
