/**
 * GameTitle Value Object - Clean Architecture Domain Layer
 * ゲームタイトルのビジネスルールと検証を含む値オブジェクト
 */

import { ValidationError } from '../errors/DomainErrors'

export class GameTitle {
  private readonly originalName: string
  private readonly japaneseName?: string

  constructor(originalName: string, japaneseName?: string) {
    this.validateOriginalName(originalName)
    if (japaneseName) {
      this.validateJapaneseName(japaneseName)
    }
    
    this.originalName = originalName.trim()
    this.japaneseName = japaneseName?.trim()
  }

  private validateOriginalName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError(['Game title is required'])
    }

    const trimmedName = name.trim()

    if (trimmedName.length > 200) {
      throw new ValidationError(['Game title must be 200 characters or less'])
    }

    if (trimmedName.length < 1) {
      throw new ValidationError(['Game title must be at least 1 character'])
    }
  }

  private validateJapaneseName(name: string): void {
    const trimmedName = name.trim()

    if (trimmedName.length === 0) {
      throw new ValidationError(['Japanese title cannot be empty if provided'])
    }

    if (trimmedName.length > 200) {
      throw new ValidationError(['Japanese title must be 200 characters or less'])
    }
  }

  getOriginalName(): string {
    return this.originalName
  }

  getJapaneseName(): string | undefined {
    return this.japaneseName
  }

  /**
   * 表示用のタイトルを取得（日本語優先）
   */
  getDisplayName(): string {
    return this.japaneseName || this.originalName
  }

  /**
   * 完全なタイトル表記を取得（日本語と原語両方）
   */
  getFullTitle(): string {
    if (!this.japaneseName) {
      return this.originalName
    }
    
    if (this.japaneseName === this.originalName) {
      return this.originalName
    }

    return `${this.japaneseName}（${this.originalName}）`
  }

  /**
   * 検索用の正規化されたタイトルを取得
   */
  getNormalizedSearchTerms(): string[] {
    const terms: string[] = []
    
    // Original name
    terms.push(this.originalName.toLowerCase())
    
    // Japanese name if exists
    if (this.japaneseName) {
      terms.push(this.japaneseName.toLowerCase())
    }

    // Remove common articles and normalize
    const normalizedOriginal = this.normalizeForSearch(this.originalName)
    if (normalizedOriginal !== this.originalName.toLowerCase()) {
      terms.push(normalizedOriginal)
    }

    return [...new Set(terms)] // Remove duplicates
  }

  private normalizeForSearch(title: string): string {
    return title
      .toLowerCase()
      .replace(/^(the|a|an)\s+/i, '') // Remove leading articles
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  /**
   * 日本語タイトルが設定されているかどうか
   */
  hasJapaneseName(): boolean {
    return !!this.japaneseName
  }

  /**
   * タイトルが長いかどうか判定
   */
  isLongTitle(): boolean {
    return this.getDisplayName().length > 30
  }

  /**
   * タイトルに数字が含まれているかどうか
   */
  hasNumbers(): boolean {
    return /\d/.test(this.originalName) || /\d/.test(this.japaneseName || '')
  }

  /**
   * タイトルに特殊文字が含まれているかどうか
   */
  hasSpecialCharacters(): boolean {
    return /[^\w\s]/.test(this.originalName) || /[^\w\s]/.test(this.japaneseName || '')
  }

  /**
   * シリーズものかどうか判定（番号やコロンの存在で判定）
   */
  appearsToBeSeries(): boolean {
    const seriesPatterns = [
      /\b\d+\b/, // Numbers
      /:/, // Colons
      /\bII\b|\bIII\b|\bIV\b|\bV\b/, // Roman numerals
      /第\d+/, // Japanese series indicators
    ]
    
    const textToCheck = `${this.originalName} ${this.japaneseName || ''}`
    return seriesPatterns.some(pattern => pattern.test(textToCheck))
  }

  equals(other: GameTitle): boolean {
    return this.originalName === other.originalName && 
           this.japaneseName === other.japaneseName
  }

  toString(): string {
    return this.getDisplayName()
  }

  static create(originalName: string, japaneseName?: string): GameTitle {
    return new GameTitle(originalName, japaneseName)
  }

  /**
   * 日本語タイトルを設定/更新
   */
  withJapaneseName(japaneseName: string): GameTitle {
    return new GameTitle(this.originalName, japaneseName)
  }

  /**
   * 日本語タイトルを削除
   */
  withoutJapaneseName(): GameTitle {
    return new GameTitle(this.originalName)
  }
}