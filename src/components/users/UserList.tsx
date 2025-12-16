'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button, Card, Pagination, LoadingOverlay } from '@/components/ui'
import type { UserListItem, ApiResponse, PaginationInfo } from '@/types'

interface UsersResponse {
  users: UserListItem[]
  pagination: PaginationInfo
}

const roleLabels: Record<'SALES' | 'MANAGER', string> = {
  SALES: '営業',
  MANAGER: '上長',
}

export function UserList() {
  const [users, setUsers] = useState<UserListItem[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')

      const res = await fetch(`/api/users?${params}`)
      const data: ApiResponse<UsersResponse> = await res.json()

      if (data.success && data.data) {
        setUsers(data.data.users)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
        <Link href="/users/new">
          <Button>+ 新規登録</Button>
        </Link>
      </div>

      <Card>
        {loading ? (
          <LoadingOverlay label="ユーザーを読み込み中..." />
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">ユーザーがいません</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      氏名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      メールアドレス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      部署
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      役職
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.department || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {roleLabels[user.role]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/users/${user.id}/edit`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          編集
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && (
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                className="mt-6"
              />
            )}
          </>
        )}
      </Card>
    </div>
  )
}
