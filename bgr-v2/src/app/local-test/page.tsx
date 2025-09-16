'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Game {
  id: number
  name: string
  description: string | null
  year_published: number | null
  min_players: number | null
  max_players: number | null
  playing_time: number | null
  rating_average: number | null
  rating_count: number
  mechanics: string[]
  categories: string[]
}

export default function LocalTestPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGames = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/local/games')
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch games')
      }

      setGames(data.data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch games'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGames()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">ローカルPostgreSQL接続テスト</h1>
        <Button onClick={fetchGames} disabled={loading}>
          {loading ? '読み込み中...' : 'ゲーム一覧を再取得'}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">エラー: {error}</p>
        </div>
      )}

      {games.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card key={game.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{game.name}</CardTitle>
                {game.year_published && (
                  <p className="text-sm text-gray-600">{game.year_published}年</p>
                )}
              </CardHeader>
              <CardContent>
                {game.description && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                    {game.description}
                  </p>
                )}
                
                <div className="space-y-2 text-sm">
                  {(game.min_players || game.max_players) && (
                    <p>
                      <strong>プレイ人数:</strong>{' '}
                      {game.min_players === game.max_players
                        ? `${game.min_players}人`
                        : `${game.min_players || '?'}-${game.max_players || '?'}人`}
                    </p>
                  )}
                  
                  {game.playing_time && (
                    <p>
                      <strong>プレイ時間:</strong> {game.playing_time}分
                    </p>
                  )}

                  {game.rating_average && (
                    <p>
                      <strong>評価:</strong> {Number(game.rating_average).toFixed(1)}/10
                      <span className="text-gray-600 ml-1">
                        ({game.rating_count}件)
                      </span>
                    </p>
                  )}

                  {game.categories.length > 0 && (
                    <div>
                      <strong>カテゴリー:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {game.categories.map((category, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && games.length === 0 && !error && (
        <div className="text-center py-8">
          <p className="text-gray-600">ゲームデータがありません。</p>
        </div>
      )}
    </div>
  )
}