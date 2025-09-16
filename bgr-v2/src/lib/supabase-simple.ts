'use client'

import { createClient } from '@supabase/supabase-js'

// シンプルなSupabaseクライアント（認証機能なし）
const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

console.log('🔧 Simple Supabase Client Config:', {
  url: supabaseUrl,
  key: supabaseAnonKey?.slice(0, 20) + '...'
})

export const simpleSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    }
  }
})

export const createSimpleSupabaseClient = () => simpleSupabase