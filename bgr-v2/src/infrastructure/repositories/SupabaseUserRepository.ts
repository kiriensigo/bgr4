import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { User, UserPlainObject } from '@/domain/entities/User'
import { UserRepository, UserFilters, PaginatedResult, UserStats } from '@/domain/repositories/UserRepository'

export class SupabaseUserRepository implements UserRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch user: ${error.message}`)
    }

    return this.mapToUserEntity(data)
  }

  async findByEmail(_email: string): Promise<User | null> {
    // Note: email is not stored in profiles table, it's in auth.users
    // This is a simplified implementation - in practice, you might need to join or use auth admin API
    const { data: _data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (error) {
      throw new Error(`Failed to search user by email: ${error.message}`)
    }

    // This is a placeholder - in real implementation, you'd query auth.users or use a different approach
    return null
  }

  async findByUsername(username: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch user by username: ${error.message}`)
    }

    return this.mapToUserEntity(data)
  }

  async findMany(filters: UserFilters): Promise<PaginatedResult<User>> {
    const page = filters.page || 1
    const limit = filters.limit || 20
    const offset = (page - 1) * limit

    let query = this.supabase
      .from('profiles')
      .select('*', { count: 'exact' })

    // Search filter
    if (filters.search) {
      query = query.or(`username.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`)
    }

    // Admin filter
    if (filters.isAdmin !== undefined) {
      query = query.eq('is_admin', filters.isAdmin)
    }

    // Active filter (placeholder - assuming all profiles are active for now)
    if (filters.isActive !== undefined) {
      // In a real implementation, you might have an active/inactive status field
    }

    // Email verified filter (placeholder)
    if (filters.emailVerified !== undefined) {
      // In a real implementation, you might join with auth.users or have a separate field
    }

    // Sorting
    const validSortFields = ['username', 'full_name', 'updated_at', 'created_at']
    const sortBy = filters.sortBy || 'updated_at'
    const sortOrder = filters.sortOrder || 'desc'
    
    if (validSortFields.includes(sortBy)) {
      const dbField = sortBy === 'created_at' ? 'updated_at' : sortBy // profiles doesn't have created_at
      query = query.order(dbField, { ascending: sortOrder === 'asc' })
    }

    // Pagination
    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    return {
      data: (data || []).map(item => this.mapToUserEntity(item)),
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  async save(user: User): Promise<User> {
    const userData = this.mapFromUserEntity(user)
    const { data, error } = await this.supabase
      .from('profiles')
      .insert(userData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save user: ${error.message}`)
    }

    return this.mapToUserEntity(data)
  }

  async update(user: User): Promise<User> {
    const userData = this.mapFromUserEntity(user)
    const { data, error } = await this.supabase
      .from('profiles')
      .update({
        ...userData,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`)
    }

    return this.mapToUserEntity(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`)
    }
  }

  async getAdminUsers(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('is_admin', true)
      .order('full_name')

    if (error) {
      throw new Error(`Failed to fetch admin users: ${error.message}`)
    }

    return (data || []).map(item => this.mapToUserEntity(item))
  }

  async getActiveUsers(): Promise<User[]> {
    // Placeholder implementation - in practice, you'd filter by active status
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(100)

    if (error) {
      throw new Error(`Failed to fetch active users: ${error.message}`)
    }

    return (data || []).map(item => this.mapToUserEntity(item))
  }

  async getUserStats(userId: string): Promise<UserStats> {
    // Get review count
    const { count: reviewCount, error: reviewError } = await this.supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_published', true)

    if (reviewError) {
      throw new Error(`Failed to fetch review count: ${reviewError.message}`)
    }

    // Get favorite count
    const { count: favoriteCount, error: favoriteError } = await this.supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (favoriteError) {
      throw new Error(`Failed to fetch favorite count: ${favoriteError.message}`)
    }

    // Get average rating
    const { data: avgData, error: avgError } = await this.supabase
      .from('reviews')
      .select('overall_score')
      .eq('user_id', userId)
      .eq('is_published', true)

    if (avgError) {
      throw new Error(`Failed to fetch average rating: ${avgError.message}`)
    }

    const averageRating = avgData && avgData.length > 0
      ? avgData.reduce((sum, review) => sum + (review.overall_score || 0), 0) / avgData.length
      : 0

    return {
      reviewCount: reviewCount || 0,
      favoriteCount: favoriteCount || 0,
      averageRating: Math.round(averageRating * 10) / 10
    }
  }

  private mapToUserEntity(row: Database['public']['Tables']['profiles']['Row']): User {
    const plainObject: UserPlainObject = {
      id: row.id,
      email: undefined, // Email is not stored in profiles table
      username: row.username || undefined,
      full_name: row.full_name || undefined,
      avatar_url: row.avatar_url || undefined,
      website: row.website || undefined,
      is_admin: row.is_admin || false,
      is_active: true, // Placeholder - assuming all profiles are active
      email_verified: true, // Placeholder - would need to check auth.users
      last_login_at: undefined, // Not stored in profiles table
      created_at: undefined, // Not stored in profiles table
      updated_at: row.updated_at || undefined
    }

    return User.fromPlainObject(plainObject)
  }

  private mapFromUserEntity(user: User): Database['public']['Tables']['profiles']['Insert'] {
    const plainObject = user.toPlainObject()
    
    return {
      id: plainObject.id,
      username: plainObject.username,
      full_name: plainObject.full_name,
      avatar_url: plainObject.avatar_url,
      website: plainObject.website,
      is_admin: plainObject.is_admin
      // Note: email, is_active, email_verified, last_login_at are not stored in profiles table
    }
  }
}