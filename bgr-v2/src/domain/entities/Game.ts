/**
 * Game Entity - Clean Architecture Domain Layer
 * ビジネスルールと制約を含むゲームエンティティ
 */

import { ValidationError } from '../errors/DomainErrors'

export interface GameProps {
  readonly id?: number
  readonly bggId?: string | number
  readonly name: string
  readonly japaneseName?: string
  readonly description?: string
  readonly yearPublished?: number
  readonly minPlayers: number
  readonly maxPlayers: number
  readonly playingTime?: number
  readonly minPlayingTime?: number
  readonly maxPlayingTime?: number
  readonly minAge?: number
  readonly imageUrl?: string
  readonly thumbnailUrl?: string
  readonly bggCategories: readonly string[]
  readonly bggMechanics: readonly string[]
  readonly bggPublishers: readonly string[]
  readonly siteCategories: readonly string[]
  readonly siteMechanics: readonly string[]
  readonly sitePublishers: readonly string[]
  readonly bggBestPlayers?: readonly number[]
  readonly bggRecommendedPlayers?: readonly number[]
  readonly designers: readonly string[]
  readonly ratingAverage?: number
  readonly ratingCount?: number
  readonly reviewStats?: {
    review_count: number
    overall_avg: number | null
  }
  readonly createdAt?: Date
  readonly updatedAt?: Date
}

export class Game {
  private readonly _id?: number
  private readonly _bggId?: string | number
  private readonly _name: string
  private readonly _japaneseName?: string
  private readonly _description?: string
  private readonly _yearPublished?: number
  private readonly _minPlayers: number
  private readonly _maxPlayers: number
  private readonly _playingTime?: number
  private readonly _minPlayingTime?: number
  private readonly _maxPlayingTime?: number
  private readonly _minAge?: number
  private readonly _imageUrl?: string
  private readonly _thumbnailUrl?: string
  private readonly _bggCategories: readonly string[]
  private readonly _bggMechanics: readonly string[]
  private readonly _bggPublishers: readonly string[]
  private readonly _siteCategories: readonly string[]
  private readonly _siteMechanics: readonly string[]
  private readonly _sitePublishers: readonly string[]
  private readonly _bggBestPlayers: readonly number[]
  private readonly _bggRecommendedPlayers: readonly number[]
  private readonly _designers: readonly string[]
  private readonly _ratingAverage?: number
  private readonly _ratingCount?: number
  private readonly _reviewStats?: {
    review_count: number
    overall_avg: number | null
  }
  private readonly _createdAt?: Date
  private readonly _updatedAt?: Date

  constructor(props: GameProps) {
    this.validateProps(props)
    
    this._id = props.id
    this._bggId = props.bggId
    this._name = props.name
    this._japaneseName = props.japaneseName
    this._description = props.description
    this._yearPublished = props.yearPublished
    this._minPlayers = props.minPlayers
    this._maxPlayers = props.maxPlayers
    this._playingTime = props.playingTime
    this._minPlayingTime = props.minPlayingTime
    this._maxPlayingTime = props.maxPlayingTime
    this._minAge = props.minAge
    this._imageUrl = props.imageUrl
    this._thumbnailUrl = props.thumbnailUrl
    this._bggCategories = [...props.bggCategories]
    this._bggMechanics = [...props.bggMechanics]
    this._bggPublishers = [...props.bggPublishers]
    this._siteCategories = [...props.siteCategories]
    this._siteMechanics = [...props.siteMechanics]
    this._sitePublishers = [...props.sitePublishers]
    this._bggBestPlayers = props.bggBestPlayers ? [...props.bggBestPlayers] : []
    this._bggRecommendedPlayers = props.bggRecommendedPlayers ? [...props.bggRecommendedPlayers] : []
    this._designers = [...props.designers]
    this._ratingAverage = props.ratingAverage
    this._ratingCount = props.ratingCount
    this._reviewStats = props.reviewStats
    this._createdAt = props.createdAt
    this._updatedAt = props.updatedAt
  }

