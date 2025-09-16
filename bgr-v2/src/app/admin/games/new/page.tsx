'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { GameForm } from '@/components/admin/GameForm'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'

function AdminNewGamePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useUser()
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (!user) {
        router.push('/login?redirect=/admin/games/new')
        return
      }
      
      if (!profile?.is_admin) {
        router.push('/?error=unauthorized')
        return
      }
      
      setLoading(false)
    }
  }, [user, profile, authLoading, profileLoading, router])

  if (loading || authLoading || profileLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const handleSubmit = async (formData: any) => {
    setSubmitLoading(true)
    try {
      const response = await fetch('/api/admin/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        alert('ゲームが正常に登録されました')
        router.push('/admin/games')
      } else {
        throw new Error(result.message || 'ゲームの登録に失敗しました')
      }
    } catch (error) {
      console.error('Game creation error:', error)
      alert(error instanceof Error ? error.message : 'ゲームの登録に失敗しました')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/games')
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">新しいゲーム登録</h1>
          <p className="mt-2 text-gray-600">
            手動でゲーム情報を入力するか、BGGから情報を取得して登録できます
          </p>
        </div>

        <GameForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitLoading}
        />
      </div>
    </AdminLayout>
  )
}

export default function AdminNewGamePageWrapper() {
  return <AdminNewGamePage />
}