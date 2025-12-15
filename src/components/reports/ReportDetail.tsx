'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, CardHeader, CardTitle, TextArea } from '@/components/ui'
import type { ReportDetail as ReportDetailType, ApiResponse, CommentResponse } from '@/types'

interface Props {
  reportId: string
}

export function ReportDetail({ reportId }: Props) {
  const router = useRouter()
  const [report, setReport] = useState<ReportDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}`)
      const data: ApiResponse<ReportDetailType> = await res.json()

      if (data.success && data.data) {
        setReport(data.data)
      } else {
        setError(data.error?.message || '日報の取得に失敗しました')
      }
    } catch (err) {
      console.error('Failed to fetch report:', err)
      setError('日報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} (${days[date.getDay()]})`
  }

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '-'
    return timeStr
  }

  const handleDelete = async () => {
    if (!confirm('この日報を削除してもよろしいですか？')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' })
      const data: ApiResponse<void> = await res.json()

      if (data.success) {
        router.push('/reports')
      } else {
        alert(data.error?.message || '削除に失敗しました')
      }
    } catch (err) {
      console.error('Failed to delete report:', err)
      alert('削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/reports/${reportId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })
      const data: ApiResponse<CommentResponse> = await res.json()

      if (data.success) {
        setNewComment('')
        fetchReport()
      } else {
        alert(data.error?.message || 'コメントの追加に失敗しました')
      }
    } catch (err) {
      console.error('Failed to add comment:', err)
      alert('コメントの追加に失敗しました')
    } finally {
      setSubmittingComment(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">読み込み中...</div>
    )
  }

  if (error || !report) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error || '日報が見つかりません'}</p>
        <Link href="/reports">
          <Button variant="secondary">一覧に戻る</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">日報詳細</h1>
        <div className="flex space-x-2">
          <Link href="/reports">
            <Button variant="secondary">一覧に戻る</Button>
          </Link>
          <Link href={`/reports/${reportId}/edit`}>
            <Button variant="secondary">編集</Button>
          </Link>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? '削除中...' : '削除'}
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">日付</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(report.reportDate)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">担当者</dt>
            <dd className="mt-1 text-sm text-gray-900">{report.user.name}</dd>
          </div>
        </dl>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>訪問記録 ({report.visits.length}件)</CardTitle>
        </CardHeader>
        {report.visits.length === 0 ? (
          <p className="text-gray-500">訪問記録がありません</p>
        ) : (
          <div className="space-y-4">
            {report.visits.map((visit, index) => (
              <div key={visit.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">
                    {index + 1}. {visit.customer.name}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {formatTime(visit.visitTime)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{visit.content}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {(report.problem || report.plan) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>所感・計画</CardTitle>
          </CardHeader>
          {report.problem && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 mb-1">課題・問題点</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.problem}</p>
            </div>
          )}
          {report.plan && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">翌日の予定</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.plan}</p>
            </div>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>コメント ({report.comments.length}件)</CardTitle>
        </CardHeader>

        <div className="mb-4">
          <TextArea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="コメントを入力..."
            rows={3}
          />
          <div className="mt-2 flex justify-end">
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || submittingComment}
            >
              {submittingComment ? '送信中...' : 'コメント追加'}
            </Button>
          </div>
        </div>

        {report.comments.length === 0 ? (
          <p className="text-gray-500">コメントがありません</p>
        ) : (
          <div className="space-y-4">
            {report.comments.map((comment) => (
              <div key={comment.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-gray-900">{comment.user.name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleString('ja-JP')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
