import { NextResponse } from 'next/server'
import {
  DomainError,
  GameNotFoundError,
  ReviewNotFoundError,
  UserNotFoundError,
  ValidationError,
  DatabaseError,
  NetworkError,
  BGGApiError,
  UnauthorizedError,
  ForbiddenError
} from '@/domain/errors/DomainErrors'

export interface ApiErrorResponse {
  error: string
  code: string
  details?: Record<string, any>
  timestamp: string
}

export class ErrorHandler {
  static handleApiError(error: unknown): NextResponse {
    const timestamp = new Date().toISOString()

    if (error instanceof DomainError) {
      const response: ApiErrorResponse = {
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
        timestamp
      }

      // Log specific errors for monitoring
      if (error instanceof DatabaseError || error instanceof BGGApiError) {
        console.error(`${error.code}:`, error.message, error.details)
      }

      return NextResponse.json(response, { status: error.statusCode })
    }

    // Handle unexpected errors
    console.error('Unexpected error:', error)
    
    const response: ApiErrorResponse = {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp
    }

    return NextResponse.json(response, { status: 500 })
  }

  static handleHookError(error: unknown): {
    message: string
    code: string
    isRetryable: boolean
  } {
    if (error instanceof GameNotFoundError) {
      return {
        message: 'ゲームが見つかりません',
        code: error.code,
        isRetryable: false
      }
    }

    if (error instanceof ReviewNotFoundError) {
      return {
        message: 'レビューが見つかりません',
        code: error.code,
        isRetryable: false
      }
    }

    if (error instanceof ValidationError) {
      return {
        message: `入力エラー: ${error.validationErrors.join(', ')}`,
        code: error.code,
        isRetryable: false
      }
    }

    if (error instanceof NetworkError || error instanceof BGGApiError) {
      return {
        message: 'ネットワークエラーが発生しました。再試行してください。',
        code: error.code,
        isRetryable: true
      }
    }

    if (error instanceof UnauthorizedError) {
      return {
        message: 'ログインが必要です',
        code: error.code,
        isRetryable: false
      }
    }

    if (error instanceof ForbiddenError) {
      return {
        message: 'この操作を実行する権限がありません',
        code: error.code,
        isRetryable: false
      }
    }

    // Unexpected errors
    console.error('Unexpected error in hook:', error)
    return {
      message: '予期しないエラーが発生しました',
      code: 'UNEXPECTED_ERROR',
      isRetryable: true
    }
  }

  static logError(error: DomainError, context?: Record<string, any>): void {
    const logData = {
      error: error.message,
      code: error.code,
      details: error.details,
      context,
      timestamp: new Date().toISOString(),
      stack: error.stack
    }

    // In production, send to monitoring service
    console.error('Domain Error:', logData)
  }

  static isRetryableError(error: unknown): boolean {
    return error instanceof NetworkError || 
           error instanceof BGGApiError ||
           error instanceof DatabaseError
  }

  static getErrorMetrics(error: DomainError): {
    category: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    alertRequired: boolean
  } {
    switch (true) {
      case error instanceof GameNotFoundError:
      case error instanceof ReviewNotFoundError:
      case error instanceof UserNotFoundError:
        return { category: 'not_found', severity: 'low', alertRequired: false }

      case error instanceof ValidationError:
        return { category: 'validation', severity: 'medium', alertRequired: false }

      case error instanceof UnauthorizedError:
      case error instanceof ForbiddenError:
        return { category: 'auth', severity: 'medium', alertRequired: true }

      case error instanceof NetworkError:
      case error instanceof BGGApiError:
        return { category: 'external_api', severity: 'high', alertRequired: true }

      case error instanceof DatabaseError:
        return { category: 'database', severity: 'critical', alertRequired: true }

      default:
        return { category: 'unknown', severity: 'critical', alertRequired: true }
    }
  }
}