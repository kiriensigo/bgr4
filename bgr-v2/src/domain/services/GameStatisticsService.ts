/**
 * Game Statistics Service - Clean Architecture Domain Layer
 * ゲームの統計情報計算と分析を行うドメインサービス
 */

import { Game } from '../entities/Game'
import { Review } from '../entities/Review'
import { ReviewRepository } from '../repositories/ReviewRepository'

export interface GameStatistics {
  gameId: number
  reviewCount: number
  averageOverallScore: number
  averageRuleComplexity: number
  averageLuckFactor: number
  averageInteraction: number
  averageDowntime: number
  mostRecommendedPlayerCounts: PlayerCountRecommendation[]
  popularMechanics: FeatureCount[]
  popularCategories: FeatureCount[]
  ratingDistribution: RatingDistribution
  playTimeAnalysis: PlayTimeAnalysis
  qualityMetrics: QualityMetrics
}

export interface PlayerCountRecommendation {
  playerCount: string
  recommendationCount: number
  percentage: number
}

export interface FeatureCount {
  feature: string
  count: number
  percentage: number
}

export interface RatingDistribution {
  excellent: number // 8-10
  good: number      // 6-7
  average: number   // 4-5
  poor: number      // 1-3
}

export interface PlayTimeAnalysis {
  averageActualPlayTime?: number
  playTimeVariance?: number
  quickPlayRecommendations: number // Reviews recommending quick play
}

export interface QualityMetrics {
  averageReviewQuality: number
  detailedReviewsCount: number
  experiencedReviewsCount: number // Reviews with play experience data
}

export interface GameStatisticsService {
  calculateGameStatistics(game: Game): Promise<GameStatistics>
  calculateGameAverageRating(gameId: number): Promise<number>
  getTopRatedGames(limit: number): Promise<Array<{ game: Game; averageRating: number }>>
  getMostReviewedGames(limit: number): Promise<Array<{ game: Game; reviewCount: number }>>
  getRecommendedPlayerCountDistribution(gameId: number): Promise<PlayerCountRecommendation[]>
}

export class GameStatisticsServiceImpl implements GameStatisticsService {
  constructor(
    private readonly reviewRepository: ReviewRepository
  ) {}

  /**
   * ゲームの統計情報を計算
   */
  async calculateGameStatistics(game: Game): Promise<GameStatistics> {
    const reviews = await this.reviewRepository.findByGameId(game.id!)
    const publishedReviews = reviews.filter(review => review.isPublished)

    if (publishedReviews.length === 0) {
      return this.createEmptyStatistics(game.id!)
    }

    return {
      gameId: game.id!,
      reviewCount: publishedReviews.length,
      averageOverallScore: this.calculateAverageOverallScore(publishedReviews),
      averageRuleComplexity: this.calculateFieldAverageRating(publishedReviews, 'ruleComplexity'),
      averageLuckFactor: this.calculateFieldAverageRating(publishedReviews, 'luckFactor'),
      averageInteraction: this.calculateFieldAverageRating(publishedReviews, 'interaction'),
      averageDowntime: this.calculateFieldAverageRating(publishedReviews, 'downtime'),
      mostRecommendedPlayerCounts: this.calculatePlayerCountRecommendations(publishedReviews),
      popularMechanics: this.calculateFeatureCounts(publishedReviews, 'mechanics'),
      popularCategories: this.calculateFeatureCounts(publishedReviews, 'categories'),
      ratingDistribution: this.calculateRatingDistribution(publishedReviews),
      playTimeAnalysis: this.calculatePlayTimeAnalysis(publishedReviews),
      qualityMetrics: this.calculateQualityMetrics(publishedReviews)
    }
  }

  /**
   * ゲームの平均評価を計算
   */
  async calculateGameAverageRating(gameId: number): Promise<number> {
    const reviews = await this.reviewRepository.findByGameId(gameId)
    const publishedReviews = reviews.filter(review => review.isPublished)

    if (publishedReviews.length === 0) {
      return 0
    }

    return this.calculateAverageOverallScore(publishedReviews)
  }

