'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, Users, Clock } from 'lucide-react'
// import { Star } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import { useAuth } from '@/hooks/useAuth'
import type { Game } from '@/types'

interface GameCardProps {
  game: Game
  className?: string
  priority?: boolean
}

export function GameCard({ game, className, priority = false }: GameCardProps) {
  if (!game || !game.id || !game.name) {
    return null
  }
  
  const { isAuthenticated } = useAuth()
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()
  const isGameFavorite = isFavorite(game.id)

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) return
    
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

  const formatPlayers = () => {
    const minPlayers = game.min_players ?? 0
    const maxPlayers = game.max_players ?? 0
    
    if (minPlayers === maxPlayers && minPlayers > 0) {
      return `${minPlayers}人`
    }
    return `${minPlayers || '?'}-${maxPlayers || '?'}人`
  }

  const formatPlayingTime = () => {
    const minTime = (game as any).min_playing_time || (game as any).playing_time
    const maxTime = (game as any).max_playing_time || (game as any).playing_time
    
    if (!minTime && !maxTime) return '不明'
    
    const formatTime = (time: number) => {
      if (time < 60) return `${time}分`
      const hours = Math.floor(time / 60)
      const minutes = time % 60
      return minutes > 0 ? `${hours}時間${minutes}分` : `${hours}時間`
    }
    
    if (minTime === maxTime) {
      return formatTime(minTime)
    }
    
    return `${formatTime(minTime)}～${formatTime(maxTime)}`
  }

  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 border-2 hover:border-blue-200 ${className}`}>
      <Link href={`/games/${game.id}`} className="group block">
        <CardHeader className="p-0">
          <div className="relative aspect-square">
            <Image
              src={game.image_url || game.thumbnail_url || '/placeholder-game.jpg'}
              alt={game.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 20vw"
              quality={60}
              fetchPriority={priority ? 'high' : 'auto'}
              priority={priority}
            />
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 p-1 h-auto bg-white/80 hover:bg-white/90"
                onClick={handleFavoriteClick}
              >
                <Heart
                  className={`h-4 w-4 ${
                    isGameFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                  }`}
                />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {game.name}
          </h3>
          
          {game.year_published && (
            <p className="text-sm text-gray-600 mb-2">
              {game.year_published}年
            </p>
          )}

          {game.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
              {game.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              {formatPlayers()}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              {formatPlayingTime()}
            </div>
          </div>

          {/* 評価表示（5つ星・部分表示対応） */}
          {game.rating_average && (
            <div className="mb-3 flex items-center gap-1">
              {(() => {
                const rating = game.rating_average
                const stars = []
                
                // 10点満点を5つ星に変換（2点=1つ星）
                const starValue = rating / 2
                
                for (let i = 0; i < 5; i++) {
                  const starProgress = Math.max(0, Math.min(1, starValue - i))
                  
                  if (starProgress === 0) {
                    // 空の星
                    stars.push(<span key={`empty-${i}`} className="text-gray-300">☆</span>)
                  } else if (starProgress === 1) {
                    // 満点の星
                    stars.push(<span key={`full-${i}`} className="text-yellow-500">★</span>)
                  } else {
                    // 部分的な星（オーバーレイ方式）
                    const percentage = starProgress * 100
                    stars.push(
                      <span key={`partial-${i}`} className="relative inline-block">
                        <span className="text-gray-300">☆</span>
                        <span 
                          className="absolute top-0 left-0 text-yellow-500 overflow-hidden"
                          style={{
                            width: `${percentage}%`
                          }}
                        >
                          ★
                        </span>
                      </span>
                    )
                  }
                }
                
                return stars
              })()}
              <span className="font-semibold text-sm ml-1">
                {game.rating_average.toFixed(1)}
              </span>
            </div>
          )}

          {game.categories && Array.isArray(game.categories) && game.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {game.categories.slice(0, 3).map((category, index) => (
                <Badge
                  key={`${game.id}-category-${index}`}
                  variant="secondary"
                  className="text-xs"
                >
                  {category}
                </Badge>
              ))}
              {game.categories.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{game.categories.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  )
}
