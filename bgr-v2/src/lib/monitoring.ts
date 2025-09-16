'use client'

import { trackEvents } from '@/lib/analytics'

// エラー監視クラス
export class ErrorMonitor {
  private static instance: ErrorMonitor
  private errorCount = 0
  private readonly maxErrors = 10
  private readonly timeWindow = 5 * 60 * 1000 // 5分

  private constructor() {
    this.initialize()
  }

  public static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor()
    }
    return ErrorMonitor.instance
  }

  private initialize() {
    if (typeof window === 'undefined') return

    // JavaScript エラーの監視
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
    })

    // Promise rejection の監視
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'promise_rejection',
        message: event.reason?.toString() || 'Unhandled Promise Rejection',
        stack: event.reason?.stack
      })
    })

    // ネットワークエラーの監視
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        
        if (!response.ok) {
          this.handleError({
            type: 'network_error',
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: args[0]?.toString(),
            status: response.status
          })
        }
        
        return response
      } catch (error) {
        this.handleError({
          type: 'network_error',
          message: error instanceof Error ? error.message : 'Network request failed',
          url: args[0]?.toString()
        })
        throw error
      }
    }
  }

  private handleError(errorData: {
    type: string
    message: string
    filename?: string
    lineno?: number
    colno?: number
    stack?: string
    url?: string
    status?: number
  }) {
    // エラー頻度制限
    this.errorCount++
    if (this.errorCount > this.maxErrors) {
      console.warn('Too many errors reported, throttling...')
      return
    }

    // 5分後にカウンターをリセット
    setTimeout(() => {
      this.errorCount = Math.max(0, this.errorCount - 1)
    }, this.timeWindow)

    // アナリティクスに送信
    trackEvents.error(errorData.type, errorData.message)

    // 開発環境では詳細をログ出力
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', errorData)
    }

    // 重要なエラーの場合は追加の処理
    if (this.isCriticalError(errorData)) {
      this.handleCriticalError(errorData)
    }
  }

  private isCriticalError(errorData: { type: string; message: string }): boolean {
    const criticalPatterns = [
      /network.*failed/i,
      /authentication.*failed/i,
      /permission.*denied/i,
      /server.*error/i
    ]
    
    return criticalPatterns.some(pattern => 
      pattern.test(errorData.message) || pattern.test(errorData.type)
    )
  }

  private handleCriticalError(errorData: any) {
    // 重要なエラーの場合の追加処理
    console.error('Critical error detected:', errorData)
    
    // 必要に応じてユーザーに通知
    // this.notifyUser('重要なエラーが発生しました。ページを再読み込みしてください。')
  }

  public reportError(error: Error, context?: string) {
    this.handleError({
      type: 'manual_error',
      message: error.message,
      stack: error.stack,
      ...(context && { context })
    })
  }
}

// パフォーマンス監視クラス
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  private constructor() {
    this.initialize()
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private initialize() {
    if (typeof window === 'undefined' || !('performance' in window)) return

    // メモリ使用量の監視
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        this.recordMetric('memory_used', memory.usedJSHeapSize)
        this.recordMetric('memory_total', memory.totalJSHeapSize)
        this.recordMetric('memory_limit', memory.jsHeapSizeLimit)
      }
    }, 30000) // 30秒ごと

    // Connection 情報の監視
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        this.recordMetric('connection_downlink', connection.downlink)
        this.recordMetric('connection_rtt', connection.rtt)
        
        connection.addEventListener('change', () => {
          this.recordMetric('connection_downlink', connection.downlink)
          this.recordMetric('connection_rtt', connection.rtt)
        })
      }
    }
  }

  public recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const values = this.metrics.get(name)!
    values.push(value)
    
    // 直近100件のみ保持
    if (values.length > 100) {
      values.shift()
    }
    
    // アナリティクスに送信
    trackEvents.performance(name, value)
  }

  public measureAsyncOperation<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    
    return operation().then(
      (result) => {
        const duration = performance.now() - startTime
        this.recordMetric(`${name}_duration`, duration)
        return result
      },
      (error) => {
        const duration = performance.now() - startTime
        this.recordMetric(`${name}_error_duration`, duration)
        throw error
      }
    )
  }

  public getMetricSummary(name: string) {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) return null

    const sorted = [...values].sort((a, b) => a - b)
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p95: sorted[Math.floor(sorted.length * 0.95)]
    }
  }
}

// 使用状況監視クラス
export class UsageMonitor {
  private static instance: UsageMonitor
  private pageViews: Map<string, number> = new Map()
  private userActions: Map<string, number> = new Map()
  private sessionStart = Date.now()

  private constructor() {
    this.initialize()
  }

  public static getInstance(): UsageMonitor {
    if (!UsageMonitor.instance) {
      UsageMonitor.instance = new UsageMonitor()
    }
    return UsageMonitor.instance
  }

  private initialize() {
    if (typeof window === 'undefined') return

    // ページ離脱時にセッション情報を送信
    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - this.sessionStart
      trackEvents.performance('session_duration', sessionDuration)
      
      // セッション統計を送信
      this.sendSessionStats()
    })

    // visibilitychange イベントでタブの切り替えを監視
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        trackEvents.performance('tab_hidden', Date.now() - this.sessionStart)
      } else {
        trackEvents.performance('tab_visible', Date.now() - this.sessionStart)
      }
    })
  }

  public trackPageView(path: string) {
    const count = this.pageViews.get(path) || 0
    this.pageViews.set(path, count + 1)
    
    trackEvents.performance('page_view_count', count + 1)
  }

  public trackUserAction(action: string) {
    const count = this.userActions.get(action) || 0
    this.userActions.set(action, count + 1)
    
    trackEvents.performance('user_action_count', count + 1)
  }

  private sendSessionStats() {
    // ページビュー統計
    for (const [path, count] of this.pageViews) {
      trackEvents.performance(`pageviews_${path.replace(/\//g, '_')}`, count)
    }
    
    // ユーザーアクション統計
    for (const [action, count] of this.userActions) {
      trackEvents.performance(`actions_${action}`, count)
    }
  }

  public getSessionStats() {
    return {
      duration: Date.now() - this.sessionStart,
      pageViews: Object.fromEntries(this.pageViews),
      userActions: Object.fromEntries(this.userActions)
    }
  }
}

// 統一された監視システムの初期化
export function initializeMonitoring() {
  if (typeof window === 'undefined') return

  ErrorMonitor.getInstance()
  PerformanceMonitor.getInstance()
  UsageMonitor.getInstance()
  
  console.log('Monitoring systems initialized')
}

// 便利な関数をエクスポート
export const errorMonitor = ErrorMonitor.getInstance()
export const performanceMonitor = PerformanceMonitor.getInstance()
export const usageMonitor = UsageMonitor.getInstance()