import { supabase } from './supabase-client'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { toast } from '@/hooks/useToast'

type Profile = Database['public']['Tables']['profiles']['Row']

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env['NEXT_PUBLIC_APP_URL'] || 'https://bgrq.netlify.app'}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  
  if (error) throw error
  return data
}

export async function signInWithTwitter() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'twitter',
    options: {
      redirectTo: `${process.env['NEXT_PUBLIC_APP_URL'] || 'https://bgrq.netlify.app'}/auth/callback`,
      scopes: 'read:user user:email',
    },
  })
  
  if (error) throw error
  return data
}

export async function signOut() {
  try {
    console.log('🔓 Starting logout process...')
    
    // Supabaseからログアウト
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Logout error:', error)
      toast({
        variant: "destructive",
        title: "ログアウトエラー",
        description: "ログアウト中にエラーが発生しました。もう一度お試しください。",
      })
      throw error
    }
    
    console.log('✅ Logout successful')
    
    // 成功メッセージを表示
    toast({
      variant: "success",
      title: "ログアウト完了",
      description: "正常にログアウトしました。",
    })
    
    // ページリフレッシュしてクリーンアップ
    setTimeout(() => {
      window.location.reload()
    }, 1000)
    
  } catch (error) {
    console.error('Failed to logout:', error)
    throw error
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser()
  if (!user) return null
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  
  return profile
}

export async function updateProfile(updates: Partial<Profile>) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function createProfile(user: User) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      username: user.user_metadata?.['user_name'] || user.email?.split('@')[0] || '',
      full_name: user.user_metadata?.['full_name'] || '',
      avatar_url: user.user_metadata?.['avatar_url'] || '',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile()
  if (!profile?.is_admin) {
    throw new Error('Admin access required')
  }
  return profile
}