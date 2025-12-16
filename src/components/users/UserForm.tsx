'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Select, Card } from '@/components/ui'
import type { UserListItem, ApiResponse, CreateUserRequest, UpdateUserRequest } from '@/types'

interface Props {
  userId?: string
}

export function UserForm({ userId }: Props) {
  const router = useRouter()
  const isEdit = !!userId

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [department, setDepartment] = useState('')
  const [role, setRole] = useState<'SALES' | 'MANAGER'>('SALES')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isEdit) {
      fetchUser()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const fetchUser = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${userId}`)
      const data: ApiResponse<UserListItem> = await res.json()

      if (data.success && data.data) {
        const user = data.data
        setName(user.name)
        setEmail(user.email)
        setDepartment(user.department || '')
        setRole(user.role)
      }
    } catch (err) {
      console.error('Failed to fetch user:', err)
    } finally {
      setLoading(false)
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = '氏名は必須です'
    } else if (name.length > 50) {
      newErrors.name = '氏名は50文字以内で入力してください'
    }

    if (!email.trim()) {
      newErrors.email = 'メールアドレスは必須です'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        newErrors.email = 'メールアドレスの形式が正しくありません'
      }
    }

    if (!isEdit) {
      if (!password.trim()) {
        newErrors.password = 'パスワードは必須です'
      } else if (password.length < 8) {
        newErrors.password = 'パスワードは8文字以上で入力してください'
      }
    }

    if (department && department.length > 50) {
      newErrors.department = '部署は50文字以内で入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setSubmitting(true)

    try {
      const url = isEdit ? `/api/users/${userId}` : '/api/users'
      const method = isEdit ? 'PUT' : 'POST'

      const body: CreateUserRequest | UpdateUserRequest = isEdit
        ? {
            name,
            email,
            department: department || null,
            role,
          }
        : {
            name,
            email,
            password,
            department,
            role,
          }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data: ApiResponse<{ id: string; message: string }> = await res.json()

      if (data.success) {
        router.push('/users')
      } else {
        // Handle API errors
        if (data.error?.details) {
          const fieldErrors: Record<string, string> = {}
          data.error.details.forEach((detail) => {
            fieldErrors[detail.field] = detail.message
          })
          setErrors(fieldErrors)
        } else {
          alert(data.error?.message || 'エラーが発生しました')
        }
      }
    } catch (error) {
      console.error('Failed to save user:', error)
      alert('ユーザーの保存に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('本当に削除しますか?')) return

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      const data: ApiResponse<{ message: string }> = await res.json()

      if (data.success) {
        router.push('/users')
      } else {
        alert(data.error?.message || '削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('削除に失敗しました')
    }
  }

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/users" className="text-blue-600 hover:text-blue-800">
          ← 一覧に戻る
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'ユーザー編集' : 'ユーザー登録'}
      </h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="氏名"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            placeholder="山田太郎"
          />

          <Input
            type="email"
            label="メールアドレス"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="yamada@example.com"
          />

          {!isEdit && (
            <Input
              type="password"
              label="パスワード"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder="8文字以上"
            />
          )}

          <Input
            label="部署"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            error={errors.department}
            placeholder="営業1課"
          />

          <Select
            label="役職"
            required
            value={role}
            onChange={(e) => setRole(e.target.value as 'SALES' | 'MANAGER')}
            options={[
              { value: 'SALES', label: '営業' },
              { value: 'MANAGER', label: '上長' },
            ]}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? '保存中...' : '保存'}
            </Button>
            <Link href="/users">
              <Button type="button" variant="secondary">
                キャンセル
              </Button>
            </Link>
            {isEdit && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleDelete}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                削除
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  )
}
