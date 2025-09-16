/**
 * Review Entity - Clean Architecture Domain Layer
 * レビューのビジネスルールと制約を含むエンティティ
 */

import { ValidationError } from '../errors/DomainErrors'

export interface ReviewProps {
  readonly id?: number
  readonly userId: string
  readonly gameId: number
  readonly title: string
  readonly content: string
  readonly overallScore: number // 1-10
  readonly rating?: number // Legacy compatibility
  readonly ruleComplexity: number // 1-5
  readonly luckFactor: number // 1-5
  readonly interaction: number // 1-5
  readonly downtime: number // 1-5
  readonly recommendedPlayers: readonly string[]
  readonly mechanics: readonly string[]
  readonly categories: readonly string[]
  readonly customTags: readonly string[]
  readonly playTimeActual?: number // minutes
  readonly playerCountPlayed?: number
  readonly pros?: readonly string[]
  readonly cons?: readonly string[]
  readonly isPublished: boolean
  readonly createdAt?: Date
  readonly updatedAt?: Date
}

export class Review {
  private readonly _id?: number
  private readonly _userId: string
  private readonly _gameId: number
  private readonly _title: string
  private readonly _content: string
  private readonly _overallScore: number
  private readonly _rating?: number
  private readonly _ruleComplexity: number
  private readonly _luckFactor: number
  private readonly _interaction: number
  private readonly _downtime: number
  private readonly _recommendedPlayers: readonly string[]
  private readonly _mechanics: readonly string[]
  private readonly _categories: readonly string[]
  private readonly _customTags: readonly string[]
  private readonly _playTimeActual?: number
  private readonly _playerCountPlayed?: number
  private readonly _pros?: readonly string[]
  private readonly _cons?: readonly string[]
  private readonly _isPublished: boolean
  private readonly _createdAt?: Date
  private readonly _updatedAt?: Date

  constructor(props: ReviewProps) {
    this.validateProps(props)
    
    this._id = props.id
    this._userId = props.userId
    this._gameId = props.gameId
    this._title = props.title.trim()
    this._content = props.content ? props.content.trim() : ''
    this._overallScore = props.overallScore
    this._rating = props.rating ?? props.overallScore // Legacy compatibility
    this._ruleComplexity = props.ruleComplexity
    this._luckFactor = props.luckFactor
    this._interaction = props.interaction
    this._downtime = props.downtime
    this._recommendedPlayers = [...props.recommendedPlayers]
    this._mechanics = [...props.mechanics]
    this._categories = [...props.categories]
    this._customTags = [...props.customTags]
    this._playTimeActual = props.playTimeActual
    this._playerCountPlayed = props.playerCountPlayed
    this._pros = props.pros ? [...props.pros] : undefined
    this._cons = props.cons ? [...props.cons] : undefined
    this._isPublished = props.isPublished
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
  }

  private validateProps(props: ReviewProps): void {
    // Required fields validation
    if (!props.userId || props.userId.trim().length === 0) {
      throw new ValidationError(['User ID is required'])
    }

    if (!props.gameId || props.gameId <= 0) {
      throw new ValidationError(['Valid game ID is required'])
    }

    if (!props.title || props.title.trim().length === 0) {
      throw new ValidationError(['Review title is required'])
    }

    if (props.title.trim().length > 200) {
      throw new ValidationError(['Review title must be 200 characters or less'])
    }

    // Allow empty content for rating-only reviews
    // Content validation is optional to support various review types

    if (props.content && props.content.trim().length > 10000) {
      throw new ValidationError(['Review content must be 10000 characters or less'])
    }

    // Rating validations - overall score can be decimal, others are integers
    if (typeof props.overallScore !== 'number' || props.overallScore < 1 || props.overallScore > 10) {
      throw new ValidationError(['Overall score must be a number between 1 and 10'])
    }

    if (!Number.isInteger(props.ruleComplexity) || props.ruleComplexity < 1 || props.ruleComplexity > 5) {
      throw new ValidationError(['Rule complexity must be an integer between 1 and 5'])
    }

    if (!Number.isInteger(props.luckFactor) || props.luckFactor < 1 || props.luckFactor > 5) {
      throw new ValidationError(['Luck factor must be an integer between 1 and 5'])
    }

    if (!Number.isInteger(props.interaction) || props.interaction < 1 || props.interaction > 5) {
      throw new ValidationError(['Interaction must be an integer between 1 and 5'])
    }

    if (!Number.isInteger(props.downtime) || props.downtime < 1 || props.downtime > 5) {
      throw new ValidationError(['Downtime must be an integer between 1 and 5'])
    }

    // Optional field validations
    if (props.playTimeActual && (props.playTimeActual < 1 || props.playTimeActual > 1440)) {
      throw new ValidationError(['Actual play time must be between 1 and 1440 minutes'])
    }

    if (props.playerCountPlayed && (props.playerCountPlayed < 1 || props.playerCountPlayed > 20)) {
      throw new ValidationError(['Player count played must be between 1 and 20'])
    }

    // Array length validations
    if (props.customTags.length > 10) {
      throw new ValidationError(['Cannot have more than 10 custom tags'])
    }

    if (props.pros && props.pros.length > 10) {
      throw new ValidationError(['Cannot have more than 10 pros'])
    }

    if (props.cons && props.cons.length > 10) {
      throw new ValidationError(['Cannot have more than 10 cons'])
    }

    // String content validations - handle pros and cons arrays properly
    if (props.pros && Array.isArray(props.pros) && props.pros.some(pro => typeof pro === 'string' && (pro.trim().length === 0 || pro.trim().length > 200))) {
      throw new ValidationError(['Each pro must be between 1 and 200 characters'])
    }

    if (props.cons && Array.isArray(props.cons) && props.cons.some(con => typeof con === 'string' && (con.trim().length === 0 || con.trim().length > 200))) {
      throw new ValidationError(['Each con must be between 1 and 200 characters'])
    }

    if (props.customTags.some(tag => tag.trim().length === 0 || tag.trim().length > 50)) {
      throw new ValidationError(['Each custom tag must be between 1 and 50 characters'])
    }
  }

