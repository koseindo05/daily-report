'use client'

import { Button } from './Button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <nav
      className={`flex justify-center items-center space-x-4 ${className}`}
      aria-label="ページネーション"
    >
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="前のページ"
      >
        前へ
      </Button>
      <span className="text-sm text-gray-600" aria-current="page">
        {currentPage} / {totalPages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="次のページ"
      >
        次へ
      </Button>
    </nav>
  )
}
