export abstract class DomainError extends Error {
  abstract readonly code: string
  abstract readonly statusCode: number

  constructor(message: string, public readonly details?: Record<string, any>) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class GameNotFoundError extends DomainError {
  readonly code = 'GAME_NOT_FOUND'
  readonly statusCode = 404

  constructor(gameId?: number | string, message?: string) {
    super(
      message || `Game ${gameId ? `with id ${gameId}` : ''} not found`,
      gameId ? { gameId } : undefined
    )
  }
}

export class ReviewNotFoundError extends DomainError {
  readonly code = 'REVIEW_NOT_FOUND'
  readonly statusCode = 404

  constructor(reviewId?: number, message?: string) {
    super(
      message || `Review ${reviewId ? `with id ${reviewId}` : ''} not found`,
      reviewId ? { reviewId } : undefined
    )
  }
}

export class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND'
  readonly statusCode = 404

  constructor(userId?: string, message?: string) {
    super(
      message || `User ${userId ? `with id ${userId}` : ''} not found`,
      userId ? { userId } : undefined
    )
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR'
  readonly statusCode = 400

  constructor(public readonly validationErrors: string[], message?: string) {
    super(
      message || `Validation failed: ${validationErrors.join(', ')}`,
      { validationErrors }
    )
  }
}

export class DatabaseError extends DomainError {
  readonly code = 'DATABASE_ERROR'
  readonly statusCode = 500

  constructor(message: string = 'Database operation failed', operation?: string) {
    super(message, operation ? { operation } : undefined)
  }
}

export class NetworkError extends DomainError {
  readonly code = 'NETWORK_ERROR'
  readonly statusCode = 503

  constructor(message: string = 'Network request failed', url?: string) {
    super(message, url ? { url } : undefined)
  }
}

export class BGGApiError extends DomainError {
  readonly code = 'BGG_API_ERROR'
  readonly statusCode = 502

  constructor(message: string = 'BGG API request failed', public readonly httpStatus?: number) {
    super(message, httpStatus ? { httpStatus } : undefined)
  }
}

export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED'
  readonly statusCode = 401

  constructor(message: string = 'Unauthorized access') {
    super(message)
  }
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN'
  readonly statusCode = 403

  constructor(message: string = 'Access forbidden') {
    super(message)
  }
}

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT'
  readonly statusCode = 409

  constructor(message: string, conflictDetails?: Record<string, any>) {
    super(message, conflictDetails)
  }
}