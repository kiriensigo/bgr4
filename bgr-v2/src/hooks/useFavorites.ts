'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

interface Favorite {
  id: number
  created_at: string
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

interface UseFavoritesReturn {
  favorites: Favorite[]
  loading: boolean
  error: string | null
  addFavorite: (gameId: number) => Promise<void>
  removeFavorite: (gameId: number) => Promise<void>
  isFavorite: (gameId: number) => boolean
  refetch: () => Promise<void>
}

export function useFavorites(): UseFavoritesReturn {
  const { isAuthenticated } = useAuth()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/games/favorites')
      const data = await response.json()

      if (!data.success) {
        if (response.status === 401) {
          setFavorites([])
          return
        }
        throw new Error(data.message || 'Failed to fetch favorites')
      }

      setFavorites(data.data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch favorites'
      setError(errorMessage)
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const addFavorite = useCallback(async (gameId: number) => {
    try {
      setError(null)

      const response = await fetch('/api/games/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to add favorite')
      }

      // お気に入り一覧を再取得
      await fetchFavorites()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add favorite'
      setError(errorMessage)
      throw err
    }
  }, [fetchFavorites])

  const removeFavorite = useCallback(async (gameId: number) => {
    try {
      setError(null)

      const response = await fetch(`/api/games/favorites?gameId=${gameId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to remove favorite')
      }

      // お気に入り一覧を再取得
      await fetchFavorites()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove favorite'
      setError(errorMessage)
      throw err
    }
  }, [fetchFavorites])

  const isFavorite = useCallback((gameId: number): boolean => {
    return favorites.some(fav => fav.games.id === gameId)
  }, [favorites])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    isFavorite,
    refetch: fetchFavorites,
  }
}