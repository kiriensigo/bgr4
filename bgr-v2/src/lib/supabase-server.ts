import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// サーバーサイド専用のSupabaseクライアント
export function createSupabaseServerClient() {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}