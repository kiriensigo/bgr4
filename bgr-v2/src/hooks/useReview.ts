'use client'

import { useState, useEffect } from 'react'

interface ReviewDetail {
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
    description: string | null
    year_published: number | null
    min_players: number | null
    max_players: number | null
    playing_time: number | null
    image_url: string | null
    thumbnail_url: string | null
    rating_average: number | null
    rating_count: number
  }
}

interface UseReviewReturn {
  review: ReviewDetail | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useReview(reviewId: number | null): UseReviewReturn {
  const [review, setReview] = useState<ReviewDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReview = async (id: number) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/reviews/${id}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch review')
      }

      setReview(data.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch review'
      setError(errorMessage)
      setReview(null)
    } finally {
      setLoading(false)
    }
  }

  const refetch = async () => {
    if (reviewId) {
      await fetchReview(reviewId)
    }
  }

  useEffect(() => {
    if (reviewId) {
      fetchReview(reviewId)
    } else {
      setReview(null)
      setError(null)
    }
  }, [reviewId])

  return {
    review,
    loading,
    error,
    refetch,
  }
}