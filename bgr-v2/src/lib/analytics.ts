'use client'

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date | object,
      config?: object
    ) => void
    dataLayer: any[]
  }
}

// Google Analytics ID
export const GA_TRACKING_ID = process.env['NEXT_PUBLIC_GA_ID']

// Google Analytics がロードされているかチェック
export const isGAEnabled = !!GA_TRACKING_ID && typeof window !== 'undefined'

// ページビューを送信
export const pageview = (url: string): void => {
  if (!isGAEnabled) return
  
  window.gtag('config', GA_TRACKING_ID!, {
    page_location: url,
  })
}

// イベントを送信
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}): void => {
  if (!isGAEnabled) return

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

// カスタムイベント定義
export const trackEvents = {
  // ゲーム関連
  gameView: (gameId: number, gameName: string) => {
    event({
      action: 'view_game',
      category: 'game',
      label: `${gameId}-${gameName}`,
    })
  },

  gameSearch: (searchTerm: string, resultsCount: number) => {
    event({
      action: 'search_game',
      category: 'search',
      label: searchTerm,
      value: resultsCount,
    })
  },

  gameFilter: (filterType: string, filterValue: string) => {
    event({
      action: 'filter_game',
      category: 'search',
      label: `${filterType}:${filterValue}`,
    })
  },

  // レビュー関連
  reviewCreate: (gameId: number, rating: number) => {
    event({
      action: 'create_review',
      category: 'review',
      label: `game-${gameId}`,
      value: rating,
    })
  },

  reviewView: (reviewId: number) => {
    event({
      action: 'view_review',
      category: 'review',
      label: `review-${reviewId}`,
    })
  },

  reviewLike: (reviewId: number) => {
    event({
      action: 'like_review',
      category: 'engagement',
      label: `review-${reviewId}`,
    })
  },

  // コメント関連
  commentCreate: (reviewId: number) => {
    event({
      action: 'create_comment',
      category: 'engagement',
      label: `review-${reviewId}`,
    })
  },

  commentLike: (commentId: number) => {
    event({
      action: 'like_comment',
      category: 'engagement',
      label: `comment-${commentId}`,
    })
  },

  // ウィッシュリスト関連
  wishlistAdd: (gameId: number) => {
    event({
      action: 'add_to_wishlist',
      category: 'wishlist',
      label: `game-${gameId}`,
    })
  },

  wishlistRemove: (gameId: number) => {
    event({
      action: 'remove_from_wishlist',
      category: 'wishlist',
      label: `game-${gameId}`,
    })
  },

  // 認証関連
  userSignup: (method: string) => {
    event({
      action: 'sign_up',
      category: 'auth',
      label: method,
    })
  },

  userLogin: (method: string) => {
    event({
      action: 'login',
      category: 'auth',
      label: method,
    })
  },

  userLogout: () => {
    event({
      action: 'logout',
      category: 'auth',
    })
  },

  // BGG連携関連
  bggGameImport: (bggId: number) => {
    event({
      action: 'import_bgg_game',
      category: 'admin',
      label: `bgg-${bggId}`,
    })
  },

  bggSync: (count: number) => {
    event({
      action: 'bgg_sync',
      category: 'admin',
      value: count,
    })
  },

  // エラー関連
  error: (errorType: string, errorMessage: string) => {
    event({
      action: 'error',
      category: 'error',
      label: `${errorType}: ${errorMessage}`,
    })
  },

  // パフォーマンス関連
  performance: (metric: string, value: number) => {
    event({
      action: 'performance_metric',
      category: 'performance',
      label: metric,
      value: Math.round(value),
    })
  },
}

// Core Web Vitals の測定
export const reportWebVitals = ({ id, name, value }: any): void => {
  if (!isGAEnabled) return

  window.gtag('event', name, {
    event_category: 'Web Vitals',
    event_label: id,
    value: Math.round(value),
    non_interaction: true,
  })
}

// ユーザープロパティ設定
export const setUserProperties = (properties: Record<string, string | number>): void => {
  if (!isGAEnabled) return

  window.gtag('set', properties)
}

// セッション開始時の設定
export const initializeAnalytics = (userId?: string): void => {
  if (!isGAEnabled) return

  // ユーザーIDがある場合は設定
  if (userId) {
    window.gtag('config', GA_TRACKING_ID!, {
      user_id: userId,
    })
  }

  // カスタムディメンション設定（必要に応じて）
  setUserProperties({
    app_version: process.env['NEXT_PUBLIC_APP_VERSION'] || 'unknown',
    environment: process.env['NODE_ENV'] || 'development',
  })
}