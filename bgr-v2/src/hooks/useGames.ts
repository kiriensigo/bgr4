'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Game } from '@/types'

interface UseGamesParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  category?: string
  minPlayers?: number
  maxPlayers?: number
  minPlayingTime?: number
  maxPlayingTime?: number
  yearFrom?: number
  yearTo?: number
}

interface UseGamesReturn {
  games: Game[]
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

export function useGames(params: UseGamesParams = {}): UseGamesReturn {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  } | null>(null)

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.sortBy) searchParams.set('sortBy', params.sortBy)
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)
      if (params.category) searchParams.set('category', params.category)
      if (params.minPlayers) searchParams.set('minPlayers', params.minPlayers.toString())
      if (params.maxPlayers) searchParams.set('maxPlayers', params.maxPlayers.toString())
      if (params.minPlayingTime) searchParams.set('minPlayingTime', params.minPlayingTime.toString())
      if (params.maxPlayingTime) searchParams.set('maxPlayingTime', params.maxPlayingTime.toString())
      if (params.yearFrom) searchParams.set('yearFrom', params.yearFrom.toString())
      if (params.yearTo) searchParams.set('yearTo', params.yearTo.toString())

      const response = await fetch(`/api/games?${searchParams}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      console.log('🔍 API Response:', data)
      console.log('🎮 Games data:', data.games)

      if (data.error) {
        throw new Error(data.error)
      }

      setGames(data.games || [])
      setPagination({
        page: data.page || 1,
        limit: data.limit || 20,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
        hasNext: (data.page || 1) < (data.totalPages || 0),
        hasPrev: (data.page || 1) > 1
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch games'
      setError(errorMessage)
      setGames([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [
    params.page,
    params.limit,
    params.sortBy,
    params.sortOrder,
    params.category,
    params.minPlayers,
    params.maxPlayers,
    params.minPlayingTime,
    params.maxPlayingTime,
    params.yearFrom,
    params.yearTo,
  ])

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  return {
    games,
    loading,
    error,
    pagination,
    refetch: fetchGames,
  }
}