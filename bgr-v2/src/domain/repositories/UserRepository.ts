import { User } from '../entities/User'

export interface UserFilters {
  search?: string
  isAdmin?: boolean
  isActive?: boolean
  emailVerified?: boolean
  sortBy?: 'username' | 'full_name' | 'updated_at' | 'created_at'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface UserStats {
  reviewCount: number
  favoriteCount: number
  averageRating: number
}

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByUsername(username: string): Promise<User | null>
  findMany(filters: UserFilters): Promise<PaginatedResult<User>>
  save(user: User): Promise<User>
  update(user: User): Promise<User>
  delete(id: string): Promise<void>
  getAdminUsers(): Promise<User[]>
  getActiveUsers(): Promise<User[]>
  getUserStats(userId: string): Promise<UserStats>
}