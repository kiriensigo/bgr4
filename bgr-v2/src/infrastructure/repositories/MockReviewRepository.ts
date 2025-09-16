import { Review } from '@/domain/entities/Review'
import { ReviewRepository, ReviewFilters, PaginatedResult } from '@/domain/repositories/ReviewRepository'

export class MockReviewRepository implements ReviewRepository {
  private reviews: Review[] = []
  private nextId = 1

  async findById(id: number): Promise<Review | null> {
    return this.reviews.find(review => review.id === id) || null
  }

  async findByGameId(gameId: number, filters?: Omit<ReviewFilters, 'gameId'>): Promise<Review[]> {
    let filtered = this.reviews.filter(review => review.gameId === gameId)

    // Apply additional filters
    if (filters?.userId) {
      filtered = filtered.filter(review => review.userId === filters.userId)
    }

    if (filters?.isPublished !== undefined) {
      filtered = filtered.filter(review => review.isPublished === filters.isPublished)
    }

    if (filters?.minRating) {
      filtered = filtered.filter(review => review.overallScore >= filters.minRating!)
    }

    if (filters?.maxRating) {
      filtered = filtered.filter(review => review.overallScore <= filters.maxRating!)
    }

    return filtered
  }

  async findByUserId(userId: string, filters?: Omit<ReviewFilters, 'userId'>): Promise<Review[]> {
    let filtered = this.reviews.filter(review => review.userId === userId)

    // Apply additional filters
    if (filters?.gameId) {
      filtered = filtered.filter(review => review.gameId === filters.gameId)
    }

    if (filters?.isPublished !== undefined) {
      filtered = filtered.filter(review => review.isPublished === filters.isPublished)
    }

    return filtered
  }

  async findByUserAndGame(userId: string, gameId: number): Promise<Review[]> {
    return this.reviews.filter(review => 
      review.userId === userId && review.gameId === gameId
    )
  }

  async findMany(filters: ReviewFilters): Promise<PaginatedResult<Review>> {
    let filtered = [...this.reviews]

    // Apply filters
    if (filters.gameId) {
      filtered = filtered.filter(review => review.gameId === filters.gameId)
    }

    if (filters.userId) {
      filtered = filtered.filter(review => review.userId === filters.userId)
    }

    if (filters.rating) {
      filtered = filtered.filter(review => review.overallScore === filters.rating)
    }

    if (filters.minRating) {
      filtered = filtered.filter(review => review.overallScore >= filters.minRating!)
    }

    if (filters.maxRating) {
      filtered = filtered.filter(review => review.overallScore <= filters.maxRating!)
    }

    if (filters.isPublished !== undefined) {
      filtered = filtered.filter(review => review.isPublished === filters.isPublished)
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aVal: any, bVal: any

        switch (filters.sortBy) {
          case 'created_at':
            aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0
            bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0
            break
          case 'rating':
            aVal = a.rating || a.overallScore
            bVal = b.rating || b.overallScore
            break
          case 'overall_score':
            aVal = a.overallScore
            bVal = b.overallScore
            break
          default:
            return 0
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return filters.sortOrder === 'desc' ? bVal - aVal : aVal - bVal
        }

        return 0
      })
    }

    return this.paginateResults(filtered, filters)
  }

  async save(review: Review): Promise<Review> {
    if (!review.id) {
      // Create new review with ID
      const newReview = new Review({
        id: this.nextId++,
        userId: review.userId,
        gameId: review.gameId,
        title: review.title,
        content: review.content,
        overallScore: review.overallScore,
        rating: review.rating,
        ruleComplexity: review.ruleComplexity,
        luckFactor: review.luckFactor,
        interaction: review.interaction,
        downtime: review.downtime,
        recommendedPlayers: review.recommendedPlayers,
        mechanics: review.mechanics,
        categories: review.categories,
        customTags: review.customTags,
        playTimeActual: review.playTimeActual,
        playerCountPlayed: review.playerCountPlayed,
        pros: review.pros,
        cons: review.cons,
        isPublished: review.isPublished,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      this.reviews.push(newReview)
      return newReview
    } else {
      // Update existing review
      const reviewIndex = this.reviews.findIndex(r => r.id === review.id)
      if (reviewIndex === -1) {
        throw new Error(`Review with id ${review.id} not found`)
      }
      
      const updatedReview = review.update({ updatedAt: new Date() })
      this.reviews[reviewIndex] = updatedReview
      return updatedReview
    }
  }

  async update(review: Review): Promise<Review> {
    if (!review.id) {
      throw new Error('Review ID is required for update')
    }

    const reviewIndex = this.reviews.findIndex(r => r.id === review.id)
    if (reviewIndex === -1) {
      throw new Error(`Review with id ${review.id} not found`)
    }

    const updatedReview = review.update({ updatedAt: new Date() })
    this.reviews[reviewIndex] = updatedReview
    return updatedReview
  }

  async delete(id: number): Promise<void> {
    const reviewIndex = this.reviews.findIndex(review => review.id === id)
    if (reviewIndex === -1) {
      throw new Error(`Review with id ${id} not found`)
    }

    this.reviews.splice(reviewIndex, 1)
  }

  async getRecentReviews(limit: number = 10): Promise<Review[]> {
    const publishedReviews = this.reviews.filter(review => review.isPublished)
    
    return publishedReviews
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bTime - aTime
      })
      .slice(0, limit)
  }

  async getTopRatedReviews(gameId: number, limit: number = 5): Promise<Review[]> {
    return this.reviews
      .filter(review => review.gameId === gameId && review.isPublished)
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, limit)
  }

  private paginateResults(reviews: Review[], filters?: Partial<ReviewFilters>): PaginatedResult<Review> {
    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const offset = (page - 1) * limit
    const paginatedData = reviews.slice(offset, offset + limit)

    return {
      data: paginatedData,
      total: reviews.length,
      page,
      limit,
      totalPages: Math.ceil(reviews.length / limit)
    }
  }

  // Test helper methods
  clear(): void {
    this.reviews = []
    this.nextId = 1
  }

  getAll(): Review[] {
    return [...this.reviews]
  }

  count(): number {
    return this.reviews.length
  }
}