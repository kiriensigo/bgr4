'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Shield, 
  ShieldCheck, 
  User, 
  Calendar,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

interface UsersListProps {
  usersData: UsersData | null
  loading: boolean
  currentPage: number
  onPageChange: (page: number) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function UsersList({ 
  usersData, 
  loading, 
  currentPage, 
  onPageChange, 
  searchQuery, 
  onSearchChange 
}: UsersListProps) {
  const [actionLoading, setActionLoading] = useState(false)

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`管理者権限を${currentStatus ? '剥奪' : '付与'}しますか？`)) {
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_admin: !currentStatus
        })
      })

      if (response.ok) {
        // データ再取得をトリガー
        window.location.reload()
      } else {
        throw new Error('Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('ユーザーの更新に失敗しました')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <UsersListSkeleton />
  }

  if (!usersData) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">データの読み込みに失敗しました</p>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <User className="h-6 w-6" />
            <span>ユーザー一覧</span>
            <Badge variant="secondary">{usersData.totalCount}人</Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ユーザー検索..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {usersData.users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4">ユーザーが見つかりません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {usersData.users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {user.is_admin ? (
                      <ShieldCheck className="h-6 w-6 text-red-600" />
                    ) : (
                      <User className="h-6 w-6 text-gray-600" />
                    )}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">
                        {user.full_name || user.username || 'Unknown User'}
                      </h3>
                      {user.is_admin && (
                        <Badge className="bg-red-100 text-red-800">
                          <Shield className="h-3 w-3 mr-1" />
                          管理者
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      {user.username && (
                        <div className="flex items-center space-x-1">
                          <span>@{user.username}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>更新: {formatDate(user.updated_at)}</span>
                      </div>
                      {user.website && (
                        <div className="flex items-center space-x-1">
                          <span>🌐 {user.website}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={actionLoading}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                        className={user.is_admin ? "text-red-600" : "text-blue-600"}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        {user.is_admin ? '管理者権限を剥奪' : '管理者権限を付与'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {usersData.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              前へ
            </Button>
            <span className="text-sm text-gray-500">
              {currentPage} / {usersData.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === usersData.totalPages}
            >
              次へ
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function UsersListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-5 w-10 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-10 w-64 bg-gray-200 rounded"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}