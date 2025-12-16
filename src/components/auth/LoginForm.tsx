'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, CardHeader, CardTitle } from '@/components/ui'
import { useAuth } from '@/components/auth/AuthProvider'
import type { ApiResponse } from '@/types'

interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: 'SALES' | 'MANAGER'
    department: string | null
  }
}

export function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data: ApiResponse<LoginResponse> = await res.json()

      if (data.success && data.data) {
        // AuthProviderのlogin関数を使用してステートとlocalStorageを同時に更新
        login(data.data.token, data.data.user)

        // 日報一覧ページにリダイレクト
        router.push('/reports')
      } else {
        setError(data.error?.message || 'ログインに失敗しました')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">営業日報システム</h1>
          <p className="mt-2 text-gray-600">アカウントにログイン</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ログイン</CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Input
              type="email"
              label="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@company.com"
              required
              autoComplete="email"
            />

            <Input
              type="password"
              label="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              required
              autoComplete="current-password"
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-sm text-gray-500">
          デモアカウント: sales@example.com / password123
        </p>
      </div>
    </div>
  )
}
