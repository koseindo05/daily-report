// Enums
export type Role = 'SALES' | 'MANAGER'
export type TargetType = 'PROBLEM' | 'PLAN'

// Entities
export interface User {
  id: string
  email: string
  name: string
  department: string | null
  role: Role
  createdAt: Date
  updatedAt: Date
}

export interface Customer {
  id: string
  name: string
  address?: string
  phone?: string
  contactPerson?: string
}

export interface DailyReport {
  id: string
  userId: string
  reportDate: Date
  problem: string | null
  plan: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Visit {
  id: string
  dailyReportId: string
  customerId: string
  content: string
  visitTime: string | null
  createdAt: Date
}

export interface Comment {
  id: string
  dailyReportId: string
  userId: string
  targetType: TargetType
  content: string
  createdAt: Date
}

// API Response で使用するコメント型（ユーザー情報を含む）
export interface CommentResponse {
  id: string
  content: string
  user: {
    id: string
    name: string
  }
  createdAt: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Array<{ field: string; message: string }>
  }
}

export interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationInfo
}

// Report API Types
export interface ReportListItem {
  id: string
  reportDate: string
  user: {
    id: string
    name: string
  }
  visitCount: number
  commentCount: number
  createdAt: string
}

export interface ReportDetail {
  id: string
  reportDate: string
  user: {
    id: string
    name: string
    department: string | null
  }
  visits: Array<{
    id: string
    customer: {
      id: string
      name: string
    }
    visitTime: string | null
    content: string
  }>
  problem: string | null
  plan: string | null
  comments: Array<{
    id: string
    targetType: TargetType
    content: string
    user: {
      id: string
      name: string
    }
    createdAt: string
  }>
  createdAt: string
  updatedAt: string
}

export interface CreateReportRequest {
  reportDate: string
  visits: Array<{
    customerId: string
    visitTime?: string
    content: string
  }>
  problem?: string
  plan?: string
}

export interface UpdateReportRequest {
  visits: Array<{
    id?: string
    customerId: string
    visitTime?: string
    content: string
  }>
  problem?: string
  plan?: string
}