  private validateProps(props: GameProps): void {
    if (!props.name || props.name.trim().length === 0) {
      throw new ValidationError(['Game name is required'])
    }

    if (props.minPlayers < 1) {
      throw new ValidationError(['Minimum players must be at least 1'])
    }

    if (props.maxPlayers < props.minPlayers) {
      throw new ValidationError(['Maximum players must be greater than or equal to minimum players'])
    }

    if (props.yearPublished && (props.yearPublished < 1800 || props.yearPublished > new Date().getFullYear() + 5)) {
      throw new ValidationError(['Year published must be between 1800 and 5 years in the future'])
    }

    if (props.minAge && props.minAge < 0) {
      throw new ValidationError(['Minimum age cannot be negative'])
    }

    if (props.playingTime && props.playingTime < 0) {
      throw new ValidationError(['Playing time cannot be negative'])
    }

    if (props.ratingAverage && (props.ratingAverage < 0 || props.ratingAverage > 10)) {
      throw new ValidationError(['Rating average must be between 0 and 10'])
    }

    if (props.ratingCount && props.ratingCount < 0) {
      throw new ValidationError(['Rating count cannot be negative'])
    }
  }

  // Getters
  get id(): number | undefined { return this._id }
  get bggId(): string | number | undefined { return this._bggId }
  get name(): string { return this._name }
  get japaneseName(): string | undefined { return this._japaneseName }
  get description(): string | undefined { return this._description }
  get yearPublished(): number | undefined { return this._yearPublished }
  get minPlayers(): number { return this._minPlayers }
  get maxPlayers(): number { return this._maxPlayers }
  get playingTime(): number | undefined { return this._playingTime }
  get minPlayingTime(): number | undefined { return this._minPlayingTime }
  get maxPlayingTime(): number | undefined { return this._maxPlayingTime }
  get minAge(): number | undefined { return this._minAge }
  get imageUrl(): string | undefined { return this._imageUrl }
  get thumbnailUrl(): string | undefined { return this._thumbnailUrl }
  get bggCategories(): readonly string[] { return this._bggCategories }
  get bggMechanics(): readonly string[] { return this._bggMechanics }
  get bggPublishers(): readonly string[] { return this._bggPublishers }
  get bggBestPlayers(): readonly number[] { return this._bggBestPlayers }
  get bggRecommendedPlayers(): readonly number[] { return this._bggRecommendedPlayers }
  get siteCategories(): readonly string[] { return this._siteCategories }
  get siteMechanics(): readonly string[] { return this._siteMechanics }
  get sitePublishers(): readonly string[] { return this._sitePublishers }
  get designers(): readonly string[] { return this._designers }
  get ratingAverage(): number | undefined { return this._ratingAverage }
  get ratingCount(): number | undefined { return this._ratingCount }
  get reviewStats(): { review_count: number; overall_avg: number | null } | undefined { return this._reviewStats }
  get createdAt(): Date | undefined { return this._createdAt }
  get updatedAt(): Date | undefined { return this._updatedAt }

  // Business Logic Methods
  
  /**
   * プレイ可能人数範囲を取得
   */
  getPlayerRange(): string {
    if (this._minPlayers === this._maxPlayers) {
      return `${this._minPlayers}人`
    }
    return `${this._minPlayers}-${this._maxPlayers}人`
  }

  /**
   * プレイ時間範囲を推定して取得
   */
  getEstimatedPlayTimeRange(): string | null {
    if (!this._playingTime) return null
    
    const maxTime = this._playingTime
    let minTime: number
    
    if (maxTime <= 60) {
      minTime = Math.max(15, Math.floor(maxTime * 0.7))
    } else if (maxTime <= 120) {
      minTime = Math.max(30, Math.floor(maxTime * 0.5))
    } else {
      minTime = Math.max(60, Math.floor(maxTime * 0.6))
    }
    
    const formatTime = (minutes: number): string => {
      if (minutes < 60) return `${minutes}分`
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0 ? `${hours}時間${remainingMinutes}分` : `${hours}時間`
    }
    
    if (maxTime - minTime <= 15) {
      return formatTime(maxTime)
    }
    
    return `${formatTime(minTime)}～${formatTime(maxTime)}`
  }

