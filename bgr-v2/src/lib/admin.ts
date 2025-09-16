import { supabase } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

export interface AdminUser {
  id: string
  email: string
  is_admin: boolean
  created_at: string
  last_sign_in_at?: string
}

export interface AdminStats {
  totalUsers: number
  totalGames: number
  totalReviews: number
  activeReviewers: number
  reviewsThisMonth: number
  averageRating: number
}

export interface ActivityLog {
  id: string
  user_id: string
  action: string
  table_name: string
  record_id: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  created_at: string
}

// 管理者権限チェック
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return false
    }

    return profile.is_admin === true
  } catch (error) {
    console.error('Admin check error:', error)
    return false
  }
}

export class AdminError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AdminError'
  }
}

// 管理者権限を必要とする処理のラッパー（認証込み）
export async function requireAdmin() {
  const user = await requireAuth()
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (error) {
    throw new AdminError('Failed to fetch user profile', 'PROFILE_FETCH_ERROR')
  }

  if (!profile?.is_admin) {
    throw new AdminError('Administrator privileges required', 'INSUFFICIENT_PRIVILEGES')
  }

  return user
}

// ユーザー一覧取得（管理者用）
export async function getAdminUsersList(page: number = 1, limit: number = 20) {
  return getAdminUsers(page, limit)
}

export async function getAdminUsers(page: number = 1, limit: number = 20) {
  try {
    const offset = (page - 1) * limit

    const { data: users, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      users: users || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  } catch (error) {
    console.error('Get admin users error:', error)
    throw error
  }
}

// ユーザーの管理者権限付与/剥奪
export async function updateUserAdminStatus(userId: string, isAdmin: boolean, adminUserId: string) {
  try {
    await requireAdmin()

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_admin: isAdmin })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    // 操作ログ記録
    await logAdminAction('profiles', userId, 'admin_status_update', {
      old_is_admin: !isAdmin,
      new_is_admin: isAdmin
    }, adminUserId)

    return data
  } catch (error) {
    console.error('Update user admin status error:', error)
    throw error
  }
}

// 管理者統計情報取得
export async function getSystemStats(): Promise<AdminStats> {
  return getAdminStats()
}

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const [usersCount, gamesCount, reviewsCount, reviewsThisMonth] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('games').select('*', { count: 'exact', head: true }),
      supabase.from('reviews').select('*', { count: 'exact', head: true }),
      supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    ])

    // 平均評価計算
    const { data: reviews } = await supabase
      .from('reviews')
      .select('overall_score')
      .not('overall_score', 'is', null)

    const averageRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.overall_score || 0), 0) / reviews.length
      : 0

    // アクティブレビューワー数（過去30日間にレビューした人数）
    const { data: activeReviewers } = await supabase
      .from('reviews')
      .select('user_id')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const uniqueReviewers = new Set(activeReviewers?.map(r => r.user_id) || []).size

    return {
      totalUsers: usersCount.count || 0,
      totalGames: gamesCount.count || 0,
      totalReviews: reviewsCount.count || 0,
      activeReviewers: uniqueReviewers,
      reviewsThisMonth: reviewsThisMonth.count || 0,
      averageRating: Math.round(averageRating * 10) / 10
    }
  } catch (error) {
    console.error('Get admin stats error:', error)
    throw error
  }
}

// レビュー管理用
export async function getAdminReviews(
  page: number = 1, 
  limit: number = 20, 
  status?: 'published' | 'pending' | 'rejected'
) {
  try {
    const offset = (page - 1) * limit

    let query = supabase
      .from('reviews')
      .select(`
        *,
        user:profiles(id, username, email, full_name),
        game:games(id, name, japanese_name)
      `, { count: 'exact' })

    if (status === 'published') {
      query = query.eq('is_published', true)
    } else if (status === 'pending') {
      query = query.eq('is_published', false)
    }

    const { data: reviews, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      reviews: reviews || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  } catch (error) {
    console.error('Get admin reviews error:', error)
    throw error
  }
}

// レビューの公開状態変更
export async function updateReviewStatus(reviewId: string, isPublished: boolean, adminUserId: string) {
  try {
    await requireAdmin()

    const { data, error } = await supabase
      .from('reviews')
      .update({ is_published: isPublished, updated_at: new Date().toISOString() })
      .eq('id', parseInt(reviewId))
      .select()
      .single()

    if (error) throw error

    // 操作ログ記録
    await logAdminAction('reviews', reviewId, 'status_update', {
      new_is_published: isPublished
    }, adminUserId)

    return data
  } catch (error) {
    console.error('Update review status error:', error)
    throw error
  }
}

// 操作ログ記録
export async function logAdminAction(
  tableName: string,
  recordId: string,
  action: string,
  values: Record<string, any>,
  userId?: string
) {
  try {
    // 実際の実装では専用のlogsテーブルを作成
    // 今回はconsole.logで代用
    console.log('Admin Action Log:', {
      table_name: tableName,
      record_id: recordId,
      action,
      values,
      user_id: userId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Log admin action error:', error)
  }
}

// ゲーム管理用
export async function getAdminGames(page: number = 1, limit: number = 20) {
  try {
    const offset = (page - 1) * limit

    const { data: games, error, count } = await supabase
      .from('games')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) throw error

    return {
      games: games || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  } catch (error) {
    console.error('Get admin games error:', error)
    throw error
  }
}

// ゲーム情報更新
export async function updateGameInfo(
  gameId: string, 
  gameData: Partial<any>, 
  adminUserId: string
) {
  try {
    await requireAdmin()

    const { data, error } = await supabase
      .from('games')
      .update({ ...gameData, updated_at: new Date().toISOString() })
      .eq('id', parseInt(gameId))
      .select()
      .single()

    if (error) throw error

    // 操作ログ記録
    await logAdminAction('games', gameId, 'info_update', gameData, adminUserId)

    return data
  } catch (error) {
    console.error('Update game info error:', error)
    throw error
  }
}