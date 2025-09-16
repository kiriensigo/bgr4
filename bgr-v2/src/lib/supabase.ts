import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://example.supabase.co'
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 'example-key'

// シングルトンパターンでクライアントインスタンスを管理
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null
let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'bgr-auth-session',
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'apikey': supabaseAnonKey,
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 2,
        }
      }
    })
  }
  return supabaseInstance
})()

// サーバーサイド用のクライアント（Service Role Key使用）
export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient<Database>(
      supabaseUrl,
      process.env['SUPABASE_SERVICE_ROLE_KEY'] || 'example-service-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    )
  }
  return supabaseAdminInstance
})()

// サーバーサイドでクッキーからセッションを読み取るクライアント
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server componentsではクッキー設定できないので無視
          }
        },
      },
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      }
    }
  )
}

// エクスポートエラー修正用のエイリアス
export const createSupabaseClient = () => supabase
export { createClient }