import { User } from '@/domain/entities/User'
import { UserRepository, UserFilters, PaginatedResult, UserStats } from '@/domain/repositories/UserRepository'

export class MockUserRepository implements UserRepository {
  private users: User[] = []
  private nextId = 1

  async findById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.users.find(user => user.username === username) || null
  }

  async findMany(filters: UserFilters): Promise<PaginatedResult<User>> {
    let filtered = [...this.users]

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(user => 
        user.username?.toLowerCase().includes(searchLower) ||
        user.fullName?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.isAdmin !== undefined) {
      filtered = filtered.filter(user => user.isAdmin === filters.isAdmin)
    }

    if (filters.isActive !== undefined) {
      filtered = filtered.filter(user => user.isActive === filters.isActive)
    }

    if (filters.emailVerified !== undefined) {
      filtered = filtered.filter(user => user.emailVerified === filters.emailVerified)
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aVal: any, bVal: any
        
        switch (filters.sortBy) {
          case 'username':
            aVal = a.username
            bVal = b.username
            break
          case 'full_name':
            aVal = a.fullName
            bVal = b.fullName
            break
          case 'updated_at':
            aVal = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
            bVal = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
            break
          case 'created_at':
            aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0
            bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0
            break
          default:
            return 0
        }
        
        if (aVal === undefined) return 1
        if (bVal === undefined) return -1
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return filters.sortOrder === 'desc' 
            ? bVal.localeCompare(aVal)
            : aVal.localeCompare(bVal)
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return filters.sortOrder === 'desc' ? bVal - aVal : aVal - bVal
        }
        
        return 0
      })
    }

    // Apply pagination
    const page = filters.page || 1
    const limit = filters.limit || 20
    const offset = (page - 1) * limit
    const paginatedData = filtered.slice(offset, offset + limit)

    return {
      data: paginatedData,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit)
    }
  }

  async save(user: User): Promise<User> {
    const now = new Date()
    
    if (!user.id) {
      // Create new user with ID
      const userId = (this.nextId++).toString()
      const newUser = new User({
        id: userId,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        website: user.website,
        isAdmin: user.isAdmin,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: now,
        updatedAt: now
      })
      
      this.users.push(newUser)
      return newUser
    } else {
      // Update existing user
      const userIndex = this.users.findIndex(u => u.id === user.id)
      if (userIndex === -1) {
        throw new Error(`User with id ${user.id} not found`)
      }
      
      const updatedUser = user.update({ updatedAt: now })
      this.users[userIndex] = updatedUser
      return updatedUser
    }
  }

  async update(user: User): Promise<User> {
    if (!user.id) {
      throw new Error('User ID is required for update')
    }

    const userIndex = this.users.findIndex(u => u.id === user.id)
    if (userIndex === -1) {
      throw new Error(`User with id ${user.id} not found`)
    }

    const updatedUser = user.update({ updatedAt: new Date() })
    this.users[userIndex] = updatedUser
    return updatedUser
  }

  async delete(id: string): Promise<void> {
    const userIndex = this.users.findIndex(user => user.id === id)
    if (userIndex === -1) {
      throw new Error(`User with id ${id} not found`)
    }

    this.users.splice(userIndex, 1)
  }

  async getAdminUsers(): Promise<User[]> {
    return this.users.filter(user => user.isAdmin === true)
  }

  async getActiveUsers(): Promise<User[]> {
    return this.users.filter(user => user.isActive === true)
  }

  async getUserStats(_userId: string): Promise<UserStats> {
    // Mock implementation
    return {
      reviewCount: 0,
      favoriteCount: 0,
      averageRating: 0
    }
  }

  // Test helper methods
  clear(): void {
    this.users = []
  }

  getAll(): User[] {
    return [...this.users]
  }

  count(): number {
    return this.users.length
  }

  addTestUser(user: User): void {
    this.users.push(user)
  }
}