'use client'

import { useEffect, useState } from 'react'
import { GameCard } from '@/components/games/GameCard'
import type { Game } from '@/types'

export default function RangeDisplayTest() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/games-with-range')
      .then(res => res.json())
      .then(data => {
        setGames(data.games)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch games:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="container mx-auto px-4 py-8">読み込み中...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">プレイ時間範囲表示テスト</h1>
        <p className="text-gray-600 mb-6">
          min/max時間データを含むGameCardでの範囲表示テスト
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {games.map((game) => (
          <div key={game.id} className="space-y-4">
            <GameCard game={game as any} />
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <div>データ: {(game as any).min_playing_time}分～{(game as any).max_playing_time}分</div>
              <div>期待表示: {
                (game as any).min_playing_time === (game as any).max_playing_time 
                  ? `${(game as any).min_playing_time}分`
                  : `${(game as any).min_playing_time}分～${(game as any).max_playing_time}分`
              }</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}