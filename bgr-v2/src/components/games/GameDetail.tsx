'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Users, Clock, Star, Calendar, Target, ExternalLink } from 'lucide-react'
import { useGame } from '@/hooks/useGame'
import { useFavorites } from '@/hooks/useFavorites'
import { useAuth } from '@/hooks/useAuth'
import { cleanBggDescription } from '@/lib/text-utils'
import ReviewStats from '@/components/reviews/ReviewStats'
import { generateShoppingLinks } from '@/lib/affiliate-links'

interface GameDetailProps {
  gameId: number
}

export function GameDetail({ gameId }: GameDetailProps) {
  const { game, loading, error } = useGame(gameId)
  const { isAuthenticated } = useAuth()
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()
  
  const isGameFavorite = game ? isFavorite(game.id) : false

  const handleFavoriteClick = async () => {
    if (!isAuthenticated || !game) return
    
    try {
      if (isGameFavorite) {
        await removeFavorite(game.id)
      } else {
        await addFavorite(game.id)
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="aspect-square bg-gray-300 rounded-lg"></div>
            </div>
            <div className="lg:col-span-2">
              <div className="h-8 bg-gray-300 rounded mb-4"></div>
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-gray-300 rounded"></div>
                <div className="h-20 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">エラー</h1>
          <p className="text-gray-600 mt-2">{error || 'ゲームが見つかりませんでした。'}</p>
        </div>
      </div>
    )
  }

  const formatPlayers = () => {
    if (game.min_players === game.max_players) {
      return `${game.min_players}人`
    }
    return `${game.min_players || '?'}-${game.max_players || '?'}人`
  }

  const formatPlayingTime = () => {
    const maxTime = game.playing_time
    if (!maxTime) return '不明'
    
    // BGGデータに基づく合理的な最小時間推定
    // 短いゲーム（<60分）: 最小値は最大値の60-80%
    // 中程度のゲーム（60-120分）: 最小値は最大値の40-60%
    // 長いゲーム（>120分）: 最小値は最大値の50-70%
    let minTime: number
    if (maxTime <= 60) {
      minTime = Math.max(15, Math.floor(maxTime * 0.7))
    } else if (maxTime <= 120) {
      minTime = Math.max(30, Math.floor(maxTime * 0.5))
    } else {
      minTime = Math.max(60, Math.floor(maxTime * 0.6))
    }
    
    const formatTime = (minutes: number) => {
      if (minutes < 60) return `${minutes}分`
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0 ? `${hours}時間${remainingMinutes}分` : `${hours}時間`
    }
    
    // 最小時間と最大時間が近い場合（差が15分以下）は単一表示
    if (maxTime - minTime <= 15) {
      return formatTime(maxTime)
    }
    
    return `${formatTime(minTime)}～${formatTime(maxTime)}`
  }

  const getBggUrl = () => {
    if (!game.bgg_id) return null
    // bgg_idが数値の場合とjp-で始まる手動登録の場合を判別
    if (typeof game.bgg_id === 'number' || !String(game.bgg_id).startsWith('jp-')) {
      return `https://boardgamegeek.com/boardgame/${game.bgg_id}`
    }
    return null
  }

  const bggUrl = getBggUrl()
  const shoppingLinks = generateShoppingLinks(game.name)

  // 既存フィールドから直接表示データを取得（変換済み）
  const displayCategories = game.categories || []
  const displayMechanics = game.mechanics || []
  const displayPublishers = game.publishers || []

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ゲーム画像とアクション */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <Card className="overflow-hidden">
              <div className="relative aspect-square">
                <Image
                  src={game.image_url || game.thumbnail_url || '/placeholder-game.jpg'}
                  alt={game.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  priority
                />
              </div>
              
              <CardContent className="p-4 space-y-3">
                {isAuthenticated && (
                  <Button
                    onClick={handleFavoriteClick}
                    variant={isGameFavorite ? "default" : "outline"}
                    className="w-full"
                  >
                    <Heart className={`mr-2 h-4 w-4 ${isGameFavorite ? 'fill-current' : ''}`} />
                    {isGameFavorite ? 'お気に入り解除' : 'お気に入り'}
                  </Button>
                )}
                
                {/* ショッピングリンク */}
                <div className="space-y-2">
                  {bggUrl && (
                    <Button
                      asChild
                      variant="secondary"
                      className="w-full"
                    >
                      <a
                        href={bggUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        BGGで詳細を見る
                      </a>
                    </Button>
                  )}
                  
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                  >
                    <a
                      href={shoppingLinks.amazon}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Amazonで見る
                    </a>
                  </Button>
                  
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                  >
                    <a
                      href={shoppingLinks.rakuten}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      楽天で見る
                    </a>
                  </Button>
                  
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                  >
                    <a
                      href={shoppingLinks.yahoo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Yahoo!で見る
                    </a>
                  </Button>
                  
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                  >
                    <a
                      href={shoppingLinks.suruga}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      駿河屋で見る
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ゲーム詳細情報 */}
        <div className="lg:col-span-2 space-y-6">
          {/* タイトルと基本評価 */}
          <Card>
            <CardContent className="p-6">
              <h1 className="text-2xl md:text-3xl font-bold mb-2 line-clamp-2">{game.name}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                {game.year_published && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {game.year_published}年
                  </span>
                )}
                
                {game.rating_average && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-gray-900">
                      {game.rating_average.toFixed(1)}
                    </span>
                    <span className="text-sm">
                      ({game.rating_count}件)
                    </span>
                  </div>
                )}
              </div>

              {/* 基本プレイ情報 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-600">プレイ人数</div>
                    <div className="font-medium">{formatPlayers()}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-sm text-gray-600">プレイ時間</div>
                    <div className="font-medium">{formatPlayingTime()}</div>
                  </div>
                </div>
                
                {game.min_age && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="text-sm text-gray-600">推奨年齢</div>
                      <div className="font-medium">{game.min_age}歳以上</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5軸レビュー統計 */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4">レビュー評価</h3>
                <ReviewStats 
                  stats={{
                    overall: game.review_stats?.overall_avg,
                    complexity: game.review_stats?.complexity_avg,
                    luck: game.review_stats?.luck_avg,
                    interaction: game.review_stats?.interaction_avg,
                    downtime: game.review_stats?.downtime_avg,
                    reviewCount: (game as any).review_stats?.review_count || (game as any).rating_count || undefined
                  }}
                  size="md"
                  showLabels={true}
                />
              </div>
            </CardContent>
          </Card>

          {/* ゲーム説明 */}
          {game.description && (
            <Card>
              <CardHeader>
                <CardTitle>ゲーム説明</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {cleanBggDescription(game.description)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* カテゴリーとメカニクス */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayCategories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>カテゴリー</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {displayCategories.map((category, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {displayMechanics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>メカニクス</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {displayMechanics.map((mechanic, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {mechanic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* デザイナー・パブリッシャー */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {game.designers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>デザイナー</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {game.designers.map((designer, index) => (
                      <div key={index} className="text-gray-700">
                        {designer}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {displayPublishers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>パブリッシャー</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {displayPublishers.map((publisher, index) => (
                      <div key={index} className="text-gray-700">
                        {publisher}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}