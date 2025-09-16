/**
 * Username Value Object - Clean Architecture Domain Layer
 * ユーザー名のビジネスルールと検証を含む値オブジェクト
 */

import { ValidationError } from '../errors/DomainErrors'

export class Username {
  private readonly value: string

  constructor(username: string) {
    this.validate(username)
    this.value = username.trim()
  }

  private validate(username: string): void {
    if (!username || username.trim().length === 0) {
      throw new ValidationError(['Username is required'])
    }

    const trimmedUsername = username.trim()

    if (trimmedUsername.length < 2) {
      throw new ValidationError(['Username must be at least 2 characters'])
    }

    if (trimmedUsername.length > 50) {
      throw new ValidationError(['Username must be 50 characters or less'])
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      throw new ValidationError(['Username can only contain letters, numbers, underscores, and hyphens'])
    }

    if (trimmedUsername.startsWith('-') || trimmedUsername.endsWith('-')) {
      throw new ValidationError(['Username cannot start or end with a hyphen'])
    }

    if (trimmedUsername.startsWith('_') || trimmedUsername.endsWith('_')) {
      throw new ValidationError(['Username cannot start or end with an underscore'])
    }

    // Check for reserved usernames
    const reservedUsernames = [
      'admin', 'administrator', 'root', 'system', 'user',
      'api', 'www', 'mail', 'email', 'support', 'help',
      'info', 'contact', 'about', 'terms', 'privacy',
      'bgr', 'review', 'game', 'boardgame'
    ]

    if (reservedUsernames.includes(trimmedUsername.toLowerCase())) {
      throw new ValidationError(['This username is reserved and cannot be used'])
    }

    // Check for inappropriate patterns
    if (/(\w)\1{2,}/.test(trimmedUsername)) {
      throw new ValidationError(['Username cannot contain more than 2 consecutive identical characters'])
    }
  }

  getValue(): string {
    return this.value
  }

  isShort(): boolean {
    return this.value.length < 5
  }

  isLong(): boolean {
    return this.value.length > 20
  }

  hasNumbers(): boolean {
    return /\d/.test(this.value)
  }

  hasSpecialChars(): boolean {
    return /[_-]/.test(this.value)
  }

  getDisplayName(): string {
    return `@${this.value}`
  }

  equals(other: Username): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase()
  }

  toString(): string {
    return this.value
  }

  static create(username: string): Username {
    return new Username(username)
  }
}