import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { simpleRateLimit } from '@/lib/simple-rate-limit'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // セキュリティヘッダーを追加
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // API エンドポイントにレート制限を適用
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const isAllowed = simpleRateLimit(ip, 100, 60000) // 1分間に100リクエスト
    
    if (!isAllowed) {
      return new NextResponse('Rate limit exceeded', { 
        status: 429,
        headers: {
          'Retry-After': '60'
        }
      })
    }
  }
  
  // Supabase SSR クライアントを作成
  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // セッション取得とクッキーの更新
  await supabase.auth.getSession()

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}