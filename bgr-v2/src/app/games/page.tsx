'use client'

import { useState } from 'react'
import { GamesList } from '@/components/games/GamesList'
import { useGames } from '@/hooks/useGames'

export default function GamesPage() {
  const [currentPage, setCurrentPage] = useState(1)

  const {
    games,
    loading,
    error,
    pagination,
  } = useGames({
    page: currentPage,
    limit: 20,
    sortBy: 'rating_average',
    sortOrder: 'desc',
  })

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-[75vh]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">ボードゲーム一覧</h1>
      </div>

      <GamesList
        games={games}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  )
}
