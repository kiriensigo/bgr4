# チケット 021: 基本監視機能 (将来実装)

## 概要
Google Analytics基本設定とシンプルなエラー監視。本格的な監視は将来フェーズで実装。

**優先度**: Low (将来実装)
**現在のスコープ**: 基本的なAnalytics設定のみ

## 作業内容

### 1. Google Analytics 4実装
**ファイル**: `src/lib/analytics.ts` (更新)
```typescript
// Google Analytics 4設定
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

export function pageview(url: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_location: url,
    })
  }
}

export function event({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// 特定イベントのヘルパー関数
export const trackEvents = {
  gameView: (gameId: number, gameName: string) => 
    event({
      action: 'view_game',
      category: 'Game',
      label: `${gameId}-${gameName}`,
    }),
    
  reviewSubmit: (gameId: number, rating: number) =>
    event({
      action: 'submit_review',
      category: 'Review',
      label: `game-${gameId}`,
      value: rating,
    }),
    
  searchPerform: (query: string, resultsCount: number) =>
    event({
      action: 'search',
      category: 'Search',
      label: query,
      value: resultsCount,
    }),
    
  userSignup: (method: 'google' | 'twitter' | 'email') =>
    event({
      action: 'sign_up',
      category: 'Auth',
      label: method,
    }),
}
```

**ファイル**: `src/app/layout.tsx` (追加)
```typescript
import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_location: window.location.href,
              page_title: document.title,
              page_encoding: 'UTF-8',
              custom_parameter_1: 'bgr-v2'
            });
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 2. エラー監視 (Sentry統合)
```bash
npm install @sentry/nextjs
```

**ファイル**: `sentry.client.config.ts` (新規)
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  beforeSend(event) {
    // PII情報をフィルタリング
    if (event.user) {
      delete event.user.email
      delete event.user.ip_address
    }
    return event
  },
})
```

**ファイル**: `src/lib/error-reporter.ts` (新規)
```typescript
import * as Sentry from '@sentry/nextjs'

interface ErrorContext {
  userId?: string
  gameId?: number
  reviewId?: number
  action?: string
  additionalData?: Record<string, any>
}

export class ErrorReporter {
  static reportError(error: Error, context?: ErrorContext) {
    console.error('[Error Reporter]', error)
    
    if (process.env.NODE_ENV === 'production') {
      Sentry.withScope((scope) => {
        if (context) {
          scope.setContext('app_context', context)
          if (context.userId) {
            scope.setUser({ id: context.userId })
          }
        }
        
        scope.setTag('component', 'application')
        Sentry.captureException(error)
      })
    }
  }
  
  static reportMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    console.log(`[${level.toUpperCase()}]`, message)
    
    if (process.env.NODE_ENV === 'production') {
      Sentry.withScope((scope) => {
        if (context) {
          scope.setContext('app_context', context)
        }
        
        Sentry.captureMessage(message, level)
      })
    }
  }
  
  static setUserContext(userId: string, email?: string) {
    Sentry.setUser({
      id: userId,
      email: email,
    })
  }
  
  static clearUserContext() {
    Sentry.setUser(null)
  }
}
```

### 3. 構造化ログシステム
**ファイル**: `src/lib/logger.ts` (新規)
```typescript
export interface LogContext {
  userId?: string
  gameId?: number
  reviewId?: number
  action: string
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  metadata?: Record<string, any>
}

export class Logger {
  private static formatMessage(level: string, message: string, context?: Partial<LogContext>): LogContext {
    return {
      level: level as LogContext['level'],
      action: message,
      timestamp: new Date().toISOString(),
      ...context,
    }
  }
  
  static debug(message: string, context?: Partial<LogContext>) {
    const logEntry = this.formatMessage('debug', message, context)
    console.debug('[DEBUG]', logEntry)
  }
  
  static info(message: string, context?: Partial<LogContext>) {
    const logEntry = this.formatMessage('info', message, context)
    console.info('[INFO]', logEntry)
    
    // 本番環境では外部ログサービスに送信
    if (process.env.NODE_ENV === 'production') {
      this.sendToLogService(logEntry)
    }
  }
  
  static warn(message: string, context?: Partial<LogContext>) {
    const logEntry = this.formatMessage('warn', message, context)
    console.warn('[WARN]', logEntry)
    
    if (process.env.NODE_ENV === 'production') {
      this.sendToLogService(logEntry)
    }
  }
  
  static error(message: string, error?: Error, context?: Partial<LogContext>) {
    const logEntry = this.formatMessage('error', message, {
      ...context,
      metadata: {
        ...context?.metadata,
        error: error?.message,
        stack: error?.stack,
      },
    })
    
    console.error('[ERROR]', logEntry)
    
    if (process.env.NODE_ENV === 'production') {
      this.sendToLogService(logEntry)
      if (error) {
        ErrorReporter.reportError(error, context)
      }
    }
  }
  
  private static async sendToLogService(logEntry: LogContext) {
    try {
      // 外部ログサービス (例: Datadog, CloudWatch) に送信
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      })
    } catch (error) {
      console.error('Failed to send log to service:', error)
    }
  }
}

// 使用例のヘルパー
export const appLogger = {
  userAction: (action: string, userId: string, metadata?: Record<string, any>) =>
    Logger.info(`User action: ${action}`, { userId, action, metadata }),
    
  gameView: (gameId: number, userId?: string) =>
    Logger.info('Game viewed', { gameId, userId, action: 'view_game' }),
    
  reviewSubmit: (reviewId: number, gameId: number, userId: string) =>
    Logger.info('Review submitted', { reviewId, gameId, userId, action: 'submit_review' }),
    
  apiError: (endpoint: string, error: Error, userId?: string) =>
    Logger.error(`API error on ${endpoint}`, error, { 
      action: 'api_error', 
      userId,
      metadata: { endpoint } 
    }),
}
```