  /**
   * 高評価ゲーム一覧を取得
   */
  async getTopRatedGames(limit: number): Promise<Array<{ game: Game; averageRating: number }>> {
    // この実装では、全ゲームの評価を計算して上位を取得
    // 実際のプロダクションでは、事前計算済みの統計テーブルを使用することを推奨
    const games = await this.getAllGamesWithRatings()
    
    return games
      .filter(item => item.averageRating > 0) // レビューがないゲームを除外
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit)
  }

  /**
   * レビュー数が多いゲーム一覧を取得
   */
  async getMostReviewedGames(limit: number): Promise<Array<{ game: Game; reviewCount: number }>> {
    const games = await this.getAllGamesWithReviewCounts()
    
    return games
      .filter(item => item.reviewCount > 0)
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, limit)
  }

  /**
   * 推奨プレイヤー数の分布を取得
   */
  async getRecommendedPlayerCountDistribution(gameId: number): Promise<PlayerCountRecommendation[]> {
    const reviews = await this.reviewRepository.findByGameId(gameId)
    const publishedReviews = reviews.filter(review => review.isPublished)

    return this.calculatePlayerCountRecommendations(publishedReviews)
  }

  /**
   * 空の統計情報を作成
   */
  private createEmptyStatistics(gameId: number): GameStatistics {
    return {
      gameId,
      reviewCount: 0,
      averageOverallScore: 0,
      averageRuleComplexity: 0,
      averageLuckFactor: 0,
      averageInteraction: 0,
      averageDowntime: 0,
      mostRecommendedPlayerCounts: [],
      popularMechanics: [],
      popularCategories: [],
      ratingDistribution: { excellent: 0, good: 0, average: 0, poor: 0 },
      playTimeAnalysis: { quickPlayRecommendations: 0 },
      qualityMetrics: {
        averageReviewQuality: 0,
        detailedReviewsCount: 0,
        experiencedReviewsCount: 0
      }
    }
  }

  /**
   * 平均総合評価を計算
   */
  private calculateAverageOverallScore(reviews: Review[]): number {
    if (reviews.length === 0) return 0

    const sum = reviews.reduce((total, review) => total + review.overallScore, 0)
    return Math.round((sum / reviews.length) * 10) / 10 // 小数点1桁で四捨五入
  }

  /**
   * 指定フィールドの平均評価を計算
   */
  private calculateFieldAverageRating(reviews: Review[], field: keyof Review): number {
    if (reviews.length === 0) return 0

    const validReviews = reviews.filter(review => {
      const value = review[field]
      return typeof value === 'number' && value > 0
    })

    if (validReviews.length === 0) return 0

    const sum = validReviews.reduce((total, review) => {
      const value = review[field] as number
      return total + value
    }, 0)

    return Math.round((sum / validReviews.length) * 10) / 10
  }

  /**
   * プレイヤー数推奨の計算
   */
  private calculatePlayerCountRecommendations(reviews: Review[]): PlayerCountRecommendation[] {
    const countMap = new Map<string, number>()

    reviews.forEach(review => {
      review.recommendedPlayers.forEach(playerCount => {
        countMap.set(playerCount, (countMap.get(playerCount) || 0) + 1)
      })
    })

    const totalRecommendations = Array.from(countMap.values()).reduce((sum, count) => sum + count, 0)

    return Array.from(countMap.entries())
      .map(([playerCount, count]) => ({
        playerCount,
        recommendationCount: count,
        percentage: Math.round((count / totalRecommendations) * 100)
      }))
      .sort((a, b) => b.recommendationCount - a.recommendationCount)
  }

  /**
   * 特徴の人気度計算（メカニクス・カテゴリー）
   */
  private calculateFeatureCounts(reviews: Review[], field: 'mechanics' | 'categories'): FeatureCount[] {
    const countMap = new Map<string, number>()

    reviews.forEach(review => {
      const features = review[field] as readonly string[]
      features.forEach(feature => {
        countMap.set(feature, (countMap.get(feature) || 0) + 1)
      })
    })

    const totalMentions = Array.from(countMap.values()).reduce((sum, count) => sum + count, 0)

    return Array.from(countMap.entries())
      .map(([feature, count]) => ({
        feature,
        count,
        percentage: Math.round((count / totalMentions) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // 上位10位まで
  }

  /**
   * 評価分布の計算
   */
  private calculateRatingDistribution(reviews: Review[]): RatingDistribution {
    const distribution = { excellent: 0, good: 0, average: 0, poor: 0 }

    reviews.forEach(review => {
      if (review.overallScore >= 8) {
        distribution.excellent++
      } else if (review.overallScore >= 6) {
        distribution.good++
      } else if (review.overallScore >= 4) {
        distribution.average++
      } else {
        distribution.poor++
      }
    })

    return distribution
  }

  /**
   * プレイ時間分析の計算
   */
  private calculatePlayTimeAnalysis(reviews: Review[]): PlayTimeAnalysis {
    const reviewsWithPlayTime = reviews.filter(review => review.playTimeActual)
    
    let averageActualPlayTime: number | undefined
    let playTimeVariance: number | undefined
    
    if (reviewsWithPlayTime.length > 0) {
      const playTimes = reviewsWithPlayTime.map(review => review.playTimeActual!)
      const sum = playTimes.reduce((total, time) => total + time, 0)
      averageActualPlayTime = Math.round(sum / playTimes.length)

      // 分散の計算
      const variance = playTimes.reduce((total, time) => {
        const diff = time - averageActualPlayTime!
        return total + (diff * diff)
      }, 0) / playTimes.length
      
      playTimeVariance = Math.round(Math.sqrt(variance))
    }

    // クイックプレイ推奨の計算（30分以下の実プレイ時間）
    const quickPlayRecommendations = reviewsWithPlayTime.filter(
      review => review.playTimeActual! <= 30
    ).length

    return {
      averageActualPlayTime,
      playTimeVariance,
      quickPlayRecommendations
    }
  }

  /**
   * 品質メトリクスの計算
   */
  private calculateQualityMetrics(reviews: Review[]): QualityMetrics {
    let totalQuality = 0
    let detailedReviewsCount = 0
    let experiencedReviewsCount = 0

    reviews.forEach(review => {
      // レビュー品質スコア（Entityから取得）
      totalQuality += review.getQualityScore()

      // 詳細レビュー（詳細評価を含む）
      if (review.hasDetailedRatings()) {
        detailedReviewsCount++
      }

      // 経験レビュー（実プレイ情報を含む）
      if (review.hasPlayExperience()) {
        experiencedReviewsCount++
      }
    })

    const averageReviewQuality = reviews.length > 0 
      ? Math.round((totalQuality / reviews.length) * 10) / 10 
      : 0

    return {
      averageReviewQuality,
      detailedReviewsCount,
      experiencedReviewsCount
    }
  }

  /**
   * 全ゲームの評価情報を取得（実装は簡略化）
   */
  private async getAllGamesWithRatings(): Promise<Array<{ game: Game; averageRating: number }>> {
    // 実際の実装では、GameRepositoryとの連携が必要
    // ここでは概念的な実装のみ
    throw new Error('Not implemented - requires GameRepository integration')
  }

  /**
   * 全ゲームのレビュー数情報を取得（実装は簡略化）
   */
  private async getAllGamesWithReviewCounts(): Promise<Array<{ game: Game; reviewCount: number }>> {
    // 実際の実装では、GameRepositoryとの連携が必要
    // ここでは概念的な実装のみ
    throw new Error('Not implemented - requires GameRepository integration')
  }
}