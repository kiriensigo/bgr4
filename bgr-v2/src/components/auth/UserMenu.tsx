'use client'

import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'
import { LogOut, Shield } from 'lucide-react'
import Link from 'next/link'

export function UserMenu() {
  const { user, logout, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useUser()

  if (authLoading || profileLoading) {
    return <div className="animate-pulse w-8 h-8 bg-gray-300 rounded-full" />
  }

  if (!user) {
    return (
      <div className="flex gap-2">
        <Link href="/login">
          <Button variant="ghost">ログイン</Button>
        </Link>
        <Link href="/register">
          <Button>新規登録</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {/* ユーザーアバター */}
      <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <Avatar className="h-8 w-8">
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.full_name || profile.username || 'User'} 
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {(profile?.full_name || profile?.username || user?.email || 'U')[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </Avatar>
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {profile?.full_name || profile?.username || user.email?.split('@')[0]}
        </span>
      </Link>
      
      {/* 管理者バッジ */}
      {profile?.is_admin && (
        <Link href="/admin" title="管理者パネル">
          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
            <Shield className="h-4 w-4" />
          </Button>
        </Link>
      )}
      
      {/* ログアウトボタン */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={logout}
        title="ログアウト"
        className="text-gray-600 hover:text-gray-800"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}