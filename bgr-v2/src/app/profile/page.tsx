'use client'

import { Suspense } from 'react'
import { useUser } from '@/hooks/useUser'
import { useAuth } from '@/hooks/useAuth'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function ProfilePageContent() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading, error } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading || profileLoading) {
    return <ProfilePageSkeleton />
  }

  if (!isAuthenticated || !user) {
    return null // Will redirect
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <span className="font-medium">エラー:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              ホームに戻る
            </Link>
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">プロフィール設定</h1>
              <p className="text-muted-foreground mt-1">
                アカウント情報を管理・編集できます
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <ProfileForm user={user} profile={profile} />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  アカウント情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">メールアドレス</div>
                  <div className="text-sm">{user.email}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">登録日</div>
                  <div className="text-sm">
                    {new Date(user.created_at).toLocaleDateString('ja-JP')}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">最終ログイン</div>
                  <div className="text-sm">
                    {user.last_sign_in_at 
                      ? new Date(user.last_sign_in_at).toLocaleDateString('ja-JP') 
                      : '不明'
                    }
                  </div>
                </div>
                {profile?.is_admin && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">権限</div>
                    <div className="text-sm font-medium text-primary">管理者</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">クイックアクション</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                  <Link href="/reviews/new">
                    新しいレビューを書く
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="w-full justify-start">
                  <Link href="/reviews?userId={user.id}">
                    自分のレビューを見る
                  </Link>
                </Button>
                {profile?.is_admin && (
                  <Button variant="outline" size="sm" asChild className="w-full justify-start">
                    <Link href="/admin">
                      管理者パネル
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ヘルプ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• プロフィール情報は他のユーザーに表示されます</p>
                <p>• ユーザー名は一意である必要があります</p>
                <p>• 不適切なプロフィール情報は削除される場合があります</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-12 bg-muted rounded w-1/2"></div>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-3 mt-8">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-32 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfilePageContent />
    </Suspense>
  )
}

// Metadata is not allowed in 'use client' components
// export const metadata = {
//   title: 'プロフィール設定 - BGR',
//   description: 'アカウント情報の管理・編集ページ。ユーザー名、表示名、プロフィール画像などの設定ができます。',
// }