  /**
   * 表示用カテゴリーを取得（サイト専用 > BGG変換済み）
   */
  getDisplayCategories(): readonly string[] {
    return this._siteCategories.length > 0 ? this._siteCategories : this._bggCategories
  }

  /**
   * 表示用メカニクスを取得（サイト専用 > BGG変換済み）
   */
  getDisplayMechanics(): readonly string[] {
    return this._siteMechanics.length > 0 ? this._siteMechanics : this._bggMechanics
  }

  /**
   * 表示用パブリッシャーを取得（サイト専用 > BGG）
   */
  getDisplayPublishers(): readonly string[] {
    return this._sitePublishers.length > 0 ? this._sitePublishers : this._bggPublishers
  }

  /**
   * BGGリンクが利用可能かどうか
   */
  hasBggLink(): boolean {
    if (!this._bggId) return false
    return typeof this._bggId === 'number' || !String(this._bggId).startsWith('jp-')
  }

  /**
   * BGGのURLを取得
   */
  getBggUrl(): string | null {
    if (!this.hasBggLink()) return null
    return `https://boardgamegeek.com/boardgame/${this._bggId}`
  }

  /**
   * ゲームが評価済みかどうか
   */
  hasRating(): boolean {
    return this._ratingAverage !== undefined && this._ratingCount !== undefined && this._ratingCount > 0
  }

  /**
   * ゲームが新しいかどうか（1年以内）
   */
  isNewGame(): boolean {
    if (!this._yearPublished) return false
    const currentYear = new Date().getFullYear()
    return this._yearPublished >= currentYear - 1
  }

  /**
   * 指定された人数でプレイ可能かどうか
   */
  canPlayWithPlayerCount(playerCount: number): boolean {
    return playerCount >= this._minPlayers && playerCount <= this._maxPlayers
  }

  /**
   * エンティティをプレーンオブジェクトに変換（永続化用）
   */
  toPlainObject(): GamePlainObject {
    return {
      id: this._id,
      bgg_id: this._bggId,
      name: this._name,
      japanese_name: this._japaneseName,
      description: this._description,
      year_published: this._yearPublished,
      min_players: this._minPlayers,
      max_players: this._maxPlayers,
      playing_time: this._playingTime,
      min_playing_time: this._minPlayingTime,
      max_playing_time: this._maxPlayingTime,
      min_age: this._minAge,
      image_url: this._imageUrl,
      thumbnail_url: this._thumbnailUrl,
      bgg_categories: [...this._bggCategories],
      bgg_mechanics: [...this._bggMechanics],
      bgg_publishers: [...this._bggPublishers],
      bgg_best_players: [...this._bggBestPlayers],
      bgg_recommended_players: [...this._bggRecommendedPlayers],
      site_categories: [...this._siteCategories],
      site_mechanics: [...this._siteMechanics],
      site_publishers: [...this._sitePublishers],
      designers: [...this._designers],
      rating_average: this._ratingAverage,
      rating_count: this._ratingCount,
      review_stats: this._reviewStats,
      created_at: this._createdAt?.toISOString(),
      updated_at: this._updatedAt?.toISOString()
    }
  }

