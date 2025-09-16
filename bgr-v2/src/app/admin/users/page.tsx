'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { UsersList } from '@/components/admin/UsersList'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'

interface AdminUser {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  website: string | null
  is_admin: boolean
  updated_at: string
}

interface UsersData {
  users: AdminUser[]
  totalCount: number
  totalPages: number
  currentPage: number
}

function AdminUsersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useUser()
  const [loading, setLoading] = useState(true)
  const [usersData, setUsersData] = useState<UsersData | null>(null)
  const [usersLoading, setUsersLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (!user) {
        router.push('/login?redirect=/admin/users')
        return
      }
      
      if (!profile?.is_admin) {
        router.push('/?error=unauthorized')
        return
      }
      
      setLoading(false)
    }
  }, [user, profile, authLoading, profileLoading, router])

  // ユーザーデータ取得
  useEffect(() => {
    if (!loading && user && profile?.is_admin) {
      const fetchUsers = async () => {
        try {
          setUsersLoading(true)
          const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: '20'
          })
          
          if (searchQuery.trim()) {
            params.append('search', searchQuery.trim())
          }

          const response = await fetch(`/api/admin/users?${params}`)
          if (response.ok) {
            const data = await response.json()
            setUsersData(data)
          }
        } catch (error) {
          console.error('Failed to fetch users:', error)
        } finally {
          setUsersLoading(false)
        }
      }

      fetchUsers()
    }
  }, [loading, user, profile, currentPage, searchQuery])

  if (loading || authLoading || profileLoading) {
    return <AdminUsersPageSkeleton />
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ユーザー管理</h1>
          <p className="mt-2 text-gray-600">
            登録ユーザーの管理と権限設定を行えます
          </p>
        </div>

        {/* Users List */}
        <UsersList 
          usersData={usersData}
          loading={usersLoading}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>
    </AdminLayout>
  )
}

function AdminUsersPageSkeleton() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        
        <div className="bg-white rounded-lg border">
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-8 w-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default function AdminUsersPageWrapper() {
  return <AdminUsersPage />
}