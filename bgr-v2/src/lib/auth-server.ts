import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

export async function getUser() {
  const supabase = await createSupabaseServerClient()
  
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function getUserProfile() {
  const supabase = await createSupabaseServerClient()
  
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    // プロフィール情報とレビュー数を取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        full_name,
        avatar_url,
        is_admin,
        reviews:reviews(count)
      `)
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error getting user profile:', profileError)
      return {
        ...user,
        is_admin: false,
        reviews_count: 0,
        username: null,
        full_name: null,
        avatar_url: null,
      }
    }

    return {
      ...user,
      is_admin: profile.is_admin || false,
      reviews_count: profile.reviews?.[0]?.count || 0,
      username: profile.username,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
    }
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

export async function requireAuth() {
  const user = await getUserProfile()
  
  if (!user) {
    redirect('/auth/login?message=ログインが必要です')
  }
  
  return user
}

export async function requireAdmin() {
  const user = await getUserProfile()
  
  if (!user) {
    redirect('/auth/login?message=ログインが必要です')
  }
  
  if (!user.is_admin) {
    redirect('/?message=管理者権限が必要です')
  }
  
  return user
}