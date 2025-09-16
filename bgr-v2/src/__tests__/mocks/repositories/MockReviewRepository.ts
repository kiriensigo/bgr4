import { EnhancedReview } from '@/types/enhanced-review'
import { ReviewRepository, ReviewFilters, PaginatedResult } from '@/domain/repositories/ReviewRepository'

export class MockReviewRepository implements ReviewRepository {
  private reviews: EnhancedReview[] = []
  private nextId = 1

  setMockData(reviews: EnhancedReview[]): void {
    this.reviews = reviews
    this.nextId = Math.max(...reviews.map(r => r.id), 0) + 1
  }

  async findById(id: number): Promise<EnhancedReview | null> {
    return this.reviews.find(review => review.id === id) || null
  }

  async findMany(filters: ReviewFilters): Promise<PaginatedResult<EnhancedReview>> {
    let filteredReviews = [...this.reviews]

    // Apply filters
    if (filters.gameId) {
      filteredReviews = filteredReviews.filter(review => review.game_id === filters.gameId)
    }

    if (filters.userId) {
      filteredReviews = filteredReviews.filter(review => review.user_id === filters.userId)
    }

    if (filters.rating) {
      filteredReviews = filteredReviews.filter(review => review.rating === filters.rating)
    }

    if (filters.minRating) {
      filteredReviews = filteredReviews.filter(review => review.overall_score >= filters.minRating!)
    }

    if (filters.maxRating) {
      filteredReviews = filteredReviews.filter(review => review.overall_score <= filters.maxRating!)
    }

    if (filters.isPublished !== undefined) {
      filteredReviews = filteredReviews.filter(review => review.is_published === filters.isPublished)
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'created_at'
    const sortOrder = filters.sortOrder || 'desc'
    
    filteredReviews.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'rating':
          aValue = a.rating
          bValue = b.rating
          break
        case 'overall_score':
          aValue = a.overall_score
          bValue = b.overall_score
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
    const paginatedReviews = filteredReviews.slice(offset, offset + limit)

    return {
      data: paginatedReviews,
      total: filteredReviews.length,
      page,
      limit,
      totalPages: Math.ceil(filteredReviews.length / limit)
    }
  }

  async findByGameId(gameId: number, filters?: Omit<ReviewFilters, 'gameId'>): Promise<PaginatedResult<EnhancedReview>> {
    return this.findMany({ ...filters, gameId })
  }

  async findByUserId(userId: string, filters?: Omit<ReviewFilters, 'userId'>): Promise<PaginatedResult<EnhancedReview>> {
    return this.findMany({ ...filters, userId })
  }

  async save(reviewData: Omit<EnhancedReview, 'id' | 'created_at' | 'updated_at' | 'user' | 'game' | '_count'>): Promise<EnhancedReview> {
    const newReview: EnhancedReview = {
      ...reviewData,
      id: this.nextId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _count: { comments: 0 }
    }

    this.reviews.push(newReview)
    return newReview
  }

  async update(id: number, updates: Partial<EnhancedReview>): Promise<EnhancedReview> {
    const index = this.reviews.findIndex(review => review.id === id)
    if (index === -1) {
      throw new Error(`Review with id ${id} not found`)
    }

    const updatedReview = {
      ...this.reviews[index],
      ...updates,
      updated_at: new Date().toISOString()
    }

    this.reviews[index] = updatedReview
    return updatedReview
  }

  async delete(id: number): Promise<void> {
    const index = this.reviews.findIndex(review => review.id === id)
    if (index === -1) {
      throw new Error(`Review with id ${id} not found`)
    }

    this.reviews.splice(index, 1)
  }

  async getRecentReviews(limit: number = 10): Promise<EnhancedReview[]> {
    return this.reviews
      .filter(review => review.is_published)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  }

  async getTopRatedReviews(gameId: number, limit: number = 5): Promise<EnhancedReview[]> {
    return this.reviews
      .filter(review => review.game_id === gameId && review.is_published)
      .sort((a, b) => b.overall_score - a.overall_score)
      .slice(0, limit)
  }

  // Test utility methods
  reset(): void {
    this.reviews = []
    this.nextId = 1
  }

  getAll(): EnhancedReview[] {
    return [...this.reviews]
  }
}