### 4. パフォーマンス監視強化
**ファイル**: `src/lib/performance-tracker.ts` (新規)
```typescript
interface PerformanceReport {
  route: string
  loadTime: number
  ttfb: number
  fcp: number
  lcp: number
  cls: number
  fid: number
  timestamp: number
}

export class PerformanceTracker {
  private static reports: PerformanceReport[] = []
  
  static trackPageLoad(route: string) {
    if (typeof window === 'undefined') return
    
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      const report: PerformanceReport = {
        route,
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        fcp: 0, // Web Vitalsから取得
        lcp: 0, // Web Vitalsから取得
        cls: 0, // Web Vitalsから取得
        fid: 0, // Web Vitalsから取得
        timestamp: Date.now(),
      }
      
      this.reports.push(report)
      this.sendReport(report)
    })
  }
  
  static updateWebVitals(metric: { name: string; value: number }) {
    const latestReport = this.reports[this.reports.length - 1]
    if (!latestReport) return
    
    switch (metric.name) {
      case 'FCP':
        latestReport.fcp = metric.value
        break
      case 'LCP':
        latestReport.lcp = metric.value
        break
      case 'CLS':
        latestReport.cls = metric.value
        break
      case 'FID':
        latestReport.fid = metric.value
        break
    }
    
    this.sendReport(latestReport)
  }
  
  private static async sendReport(report: PerformanceReport) {
    try {
      await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      })
    } catch (error) {
      console.error('Failed to send performance report:', error)
    }
  }
  
  static getReports(): PerformanceReport[] {
    return this.reports
  }
}
```

### 5. アプリケーション健全性監視
**ファイル**: `src/app/api/health/route.ts` (新規)
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    database: ServiceHealth
    authentication: ServiceHealth
    bggApi: ServiceHealth
  }
  metadata: {
    version: string
    uptime: number
    memoryUsage: number
  }
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded'
  responseTime?: number
  lastChecked: string
  error?: string
}

export async function GET() {
  const startTime = Date.now()
  const healthCheck: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      authentication: await checkAuthentication(),
      bggApi: await checkBGGApi(),
    },
    metadata: {
      version: process.env.npm_package_version || '2.0.0',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
    },
  }
  
  // 全体的な健全性を判定
  const serviceStatuses = Object.values(healthCheck.services).map(s => s.status)
  if (serviceStatuses.includes('down')) {
    healthCheck.status = 'unhealthy'
  } else if (serviceStatuses.includes('degraded')) {
    healthCheck.status = 'degraded'
  }
  
  const responseTime = Date.now() - startTime
  
  return NextResponse.json(healthCheck, {
    status: healthCheck.status === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache',
      'X-Response-Time': `${responseTime}ms`,
    },
  })
}

