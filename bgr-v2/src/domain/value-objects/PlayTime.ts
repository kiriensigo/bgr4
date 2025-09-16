/**
 * PlayTime Value Object - Clean Architecture Domain Layer
 * プレイ時間のビジネスルールと検証を含む値オブジェクト
 */

import { ValidationError } from '../errors/DomainErrors'

export class PlayTime {
  private readonly minutes: number

  constructor(minutes: number) {
    this.validate(minutes)
    this.minutes = minutes
  }

  private validate(minutes: number): void {
    if (!Number.isInteger(minutes) || minutes < 1) {
      throw new ValidationError(['Play time must be a positive integer (minutes)'])
    }

    if (minutes > 1440) { // 24 hours
      throw new ValidationError(['Play time cannot exceed 24 hours (1440 minutes)'])
    }
  }

  getMinutes(): number {
    return this.minutes
  }

  getHours(): number {
    return this.minutes / 60
  }

  /**
   * 表示用の時間文字列を取得
   */
  getDisplayString(): string {
    if (this.minutes < 60) {
      return `${this.minutes}分`
    }

    const hours = Math.floor(this.minutes / 60)
    const remainingMinutes = this.minutes % 60

    if (remainingMinutes === 0) {
      return `${hours}時間`
    }

    return `${hours}時間${remainingMinutes}分`
  }

  /**
   * 短縮表示文字列を取得
   */
  getShortDisplayString(): string {
    if (this.minutes < 60) {
      return `${this.minutes}分`
    }

    const hours = Math.floor(this.minutes / 60)
    const remainingMinutes = this.minutes % 60

    if (remainingMinutes === 0) {
      return `${hours}h`
    }

    return `${hours}h${remainingMinutes}m`
  }

  /**
   * 範囲表示用の文字列を取得（推定範囲）
   */
  getEstimatedRange(): string {
    let minTime: number
    let maxTime: number

    if (this.minutes <= 30) {
      minTime = Math.max(10, Math.floor(this.minutes * 0.8))
      maxTime = Math.ceil(this.minutes * 1.2)
    } else if (this.minutes <= 60) {
      minTime = Math.max(15, Math.floor(this.minutes * 0.7))
      maxTime = Math.ceil(this.minutes * 1.3)
    } else if (this.minutes <= 120) {
      minTime = Math.floor(this.minutes * 0.6)
      maxTime = Math.ceil(this.minutes * 1.2)
    } else {
      minTime = Math.floor(this.minutes * 0.7)
      maxTime = Math.ceil(this.minutes * 1.1)
    }

    if (maxTime - minTime <= 15) {
      return this.getDisplayString()
    }

    const minDisplay = new PlayTime(minTime).getDisplayString()
    const maxDisplay = new PlayTime(maxTime).getDisplayString()
    return `${minDisplay}～${maxDisplay}`
  }

  /**
   * ゲーム時間のカテゴリを取得
   */
  getCategory(): PlayTimeCategory {
    if (this.minutes <= 30) return PlayTimeCategory.QUICK
    if (this.minutes <= 60) return PlayTimeCategory.SHORT
    if (this.minutes <= 120) return PlayTimeCategory.MEDIUM
    if (this.minutes <= 240) return PlayTimeCategory.LONG
    return PlayTimeCategory.EPIC
  }

  /**
   * カテゴリの説明を取得
   */
  getCategoryDescription(): string {
    switch (this.getCategory()) {
      case PlayTimeCategory.QUICK: return 'サクッと'
      case PlayTimeCategory.SHORT: return '短時間'
      case PlayTimeCategory.MEDIUM: return '中程度'
      case PlayTimeCategory.LONG: return '長時間'
      case PlayTimeCategory.EPIC: return '超長時間'
    }
  }

  /**
   * フィラーゲーム（隙間時間）向きかどうか判定
   */
  isFillerGame(): boolean {
    return this.minutes <= 20
  }

  /**
   * 昼休み時間で遊べるかどうか判定
   */
  isSuitableForLunchBreak(): boolean {
    return this.minutes <= 45
  }

  /**
   * 夕食後の時間で遊べるかどうか判定
   */
  isSuitableForEvening(): boolean {
    return this.minutes <= 90
  }

  /**
   * 週末向けの長時間ゲームかどうか判定
   */
  isWeekendGame(): boolean {
    return this.minutes >= 120
  }

  /**
   * 集中力を要する時間かどうか判定
   */
  requiresHighConcentration(): boolean {
    return this.minutes >= 90
  }

  /**
   * 複数回プレイ可能時間を計算（セットアップ時間込み）
   */
  getMultiplePlaySessions(availableMinutes: number, setupTime: number = 10): number {
    if (availableMinutes < this.minutes + setupTime) {
      return 0
    }

    const totalTimePerGame = this.minutes + setupTime
    return Math.floor(availableMinutes / totalTimePerGame)
  }

  /**
   * 時間効率を評価（短いほど高評価）
   */
  getEfficiencyScore(): number {
    if (this.minutes <= 30) return 5
    if (this.minutes <= 60) return 4
    if (this.minutes <= 120) return 3
    if (this.minutes <= 240) return 2
    return 1
  }

  /**
   * 他のプレイ時間との比較
   */
  compareTo(other: PlayTime): number {
    return this.minutes - other.minutes
  }

  /**
   * より短いかどうか判定
   */
  isShorterThan(other: PlayTime): boolean {
    return this.minutes < other.minutes
  }

  /**
   * より長いかどうか判定
   */
  isLongerThan(other: PlayTime): boolean {
    return this.minutes > other.minutes
  }

  /**
   * 同程度の時間かどうか判定（±15分）
   */
  isSimilarTo(other: PlayTime): boolean {
    return Math.abs(this.minutes - other.minutes) <= 15
  }

  equals(other: PlayTime): boolean {
    return this.minutes === other.minutes
  }

  toString(): string {
    return this.getDisplayString()
  }

  static createMinutes(minutes: number): PlayTime {
    return new PlayTime(minutes)
  }

  static createHours(hours: number): PlayTime {
    return new PlayTime(Math.round(hours * 60))
  }

  static createQuickGame(): PlayTime {
    return new PlayTime(20)
  }

  static createShortGame(): PlayTime {
    return new PlayTime(45)
  }

  static createMediumGame(): PlayTime {
    return new PlayTime(90)
  }

  static createLongGame(): PlayTime {
    return new PlayTime(150)
  }

  static createEpicGame(): PlayTime {
    return new PlayTime(240)
  }
}

export enum PlayTimeCategory {
  QUICK = 'quick',        // ~30min
  SHORT = 'short',        // 30-60min
  MEDIUM = 'medium',      // 60-120min
  LONG = 'long',          // 120-240min
  EPIC = 'epic'           // 240min+
}