  // Getters
  get id(): number | undefined { return this._id }
  get userId(): string { return this._userId }
  get gameId(): number { return this._gameId }
  get title(): string { return this._title }
  get content(): string { return this._content }
  get overallScore(): number { return this._overallScore }
  get rating(): number | undefined { return this._rating }
  get ruleComplexity(): number { return this._ruleComplexity }
  get luckFactor(): number { return this._luckFactor }
  get interaction(): number { return this._interaction }
  get downtime(): number { return this._downtime }
  get recommendedPlayers(): readonly string[] { return this._recommendedPlayers }
  get mechanics(): readonly string[] { return this._mechanics }
  get categories(): readonly string[] { return this._categories }
  get customTags(): readonly string[] { return this._customTags }
  get playTimeActual(): number | undefined { return this._playTimeActual }
  get playerCountPlayed(): number | undefined { return this._playerCountPlayed }
  get pros(): readonly string[] | undefined { return this._pros }
  get cons(): readonly string[] | undefined { return this._cons }
  get isPublished(): boolean { return this._isPublished }
  get createdAt(): Date | undefined { return this._createdAt }
  get updatedAt(): Date | undefined { return this._updatedAt }

  // Business Logic Methods

  /**
   * レビューの総合品質スコア（1-5）を計算
   * タイトル、内容、詳細評価の充実度に基づく
   */
  getQualityScore(): number {
    let score = 0
    let maxScore = 0

    // Title quality (20%)
    maxScore += 1
    if (this._title.length >= 10) score += 0.5
    if (this._title.length >= 20) score += 0.5

    // Content quality (40%)
    maxScore += 2
    if (this._content.length >= 100) score += 0.5
    if (this._content.length >= 500) score += 0.5
    if (this._content.length >= 1000) score += 0.5
    if (this._content.length >= 2000) score += 0.5

    // Feature completeness (40%)
    maxScore += 2
    if (this._recommendedPlayers.length > 0) score += 0.3
    if (this._mechanics.length > 0) score += 0.3
    if (this._categories.length > 0) score += 0.3
    if (this._playTimeActual !== undefined) score += 0.3
    if (this._playerCountPlayed !== undefined) score += 0.3
    if (this._pros && this._pros.length > 0) score += 0.25
    if (this._cons && this._cons.length > 0) score += 0.25

    // Normalize to 1-5 scale
    const normalizedScore = (score / maxScore) * 4 + 1
    return Math.min(5, Math.max(1, Math.round(normalizedScore * 10) / 10))
  }

  /**
   * レビューが詳細評価を含むかどうか
   */
  hasDetailedRatings(): boolean {
    return this._ruleComplexity !== undefined && 
           this._luckFactor !== undefined && 
           this._interaction !== undefined && 
           this._downtime !== undefined
  }

  /**
   * レビューが実プレイ情報を含むかどうか
   */
  hasPlayExperience(): boolean {
    return this._playTimeActual !== undefined || this._playerCountPlayed !== undefined
  }

  /**
   * レビューがゲーム特徴を含むかどうか
   */
  hasGameFeatures(): boolean {
    return this._mechanics.length > 0 || 
           this._categories.length > 0 || 
           this._recommendedPlayers.length > 0
  }

  /**
   * レビューの推定読了時間（分）を計算
   */
  getEstimatedReadingTime(): number {
    const wordsPerMinute = 200 // 日本語の平均読速
    const wordCount = this._content.length / 2 // 日本語では文字数の半分を単語数と仮定
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
  }

  /**
   * レビューがポジティブかどうか判定
   */
  isPositive(): boolean {
    return this._overallScore >= 7
  }

  /**
   * レビューがネガティブかどうか判定
   */
  isNegative(): boolean {
    return this._overallScore <= 4
  }

  /**
   * レビューがニュートラルかどうか判定
   */
  isNeutral(): boolean {
    return this._overallScore >= 5 && this._overallScore <= 6
  }

