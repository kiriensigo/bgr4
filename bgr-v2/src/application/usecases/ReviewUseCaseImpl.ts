import { Review } from '@/domain/entities/Review'
import { ReviewRepository, ReviewFilters, PaginatedResult } from '@/domain/repositories/ReviewRepository'
import { GameRepository } from '@/domain/repositories/GameRepository'
import { 
  ReviewUseCase,
  CreateReviewInput,
  UpdateReviewInput,
  SearchReviewsInput
} from './ReviewUseCase'
import { 
  ValidationError,
  ReviewNotFoundError,
  GameNotFoundError,
  ForbiddenError
} from '@/domain/errors/DomainErrors'

export class ReviewUseCaseImpl implements ReviewUseCase {
  constructor(
    private reviewRepository: ReviewRepository,
    private gameRepository: GameRepository
  ) {}

  async createReview(input: CreateReviewInput): Promise<Review> {
    // Validate input
    await this.validateCreateReviewInput(input)

    // Verify game exists
    const game = await this.gameRepository.findById(input.gameId)
    if (!game) {
      throw new GameNotFoundError(input.gameId)
    }

    // Create review entity
    const review = new Review({
      userId: input.userId,
      gameId: input.gameId,
      title: input.title,
      content: input.content,
      overallScore: input.overallScore,
      rating: input.rating,
      ruleComplexity: input.ruleComplexity,
      luckFactor: input.luckFactor,
      interaction: input.interaction,
      downtime: input.downtime,
      recommendedPlayers: input.recommendedPlayers || [],
      mechanics: input.mechanics || [],
      categories: input.categories || [],
      customTags: input.customTags || [],
      ...(input.playTimeActual !== undefined && { playTimeActual: input.playTimeActual }),
      ...(input.playerCountPlayed !== undefined && { playerCountPlayed: input.playerCountPlayed }),
      pros: input.pros,
      cons: input.cons,
      isPublished: input.isPublished ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const savedReview = await this.reviewRepository.save(review)

    // TODO: 統計更新機能は後で実装
    // await this.gameRepository.updateRatingStatistics(input.gameId)

    return savedReview
  }

  async updateReview(input: UpdateReviewInput): Promise<Review> {
    const { reviewId, updates, userId } = input

    // Get existing review
    const existingReview = await this.reviewRepository.findById(reviewId)
    if (!existingReview) {
      throw new ReviewNotFoundError(reviewId)
    }

    // Check ownership
    if (existingReview.userId !== userId) {
      throw new ForbiddenError('You can only update your own reviews')
    }

    // Validate updates
    if (updates.gameId && updates.gameId !== existingReview.gameId) {
      throw new ValidationError(['Cannot change game ID of existing review'])
    }

    // Apply updates using entity method
    const updatedReview = existingReview.update(updates)
    const savedReview = await this.reviewRepository.update(updatedReview)

    // Update game statistics if rating changed
    if (updates.rating !== undefined || updates.overallScore !== undefined) {
      await this.gameRepository.updateRatingStatistics(existingReview.gameId)
    }

    return savedReview
  }

  async deleteReview(reviewId: number, userId: string): Promise<void> {
    // Get existing review
    const existingReview = await this.reviewRepository.findById(reviewId)
    if (!existingReview) {
      throw new ReviewNotFoundError(reviewId)
    }

    // Check ownership
    if (existingReview.userId !== userId) {
      throw new ForbiddenError('You can only delete your own reviews')
    }

    await this.reviewRepository.delete(reviewId)

    // Update game statistics
    await this.gameRepository.updateRatingStatistics(existingReview.gameId)
  }

  async getReviewById(id: number): Promise<Review> {
    const review = await this.reviewRepository.findById(id)
    if (!review) {
      throw new ReviewNotFoundError(id)
    }
    return review
  }

  async searchReviews(input: SearchReviewsInput): Promise<PaginatedResult<Review>> {
    return await this.reviewRepository.findMany(input.filters)
  }

  async getReviewsByGame(gameId: number, filters?: Omit<ReviewFilters, 'gameId'>): Promise<PaginatedResult<Review>> {
    // Verify game exists
    const game = await this.gameRepository.findById(gameId)
    if (!game) {
      throw new GameNotFoundError(gameId)
    }

    return await this.reviewRepository.findMany({ ...filters, gameId })
  }

  async getReviewsByUser(userId: string, filters?: Omit<ReviewFilters, 'userId'>): Promise<PaginatedResult<Review>> {
    return await this.reviewRepository.findMany({ ...filters, userId })
  }

  async getRecentReviews(limit?: number): Promise<Review[]> {
    return await this.reviewRepository.getRecentReviews(limit)
  }

  async getTopRatedReviews(gameId: number, limit?: number): Promise<Review[]> {
    return await this.reviewRepository.getTopRatedReviews(gameId, limit)
  }

  async publishReview(reviewId: number, userId: string): Promise<Review> {
    return this.updateReview({
      reviewId,
      updates: { isPublished: true },
      userId
    })
  }

  async unpublishReview(reviewId: number, userId: string): Promise<Review> {
    return this.updateReview({
      reviewId,
      updates: { isPublished: false },
      userId
    })
  }

  private async validateCreateReviewInput(input: CreateReviewInput): Promise<void> {
    const errors: string[] = []

    if (!input.title || input.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters')
    }

    if (!input.content || input.content.trim().length < 10) {
      errors.push('Content must be at least 10 characters')
    }

    if (input.rating < 1 || input.rating > 10) {
      errors.push('Rating must be between 1 and 10')
    }

    if (input.overallScore < 1 || input.overallScore > 10) {
      errors.push('Overall score must be between 1 and 10')
    }

    if (input.ruleComplexity < 1 || input.ruleComplexity > 5) {
      errors.push('Rule complexity must be between 1 and 5')
    }

    if (input.luckFactor < 1 || input.luckFactor > 5) {
      errors.push('Luck factor must be between 1 and 5')
    }

    if (input.interaction < 1 || input.interaction > 5) {
      errors.push('Interaction must be between 1 and 5')
    }

    if (input.downtime < 1 || input.downtime > 5) {
      errors.push('Downtime must be between 1 and 5')
    }

    if (errors.length > 0) {
      throw new ValidationError(errors)
    }
  }
}