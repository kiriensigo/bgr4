'use client'

import { useState, useEffect, useCallback } from 'react'
// Mock toast implementation for build compatibility
const useToast = () => ({
  toast: (options: { title: string; description?: string; variant?: string }) => {
    console.log('Toast:', options)
  }
})

export interface WeightedScoreData {
  game_id: number
  simple_average: number
  weighted_score: number
  confidence_level: number
  total_reviews: number
  weighted_reviews: number
  methodology: 'weighted_algorithm' | 'insufficient_data'
  score_breakdown?: {
    weights_used: any
    review_weights: Array<{
      review_id: number
      rating: number
      weight: number
      factors: {
        user_weight: number
        quality_weight: number
        likes_weight: number
        user_review_count: number
        content_length: number
        likes_count: number
        is_admin: boolean
      }
    }>
  }
}

interface UseWeightedScoreReturn {
  scoreData: WeightedScoreData | null
  loading: boolean
  error: string | null
  updateScore: () => Promise<boolean>
  refetch: () => Promise<void>
}

export function useWeightedScore(gameId: number): UseWeightedScoreReturn {
  const [scoreData, setScoreData] = useState<WeightedScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const fetchScore = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/games/${gameId}/weighted-score`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch weighted score')
      }

      if (result.success) {
        setScoreData(result.data)
      } else {
        throw new Error(result.message || 'Failed to fetch weighted score')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch weighted score'
      setError(errorMessage)
      toast({
        title: 'エラー',
        description: '重み付きスコアの読み込みに失敗しました',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [gameId, toast])

  const updateScore = useCallback(async (): Promise<boolean> => {
    if (isUpdating) return false

    try {
      setIsUpdating(true)
      setError(null)

      const response = await fetch(`/api/games/${gameId}/weighted-score/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update weighted score')
      }

      if (result.success) {
        setScoreData(result.data)
        toast({
          title: '成功',
          description: '重み付きスコアを更新しました',
        })
        return true
      } else {
        throw new Error(result.message || 'Failed to update weighted score')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update weighted score'
      setError(errorMessage)
      toast({
        title: 'エラー',
        description: '重み付きスコアの更新に失敗しました',
        variant: 'destructive'
      })
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [gameId, isUpdating, toast])

  const refetch = useCallback(async () => {
    await fetchScore()
  }, [fetchScore])

  useEffect(() => {
    fetchScore()
  }, [fetchScore])

  return {
    scoreData,
    loading,
    error,
    updateScore,
    refetch
  }
}