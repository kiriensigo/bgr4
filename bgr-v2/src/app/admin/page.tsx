'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { StatsCards } from '@/components/admin/StatsCards'
import { RecentActivity } from '@/components/admin/RecentActivity'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'

interface AdminStats {
  users: {
    total: number
    admins: number
    recent: number
  }
  games: {
    total: number
  }
  reviews: {
    total: number
    recent: number
    averageRating: number
  }
}

function AdminDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useUser()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (!user) {
        router.push('/login?redirect=/admin')
        return
      }
      
      if (!profile?.is_admin) {
        router.push('/?error=unauthorized')
        return
      }
      
      setLoading(false)
    }
  }, [user, profile, authLoading, profileLoading, router])

  // 統計情報取得
  useEffect(() => {
    if (!loading && user && profile?.is_admin) {
      const fetchStats = async () => {
        try {
          const response = await fetch('/api/admin/stats')
          if (response.ok) {
            const data = await response.json()
            setStats(data)
          }
        } catch (error) {
          console.error('Failed to fetch admin stats:', error)
        } finally {
          setStatsLoading(false)
        }
      }

      fetchStats()
    }
  }, [loading, user, profile])

  if (loading || authLoading || profileLoading) {
    return <AdminDashboardSkeleton />
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
          <p className="mt-2 text-gray-600">
            サイト全体の統計情報と最近のアクティビティを確認できます
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} loading={statsLoading} />

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentActivity type="reviews" />
          <RecentActivity type="users" />
        </div>
      </div>
    </AdminLayout>
  )
}

function AdminDashboardSkeleton() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 border">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 border">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}

export default function AdminPage() {
  return <AdminDashboard />
}

