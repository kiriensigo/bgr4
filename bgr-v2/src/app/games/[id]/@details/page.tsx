import { notFound } from 'next/navigation'
import Image from 'next/image'
import GameStatsClient from '@/components/games/GameStatsClient'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Clock, Calendar, Star, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import CollapsibleDescription from '@/components/ui/CollapsibleDescription'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SupabaseGameRepository } from '@/infrastructure/repositories/SupabaseGameRepository'
import { generateShoppingLinks } from '@/lib/affiliate-links'

interface GameDetailsProps {
  params: Promise<{ id: string }>
}

export default async function GameDetailsPage({ params }: GameDetailsProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const gameRepository = new SupabaseGameRepository(supabase)
  const game = await gameRepository.findById(parseInt(id))

  if (!game) {
    notFound()
  }

  const formatPlayingTime = () => {
    const minTime = game.minPlayingTime
    const maxTime = game.maxPlayingTime
    
    if (!minTime && !maxTime) return '不明'
    
    const formatTime = (time: number) => {
      if (time < 60) return `${time}分`
      const hours = Math.floor(time / 60)
      const minutes = time % 60
      return minutes > 0 ? `${hours}時間${minutes}分` : `${hours}時間`
    }
    
    if (minTime === maxTime) {
      return formatTime(minTime!)
    }
    
    return `${formatTime(minTime!)}～${formatTime(maxTime!)}`
  }

  const formatPlayers = () => {
    if (game.minPlayers === game.maxPlayers) {
      return `${game.minPlayers}人`
    }
    return `${game.minPlayers}-${game.maxPlayers}人`
  }

  const shoppingLinks = generateShoppingLinks(game.name)

  return (
    <div className="space-y-6">
      {/* ゲーム基本情報 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative w-full md:w-48 h-48 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={game.imageUrl || '/placeholder-game.jpg'}
                alt={game.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 192px"
                priority
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnIGZpbGw9JyNlZWUnIC8+PC9zdmc+"
              />
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <CardTitle className="text-2xl mb-2">{game.name}</CardTitle>
                {(game as any).nameJp && (
                  <p className="text-lg text-muted-foreground">{(game as any).nameJp}</p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {game.yearPublished && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{game.yearPublished}年</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{formatPlayers()}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{formatPlayingTime()}</span>
                </div>

                {game.ratingAverage && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span>{game.ratingAverage.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Link href={`/reviews/new/${game.id}`}>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      レビューを書く
                    </Button>
                  </Link>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {game.bggId && (
                    <Button variant="secondary" asChild>
                      <a 
                        href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        BGGで詳細を見る
                      </a>
                    </Button>
                  )}
                  
                  <Button variant="outline" asChild>
                    <a
                      href={shoppingLinks.amazon}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Amazonで見る
                    </a>
                  </Button>
                  
                  <Button variant="outline" asChild>
                    <a
                      href={shoppingLinks.rakuten}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      楽天で見る
                    </a>
                  </Button>
                  
                  <Button variant="outline" asChild>
                    <a
                      href={shoppingLinks.yahoo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Yahoo!で見る
                    </a>
                  </Button>
                  
                  <Button variant="outline" asChild>
                    <a
                      href={shoppingLinks.suruga}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      駿河屋で見る
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ゲーム説明 */}
      {game.description && (
        <Card>
          <CardContent className="pt-6">
            <CollapsibleDescription 
              title="ゲーム概要"
              content={game.description}
              maxLines={3}
            />
          </CardContent>
        </Card>
      )}

      {/* メカニクス・カテゴリー */}
      {( (game.getDisplayMechanics && game.getDisplayMechanics().length > 0) || (game.getDisplayCategories && game.getDisplayCategories().length > 0) ) && (
        <Card>
          <CardHeader>
            <CardTitle>ゲーム特徴</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {game.getDisplayMechanics && game.getDisplayMechanics().length > 0 && (
              <div>
                <h4 className="font-medium mb-2">メカニクス</h4>
                <div className="flex flex-wrap gap-2">
                  {game.getDisplayMechanics().map((mechanic: any, index: number) => (
                    <Badge key={index} className="bg-blue-100 text-blue-800">
                      {mechanic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {game.getDisplayCategories && game.getDisplayCategories().length > 0 && (
              <div>
                <h4 className="font-medium mb-2">カテゴリー</h4>
                <div className="flex flex-wrap gap-2">
                  {game.getDisplayCategories().map((category: any, index: number) => (
                    <Badge key={index} className="bg-green-100 text-green-800">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 人気統計 */}
      <GameStatsClient gameId={parseInt(id)} />

      {/* デザイナー・出版社 */}
      {( ((game as any).designers && (game as any).designers.length > 0) || (game.getDisplayPublishers && game.getDisplayPublishers().length > 0) ) && (
        <Card>
          <CardHeader>
            <CardTitle>制作情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(game as any).designers && (game as any).designers.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">デザイナー</h4>
                <div className="flex flex-wrap gap-2">
                  {(game as any).designers.map((designer: any, index: number) => (
                    <Badge key={index} variant="outline">
                      {designer}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {game.getDisplayPublishers && game.getDisplayPublishers().length > 0 && (
              <div>
                <h4 className="font-medium mb-2">出版社</h4>
                <div className="flex flex-wrap gap-2">
                  {game.getDisplayPublishers().map((publisher: any, index: number) => (
                    <Badge key={index} variant="outline">
                      {publisher}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