  /**
   * 公開状態を変更
   */
  publish(): Review {
    return new Review({
      ...this.toProps(),
      isPublished: true,
      updatedAt: new Date()
    })
  }

  /**
   * 非公開状態に変更
   */
  unpublish(): Review {
    return new Review({
      ...this.toProps(),
      isPublished: false,
      updatedAt: new Date()
    })
  }

  /**
   * エンティティをプレーンオブジェクトに変換（永続化用）
   */
  toPlainObject(): ReviewPlainObject {
    return {
      id: this._id,
      user_id: this._userId,
      game_id: this._gameId,
      title: this._title,
      content: this._content,
      overall_score: this._overallScore,
      rating: this._rating,
      complexity_score: this._ruleComplexity, // DB列名に合わせる
      luck_factor: this._luckFactor,
      interaction_score: this._interaction, // DB列名に合わせる
      downtime_score: this._downtime, // DB列名に合わせる
      pros: this._pros ? [...this._pros] : undefined,
      cons: this._cons ? [...this._cons] : undefined,
      is_published: this._isPublished,
      created_at: this._createdAt?.toISOString(),
      updated_at: this._updatedAt?.toISOString()
    }
  }

  /**
   * プロパティオブジェクトを取得（内部使用）
   */
  private toProps(): ReviewProps {
    return {
      id: this._id,
      userId: this._userId,
      gameId: this._gameId,
      title: this._title,
      content: this._content,
      overallScore: this._overallScore,
      rating: this._rating,
      ruleComplexity: this._ruleComplexity,
      luckFactor: this._luckFactor,
      interaction: this._interaction,
      downtime: this._downtime,
      recommendedPlayers: this._recommendedPlayers,
      mechanics: this._mechanics,
      categories: this._categories,
      customTags: this._customTags,
      playTimeActual: this._playTimeActual,
      playerCountPlayed: this._playerCountPlayed,
      pros: this._pros,
      cons: this._cons,
      isPublished: this._isPublished,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    }
  }

  /**
   * プレーンオブジェクトからエンティティを生成
   */
  static fromPlainObject(data: ReviewPlainObject): Review {
    return new Review({
      id: data.id,
      userId: data.user_id,
      gameId: data.game_id,
      title: data.title,
      content: data.content,
      overallScore: data.overall_score,
      rating: data.rating,
      ruleComplexity: data.complexity_score, // DB列名から変換
      luckFactor: data.luck_factor,
      interaction: data.interaction_score, // DB列名から変換
      downtime: data.downtime_score, // DB列名から変換
      recommendedPlayers: data.recommended_players?.map(String) || [], // 新しいフィールド
      mechanics: data.mechanics || [], // 新しいフィールド
      categories: data.categories || [], // 新しいフィールド
      customTags: [], // 現在のDBスキーマには存在しない
      playTimeActual: undefined, // 現在のDBスキーマには存在しない
      playerCountPlayed: undefined, // 現在のDBスキーマには存在しない
      pros: data.pros || [], // 後方互換性
      cons: data.cons || [], // 後方互換性
      isPublished: data.is_published,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }

  /**
   * エンティティの更新（不変性を保持）
   */
  update(updates: Partial<ReviewProps>): Review {
    return new Review({
      id: this._id,
      userId: this._userId, // User ID cannot be changed
      gameId: this._gameId, // Game ID cannot be changed
      title: updates.title ?? this._title,
      content: updates.content ?? this._content,
      overallScore: updates.overallScore ?? this._overallScore,
      rating: updates.rating ?? this._rating,
      ruleComplexity: updates.ruleComplexity ?? this._ruleComplexity,
      luckFactor: updates.luckFactor ?? this._luckFactor,
      interaction: updates.interaction ?? this._interaction,
      downtime: updates.downtime ?? this._downtime,
      recommendedPlayers: updates.recommendedPlayers ?? this._recommendedPlayers,
      mechanics: updates.mechanics ?? this._mechanics,
      categories: updates.categories ?? this._categories,
      customTags: updates.customTags ?? this._customTags,
      playTimeActual: updates.playTimeActual ?? this._playTimeActual,
      playerCountPlayed: updates.playerCountPlayed ?? this._playerCountPlayed,
      pros: updates.pros ?? this._pros,
      cons: updates.cons ?? this._cons,
      isPublished: updates.isPublished ?? this._isPublished,
      createdAt: this._createdAt,
      updatedAt: new Date()
    })
  }
}

// 永続化用のプレーンオブジェクト型
export interface ReviewPlainObject {
  id?: number
  user_id: string
  game_id: number
  title: string
  content: string
  overall_score: number
  rating?: number
  complexity_score: number // DB列名に合わせる
  luck_factor: number
  interaction_score: number // DB列名に合わせる
  downtime_score: number // DB列名に合わせる
  pros?: string[]  // 後方互換性のために残す
  cons?: string[]  // 後方互換性のために残す
  is_published: boolean
  created_at?: string
  updated_at?: string
  // 新しいBoolean列スキーマ対応フィールド
  mechanics?: string[]
  categories?: string[]
  recommended_players?: number[]
}