import { Review } from '../entities/Review'

export interface ReviewFilters {
  gameId?: number
  userId?: string
  rating?: number
  minRating?: number
  maxRating?: number
  isPublished?: boolean
  sortBy?: 'created_at' | 'rating' | 'overall_score'
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

export interface ReviewRepository {
  findById(id: number): Promise<Review | null>
  findMany(filters: ReviewFilters): Promise<PaginatedResult<Review>>
  findByGameId(gameId: number, filters?: Omit<ReviewFilters, 'gameId'>): Promise<Review[]>
  findByUserId(userId: string, filters?: Omit<ReviewFilters, 'userId'>): Promise<Review[]>
  findByUserAndGame(userId: string, gameId: number): Promise<Review[]>
  save(review: Review): Promise<Review>
  update(review: Review): Promise<Review>
  delete(id: number): Promise<void>
  getRecentReviews(limit?: number): Promise<Review[]>
  getTopRatedReviews(gameId: number, limit?: number): Promise<Review[]>
}