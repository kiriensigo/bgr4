import { Game } from '@/domain/entities/Game'
import { Review } from '@/domain/entities/Review'

// Frontend expected interface for PopularGame
export interface PopularGameResponse {
  id: number
  name: string
  japanese_name?: string | undefined
  year_published?: number | undefined
  min_players?: number | undefined
  max_players?: number | undefined
  playing_time?: number | undefined
  image_url?: string | undefined
  mechanics?: string[] | undefined
  categories?: string[] | undefined
  stats: {
    review_count: number
    avg_rating: number
    review_avg: number | null
    popularity_score: number
  }
}

// Frontend expected interface for Review
export interface ReviewResponse {
  id: number | undefined
  user_id: string
  game_id: number
  title: string
  content: string
  rating?: number | undefined
  overallScore: number
  pros?: string[] | undefined
  cons?: string[] | undefined
  ruleComplexity?: number | undefined
  luckFactor?: number | undefined
  gameLength?: number | undefined
  replayability?: number | undefined
  is_published: boolean
  created_at: string
  updated_at?: string | undefined
  userId: string
  gameId: number
  createdAt: string
  updatedAt?: string | undefined
}

export class PresentationAdapter {
  /**
   * Convert Domain Game Entity to PopularGame response format
   */
  static gameToPopularGameResponse(game: Game): PopularGameResponse {
    return {
      id: game.id!,
      name: game.name,
      japanese_name: game.japaneseName || undefined,
      year_published: game.yearPublished || undefined,
      min_players: game.minPlayers || undefined,
      max_players: game.maxPlayers || undefined,
      playing_time: game.playingTime || undefined,
      image_url: game.imageUrl || undefined,
      mechanics: game.getDisplayMechanics().length > 0 ? [...game.getDisplayMechanics()] : undefined,
      categories: game.getDisplayCategories().length > 0 ? [...game.getDisplayCategories()] : undefined,
      stats: {
        review_count: game.reviewStats?.review_count || 0,
        avg_rating: game.ratingAverage || 0,
        review_avg: game.reviewStats?.overall_avg || null,
        popularity_score: this.calculatePopularityScore(game)
      }
    }
  }

  /**
   * Convert Domain Review Entity to Review response format
   */
  static reviewToResponse(review: Review): ReviewResponse {
    return {
      // Legacy snake_case properties for backward compatibility
      id: review.id,
      user_id: review.userId,
      game_id: review.gameId,
      title: review.title,
      content: review.content,
      rating: review.rating || undefined,
      overallScore: review.overallScore,
      pros: review.pros ? [...review.pros] : undefined,
      cons: review.cons ? [...review.cons] : undefined,
      ruleComplexity: review.ruleComplexity || undefined,
      luckFactor: review.luckFactor || undefined,
      gameLength: review.playTimeActual || undefined,
      replayability: undefined, // Not in Review entity
      is_published: review.isPublished,
      created_at: review.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: review.updatedAt?.toISOString() || undefined,
      
      // Modern camelCase properties
      userId: review.userId,
      gameId: review.gameId,
      createdAt: review.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: review.updatedAt?.toISOString() || undefined
    }
  }

  /**
   * Calculate popularity score based on review count and average rating
   */
  private static calculatePopularityScore(game: Game): number {
    const reviewCount = game.reviewStats?.review_count || 0
    const avgRating = game.ratingAverage || 0
    
    // Weight: 30% review count, 70% average rating
    const reviewWeight = Math.min(reviewCount / 10, 1) * 0.3
    const ratingWeight = (avgRating / 10) * 0.7
    
    return (reviewWeight + ratingWeight) * 10
  }
}