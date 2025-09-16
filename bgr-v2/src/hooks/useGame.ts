'use client'

import { useState, useEffect } from 'react'
import type { Game } from '@/types'

interface UseGameReturn {
  game: Game | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useGame(gameId: number | null): UseGameReturn {
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGame = async (id: number) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/games/${id}`)
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