'use client'

import { useState, useEffect } from 'react'
import { EnhancedReview } from '@/types/enhanced-review'

interface PopularGame {
  id: number
  name: string
  japanese_name?: string
  year_published?: number
  min_players?: number
  max_players?: number
  playing_time?: number
  image_url?: string
  mechanics?: string[]
  categories?: string[]
  stats: {
    review_count: number
    avg_rating: number
    popularity_score: number
  }
}

interface HomeStats {
  totalReviews: number
  totalGames: number
  activeReviewers: number
  averageRating: number
  reviewsThisMonth: number
  detailedReviews: number
}

interface HomeData {
  stats: HomeStats | null
  recentReviews: EnhancedReview[]
  popularGames: PopularGame[]
  loading: boolean
  error: string | null
}

export function useHomeData(): HomeData {
  const [homeData, setHomeData] = useState<HomeData>({
    stats: null,
    recentReviews: [],
    popularGames: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    async function fetchHomeData() {
      try {
        // 5秒のタイムアウトを設定（Mobile Safariの互換性向上）
        timeoutId = setTimeout(() => {
          console.warn('Home data fetch timeout, using fallback')
          setHomeData({
            stats: {
              totalReviews: 0,
              totalGames: 0,
              activeReviewers: 0,
              averageRating: 0,
              reviewsThisMonth: 0,
              detailedReviews: 0
            },
            recentReviews: [],
            popularGames: [],
            loading: false,
            error: null
          })
        }, 5000)

        const controller = new AbortController()
        const signal = controller.signal

        const [statsResponse, reviewsResponse, gamesResponse] = await Promise.all([
          fetch('/api/home/stats', { signal }),
          fetch('/api/home/recent-reviews', { signal }),
          fetch('/api/home/popular-games', { signal })
        ])

        // タイムアウトをクリア
        clearTimeout(timeoutId)

        const [statsData, reviewsData, gamesData] = await Promise.all([
          statsResponse.json(),
          reviewsResponse.json(),
          gamesResponse.json()
        ])

        setHomeData({
          stats: statsData.success ? statsData.data : null,
          recentReviews: reviewsData.success ? reviewsData.data : [],
          popularGames: gamesData.success ? gamesData.data : [],
          loading: false,
          error: null
        })

      } catch (error) {
        clearTimeout(timeoutId)
        console.error('Failed to fetch home data:', error)
        setHomeData(prev => ({
          ...prev,
          loading: false,
          error: 'データの取得に失敗しました'
        }))
      }
    }

    fetchHomeData()

    // クリーンアップ
    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  return homeData
}