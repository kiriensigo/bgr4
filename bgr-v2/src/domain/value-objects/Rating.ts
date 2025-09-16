/**
 * Rating Value Object - Clean Architecture Domain Layer
 * 評価点のビジネスルールと検証を含む値オブジェクト
 */

import { ValidationError } from '../errors/DomainErrors'

export class Rating {
  private readonly value: number
  private readonly scale: RatingScale

  constructor(value: number, scale: RatingScale = RatingScale.TEN_POINT) {
    this.scale = scale
    this.validate(value)
    this.value = value
  }

  private validate(value: number): void {
    if (!Number.isInteger(value)) {
      throw new ValidationError(['Rating must be an integer'])
    }

    const { min, max } = this.getScaleRange()

    if (value < min || value > max) {
      throw new ValidationError([`Rating must be between ${min} and ${max}`])
    }
  }

  private getScaleRange(): { min: number; max: number } {
    switch (this.scale) {
      case RatingScale.FIVE_POINT:
        return { min: 1, max: 5 }
      case RatingScale.TEN_POINT:
        return { min: 1, max: 10 }
      default:
        throw new ValidationError(['Invalid rating scale'])
    }
  }

  getValue(): number {
    return this.value
  }

  getScale(): RatingScale {
    return this.scale
  }

  /**
   * 評価をパーセンテージで取得
   */
  getPercentage(): number {
    const { min, max } = this.getScaleRange()
    return ((this.value - min) / (max - min)) * 100
  }

  /**
   * 評価を星の数で取得（5つ星スケール）
   */
  getStars(): number {
    const percentage = this.getPercentage()
    return Math.round((percentage / 100) * 5 * 2) / 2 // 0.5刻み
  }

  /**
   * 評価レベルを取得
   */
  getLevel(): RatingLevel {
    const percentage = this.getPercentage()
    
    if (percentage >= 80) return RatingLevel.EXCELLENT
    if (percentage >= 60) return RatingLevel.GOOD
    if (percentage >= 40) return RatingLevel.AVERAGE
    if (percentage >= 20) return RatingLevel.POOR
    return RatingLevel.TERRIBLE
  }

  /**
   * 評価レベルの説明を取得
   */
  getLevelDescription(): string {
    switch (this.getLevel()) {
      case RatingLevel.EXCELLENT: return '優秀'
      case RatingLevel.GOOD: return '良好'
      case RatingLevel.AVERAGE: return '普通'
      case RatingLevel.POOR: return '不満'
      case RatingLevel.TERRIBLE: return '最悪'
    }
  }

  /**
   * 他のスケールに変換
   */
  convertTo(targetScale: RatingScale): Rating {
    if (this.scale === targetScale) {
      return this
    }

    const percentage = this.getPercentage()
    const { min: targetMin, max: targetMax } = this.getTargetScaleRange(targetScale)
    const convertedValue = Math.round(targetMin + (percentage / 100) * (targetMax - targetMin))
    
    return new Rating(convertedValue, targetScale)
  }

  private getTargetScaleRange(scale: RatingScale): { min: number; max: number } {
    switch (scale) {
      case RatingScale.FIVE_POINT:
        return { min: 1, max: 5 }
      case RatingScale.TEN_POINT:
        return { min: 1, max: 10 }
      default:
        throw new ValidationError(['Invalid target rating scale'])
    }
  }

  /**
   * 高評価かどうか判定
   */
  isPositive(): boolean {
    return this.getPercentage() >= 60
  }

  /**
   * 低評価かどうか判定
   */
  isNegative(): boolean {
    return this.getPercentage() <= 40
  }

  /**
   * 中立評価かどうか判定
   */
  isNeutral(): boolean {
    const percentage = this.getPercentage()
    return percentage > 40 && percentage < 60
  }

  equals(other: Rating): boolean {
    return this.value === other.value && this.scale === other.scale
  }

  toString(): string {
    const { max } = this.getScaleRange()
    return `${this.value}/${max}`
  }

  static createFivePoint(value: number): Rating {
    return new Rating(value, RatingScale.FIVE_POINT)
  }

  static createTenPoint(value: number): Rating {
    return new Rating(value, RatingScale.TEN_POINT)
  }
}

export enum RatingScale {
  FIVE_POINT = 'five_point',
  TEN_POINT = 'ten_point'
}

export enum RatingLevel {
  TERRIBLE = 'terrible',
  POOR = 'poor',
  AVERAGE = 'average',
  GOOD = 'good',
  EXCELLENT = 'excellent'
}