'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BGGSearchResult } from '@/types/bgg'

interface UseBGGHotReturn {
  hotGames: BGGSearchResult[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBGGHot(): UseBGGHotReturn {
  const [hotGames, setHotGames] = useState<BGGSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHotGames = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/bgg/hot')
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch hot games')
      }
      
      setHotGames(data.data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch hot games'
      setError(errorMessage)
      setHotGames([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHotGames()
  }, [fetchHotGames])

  return {
    hotGames,
    loading,
    error,
    refetch: fetchHotGames,
  }
}