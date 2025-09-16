/**
 * Review Validation Service - Clean Architecture Domain Layer
 * レビューの重複チェックや品質検証を行うドメインサービス
 */

import { Review } from '../entities/Review'
import { User } from '../entities/User'
import { Game } from '../entities/Game'
import { ReviewRepository } from '../repositories/ReviewRepository'
import { ConflictError } from '../errors/DomainErrors'

export interface ReviewValidationService {
  validateReviewUniqueness(review: Review): Promise<void>
  validateReviewPermissions(review: Review, user: User, game: Game): void
  validateReviewQuality(review: Review): void
  validateReviewConsistency(review: Review): void
}

export class ReviewValidationServiceImpl implements ReviewValidationService {
  constructor(
    private readonly reviewRepository: ReviewRepository
  ) {}

  /**
   * レビューの一意性を検証
   * - 同じユーザーが同じゲームに対して複数のレビューを投稿していないか
   */
  async validateReviewUniqueness(review: Review): Promise<void> {
    const existingReviews = await this.reviewRepository.findByUserAndGame(
      review.userId,
      review.gameId
    )

    // 新規作成の場合
    if (!review.id) {
      if (existingReviews.length > 0) {
        throw new ConflictError('User has already reviewed this game')
      }
      return
    }

    // 更新の場合
    const duplicateReviews = existingReviews.filter(r => r.id !== review.id)
    if (duplicateReviews.length > 0) {
      throw new ConflictError('User has already reviewed this game')
    }
  }

  /**
   * レビューの権限を検証
   */
  validateReviewPermissions(review: Review, user: User, game: Game): void {
    // ユーザーがアクティブかどうか
    if (!user.isActive) {
      throw new ConflictError('Inactive users cannot create or update reviews')
    }

    // メール認証済みかどうか
    if (!user.emailVerified) {
      throw new ConflictError('Email verification required to create reviews')
    }

    // ユーザーIDの一致チェック
    if (review.userId !== user.id) {
      throw new ConflictError('User ID mismatch in review')
    }

    // ゲームIDの一致チェック
    if (review.gameId !== game.id) {
      throw new ConflictError('Game ID mismatch in review')
    }

    // 管理者以外は他人のレビューを編集できない
    if (review.id && review.userId !== user.id && !user.isAdmin) {
      throw new ConflictError('Users can only edit their own reviews')
    }
  }

  /**
   * レビューの品質を検証
   */
  validateReviewQuality(review: Review): void {
    // タイトルの品質チェック
    this.validateTitleQuality(review.title)

    // コンテンツの品質チェック
    this.validateContentQuality(review.content)

    // スパム検出
    this.detectSpamContent(review)

    // 不適切なコンテンツ検出
    this.detectInappropriateContent(review)

    // カスタムタグの品質チェック
    this.validateCustomTags(review.customTags)
  }

  /**
   * レビューの整合性を検証
   */
  validateReviewConsistency(review: Review): void {
    // 評価の整合性チェック
    this.validateRatingsConsistency(review)

    // プレイ体験データの整合性チェック
    this.validatePlayExperienceConsistency(review)

    // Pro/Consの整合性チェック
    this.validateProsConsConsistency(review)

    // 推奨プレイヤー数とゲーム情報の整合性
    this.validateRecommendedPlayersConsistency(review)
  }

  /**
   * タイトルの品質チェック
   */
  private validateTitleQuality(title: string): void {
    // 最小文字数チェック
    if (title.length < 5) {
      throw new ConflictError('Review title should be at least 5 characters for better quality')
    }

    // 全て大文字の禁止
    if (title === title.toUpperCase() && title.length > 10) {
      throw new ConflictError('Review title should not be all uppercase')
    }

    // 連続する同じ文字の禁止
    if (/(.)\1{4,}/.test(title)) {
      throw new ConflictError('Review title contains too many consecutive identical characters')
    }

    // 意味のない文字列の検出
    const meaninglessPatterns = [
      /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/,
      /^([a-zA-Z])\1+$/,
      /^(test|テスト|あああ|いいい)\d*$/i
    ]

    if (meaninglessPatterns.some(pattern => pattern.test(title.trim()))) {
      throw new ConflictError('Review title appears to be meaningless')
    }
  }

