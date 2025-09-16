/**
 * Game Validation Service - Clean Architecture Domain Layer
 * ゲームの重複チェックや整合性検証を行うドメインサービス
 */

import { Game } from '../entities/Game'
import { GameRepository } from '../repositories/GameRepository'
import { ConflictError } from '../errors/DomainErrors'

export interface GameValidationService {
  validateGameUniqueness(game: Game): Promise<void>
  validateGameConsistency(game: Game): void
  validateBggDataIntegrity(bggId: string | number, existingGameId?: number): Promise<void>
}

export class GameValidationServiceImpl implements GameValidationService {
  constructor(
    private readonly gameRepository: GameRepository
  ) {}

  /**
   * ゲームの一意性を検証
   * - 同じBGG IDのゲームが既に存在しないか
   * - 同じ名前のゲームが既に存在しないか（類似度チェック）
   */
  async validateGameUniqueness(game: Game): Promise<void> {
    // BGG ID重複チェック
    if (game.bggId) {
      const existingGameByBggId = await this.gameRepository.findByBggId(String(game.bggId))
      if (existingGameByBggId && existingGameByBggId.id !== game.id) {
        throw new ConflictError(`Game with BGG ID ${game.bggId} already exists (ID: ${existingGameByBggId.id})`)
      }
    }

    // 名前類似度チェック
    const similarGames = await this.findSimilarGames(game)
    if (similarGames.length > 0 && !similarGames.some(g => g.id === game.id)) {
      const similarGameNames = similarGames.map(g => g.name).join(', ')
      throw new ConflictError(`Similar games already exist: ${similarGameNames}`)
    }
  }

  /**
   * ゲームデータの整合性を検証
   */
  validateGameConsistency(game: Game): void {
    // プレイ人数の論理チェック
    if (game.minPlayers > game.maxPlayers) {
      throw new ConflictError('Minimum players cannot be greater than maximum players')
    }

    // 年代の妥当性チェック
    if (game.yearPublished) {
      const currentYear = new Date().getFullYear()
      if (game.yearPublished < 1800) {
        throw new ConflictError('Year published cannot be before 1800')
      }
      if (game.yearPublished > currentYear + 5) {
        throw new ConflictError('Year published cannot be more than 5 years in the future')
      }
    }

    // プレイ時間の妥当性チェック
    if (game.playingTime && game.playingTime < 0) {
      throw new ConflictError('Playing time cannot be negative')
    }

    // 年齢の妥当性チェック
    if (game.minAge && (game.minAge < 0 || game.minAge > 99)) {
      throw new ConflictError('Minimum age must be between 0 and 99')
    }

    // カテゴリーとメカニクスの重複チェック
    this.validateCategoriesAndMechanics(game)

    // 画像URLの形式チェック
    this.validateImageUrls(game)
  }

  /**
   * BGGデータの整合性を検証
   */
  async validateBggDataIntegrity(bggId: string | number, existingGameId?: number): Promise<void> {
    if (!bggId) {
      throw new ConflictError('BGG ID is required for BGG data validation')
    }

    // BGG IDの形式チェック
    const bggIdStr = String(bggId)
    if (bggIdStr.startsWith('jp-')) {
      // 日本独自IDの場合は特別な検証
      if (!/^jp-\d+$/.test(bggIdStr)) {
        throw new ConflictError('Invalid Japanese game ID format')
      }
      return // 日本独自IDの場合はBGGとの重複チェックをスキップ
    }

    // 数値BGG IDの検証
    const numericBggId = Number(bggId)
    if (isNaN(numericBggId) || numericBggId <= 0) {
      throw new ConflictError('BGG ID must be a positive number')
    }

    // 既存ゲームとの重複チェック
    const existingGame = await this.gameRepository.findByBggId(bggIdStr)
    if (existingGame && existingGame.id !== existingGameId) {
      throw new ConflictError(`BGG ID ${bggId} is already used by game: ${existingGame.name}`)
    }
  }

