'use client'

import { useState, useCallback } from 'react'
import type { BGGSearchResult } from '@/types/bgg'

interface UseBGGSearchReturn {
  results: BGGSearchResult[]
  loading: boolean
  error: string | null
  search: (query: string) => Promise<void>
  clearResults: () => void
}

export function useBGGSearch(): UseBGGSearchReturn {
  const [results, setResults] = useState<BGGSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/bgg/search?q=${encodeURIComponent(query)}`)
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