'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthButton } from '@/components/auth/AuthButton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Gamepad2, LogIn, AlertCircle } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { useAuth } from '@/hooks/useAuth'
// import { toast } from '@/hooks/useToast'
import Link from 'next/link'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string>('')

  // 認証済みユーザーのリダイレクト処理を統合
  useEffect(() => {
    const handleAuth = async () => {
      // ローディング中はスキップ
      if (loading) return
      
      // 認証済みユーザーのリダイレクト
      if (user) {
        const redirectTo = searchParams.get('next') || '/'
        console.log('🔄 User already authenticated, redirecting to:', redirectTo)
        router.push(redirectTo)
        return
      }
    }

    handleAuth()
  }, [user, loading, router])

  // エラー処理とOAuth処理は別のuseEffectで実行（初回のみ）
  useEffect(() => {
    const handleOAuth = async () => {
      // エラーメッセージ処理
      const error = searchParams.get('error')
      if (error) {
        const errorMessages: Record<string, string> = {
          'oauth_failed': 'ログインに失敗しました。もう一度お試しください。',
          'auth_failed': '認証に失敗しました。もう一度お試しください。',
          'auth_required': 'ログインが必要です。',
          'session_expired': 'セッションが期限切れです。再度ログインしてください。'
        }
        setErrorMessage(errorMessages[error] || 'ログインエラーが発生しました。')
        
        // Clean URL by removing error parameter
        const url = new URL(window.location.href)
        url.searchParams.delete('error')
        window.history.replaceState({}, '', url.pathname + url.search)
      }

      // OAuth コールバック処理
      const hash = window.location.hash
      if (hash.includes('code=')) {
        const params = new URLSearchParams(hash.substring(1))
        const code = params.get('code')
        const next = params.get('next') || '/'
        
        if (code) {
          try {
            window.history.replaceState(null, '', window.location.pathname)
            console.log('🔐 Starting code exchange for session...')
            const supabase = getSupabaseClient()
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)
            
            if (error) {
              console.error('Auth callback error:', error)
              setErrorMessage(`認証に失敗しました: ${error.message}`)
              return
            }
            
            if (data?.user && data?.session) {
              console.log('✅ OAuth completed successfully')
              
              // プロフィール作成/更新
              await supabase
                .from('profiles')
                .upsert({
                  id: data.user.id,
                  username: data.user.user_metadata?.['user_name'] || 
                           data.user.user_metadata?.['preferred_username'] ||
                           data.user.email?.split('@')[0] || 
                           'user',
                  full_name: data.user.user_metadata?.['full_name'] || 
                            data.user.user_metadata?.['name'] || 
                            '',
                  avatar_url: data.user.user_metadata?.['avatar_url'] || 
                             data.user.user_metadata?.['picture'] || 
                             '',
                  updated_at: new Date().toISOString(),
                })
                .then(({ error }) => {
                  if (error) console.warn('Profile upsert warning:', error)
                })
              
              const redirectTo = searchParams.get('next') || next
              console.log('🔄 OAuth completed, redirecting to:', redirectTo)
              
              setTimeout(() => {
                router.push(redirectTo)
              }, 1000)
            } else {
              setErrorMessage('認証データが不完全です。もう一度お試しください。')
            }
          } catch (error) {
            console.error('Auth callback error:', error)
            setErrorMessage('認証処理中にエラーが発生しました。')
          }
        }
      }
    }

    handleOAuth()
  }, []) // 初回のみ実行

  // ローディング中は固定レイアウトを保持
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-md w-full space-y-8 px-4">
          <div className="text-center">
            <div className="flex justify-center items-center gap-2 mb-6">
              <div className="p-3 bg-primary rounded-lg">
                <div className="w-8 h-8 bg-primary-foreground rounded"></div>
              </div>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  // 認証済みユーザーにはリダイレクト中メッセージを表示
  if (user && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-md w-full space-y-8 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">リダイレクト中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-md w-full space-y-8 px-4">
        {/* Logo & Header */}
        <div className="text-center">
          <div className="flex justify-center items-center gap-2 mb-6">
            <div className="p-3 bg-primary rounded-lg">
              <Gamepad2 className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">おかえりなさい</h1>
          <p className="mt-2 text-sm text-gray-600">
            BGR へログインして続きを楽しもう
          </p>
        </div>
        
        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">ログイン</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              アカウントにアクセス
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            <AuthButton provider="google" className="w-full" />
            <AuthButton provider="twitter" className="w-full" />
            
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                アカウントをお持ちでないですか？{' '}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  新規登録
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Quick Info */}
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">ログインして</h3>
          <div className="grid gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>お気に入りのゲームを保存</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>レビューを投稿・管理</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>パーソナライズされた体験</span>
            </div>
          </div>
        </div>
        
        {/* Terms */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            ログインすることで、
            <a href="/terms" className="text-primary hover:underline">利用規約</a>
            および
            <a href="/privacy" className="text-primary hover:underline">プライバシーポリシー</a>
            に同意したものとみなされます。
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-md w-full space-y-8 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}
