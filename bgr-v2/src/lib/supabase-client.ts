import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

let client: SupabaseClient<Database> | null = null

export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) return client

  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: 'bgr-auth-session',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
      headers: { apikey: supabaseAnonKey },
    },
    db: { schema: 'public' },
  })

  return client
}

export const createSupabaseClient = () => getSupabaseClient()

