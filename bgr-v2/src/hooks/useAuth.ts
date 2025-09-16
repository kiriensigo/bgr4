'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { User, Session } from '@supabase/supabase-js'
import { signInWithGoogle, signInWithTwitter, signOut } from '@/lib/auth'
import { toast } from '@/hooks/useToast'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // 認証状態変更リスナーを設定
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email
      })
      
      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // セッション復元時のウェルカムメッセージ
      if (event === 'SIGNED_IN' && session?.user) {
        const userName = session.user.user_metadata?.['full_name'] || 
                        session.user.user_metadata?.['name'] || 
                        session.user.email?.split('@')[0]
        
        toast({
          variant: "success",
          title: "おかえりなさい！",
          description: `${userName} としてログインしました。`,
        })
      }
      
      // ログアウトイベントの特別処理
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out, cleaning up state...')
        setSession(null)
        setUser(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = {
    google: signInWithGoogle,
    twitter: signInWithTwitter,
  }

  return {
    user,
    session,
    loading,
    login,
    logout: signOut,
    isAuthenticated: !!user,
  }
}