  /**
   * プレーンオブジェクトからエンティティを生成
   */
  static fromPlainObject(data: GamePlainObject): Game {
    return new Game({
      id: data.id,
      bggId: data.bgg_id,
      name: data.name,
      japaneseName: data.japanese_name,
      description: data.description,
      yearPublished: data.year_published,
      minPlayers: data.min_players,
      maxPlayers: data.max_players,
      playingTime: data.playing_time,
      minPlayingTime: data.min_playing_time,
      maxPlayingTime: data.max_playing_time,
      minAge: data.min_age,
      imageUrl: data.image_url,
      thumbnailUrl: data.thumbnail_url,
      bggCategories: data.bgg_categories || [],
      bggMechanics: data.bgg_mechanics || [],
      bggPublishers: data.bgg_publishers || [],
      bggBestPlayers: data.bgg_best_players || [],
      bggRecommendedPlayers: data.bgg_recommended_players || [],
      siteCategories: data.site_categories || [],
      siteMechanics: data.site_mechanics || [],
      sitePublishers: data.site_publishers || [],
      designers: data.designers || [],
      ratingAverage: data.rating_average,
      ratingCount: data.rating_count,
      reviewStats: data.review_stats,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }

  /**
   * BGGゲームかどうかを判定
   */
  isBggGame(): boolean {
    return this._id !== undefined && this._id < 10000000
  }

  /**
   * 日本独自ゲームかどうかを判定
   */
  isJapaneseGame(): boolean {
    return this._id !== undefined && this._id >= 10000000
  }

  /**
   * ゲームIDの種別を取得
   */
  getGameType(): 'bgg' | 'japanese' | 'unknown' {
    if (!this._id) return 'unknown'
    return this._id < 10000000 ? 'bgg' : 'japanese'
  }

  /**
   * エンティティの更新（不変性を保持）
   */
  update(updates: Partial<GameProps>): Game {
    return new Game({
      id: this._id,
      bggId: updates.bggId ?? this._bggId,
      name: updates.name ?? this._name,
      japaneseName: updates.japaneseName ?? this._japaneseName,
      description: updates.description ?? this._description,
      yearPublished: updates.yearPublished ?? this._yearPublished,
      minPlayers: updates.minPlayers ?? this._minPlayers,
      maxPlayers: updates.maxPlayers ?? this._maxPlayers,
      playingTime: updates.playingTime ?? this._playingTime,
      minPlayingTime: updates.minPlayingTime ?? this._minPlayingTime,
      maxPlayingTime: updates.maxPlayingTime ?? this._maxPlayingTime,
      minAge: updates.minAge ?? this._minAge,
      imageUrl: updates.imageUrl ?? this._imageUrl,
      thumbnailUrl: updates.thumbnailUrl ?? this._thumbnailUrl,
      bggCategories: updates.bggCategories ?? this._bggCategories,
      bggMechanics: updates.bggMechanics ?? this._bggMechanics,
      bggPublishers: updates.bggPublishers ?? this._bggPublishers,
      siteCategories: updates.siteCategories ?? this._siteCategories,
      siteMechanics: updates.siteMechanics ?? this._siteMechanics,
      sitePublishers: updates.sitePublishers ?? this._sitePublishers,
      bggBestPlayers: updates.bggBestPlayers ?? this._bggBestPlayers,
      bggRecommendedPlayers: updates.bggRecommendedPlayers ?? this._bggRecommendedPlayers,
      designers: updates.designers ?? this._designers,
      ratingAverage: updates.ratingAverage ?? this._ratingAverage,
      ratingCount: updates.ratingCount ?? this._ratingCount,
      createdAt: this._createdAt,
      updatedAt: new Date()
    })
  }
}

// 永続化用のプレーンオブジェクト型
export interface GamePlainObject {
  id?: number
  bgg_id?: string | number
  name: string
  japanese_name?: string
  description?: string
  year_published?: number
  min_players: number
  max_players: number
  playing_time?: number
  min_playing_time?: number
  max_playing_time?: number
  min_age?: number
  image_url?: string
  thumbnail_url?: string
  bgg_categories: string[]
  bgg_mechanics: string[]
  bgg_publishers: string[]
  bgg_best_players?: number[]
  bgg_recommended_players?: number[]
  site_categories: string[]
  site_mechanics: string[]
  site_publishers: string[]
  designers: string[]
  rating_average?: number
  rating_count?: number
  review_stats?: {
    review_count: number
    overall_avg: number | null
  }
  created_at?: string
  updated_at?: string
}