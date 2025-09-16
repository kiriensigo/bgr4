import { Profile } from '@/types'
import { UserRepository, UserFilters, PaginatedResult } from '@/domain/repositories/UserRepository'

export class MockUserRepository implements UserRepository {
  private users: Profile[] = []

  setMockData(users: Profile[]): void {
    this.users = users
  }

  async findById(id: string): Promise<Profile | null> {
    return this.users.find(user => user.id === id) || null
  }

  async findByUsername(username: string): Promise<Profile | null> {
    return this.users.find(user => user.username === username) || null
  }

  async findMany(filters: UserFilters): Promise<PaginatedResult<Profile>> {
    let filteredUsers = [...this.users]

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredUsers = filteredUsers.filter(user => 
        user.username?.toLowerCase().includes(searchLower) ||
        user.full_name?.toLowerCase().includes(searchLower)
      )
    }

    // Apply admin filter
    if (filters.isAdmin !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.is_admin === filters.isAdmin)
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'updated_at'
    const sortOrder = filters.sortOrder || 'desc'
    
    filteredUsers.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'username':
          aValue = a.username || ''
          bValue = b.username || ''
          break
        case 'full_name':
          aValue = a.full_name || ''
          bValue = b.full_name || ''
          break
        case 'updated_at':
          aValue = new Date(a.updated_at || 0).getTime()
          bValue = new Date(b.updated_at || 0).getTime()
          break
        default:
          return 0
      }

      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      }
    })

    // Apply pagination
    const page = filters.page || 1
    const limit = filters.limit || 20
    const offset = (page - 1) * limit
    const paginatedUsers = filteredUsers.slice(offset, offset + limit)

    return {
      data: paginatedUsers,
      total: filteredUsers.length,
      page,
      limit,
      totalPages: Math.ceil(filteredUsers.length / limit)
    }
  }

  async save(profileData: Omit<Profile, 'updated_at'>): Promise<Profile> {
    const newProfile: Profile = {
      ...profileData,
      updated_at: new Date().toISOString()
    }

    this.users.push(newProfile)
    return newProfile
  }

  async update(id: string, updates: Partial<Profile>): Promise<Profile> {
    const index = this.users.findIndex(user => user.id === id)
    if (index === -1) {
      throw new Error(`User with id ${id} not found`)
    }

    const updatedUser = {
      ...this.users[index],
      ...updates,
      updated_at: new Date().toISOString()
    }

    this.users[index] = updatedUser
    return updatedUser
  }

  async delete(id: string): Promise<void> {
    const index = this.users.findIndex(user => user.id === id)
    if (index === -1) {
      throw new Error(`User with id ${id} not found`)
    }

    this.users.splice(index, 1)
  }

  async getAdminUsers(): Promise<Profile[]> {
    return this.users.filter(user => user.is_admin)
  }

  async getUserStats(): Promise<{
    reviewCount: number
    favoriteCount: number
    averageRating: number
  }> {
    // Mock stats - in real tests you'd configure these
    return {
      reviewCount: 5,
      favoriteCount: 12,
      averageRating: 7.8
    }
  }

  // Test utility methods
  reset(): void {
    this.users = []
  }

  getAll(): Profile[] {
    return [...this.users]
  }
}