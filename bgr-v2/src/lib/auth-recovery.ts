import { getSupabaseClient } from './supabase-client'
const supabase = getSupabaseClient()

/**
 * ローカルストレージから既存の認証セッションを復元する
 */
export async function recoverAuthSession(): Promise<boolean> {
  try {
    console.log('🔄 Attempting to recover auth session...')
    
    // Supabaseのデフォルトキーを確認
    const defaultKey = `sb-fjjpkzhmrufwzjxqvres-auth-token`
    const customKey = 'bgr-auth-session'
    
    let authData = null
    
    // 既存のキーをチェック
    const existingData = localStorage.getItem(defaultKey) || localStorage.getItem(customKey)
    
    if (existingData) {
      try {
        authData = JSON.parse(existingData)
        console.log('📦 Found existing auth data:', {
          hasAccessToken: !!authData.access_token,
          hasUser: !!authData.user,
          userEmail: authData.user?.email
        })
      } catch (e) {
        console.error('❌ Failed to parse auth data:', e)
        return false
      }
    }
    
    if (authData?.access_token && authData?.user) {
      console.log('🔐 Restoring session...')
      const { data, error } = await supabase.auth.setSession({
        access_token: authData.access_token,
        refresh_token: authData.refresh_token || ''
      })
      
      if (error) {
        console.error('❌ Session restore error:', error)
        return false
      }
      
      if (data.user) {
        console.log('✅ Session restored successfully:', data.user.email)
        return true
      }
    }
    
    console.log('ℹ️ No valid session found to restore')
    return false
  } catch (error) {
    console.error('❌ Auth recovery error:', error)
    return false
  }
}

/**
 * 認証状態を強制的にリフレッシュ
 */
export async function refreshAuthState(): Promise<void> {
  try {
    console.log('🔄 Refreshing auth state...')
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('❌ Refresh error:', error)
    } else {
      console.log('✅ Auth state refreshed:', { hasUser: !!data.user })
    }
  } catch (error) {
    console.error('❌ Refresh error:', error)
  }
}
