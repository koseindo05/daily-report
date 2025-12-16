'use client'

import Link from 'next/link'

export function Header() {
  // TODO: 認証情報から取得
  const user: { name: string; role: 'SALES' | 'MANAGER' } = { name: '山田太郎', role: 'SALES' }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/reports" className="text-xl font-bold text-gray-900">
              営業日報システム
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link
              href="/reports"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
            >
              日報一覧
            </Link>
            <Link
              href="/customers"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
            >
              顧客マスタ
            </Link>
            {user.role === 'MANAGER' && (
              <Link
                href="/users"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                ユーザー管理
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user.name}</span>
            <button
              onClick={() => {
                // TODO: ログアウト処理
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
