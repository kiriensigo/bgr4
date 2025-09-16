'use client'

import { useState, useEffect, useCallback } from 'react'

interface Review {
  id: number
  title: string
  content: string
  rating: number
  pros: string[]
  cons: string[]
  is_published: boolean
  created_at: string
  updated_at: string
  profiles: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  }
  games: {
    id: number
    name: string
    image_url: string | null
    thumbnail_url: string | null
  }
}

interface UseReviewsParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  gameId?: number
  userId?: string
  rating?: number
}

interface UseReviewsReturn {
  reviews: Review[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  } | null
  refetch: () => Promise<void>
}

export function useReviews(params: UseReviewsParams = {}): UseReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState(null)

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.sortBy) searchParams.set('sortBy', params.sortBy)
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)
      if (params.gameId) searchParams.set('gameId', params.gameId.toString())
      if (params.userId) searchParams.set('userId', params.userId)
      if (params.rating) searchParams.set('rating', params.rating.toString())

      const response = await fetch(`/api/reviews?${searchParams}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch reviews')
      }

      setReviews(data.data || [])
      setPagination(data.pagination || null)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reviews'
      setError(errorMessage)
      setReviews([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [
    params.page,
    params.limit,
    params.sortBy,
    params.sortOrder,
    params.gameId,
    params.userId,
    params.rating,
  ])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  return {
    reviews,
    loading,
    error,
    pagination,
    refetch: fetchReviews,
  }
}