  /**
   * 類似ゲームを検索
   */
  private async findSimilarGames(game: Game): Promise<Game[]> {
    // 名前の正規化
    const normalizedName = this.normalizeGameName(game.name)
    
    // 完全一致チェック
    const exactMatches = await this.gameRepository.searchByName(normalizedName)
    if (exactMatches.length > 0) {
      return exactMatches
    }

    // 類似度チェック（編集距離を使用）
    const allGames = await this.gameRepository.findAll()
    const similarGames: Game[] = []

    for (const existingGame of allGames) {
      const normalizedExistingName = this.normalizeGameName(existingGame.name)
      const similarity = this.calculateSimilarity(normalizedName, normalizedExistingName)
      
      if (similarity > 0.85) { // 85%以上の類似度
        similarGames.push(existingGame)
      }

      // 日本語名との比較も行う
      if (game.japaneseName && existingGame.japaneseName) {
        const jaSimilarity = this.calculateSimilarity(game.japaneseName, existingGame.japaneseName)
        if (jaSimilarity > 0.9) { // 日本語は90%以上の類似度
          similarGames.push(existingGame)
        }
      }
    }

    return [...new Set(similarGames)] // 重複削除
  }

  /**
   * ゲーム名の正規化
   */
  private normalizeGameName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // 特殊文字を削除
      .replace(/\s+/g, ' ') // 連続する空白を単一に
      .trim()
      .replace(/^(the|a|an)\s+/i, '') // 冠詞を削除
  }

  /**
   * 文字列の類似度を計算（レーベンシュタイン距離）
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length
    const len2 = str2.length

    if (len1 === 0) return len2 === 0 ? 1 : 0
    if (len2 === 0) return 0

    const matrix: number[][] = []

    // 初期化
    for (let i = 0; i <= len1; i++) {
      matrix[i] = []
      matrix[i]![0] = i
    }
    for (let j = 0; j <= len2; j++) {
      if (matrix[0]) {
        matrix[0]![j] = j
      }
    }

    // 距離計算
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j]! + 1,      // 削除
          matrix[i]![j - 1]! + 1,      // 挿入
          matrix[i - 1]![j - 1]! + cost // 置換
        )
      }
    }

    const maxLen = Math.max(len1, len2)
    return (maxLen - matrix[len1]![len2]!) / maxLen
  }

  /**
   * カテゴリーとメカニクスの検証
   */
  private validateCategoriesAndMechanics(game: Game): void {
    // BGGカテゴリーの重複チェック
    const uniqueBggCategories = new Set(game.bggCategories)
    if (uniqueBggCategories.size !== game.bggCategories.length) {
      throw new ConflictError('BGG categories contain duplicates')
    }

    // BGGメカニクスの重複チェック
    const uniqueBggMechanics = new Set(game.bggMechanics)
    if (uniqueBggMechanics.size !== game.bggMechanics.length) {
      throw new ConflictError('BGG mechanics contain duplicates')
    }

    // サイトカテゴリーの重複チェック
    const uniqueSiteCategories = new Set(game.siteCategories)
    if (uniqueSiteCategories.size !== game.siteCategories.length) {
      throw new ConflictError('Site categories contain duplicates')
    }

    // サイトメカニクスの重複チェック
    const uniqueSiteMechanics = new Set(game.siteMechanics)
    if (uniqueSiteMechanics.size !== game.siteMechanics.length) {
      throw new ConflictError('Site mechanics contain duplicates')
    }

    // カテゴリー数の制限チェック
    if (game.siteCategories.length > 10) {
      throw new ConflictError('Cannot have more than 10 site categories')
    }

    if (game.siteMechanics.length > 15) {
      throw new ConflictError('Cannot have more than 15 site mechanics')
    }
  }

  /**
   * 画像URLの検証
   */
  private validateImageUrls(game: Game): void {
    if (game.imageUrl) {
      this.validateUrl(game.imageUrl, 'Image URL')
    }

    if (game.thumbnailUrl) {
      this.validateUrl(game.thumbnailUrl, 'Thumbnail URL')
    }
  }

  /**
   * URL形式の検証
   */
  private validateUrl(url: string, fieldName: string): void {
    try {
      const parsedUrl = new URL(url)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new ConflictError(`${fieldName} must use HTTP or HTTPS protocol`)
      }
    } catch {
      throw new ConflictError(`${fieldName} is not a valid URL format`)
    }
  }
}