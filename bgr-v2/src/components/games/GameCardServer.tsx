import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Game } from '@/types'

interface GameCardServerProps {
  game: Game
  className?: string
  priority?: boolean
}

export default function GameCardServer({ game, className, priority = false }: GameCardServerProps) {
  if (!game || !game.id || !game.name) return null

  const formatPlayers = () => {
    const minPlayers = (game as any).min_players ?? 0
    const maxPlayers = (game as any).max_players ?? 0
    if (minPlayers === maxPlayers && minPlayers > 0) return `${minPlayers}人`
    return `${minPlayers || '?'}-${maxPlayers || '?'}人`
  }

  const formatPlayingTime = () => {
    const minTime = (game as any).min_playing_time || (game as any).playing_time
    const maxTime = (game as any).max_playing_time || (game as any).playing_time
    if (!minTime && !maxTime) return '不明'
    const fmt = (t: number) => (t < 60 ? `${t}分` : `${Math.floor(t / 60)}時間${t % 60 ? `${t % 60}分` : ''}`)
    return minTime === maxTime ? fmt(minTime) : `${fmt(minTime)}〜${fmt(maxTime)}`
  }

  return (
    <Card className={`overflow-hidden border ${className || ''}`}>
      <Link href={`/games/${game.id}`} className="block">
        <CardHeader className="p-0">
          <div className="relative aspect-square">
            <Image
              src={(game as any).image_url || (game as any).thumbnail_url || '/placeholder-game.jpg'}
              alt={game.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              loading={priority ? undefined : 'lazy'}
              priority={priority}
              fetchPriority={priority ? 'high' : 'auto'}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{game.name}</h3>
          {(game as any).year_published && (
            <p className="text-sm text-gray-600 mb-2">{(game as any).year_published}年</p>
          )}
          <div className="flex flex-wrap gap-2 mb-1 text-sm text-gray-600">
            <span>{formatPlayers()}</span>
            <span>・{formatPlayingTime()}</span>
          </div>
          {(game as any).rating_average && (
            <div className="text-sm text-gray-700">評価 {(game as any).rating_average.toFixed(1)}</div>
          )}
        </CardContent>
      </Link>
    </Card>
  )
}
