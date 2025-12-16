'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Card, CardHeader, CardTitle } from '@/components/ui'
import type { Customer, ApiResponse } from '@/types'

interface Props {
  customerId?: string
}

export function CustomerForm({ customerId }: Props) {
  const router = useRouter()
  const isEdit = !!customerId

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isEdit) {
      fetchCustomer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId])

  const fetchCustomer = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/${customerId}`)
      const data: ApiResponse<Customer> = await res.json()

      if (data.success && data.data) {
        const customer = data.data
        setName(customer.name)
        setAddress(customer.address || '')
        setPhone(customer.phone || '')
        setContactPerson(customer.contactPerson || '')
      } else {
        alert('顧客情報の取得に失敗しました')
        router.push('/customers')
      }
    } catch (err) {
      console.error('Failed to fetch customer:', err)
      alert('顧客情報の取得に失敗しました')
      router.push('/customers')
    } finally {
      setLoading(false)
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = '顧客名は必須です'
    } else if (name.length > 100) {
      newErrors.name = '顧客名は100文字以内で入力してください'
    }

    if (address && address.length > 200) {
      newErrors.address = '住所は200文字以内で入力してください'
    }

    if (phone && !/^[0-9-+().\s]+$/.test(phone)) {
      newErrors.phone = '電話番号の形式が正しくありません'
    }

    if (contactPerson && contactPerson.length > 50) {
      newErrors.contactPerson = '担当者名は50文字以内で入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const body = {
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
      }

      const res = await fetch(
        isEdit ? `/api/customers/${customerId}` : '/api/customers',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )

      const data: ApiResponse<Customer> = await res.json()

      if (data.success) {
        alert(isEdit ? '顧客情報を更新しました' : '顧客を登録しました')
        router.push('/customers')
      } else {
        if (data.error?.details) {
          const fieldErrors: Record<string, string> = {}
          data.error.details.forEach((d) => {
            fieldErrors[d.field] = d.message
          })
          setErrors(fieldErrors)
        } else {
          alert(data.error?.message || '保存に失敗しました')
        }
      }
    } catch (err) {
      console.error('Failed to submit:', err)
      alert('保存に失敗しました')
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
          {isEdit ? '顧客編集' : '顧客登録'}
        </h1>
        <Link href="/customers">
          <Button variant="secondary">← 一覧に戻る</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>顧客情報</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Input
              type="text"
              label="顧客名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
              placeholder="例: ABC株式会社"
            />
            <Input
              type="text"
              label="住所"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              error={errors.address}
              placeholder="例: 東京都渋谷区..."
            />
            <Input
              type="tel"
              label="電話番号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
              placeholder="例: 03-1234-5678"
            />
            <Input
              type="text"
              label="担当者名"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              error={errors.contactPerson}
              placeholder="例: 田中様"
            />
          </div>
        </Card>

        <div className="flex justify-end space-x-4">
          <Link href="/customers">
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
