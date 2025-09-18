import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import GameCardServer from '@/components/games/GameCardServer'

interface PopularGame {
  id: number
  name: string
  japanese_name?: string
  year_published?: number
  min_players?: number
  max_players?: number
  playing_time?: number
  image_url?: string
  mechanics?: string[]
  categories?: string[]
  stats: {
    review_count: number
    avg_rating: number
    review_avg: number | null
    popularity_score: number
  }
}

interface PopularGamesProps {
  games: PopularGame[]
}

export function PopularGames({ games }: PopularGamesProps) {
  if (games.length === 0) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">人気ゲーム</h2>
            <p className="text-muted-foreground">
              レビューされたゲームがまだありません
            </p>
          </div>
        </div>
      </section>
    )
  }

  // PopularGameをGameCard用のGame型に変換（完全統一）
  const convertToGame = (popularGame: PopularGame): any => ({
    id: popularGame.id,
    name: popularGame.name,
    japanese_name: popularGame.japanese_name,
    year_published: popularGame.year_published,
    min_players: popularGame.min_players,
    max_players: popularGame.max_players,
    playing_time: popularGame.playing_time,
    min_playing_time: popularGame.playing_time,
    max_playing_time: popularGame.playing_time,
    image_url: popularGame.image_url,
    thumbnail_url: popularGame.image_url,
    mechanics: popularGame.mechanics,
    categories: null, // ゲーム一覧と統一するためカテゴリー非表示
    // ゲーム一覧と同じ5軸レビューデータ構造
    review_stats: {
      overall_avg: popularGame.stats.review_avg,
      complexity_avg: null, // 人気ゲームデータにはないが一覧と統一
      luck_avg: null,
      interaction_avg: null,
      downtime_avg: null,
      review_count: popularGame.stats.review_count
    },
    rating_count: popularGame.stats.review_count,
    rating_average: popularGame.stats.avg_rating
  })

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
              人気ゲーム
            </h2>
            <p className="text-muted-foreground">
              レビュー数と評価を基にした注目のボードゲーム
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/search?sortBy=popularity&sortOrder=desc" className="hidden sm:flex items-center gap-2">
              ランキングを見る
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Games Grid - Server-rendered lightweight cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.slice(0, 8).map((game, index) => (
            <div key={game.id} className="relative">
              {/* Ranking Badge */}
              <div className="absolute top-2 left-2 z-10">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg
                  ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-500'}
                `}>
                  {index + 1}
                </div>
              </div>
              
              <GameCardServer game={convertToGame(game) as any} className="h-full" />
            </div>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="text-center mt-8 sm:hidden">
          <Button variant="outline" asChild>
            <Link href="/search?sortBy=popularity&sortOrder=desc" className="flex items-center gap-2">
              人気ゲームランキングを見る
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

      </div>
    </section>
  )
}
