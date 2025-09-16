'use client'

import { useState, useEffect } from 'react'
import type { BGGGameDetail } from '@/types/bgg'

interface UseBGGGameReturn {
  game: BGGGameDetail | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBGGGame(gameId: number | null): UseBGGGameReturn {
  const [game, setGame] = useState<BGGGameDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGame = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/bgg/game/${id}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch game')
      }
      
      setGame(data.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch game'
      setError(errorMessage)
      setGame(null)
    } finally {
      setLoading(false)
    }
  }

  const refetch = async () => {
    if (gameId) {
      await fetchGame(gameId)
    }
  }

  useEffect(() => {
    if (gameId) {
      fetchGame(gameId)
    } else {
      setGame(null)
      setError(null)
    }
  }, [gameId])

  return {
    game,
    loading,
    error,
    refetch,
  }
}