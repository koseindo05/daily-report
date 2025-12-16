'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button, Input, Card } from '@/components/ui'
import type { Customer, ApiResponse, PaginationInfo } from '@/types'

interface CustomersResponse {
  customers: Customer[]
  pagination: PaginationInfo
}

export function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isManager, setIsManager] = useState(false)

  useEffect(() => {
    // Check if user is manager
    const checkUserRole = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (data.success && data.data) {
          setIsManager(data.data.role === 'MANAGER')
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error)
      }
    }
    checkUserRole()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('page', String(page))
      params.set('limit', '20')

      const res = await fetch(`/api/customers?${params}`)
      const data: ApiResponse<CustomersResponse> = await res.json()

      if (data.success && data.data) {
        setCustomers(data.data.customers)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleSearch = () => {
    setPage(1)
    fetchCustomers()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">顧客マスタ</h1>
        {isManager && (
          <Link href="/customers/new">
            <Button>+ 新規登録</Button>
          </Link>
        )}
      </div>

      <Card className="mb-6">
        <div className="flex gap-4 items-end">
          <Input
            type="text"
            label="顧客名で検索"
            placeholder="顧客名で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSearch} variant="secondary">
            検索
          </Button>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="text-center py-8 text-gray-500">読み込み中...</div>
        ) : customers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            顧客が見つかりません
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      顧客名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      住所
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      電話番号
                    </th>
                    {isManager && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {customer.address || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.phone || '-'}
                      </td>
                      {isManager && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/customers/${customer.id}/edit`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            編集
                          </Link>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-6">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← 前へ
                </Button>
                <span className="text-sm text-gray-600">
                  {page} / {pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  次へ →
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
