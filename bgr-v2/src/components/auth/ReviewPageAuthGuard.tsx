'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface ReviewPageAuthGuardProps {
  children: React.ReactNode
  gameId: string
}

export function ReviewPageAuthGuard({ children, gameId }: ReviewPageAuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      console.log('🔒 ReviewPageAuthGuard: User not authenticated, redirecting to login')
      router.push(`/login?next=${encodeURIComponent(`/reviews/new/${gameId}`)}`)
    }
  }, [user, loading, router, gameId])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">認証状態を確認中...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">ログインページに移動中...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  console.log('✅ ReviewPageAuthGuard: User authenticated:', user.email)
  return <>{children}</>
}