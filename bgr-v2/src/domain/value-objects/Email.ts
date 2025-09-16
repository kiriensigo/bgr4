/**
 * Email Value Object - Clean Architecture Domain Layer
 * メールアドレスのビジネスルールと検証を含む値オブジェクト
 */

import { ValidationError } from '../errors/DomainErrors'

export class Email {
  private readonly value: string

  constructor(email: string) {
    this.validate(email)
    this.value = email.toLowerCase().trim()
  }

  private validate(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new ValidationError(['Email is required'])
    }

    const trimmedEmail = email.trim()

    if (trimmedEmail.length > 254) {
      throw new ValidationError(['Email must be 254 characters or less'])
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      throw new ValidationError(['Invalid email format'])
    }

    // Check for common invalid patterns
    if (trimmedEmail.includes('..')) {
      throw new ValidationError(['Email cannot contain consecutive dots'])
    }

    if (trimmedEmail.startsWith('.') || trimmedEmail.endsWith('.')) {
      throw new ValidationError(['Email cannot start or end with a dot'])
    }

    const [localPart, domain] = trimmedEmail.split('@')
    
    if (!localPart || localPart.length > 64) {
      throw new ValidationError(['Email local part must be 64 characters or less'])
    }

    if (!domain || domain.length > 253) {
      throw new ValidationError(['Email domain must be 253 characters or less'])
    }
  }

  getValue(): string {
    return this.value
  }

  getDomain(): string {
    const parts = this.value.split('@')
    return parts[1] || ''
  }

  getLocalPart(): string {
    const parts = this.value.split('@')
    return parts[0] || ''
  }

  isGmailAddress(): boolean {
    return this.getDomain() === 'gmail.com'
  }

  isCompanyEmail(): boolean {
    const commonPersonalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'icloud.com', 'aol.com', 'protonmail.com'
    ]
    return !commonPersonalDomains.includes(this.getDomain())
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }

  static create(email: string): Email {
    return new Email(email)
  }
}