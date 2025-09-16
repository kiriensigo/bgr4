/**
 * PlayerCount Value Object - Clean Architecture Domain Layer
 * プレイ人数のビジネスルールと検証を含む値オブジェクト
 */

import { ValidationError } from '../errors/DomainErrors'

export class PlayerCount {
  private readonly min: number
  private readonly max: number

  constructor(min: number, max?: number) {
    this.validate(min, max)
    this.min = min
    this.max = max ?? min
  }

  private validate(min: number, max?: number): void {
    if (!Number.isInteger(min) || min < 1) {
      throw new ValidationError(['Minimum player count must be a positive integer'])
    }

    if (min > 20) {
      throw new ValidationError(['Minimum player count cannot exceed 20'])
    }

    if (max !== undefined) {
      if (!Number.isInteger(max) || max < 1) {
        throw new ValidationError(['Maximum player count must be a positive integer'])
      }

      if (max > 20) {
        throw new ValidationError(['Maximum player count cannot exceed 20'])
      }

      if (max < min) {
        throw new ValidationError(['Maximum player count must be greater than or equal to minimum'])
      }
    }
  }

  getMin(): number {
    return this.min
  }

  getMax(): number {
    return this.max
  }

  /**
   * 固定人数かどうか判定
   */
  isFixedCount(): boolean {
    return this.min === this.max
  }

  /**
   * 可変人数かどうか判定
   */
  isVariableCount(): boolean {
    return this.min !== this.max
  }

  /**
   * 指定人数がプレイ可能かどうか判定
   */
  canAccommodate(playerCount: number): boolean {
    return playerCount >= this.min && playerCount <= this.max
  }

  /**
   * ソロプレイ可能かどうか判定
   */
  supportsSoloPlay(): boolean {
    return this.min === 1
  }

  /**
   * 2人プレイ可能かどうか判定
   */
  supportsTwoPlayer(): boolean {
    return this.canAccommodate(2)
  }

  /**
   * 大人数プレイ可能かどうか判定（6人以上）
   */
  supportsLargeGroups(): boolean {
    return this.max >= 6
  }

  /**
   * パーティーゲーム向きかどうか判定（8人以上）
   */
  isPartyGameSize(): boolean {
    return this.max >= 8
  }

  /**
   * 人数の幅を取得
   */
  getRange(): number {
    return this.max - this.min
  }

  /**
   * 表示用の人数文字列を取得
   */
  getDisplayString(): string {
    if (this.isFixedCount()) {
      return `${this.min}人`
    }
    return `${this.min}-${this.max}人`
  }

  /**
   * カテゴリ分類を取得
   */
  getCategory(): PlayerCountCategory {
    if (this.supportsSoloPlay()) {
      return PlayerCountCategory.SOLO_FRIENDLY
    }
    if (this.min === 2 && this.max <= 2) {
      return PlayerCountCategory.TWO_PLAYER_ONLY
    }
    if (this.supportsTwoPlayer() && this.max <= 4) {
      return PlayerCountCategory.SMALL_GROUP
    }
    if (this.max <= 6) {
      return PlayerCountCategory.MEDIUM_GROUP
    }
    if (this.isPartyGameSize()) {
      return PlayerCountCategory.PARTY_SIZE
    }
    return PlayerCountCategory.LARGE_GROUP
  }

  /**
   * 推奨人数を取得（中央値に近い値）
   */
  getOptimalPlayerCount(): number {
    if (this.isFixedCount()) {
      return this.min
    }

    // 一般的に最大人数より少し少ない人数が最適とされることが多い
    if (this.getRange() <= 2) {
      return this.max
    }

    return Math.floor((this.min + this.max) / 2)
  }

  /**
   * 人数制限の厳しさを評価
   */
  getFlexibilityScore(): number {
    const range = this.getRange()
    if (range === 0) return 1 // Fixed count = low flexibility
    if (range <= 2) return 3   // Small range = medium flexibility
    if (range <= 4) return 4   // Good range = high flexibility
    return 5                   // Large range = very high flexibility
  }

  equals(other: PlayerCount): boolean {
    return this.min === other.min && this.max === other.max
  }

  toString(): string {
    return this.getDisplayString()
  }

  static createFixed(count: number): PlayerCount {
    return new PlayerCount(count)
  }

  static createRange(min: number, max: number): PlayerCount {
    return new PlayerCount(min, max)
  }

  static createSolo(): PlayerCount {
    return new PlayerCount(1)
  }

  static createTwoPlayer(): PlayerCount {
    return new PlayerCount(2)
  }

  static createSmallGroup(): PlayerCount {
    return new PlayerCount(2, 4)
  }

  static createMediumGroup(): PlayerCount {
    return new PlayerCount(3, 6)
  }

  static createLargeGroup(): PlayerCount {
    return new PlayerCount(4, 8)
  }

  static createPartySize(): PlayerCount {
    return new PlayerCount(6, 12)
  }
}

export enum PlayerCountCategory {
  SOLO_FRIENDLY = 'solo_friendly',
  TWO_PLAYER_ONLY = 'two_player_only',
  SMALL_GROUP = 'small_group',
  MEDIUM_GROUP = 'medium_group',
  LARGE_GROUP = 'large_group',
  PARTY_SIZE = 'party_size'
}