  /**
   * コンテンツの品質チェック
   */
  private validateContentQuality(content: string): void {
    // 推奨最小文字数
    if (content.length < 50) {
      throw new ConflictError('Review content should be at least 50 characters for better quality')
    }

    // 単語の重複度チェック
    const words = content.toLowerCase().split(/\s+/)
    const uniqueWords = new Set(words)
    const repetitionRate = 1 - (uniqueWords.size / words.length)

    if (repetitionRate > 0.7 && words.length > 20) {
      throw new ConflictError('Review content has too much repetition')
    }

    // 行の重複チェック
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    const uniqueLines = new Set(lines)

    if (lines.length > 5 && (lines.length - uniqueLines.size) > lines.length * 0.5) {
      throw new ConflictError('Review content has too many duplicate lines')
    }
  }

  /**
   * スパムコンテンツの検出
   */
  private detectSpamContent(review: Review): void {
    const fullText = `${review.title} ${review.content}`.toLowerCase()

    // URLの過度な含有
    const urlMatches = fullText.match(/https?:\/\/[^\s]+/g)
    if (urlMatches && urlMatches.length > 3) {
      throw new ConflictError('Review contains too many URLs')
    }

    // 連絡先情報の検出
    const contactPatterns = [
      /\b\d{3}-\d{4}-\d{4}\b/, // 電話番号
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // メールアドレス
      /line\s*id\s*[:：]\s*\w+/i,
      /twitter\s*[:：]\s*@?\w+/i
    ]

    if (contactPatterns.some(pattern => pattern.test(fullText))) {
      throw new ConflictError('Review cannot contain contact information')
    }

    // 宣伝文句の検出
    const promotionalPatterns = [
      /今すぐ.*購入/,
      /格安.*販売/,
      /限定.*オファー/,
      /無料.*プレゼント/,
      /\d+%\s*off/i,
      /セール.*開催中/
    ]

    if (promotionalPatterns.some(pattern => pattern.test(fullText))) {
      throw new ConflictError('Review appears to contain promotional content')
    }
  }

  /**
   * 不適切なコンテンツの検出
   */
  private detectInappropriateContent(review: Review): void {
    const fullText = `${review.title} ${review.content}`.toLowerCase()

    // 基本的な不適切語句（実際の実装では外部ライブラリを使用することを推奨）
    const inappropriatePatterns = [
      /\b(死ね|殺す|バカ|アホ|クソ)\b/,
      /\b(stupid|idiot|hate)\b/i
    ]

    if (inappropriatePatterns.some(pattern => pattern.test(fullText))) {
      throw new ConflictError('Review contains inappropriate language')
    }

    // 差別的表現の検出（簡易版）
    const discriminatoryPatterns = [
      /人種|宗教|性別.*差別/,
      /.*障害者.*馬鹿/
    ]

    if (discriminatoryPatterns.some(pattern => pattern.test(fullText))) {
      throw new ConflictError('Review may contain discriminatory content')
    }
  }

  /**
   * カスタムタグの品質チェック
   */
  private validateCustomTags(tags: readonly string[]): void {
    for (const tag of tags) {
      if (tag.length < 2) {
        throw new ConflictError('Custom tags must be at least 2 characters')
      }

      if (tag.length > 50) {
        throw new ConflictError('Custom tags must be 50 characters or less')
      }

      // 意味のないタグの検出
      if (/^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(tag)) {
        throw new ConflictError('Custom tags cannot consist only of special characters')
      }
    }

    // 重複タグの検出
    const uniqueTags = new Set(tags.map(tag => tag.toLowerCase()))
    if (uniqueTags.size !== tags.length) {
      throw new ConflictError('Custom tags contain duplicates')
    }
  }