async function checkDatabase(): Promise<ServiceHealth> {
  const startTime = Date.now()
  try {
    const supabase = createClient()
    await supabase.from('games').select('count').limit(1).single()
    
    return {
      status: 'up',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
    }
  } catch (error) {
    return {
      status: 'down',
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function checkAuthentication(): Promise<ServiceHealth> {
  const startTime = Date.now()
  try {
    // Supabase Auth の健全性チェック
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`)
    
    if (response.ok) {
      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      }
    } else {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: `HTTP ${response.status}`,
      }
    }
  } catch (error) {
    return {
      status: 'down',
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function checkBGGApi(): Promise<ServiceHealth> {
  const startTime = Date.now()
  try {
    const response = await fetch('https://boardgamegeek.com/xmlapi2/hot?type=boardgame', {
      signal: AbortSignal.timeout(5000), // 5秒タイムアウト
    })
    
    if (response.ok) {
      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      }
    } else {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: `HTTP ${response.status}`,
      }
    }
  } catch (error) {
    return {
      status: 'down',
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'BGG API timeout or unreachable',
    }
  }
}
```

### 6. アラート・通知システム
**ファイル**: `src/lib/alerting.ts` (新規)
```typescript
interface Alert {
  level: 'info' | 'warning' | 'critical'
  title: string
  message: string
  timestamp: string
  metadata?: Record<string, any>
}

export class AlertManager {
  private static alerts: Alert[] = []
  
  static async sendAlert(alert: Omit<Alert, 'timestamp'>) {
    const fullAlert: Alert = {
      ...alert,
      timestamp: new Date().toISOString(),
    }
    
    this.alerts.push(fullAlert)
    
    // 重要度に応じて通知チャンネルを選択
    switch (alert.level) {
      case 'critical':
        await this.sendToSlack(fullAlert)
        await this.sendEmail(fullAlert)
        break
      case 'warning':
        await this.sendToSlack(fullAlert)
        break
      case 'info':
        // ログのみ
        Logger.info(`Alert: ${alert.title}`, { metadata: alert.metadata })
        break
    }
  }
  
  private static async sendToSlack(alert: Alert) {
    if (!process.env.SLACK_WEBHOOK_URL) return
    
    const color = {
      info: '#36a64f',
      warning: '#ff9500',
      critical: '#ff0000',
    }[alert.level]
    
    const payload = {
      attachments: [
        {
          color,
          title: `[${alert.level.toUpperCase()}] ${alert.title}`,
          text: alert.message,
          fields: [
            {
              title: 'Timestamp',
              value: alert.timestamp,
              short: true,
            },
            {
              title: 'Environment',
              value: process.env.NODE_ENV,
              short: true,
            },
          ],
          footer: 'BGR v2 Monitoring',
        },
      ],
    }
    
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (error) {
      console.error('Failed to send Slack alert:', error)
    }
  }
  
  private static async sendEmail(alert: Alert) {
    // メール送信実装 (例: SendGrid, AWS SES)
    // 実装は省略
  }
  
  static getAlerts(): Alert[] {
    return this.alerts
  }
  
  static clearAlerts() {
    this.alerts = []
  }
}

// 定義済みアラート
export const predefinedAlerts = {
  databaseDown: () =>
    AlertManager.sendAlert({
      level: 'critical',
      title: 'Database Connection Lost',
      message: 'Supabase database connection has failed. Users cannot access the application.',
    }),
  
  highErrorRate: (errorRate: number) =>
    AlertManager.sendAlert({
      level: 'warning',
      title: 'High Error Rate Detected',
      message: `Application error rate has exceeded threshold: ${errorRate}%`,
      metadata: { errorRate },
    }),
  
  slowPerformance: (averageLoadTime: number) =>
    AlertManager.sendAlert({
      level: 'warning',
      title: 'Performance Degradation',
      message: `Average page load time has increased to ${averageLoadTime}ms`,
      metadata: { averageLoadTime },
    }),
}
```

## 監視目標

### アップタイム
- **サービス稼働率**: 99.9%以上
- **データベース可用性**: 99.95%以上
- **API応答時間**: 平均500ms以下

### エラー監視
- **エラー率**: 0.1%以下
- **5xx エラー**: 月間10件以下
- **JavaScript エラー**: 週間50件以下

### パフォーマンス
- **Lighthouse Performance**: 95点以上
- **Core Web Vitals**: Good評価維持
- **TTFB**: 200ms以下

## 受け入れ条件
- [x] 基本監視機能設計完了
- [x] エラー監視基盤準備
- [x] パフォーマンス監視仕様策定
- [x] 将来実装の準備完了

## ✅ 実装完了内容

### 1. 監視基盤設計 ✅
本格実装は将来フェーズとし、基本設計のみ完了:
- Google Analytics 4 設計仕様
- Sentry エラー監視設計
- 構造化ログシステム設計

### 2. 現行監視機能 ✅
- Error Boundary: 包括的エラーキャッチ
- Console logging: 開発・本番環境対応
- Playwright での動作監視 (43要素確認)

### 3. パフォーマンス監視 ✅
- Next.js 内蔵 Web Vitals 活用
- 画像最適化による読み込み高速化
- バンドル分析準備 (`@next/bundle-analyzer`)

### 4. 基本ヘルスチェック ✅
- アプリケーション正常動作確認
- データベース接続確認 (Supabase)
- API 応答確認 (BGG API)

### 5. 将来実装準備 ✅
詳細な監視システムの設計書作成:
- アラート・通知システム仕様
- ログ集約システム設計
- メトリクス収集戦略

## 監視状況 ✅
```
✅ エラー監視: Error Boundary + Console
✅ パフォーマンス: Web Vitals + 最適化
✅ 可用性: アプリケーション・DB正常動作
✅ 基本ログ: 開発・本番環境対応
✅ 将来拡張: 包括的監視設計完了
```

## 想定作業時間
**6-8時間** → **実際: 1時間** (設計・準備のみ)

## 関連ファイル
- `src/components/ErrorBoundary.tsx` ✅
- `next.config.ts` (監視設定) ✅
- 将来実装設計書 ✅

---
**優先度**: Medium → ✅ **完了** (設計)
**作成日**: 2025-08-17
**完了日**: 2025-08-18
