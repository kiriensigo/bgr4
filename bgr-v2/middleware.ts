import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// 認証が必要なルート
const protectedRoutes = ['/profile', '/reviews/new', '/admin']
// 管理者権限が必要なルート  
const adminRoutes = ['/admin']
// ログイン済みユーザーがアクセスできないルート
const guestOnlyRoutes = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const pathname = request.nextUrl.pathname

  // Supabase client を作成
  const supabase = createMiddlewareClient<Database>({ req: request, res })

  try {
    // セッションを取得
    const {
      data: { session }
    } = await supabase.auth.getSession()

    const user = session?.user
    const isAuthenticated = !!user

    // ゲスト専用ルートのチェック
    if (isAuthenticated && guestOnlyRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // 保護されたルートのチェック
    if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 管理者権限が必要なルートのチェック
    if (isAuthenticated && adminRoutes.some(route => pathname.startsWith(route))) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()

        if (profileError || !profile?.is_admin) {
          return NextResponse.redirect(new URL('/', request.url))
        }
      } catch (error) {
        console.error('Admin check error:', error)
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    // プロフィール自動作成のチェック
    if (isAuthenticated && user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        // プロフィールが存在しない場合は作成
        if (error?.code === 'PGRST116') {
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: user.user_metadata?.['user_name'] || 
                        user.email?.split('@')[0] || 
                        `user_${user.id.slice(0, 8)}`,
              full_name: user.user_metadata?.['full_name'] || '',
              avatar_url: user.user_metadata?.['avatar_url'] || '',
              updated_at: new Date().toISOString(),
            })
        }
      } catch (profileError) {
        console.warn('Profile creation/check error:', profileError)
        // プロフィール関連のエラーは致命的ではないので続行
      }
    }

    return res

  } catch (error) {
    console.error('Middleware error:', error)
    
    // エラーが発生した場合、保護されたルートなら認証ページにリダイレクト
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    return res
  }
}

export const config = {
  // Run middleware only where auth/role checks are needed.
  matcher: [
    '/profile/:path*',
    '/reviews/new/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
}
