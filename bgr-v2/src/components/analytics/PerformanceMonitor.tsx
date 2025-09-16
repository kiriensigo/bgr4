'use client'

import { useEffect } from 'react'
import { reportWebVitals, trackEvents } from '@/lib/analytics'

export function PerformanceMonitor() {
  useEffect(() => {
    // Web Vitals の測定
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // LCP (Largest Contentful Paint)
          if (entry.entryType === 'largest-contentful-paint') {
            reportWebVitals({
              id: entry.name,
              name: 'LCP',
              value: entry.startTime
            })
          }
          
          // FID (First Input Delay)
          if (entry.entryType === 'first-input') {
            reportWebVitals({
              id: entry.name,
              name: 'FID',
              value: (entry as any).processingStart - entry.startTime
            })
          }
          
          // CLS (Cumulative Layout Shift)
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            reportWebVitals({
              id: entry.name,
              name: 'CLS',
              value: (entry as any).value
            })
          }
        })
      })

      try {
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
      } catch (e) {
        // ブラウザが対応していない場合は無視
        console.warn('Performance observer not supported:', e)
      }

      // Navigation timing
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (perfData) {
          // Page load time
          const loadTime = perfData.loadEventEnd - perfData.fetchStart
          trackEvents.performance('page_load_time', loadTime)
          
          // DOM ready time
          const domReadyTime = perfData.domContentLoadedEventEnd - perfData.fetchStart
          trackEvents.performance('dom_ready_time', domReadyTime)
          
          // First byte time
          const ttfb = perfData.responseStart - perfData.fetchStart
          trackEvents.performance('time_to_first_byte', ttfb)
        }
      })

      // Resource timing
      const measureResourceTiming = () => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
        
        resources.forEach((resource) => {
          const loadTime = resource.responseEnd - resource.fetchStart
          
          if (resource.name.includes('/api/')) {
            trackEvents.performance('api_response_time', loadTime)
          } else if (resource.name.match(/\.(js|css|woff|woff2)$/)) {
            trackEvents.performance('asset_load_time', loadTime)
          } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
            trackEvents.performance('image_load_time', loadTime)
          }
        })
      }

      // 定期的にリソースタイミングを測定
      const resourceTimer = setInterval(measureResourceTiming, 30000) // 30秒ごと

      // エラー監視
      window.addEventListener('error', (event) => {
        trackEvents.error('javascript_error', event.message)
      })

      window.addEventListener('unhandledrejection', (event) => {
        trackEvents.error('promise_rejection', event.reason?.toString() || 'Unknown promise rejection')
      })

      // ユーザーエンゲージメント測定
      let startTime = Date.now()
      let isVisible = true

      const handleVisibilityChange = () => {
        if (document.hidden) {
          // ページが非表示になった時
          if (isVisible) {
            const sessionTime = Date.now() - startTime
            trackEvents.performance('session_duration', sessionTime)
            isVisible = false
          }
        } else {
          // ページが再表示された時
          startTime = Date.now()
          isVisible = true
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      // クリーンアップ
      return () => {
        observer?.disconnect()
        clearInterval(resourceTimer)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
    
    // Return undefined if window is not available
    return undefined
  }, [])

  return null // このコンポーネントは何もレンダリングしない
}