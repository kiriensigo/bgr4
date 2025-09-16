import { describe, it, expect, beforeEach } from '@jest/globals'
import { registerTestServices, getTestReviewUseCase, getTestGameRepository } from '@/application/container'
import { ReviewUseCaseImpl } from '@/application/usecases/ReviewUseCaseImpl'
import { 
  ValidationError, 
  ReviewNotFoundError, 
  GameNotFoundError,
  ForbiddenError
} from '@/domain/errors/DomainErrors'

describe('ReviewUseCase', () => {
  let reviewUseCase: ReviewUseCaseImpl
  let gameId: number
  
  beforeEach(async () => {
    registerTestServices()
    reviewUseCase = getTestReviewUseCase() as ReviewUseCaseImpl
    
    // Create a test game
    const gameRepo = getTestGameRepository()
    const game = await gameRepo.save({
      bgg_id: 'test-game-1',
      name: 'Test Game for Reviews',
      japanese_name: 'テストレビューゲーム',
      min_players: 2,
      max_players: 4,
      site_categories: ['戦略'],
      site_mechanics: ['ワカプレ'],
      site_publishers: [],
      bgg_categories: ['Strategy Game'],
      bgg_mechanics: ['Worker Placement'],
      bgg_publishers: [],
      categories: ['戦略'],
      mechanics: ['ワカプレ'],
      publishers: [],
      designers: [],
      rating_count: 0
    })
    gameId = game.id
  })

  describe('createReview', () => {
    it('should create review with valid input', async () => {
      const input = {
        title: 'Great game with excellent mechanics',
        content: 'This game provides an excellent strategic experience with minimal luck factor.',
        rating: 8,
        overallScore: 8,
        ruleComplexity: 3,
        luckFactor: 2,
        interaction: 4,
        downtime: 2,
        recommendedPlayers: ['3', '4'],
        mechanics: ['ワカプレ', 'セット収集'],
        categories: ['戦略'],
        customTags: ['初心者OK'],
        playTimeActual: 90,
        playerCountPlayed: 3,
        pros: ['戦略的思考が楽しい', '綺麗なアートワーク'],
        cons: ['セットアップが長い'],
        gameId,
        userId: 'user-123',
        isPublished: true
      }

      const result = await reviewUseCase.createReview(input)

      expect(result).toHaveProperty('id')
      expect(result.title).toBe(input.title)
      expect(result.content).toBe(input.content)
      expect(result.rating).toBe(input.rating)
      expect(result.user_id).toBe(input.userId)
      expect(result.game_id).toBe(input.gameId)
    })

    it('should throw ValidationError for invalid input', async () => {
      const input = {
        title: '短い', // Too short
        content: '短い', // Too short
        rating: 11,     // Invalid rating
        overallScore: 0, // Invalid score
        ruleComplexity: 6, // Invalid complexity
        luckFactor: 0,     // Invalid factor
        interaction: 6,    // Invalid interaction
        downtime: 0,       // Invalid downtime
        recommendedPlayers: [],
        mechanics: [],
        categories: [],
        customTags: [],
        pros: [],
        cons: [],
        gameId,
        userId: 'user-123'
      }

      await expect(reviewUseCase.createReview(input))
        .rejects
        .toThrow(ValidationError)
    })

    it('should throw GameNotFoundError for non-existent game', async () => {
      const input = {
        title: 'Valid review title',
        content: 'This is a valid review content that is long enough.',
        rating: 8,
        overallScore: 8,
        ruleComplexity: 3,
        luckFactor: 2,
        interaction: 4,
        downtime: 2,
        recommendedPlayers: [],
        mechanics: [],
        categories: [],
        customTags: [],
        pros: [],
        cons: [],
        gameId: 999999, // Non-existent game
        userId: 'user-123'
      }

      await expect(reviewUseCase.createReview(input))
        .rejects
        .toThrow(GameNotFoundError)
    })
  })

  describe('updateReview', () => {
    it('should update review with valid input', async () => {
      // Create review first
      const createInput = {
        title: 'Original Review',
        content: 'Original content that is long enough for validation.',
        rating: 7,
        overallScore: 7,
        ruleComplexity: 3,
        luckFactor: 2,
        interaction: 4,
        downtime: 2,
        recommendedPlayers: [],
        mechanics: [],
        categories: [],
        customTags: [],
        pros: [],
        cons: [],
        gameId,
        userId: 'user-123'
      }
      
      const createdReview = await reviewUseCase.createReview(createInput)

      // Update the review
      const updateInput = {
        reviewId: createdReview.id,
        updates: {
          title: 'Updated Review Title',
          rating: 9
        },
        userId: 'user-123'
      }

      const result = await reviewUseCase.updateReview(updateInput)

      expect(result.title).toBe('Updated Review Title')
      expect(result.rating).toBe(9)
      expect(result.id).toBe(createdReview.id)
    })

    it('should throw ForbiddenError when user tries to update other user\'s review', async () => {
      // Create review as user-123
      const createInput = {
        title: 'User 123 Review',
        content: 'This review belongs to user 123 and should not be editable by others.',
        rating: 7,
        overallScore: 7,
        ruleComplexity: 3,
        luckFactor: 2,
        interaction: 4,
        downtime: 2,
        recommendedPlayers: [],
        mechanics: [],
        categories: [],
        customTags: [],
        pros: [],
        cons: [],
        gameId,
        userId: 'user-123'
      }
      
      const createdReview = await reviewUseCase.createReview(createInput)

      // Try to update as different user
      const updateInput = {
        reviewId: createdReview.id,
        updates: { title: 'Hacked title' },
        userId: 'user-456' // Different user
      }

      await expect(reviewUseCase.updateReview(updateInput))
        .rejects
        .toThrow(ForbiddenError)
    })

    it('should throw ReviewNotFoundError for non-existent review', async () => {
      const updateInput = {
        reviewId: 999999,
        updates: { title: 'New title' },
        userId: 'user-123'
      }

      await expect(reviewUseCase.updateReview(updateInput))
        .rejects
        .toThrow(ReviewNotFoundError)
    })
  })

  describe('deleteReview', () => {
    it('should delete review successfully', async () => {
      // Create review first
      const createInput = {
        title: 'Review to Delete',
        content: 'This review will be deleted in the test case.',
        rating: 6,
        overallScore: 6,
        ruleComplexity: 3,
        luckFactor: 2,
        interaction: 4,
        downtime: 2,
        recommendedPlayers: [],
        mechanics: [],
        categories: [],
        customTags: [],
        pros: [],
        cons: [],
        gameId,
        userId: 'user-123'
      }
      
      const createdReview = await reviewUseCase.createReview(createInput)

      // Delete the review
      await expect(reviewUseCase.deleteReview(createdReview.id, 'user-123'))
        .resolves
        .toBeUndefined()

      // Verify review is deleted
      await expect(reviewUseCase.getReviewById(createdReview.id))
        .rejects
        .toThrow(ReviewNotFoundError)
    })

    it('should throw ForbiddenError when user tries to delete other user\'s review', async () => {
      // Create review as user-123
      const createInput = {
        title: 'Protected Review',
        content: 'This review should not be deletable by other users.',
        rating: 7,
        overallScore: 7,
        ruleComplexity: 3,
        luckFactor: 2,
        interaction: 4,
        downtime: 2,
        recommendedPlayers: [],
        mechanics: [],
        categories: [],
        customTags: [],
        pros: [],
        cons: [],
        gameId,
        userId: 'user-123'
      }
      
      const createdReview = await reviewUseCase.createReview(createInput)

      // Try to delete as different user
      await expect(reviewUseCase.deleteReview(createdReview.id, 'user-456'))
        .rejects
        .toThrow(ForbiddenError)
    })
  })

  describe('searchReviews', () => {
    it('should return paginated results', async () => {
      // Create multiple reviews
      for (let i = 1; i <= 3; i++) {
        await reviewUseCase.createReview({
          title: `Review ${i}`,
          content: `Content for review ${i} with sufficient length for validation.`,
          rating: 7 + i,
          overallScore: 7 + i,
          ruleComplexity: 3,
          luckFactor: 2,
          interaction: 4,
          downtime: 2,
          recommendedPlayers: [],
          mechanics: [],
          categories: [],
          customTags: [],
          pros: [],
          cons: [],
          gameId,
          userId: `user-${i}`,
          isPublished: true
        })
      }

      const result = await reviewUseCase.searchReviews({
        filters: {
          page: 1,
          limit: 2,
          gameId
        }
      })

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(3)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(2)
      expect(result.totalPages).toBe(2)
    })
  })

  describe('publishReview / unpublishReview', () => {
    it('should toggle review publication status', async () => {
      // Create unpublished review
      const createInput = {
        title: 'Draft Review',
        content: 'This is a draft review that will be published later.',
        rating: 8,
        overallScore: 8,
        ruleComplexity: 3,
        luckFactor: 2,
        interaction: 4,
        downtime: 2,
        recommendedPlayers: [],
        mechanics: [],
        categories: [],
        customTags: [],
        pros: [],
        cons: [],
        gameId,
        userId: 'user-123',
        isPublished: false
      }
      
      const createdReview = await reviewUseCase.createReview(createInput)
      expect(createdReview.is_published).toBe(false)

      // Publish review
      const publishedReview = await reviewUseCase.publishReview(createdReview.id, 'user-123')
      expect(publishedReview.is_published).toBe(true)

      // Unpublish review
      const unpublishedReview = await reviewUseCase.unpublishReview(createdReview.id, 'user-123')
      expect(unpublishedReview.is_published).toBe(false)
    })
  })
})