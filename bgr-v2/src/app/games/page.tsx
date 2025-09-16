'use client'

import { useState } from 'react'
import { GamesList } from '@/components/games/GamesList'
import { SearchForm } from '@/components/games/SearchForm'
import { useGames } from '@/hooks/useGames'
import { useGameSearch } from '@/hooks/useGameSearch'

export default function GamesPage() {
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // 一覧表示用
  const { 
    games: allGames, 
    loading: allGamesLoading, 
    error: allGamesError, 
    pagination 
  } = useGames({
    page: currentPage,
    limit: 20,
    sortBy: 'rating_average',
    sortOrder: 'desc'
  })

  // 検索用
  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    search,
    clearResults
  } = useGameSearch()

  const handleSearch = (query: string) => {
    if (!query) {
      setSearchMode(false)
      setSearchQuery('')
      clearResults()
      return
    }

    setSearchMode(true)
    setSearchQuery(query)
    search(query, 50) // 検索は50件まで表示
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const displayGames = searchMode ? searchResults : allGames
  const displayLoading = searchMode ? searchLoading : allGamesLoading
  const displayError = searchMode ? searchError : allGamesError
  const displayPagination = searchMode ? null : pagination

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">ボードゲーム一覧</h1>
        
        <SearchForm
          onSearch={handleSearch}
          placeholder="ゲーム名、デザイナー、パブリッシャーで検索..."
          className="max-w-md"
          initialValue={searchQuery}
        />
      </div>

      {searchMode && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            「{searchQuery}」の検索結果
            <button
              onClick={() => handleSearch('')}
              className="ml-4 text-blue-600 hover:text-blue-800 underline"
            >
              検索をクリア
            </button>
          </p>
        </div>
      )}

      <GamesList
        games={displayGames}
        loading={displayLoading}
        error={displayError}
        pagination={displayPagination}
        onPageChange={handlePageChange}
      />
    </div>
  )
}