  /**
   * 評価の整合性チェック
   */
  private validateRatingsConsistency(review: Review): void {
    // 極端に高い総合評価なのに詳細評価が低い場合
    if (review.overallScore >= 8) {
      const detailedRatings = [
        review.ruleComplexity,
        review.luckFactor,
        review.interaction,
        review.downtime
      ]

      const lowRatings = detailedRatings.filter(rating => rating <= 2)
      if (lowRatings.length >= 2) {
        throw new ConflictError('High overall score inconsistent with detailed ratings')
      }
    }

    // 極端に低い総合評価なのに詳細評価が高い場合
    if (review.overallScore <= 3) {
      const detailedRatings = [
        review.ruleComplexity,
        review.luckFactor,
        review.interaction,
        review.downtime
      ]

      const highRatings = detailedRatings.filter(rating => rating >= 4)
      if (highRatings.length >= 2) {
        throw new ConflictError('Low overall score inconsistent with detailed ratings')
      }
    }
  }

  /**
   * プレイ体験データの整合性チェック
   */
  private validatePlayExperienceConsistency(review: Review): void {
    // プレイ時間の妥当性
    if (review.playTimeActual) {
      if (review.playTimeActual < 5) {
        throw new ConflictError('Actual play time seems too short (less than 5 minutes)')
      }

      if (review.playTimeActual > 480) { // 8 hours
        throw new ConflictError('Actual play time seems too long (more than 8 hours)')
      }
    }

    // プレイ人数の妥当性
    if (review.playerCountPlayed) {
      if (review.playerCountPlayed < 1) {
        throw new ConflictError('Player count played must be at least 1')
      }

      if (review.playerCountPlayed > 20) {
        throw new ConflictError('Player count played seems too high (more than 20)')
      }
    }
  }

  /**
   * Pro/Consの整合性チェック
   */
  private validateProsConsConsistency(review: Review): void {
    if (review.pros && review.cons) {
      // 同じ内容がprosとconsに含まれていないか
      const prosLower = review.pros.map(pro => pro.toLowerCase().trim())
      const consLower = review.cons.map(con => con.toLowerCase().trim())

      for (const pro of prosLower) {
        if (consLower.includes(pro)) {
          throw new ConflictError('Same content cannot appear in both pros and cons')
        }
      }

      // 矛盾する内容の検出（簡易版）
      const contradictions = [
        { pro: 'simple', con: 'complex' },
        { pro: 'fast', con: 'slow' },
        { pro: 'easy', con: 'difficult' },
        { pro: '簡単', con: '難しい' },
        { pro: '早い', con: '遅い' }
      ]

      for (const { pro, con } of contradictions) {
        const hasPro = prosLower.some(p => p.includes(pro))
        const hasCon = consLower.some(c => c.includes(con))

        if (hasPro && hasCon) {
          throw new ConflictError(`Contradictory statements found: "${pro}" in pros and "${con}" in cons`)
        }
      }
    }

    // 極端に評価が高いのにprosが少ない、またはconsが多い場合
    if (review.overallScore >= 8) {
      if (review.pros && review.pros.length === 0) {
        throw new ConflictError('High rating should include some positive aspects (pros)')
      }

      if (review.cons && review.cons.length > (review.pros?.length || 0)) {
        throw new ConflictError('High rating with more cons than pros seems inconsistent')
      }
    }

    // 極端に評価が低いのにconsが少ない、またはprosが多い場合
    if (review.overallScore <= 3) {
      if (review.cons && review.cons.length === 0) {
        throw new ConflictError('Low rating should include some negative aspects (cons)')
      }

      if (review.pros && review.pros.length > (review.cons?.length || 0)) {
        throw new ConflictError('Low rating with more pros than cons seems inconsistent')
      }
    }
  }

  /**
   * 推奨プレイヤー数の整合性チェック
   */
  private validateRecommendedPlayersConsistency(review: Review): void {
    // 推奨プレイヤー数の重複チェック
    const uniqueRecommended = new Set(review.recommendedPlayers)
    if (uniqueRecommended.size !== review.recommendedPlayers.length) {
      throw new ConflictError('Recommended players contain duplicates')
    }

    // 実際にプレイした人数が推奨に含まれているか（警告レベル）
    if (review.playerCountPlayed && review.recommendedPlayers.length > 0) {
      const playedCountStr = review.playerCountPlayed.toString()
      if (!review.recommendedPlayers.includes(playedCountStr)) {
        // これは厳密な検証ではなく、ログ出力程度に留めることも可能
        console.warn(`Player count played (${review.playerCountPlayed}) not in recommended players`)
      }
    }
  }
}