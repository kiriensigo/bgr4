'use client'

import { GameCard } from './GameCard'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { Game } from '@/types'

interface GamesListProps {
  games: Game[]
  loading?: boolean
  error?: string | null
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  } | null
  onPageChange?: (page: number) => void
  className?: string
}

export function GamesList({
  games,
  loading = false,
  error = null,
  pagination = null,
  onPageChange,
  className
}: GamesListProps) {
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          再試行
        </Button>
      </div>
    )
  }

  if (loading && games.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">読み込み中...</span>
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">ゲームが見つかりませんでした。</p>
      </div>
    )
  }
  
  return (
    <div className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {loading && games.length > 0 && (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">読み込み中...</span>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            disabled={!pagination.hasPrev || loading}
            onClick={() => onPageChange?.(pagination.page - 1)}
          >
            前へ
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNumber = Math.max(
                1,
                Math.min(
                  pagination.totalPages - 4,
                  pagination.page - 2
                )
              ) + i

              if (pageNumber > pagination.totalPages) return null

              return (
                <Button
                  key={pageNumber}
                  variant={pageNumber === pagination.page ? "default" : "outline"}
                  size="sm"
                  disabled={loading}
                  onClick={() => onPageChange?.(pageNumber)}
                >
                  {pageNumber}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            disabled={!pagination.hasNext || loading}
            onClick={() => onPageChange?.(pagination.page + 1)}
          >
            次へ
          </Button>

          <span className="text-sm text-gray-600 ml-4">
            {pagination.total}件中 {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)}件
          </span>
        </div>
      )}
    </div>
  )
}