'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, TextArea, Select, Card, CardHeader, CardTitle } from '@/components/ui'
import { useToast } from '@/components/notifications/ToastProvider'
import type { Customer, ReportDetail, ApiResponse, CreateReportRequest, UpdateReportRequest } from '@/types'

interface VisitInput {
  customerId: string
  visitTime: string
  content: string
}

interface Props {
  reportId?: string
}

export function ReportForm({ reportId }: Props) {
  const router = useRouter()
  const toast = useToast()
  const isEdit = !!reportId

  const [reportDate, setReportDate] = useState('')
  const [visits, setVisits] = useState<VisitInput[]>([{ customerId: '', visitTime: '', content: '' }])
  const [problem, setProblem] = useState('')
  const [plan, setPlan] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchCustomers()
    if (isEdit) {
      fetchReport()
    } else {
      setReportDate(new Date().toISOString().split('T')[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId])

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers?limit=1000')
      const data: ApiResponse<{ customers: Customer[] }> = await res.json()
      if (data.success && data.data) {
        setCustomers(data.data.customers)
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err)
    }
  }

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/${reportId}`)
      const data: ApiResponse<ReportDetail> = await res.json()

      if (data.success && data.data) {
        const report = data.data
        setReportDate(report.reportDate.split('T')[0])
        setVisits(
          report.visits.map((v) => ({
            customerId: v.customer.id,
            visitTime: v.visitTime || '',
            content: v.content,
          }))
        )
        setProblem(report.problem || '')
        setPlan(report.plan || '')
      }
    } catch (err) {
      console.error('Failed to fetch report:', err)
    } finally {
      setLoading(false)
    }
  }

  const addVisit = () => {
    setVisits([...visits, { customerId: '', visitTime: '', content: '' }])
  }

  const removeVisit = (index: number) => {
    if (visits.length <= 1) return
    setVisits(visits.filter((_, i) => i !== index))
  }

  const updateVisit = (index: number, field: keyof VisitInput, value: string) => {
    setVisits(visits.map((v, i) => (i === index ? { ...v, [field]: value } : v)))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!reportDate) {
      newErrors.reportDate = '日付は必須です'
    } else {
      const date = new Date(reportDate)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (date > today) {
        newErrors.reportDate = '未来の日付は指定できません'
      }
    }

    const validVisits = visits.filter((v) => v.customerId || v.content)
    if (validVisits.length === 0) {
      newErrors.visits = '少なくとも1件の訪問記録が必要です'
    } else {
      validVisits.forEach((v, i) => {
        if (!v.customerId) {
          newErrors[`visit_${i}_customer`] = '顧客を選択してください'
        }
        if (!v.content) {
          newErrors[`visit_${i}_content`] = '活動内容を入力してください'
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const validVisits = visits.filter((v) => v.customerId && v.content)
      const body: CreateReportRequest | UpdateReportRequest = {
        reportDate,
        visits: validVisits.map((v) => ({
          customerId: v.customerId,
          visitTime: v.visitTime || undefined,
          content: v.content,
        })),
        problem: problem || undefined,
        plan: plan || undefined,
      }

      const res = await fetch(
        isEdit ? `/api/reports/${reportId}` : '/api/reports',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )

      const data: ApiResponse<{ id: string }> = await res.json()

      if (data.success) {
        router.push(`/reports/${data.data?.id || reportId}`)
      } else {
        if (data.error?.details) {
          const fieldErrors: Record<string, string> = {}
          data.error.details.forEach((d) => {
            fieldErrors[d.field] = d.message
          })
          setErrors(fieldErrors)
        } else {
          toast.error(data.error?.message || '保存に失敗しました')
        }
      }
    } catch (err) {
      console.error('Failed to submit:', err)
      toast.error('保存に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">読み込み中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? '日報編集' : '日報作成'}
        </h1>
        <Link href={isEdit ? `/reports/${reportId}` : '/reports'}>
          <Button variant="secondary">キャンセル</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <Input
            type="date"
            label="日付"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            error={errors.reportDate}
            required
          />
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>訪問記録</CardTitle>
          </CardHeader>
          {errors.visits && (
            <p className="text-red-600 text-sm mb-4">{errors.visits}</p>
          )}
          <div className="space-y-6">
            {visits.map((visit, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium text-gray-900">訪問 {index + 1}</h4>
                  {visits.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeVisit(index)}
                    >
                      削除
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Select
                    label="顧客"
                    value={visit.customerId}
                    onChange={(e) => updateVisit(index, 'customerId', e.target.value)}
                    error={errors[`visit_${index}_customer`]}
                  >
                    <option value="">選択してください</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="time"
                    label="訪問時刻"
                    value={visit.visitTime}
                    onChange={(e) => updateVisit(index, 'visitTime', e.target.value)}
                  />
                </div>
                <TextArea
                  label="活動内容"
                  value={visit.content}
                  onChange={(e) => updateVisit(index, 'content', e.target.value)}
                  error={errors[`visit_${index}_content`]}
                  rows={3}
                />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button type="button" variant="secondary" onClick={addVisit}>
              + 訪問を追加
            </Button>
          </div>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>所感・計画</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <TextArea
              label="課題・問題点"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              rows={3}
            />
            <TextArea
              label="翌日の予定"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              rows={3}
            />
          </div>
        </Card>

        <div className="flex justify-end space-x-4">
          <Link href={isEdit ? `/reports/${reportId}` : '/reports'}>
            <Button type="button" variant="secondary">
              キャンセル
            </Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? '保存中...' : '保存'}
          </Button>
        </div>
      </form>
    </div>
  )
}
