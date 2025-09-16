import { Review } from '@/domain/entities/Review'
import { ReviewFilters, PaginatedResult } from '@/domain/repositories/ReviewRepository'

export interface CreateReviewInput {
  title: string
  content: string
  rating: number
  overallScore: number
  ruleComplexity: number
  luckFactor: number
  interaction: number
  downtime: number
  recommendedPlayers: string[]
  mechanics: string[]
  categories: string[]
  customTags: string[]
  playTimeActual?: number
  playerCountPlayed?: number
  pros: string[]
  cons: string[]
  gameId: number
  userId: string
  isPublished?: boolean
}

export interface UpdateReviewInput {
  reviewId: number
  updates: Partial<CreateReviewInput>
  userId: string
}

export interface SearchReviewsInput {
  filters: ReviewFilters
}

export interface ReviewUseCase {
  createReview(input: CreateReviewInput): Promise<Review>
  updateReview(input: UpdateReviewInput): Promise<Review>
  deleteReview(reviewId: number, userId: string): Promise<void>
  getReviewById(id: number): Promise<Review>
  searchReviews(input: SearchReviewsInput): Promise<PaginatedResult<Review>>
  getReviewsByGame(gameId: number, filters?: Omit<ReviewFilters, 'gameId'>): Promise<PaginatedResult<Review>>
  getReviewsByUser(userId: string, filters?: Omit<ReviewFilters, 'userId'>): Promise<PaginatedResult<Review>>
  getRecentReviews(limit?: number): Promise<Review[]>
  getTopRatedReviews(gameId: number, limit?: number): Promise<Review[]>
  publishReview(reviewId: number, userId: string): Promise<Review>
  unpublishReview(reviewId: number, userId: string): Promise<Review>
}