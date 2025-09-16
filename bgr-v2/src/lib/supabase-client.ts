import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// 環境変数から読み込み
const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!

console.log('🔧 Supabase Client Config:', {
  url: supabaseUrl,
  key: supabaseAnonKey.slice(0, 20) + '...'
})

// 環境変数チェック
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Supabaseクライアントの作成
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // URLからセッションを検出できるように変更
    flowType: 'pkce',
    storageKey: 'bgr-auth-session',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    }
  },
  db: {
    schema: 'public'
  }
})

export const createSupabaseClient = () => supabase