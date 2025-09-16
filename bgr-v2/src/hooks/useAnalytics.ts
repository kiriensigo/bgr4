'use client'

import { useCallback } from 'react'
import { trackEvents } from '@/lib/analytics'

export function useAnalytics() {
  // ゲーム関連のトラッキング
  const trackGameView = useCallback((gameId: number, gameName: string) => {
    trackEvents.gameView(gameId, gameName)
  }, [])

  const trackGameSearch = useCallback((searchTerm: string, resultsCount: number) => {
    trackEvents.gameSearch(searchTerm, resultsCount)
  }, [])

  const trackGameFilter = useCallback((filterType: string, filterValue: string) => {
    trackEvents.gameFilter(filterType, filterValue)
  }, [])

  // レビュー関連のトラッキング
  const trackReviewCreate = useCallback((gameId: number, rating: number) => {
    trackEvents.reviewCreate(gameId, rating)
  }, [])

  const trackReviewView = useCallback((reviewId: number) => {
    trackEvents.reviewView(reviewId)
  }, [])

  const trackReviewLike = useCallback((reviewId: number) => {
    trackEvents.reviewLike(reviewId)
  }, [])

  // コメント関連のトラッキング
  const trackCommentCreate = useCallback((reviewId: number) => {
    trackEvents.commentCreate(reviewId)
  }, [])

  const trackCommentLike = useCallback((commentId: number) => {
    trackEvents.commentLike(commentId)
  }, [])

  // ウィッシュリスト関連のトラッキング
  const trackWishlistAdd = useCallback((gameId: number) => {
    trackEvents.wishlistAdd(gameId)
  }, [])

  const trackWishlistRemove = useCallback((gameId: number) => {
    trackEvents.wishlistRemove(gameId)
  }, [])

  // 認証関連のトラッキング
  const trackUserSignup = useCallback((method: string) => {
    trackEvents.userSignup(method)
  }, [])

  const trackUserLogin = useCallback((method: string) => {
    trackEvents.userLogin(method)
  }, [])

  const trackUserLogout = useCallback(() => {
    trackEvents.userLogout()
  }, [])

  // BGG連携関連のトラッキング
  const trackBggGameImport = useCallback((bggId: number) => {
    trackEvents.bggGameImport(bggId)
  }, [])

  const trackBggSync = useCallback((count: number) => {
    trackEvents.bggSync(count)
  }, [])

  // エラートラッキング
  const trackError = useCallback((errorType: string, errorMessage: string) => {
    trackEvents.error(errorType, errorMessage)
  }, [])

  // パフォーマンストラッキング
  const trackPerformance = useCallback((metric: string, value: number) => {
    trackEvents.performance(metric, value)
  }, [])

  // カスタムイベントトラッキング
  const trackCustomEvent = useCallback((
    action: string,
    category: string,
    label?: string,
    value?: number
  ) => {
    console.log('Custom event tracked:', { action, category, label, value });
    // trackEvents doesn't have a generic event method, so we'll just log for now
  }, [])

  // ページビュー用の便利関数
  const trackPageView = useCallback((pageName: string, additionalData?: Record<string, any>) => {
    trackCustomEvent('page_view', 'navigation', pageName)
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        trackCustomEvent('page_data', 'metadata', `${pageName}_${key}`, 
          typeof value === 'number' ? value : undefined)
      })
    }
  }, [trackCustomEvent])

  // ユーザーアクション用の便利関数
  const trackUserAction = useCallback((action: string, target?: string, value?: number) => {
    trackCustomEvent(action, 'user_action', target, value)
  }, [trackCustomEvent])

  // フォームイベント用の便利関数
  const trackFormEvent = useCallback((
    formName: string, 
    event: 'start' | 'submit' | 'error' | 'abandon',
    errorMessage?: string
  ) => {
    trackCustomEvent(`form_${event}`, 'form_interaction', formName)
    
    if (event === 'error' && errorMessage) {
      trackError('form_error', `${formName}: ${errorMessage}`)
    }
  }, [trackCustomEvent, trackError])

  return {
    // ゲーム関連
    trackGameView,
    trackGameSearch,
    trackGameFilter,
    
    // レビュー関連
    trackReviewCreate,
    trackReviewView,
    trackReviewLike,
    
    // コメント関連
    trackCommentCreate,
    trackCommentLike,
    
    // ウィッシュリスト関連
    trackWishlistAdd,
    trackWishlistRemove,
    
    // 認証関連
    trackUserSignup,
    trackUserLogin,
    trackUserLogout,
    
    // BGG連携関連
    trackBggGameImport,
    trackBggSync,
    
    // エラー・パフォーマンス
    trackError,
    trackPerformance,
    
    // 汎用・便利関数
    trackCustomEvent,
    trackPageView,
    trackUserAction,
    trackFormEvent
  }
}