'use client'

import { useState, useCallback } from 'react'
import type { Game } from '@/types'

interface UseGameSearchReturn {
  results: Game[]
  loading: boolean
  error: string | null
  search: (query: string, limit?: number) => Promise<void>
  clearResults: () => void
}

export function useGameSearch(): UseGameSearchReturn {
  const [results, setResults] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string, limit = 20) => {
    if (!query.trim()) {
      setResults([])
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams({
        q: query.trim(),
        limit: limit.toString(),
      })

      const response = await fetch(`/api/games/search?${searchParams}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Search failed')
      }

      setResults(data.data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  }
}