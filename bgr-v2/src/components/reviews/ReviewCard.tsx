'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardActions } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, ThumbsUp, MessageCircle, Edit, Calendar, User, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { generateShoppingLinks, debugAffiliateLinks } from '@/lib/affiliate-links'

export interface ReviewCardProps {
  review: {
    id: string
    title: string
    content: string
    rating: number
    rule_complexity?: number
    luck_factor?: number
    interaction?: number
    downtime?: number
    pros?: string[]
    cons?: string[]
    categories?: string[]
    mechanics?: string[]
    recommended_player_counts?: number[]
    created_at: string
    user?: {
      username: string
      full_name?: string
      avatar_url?: string
    }
    game?: {
      name: string
      japanese_name?: string
      image_url?: string
      bgg_id?: string
      id?: number
      description?: string
      year_published?: number
      min_players?: number
      max_players?: number
      playing_time?: number
    }
    // Legacy support for existing data structure
    profiles?: {
      username: string
      full_name?: string
      avatar_url?: string
    }
    games?: {
      name: string
      japanese_name?: string
      image_url?: string
      bgg_id: string
    }
  }
  showGameInfo?: boolean
  showReviewContent?: boolean
  showOverallScore?: boolean
  maxContentLines?: number
  variant?: 'default' | 'compact' | 'detailed'
  currentUserId?: string
}

export function ReviewCard({
  review,
  showGameInfo = true,
  showReviewContent = true,
  showOverallScore = true,
  maxContentLines = 3,
  variant = 'default',
  currentUserId
}: ReviewCardProps) {
  // State for collapsible game description
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  // Support both new (user/game) and legacy (profiles/games) data structures
  const gameData = review.game || review.games
  const userData = review.user || review.profiles
  
  const gameName = gameData?.japanese_name || gameData?.name || 'Unknown Game'
  const userDisplayName = userData?.full_name || userData?.username || 'Unknown User'
  const isOwner = currentUserId === userData?.username

  // Generate shopping links with affiliate support
  const shoppingLinks = generateShoppingLinks(gameName)
  
  // Debug affiliate links in development
  if (process.env.NODE_ENV === 'development') {
    debugAffiliateLinks(gameName)
  }

  const renderStarRating = (rating: number, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const stars = Math.round(rating / 2) // Convert 10-point to 5-star
    const sizeClass = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    }[size]

    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`${sizeClass} ${
                star <= stars
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      </div>
    )
  }

  const renderDetailedScores = () => {
    if (variant === 'compact') return null

    const scores = [
      { label: 'ルール複雑さ', value: review.rule_complexity },
      { label: '運要素', value: review.luck_factor },
      { label: '相互作用', value: review.interaction },
      { label: 'ダウンタイム', value: review.downtime }
    ].filter(score => score.value && score.value > 0)

    if (scores.length === 0) return null

    return (
      <div className="mt-3 grid grid-cols-2 gap-2">
        {scores.map((score) => (
          <div key={score.label} className="flex items-center justify-between">
            <span className="text-xs text-gray-600">{score.label}</span>
            <div className="flex items-center gap-1">
              {renderStarRating(score.value!, 'sm')}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderTags = () => {
    const allTags = [
      ...(review.categories || []),
      ...(review.mechanics || [])
    ]

    if (allTags.length === 0) return null

    const displayTags = allTags.slice(0, variant === 'compact' ? 2 : 4)

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {displayTags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
        {allTags.length > displayTags.length && (
          <Badge variant="outline" className="text-xs">
            +{allTags.length - displayTags.length}
          </Badge>
        )}
      </div>
    )
  }

  const renderPlayerCounts = () => {
    if (!review.recommended_player_counts || review.recommended_player_counts.length === 0) {
      return null
    }

    return (
      <div className="flex items-center gap-1 mt-2">
        <User className="h-3 w-3 text-gray-500" />
        <span className="text-xs text-gray-600">
          推奨: {review.recommended_player_counts.sort((a, b) => a - b).join(', ')}人
        </span>
      </div>
    )
  }

  return (
    <Card className="h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      {showGameInfo && (
        <div className="relative">
          <div className="aspect-video relative overflow-hidden rounded-t-lg">
            {gameData?.image_url ? (
              <Image
                src={gameData.image_url}
                alt={gameName}
                fill
                className="object-cover transition-transform duration-200 hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm">No Image</span>
              </div>
            )}
          </div>
          
          {showOverallScore && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
              {renderStarRating(review.rating, 'sm')}
            </div>
          )}
        </div>
      )}

      <CardContent className="p-4">
        {showGameInfo && (
          <div className="mb-3">
            <Link 
              href={`/games/${gameData?.id || gameData?.bgg_id || ''}`}
              className="hover:text-blue-600 transition-colors"
            >
              <h3 className="font-semibold text-lg line-clamp-1">
                {gameName}
              </h3>
            </Link>
            
            {/* Game Description - Collapsible */}
            {gameData?.description && (
              <div className="mt-2">
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <span>ゲーム概要</span>
                  {isDescriptionExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
                {isDescriptionExpanded && (
                  <div className="mt-2 text-xs text-gray-700 bg-gray-50 rounded-lg p-3">
                    <p className="line-clamp-4">{gameData.description}</p>
                    {gameData.year_published && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className="text-gray-500">
                          発売年: {gameData.year_published}
                          {gameData.min_players && gameData.max_players && (
                            <> | プレイ人数: {gameData.min_players}
                            {gameData.min_players !== gameData.max_players && `-${gameData.max_players}`}人</>
                          )}
                          {gameData.playing_time && (
                            <> | プレイ時間: {gameData.playing_time}分</>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Shopping Links */}
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                  <Link href={shoppingLinks.bgg} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    BGG
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                  <Link href={shoppingLinks.amazon} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Amazon
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                  <Link href={shoppingLinks.rakuten} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    楽天
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                  <Link href={shoppingLinks.yahoo} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Yahoo
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                  <Link href={shoppingLinks.suruga} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    駿河屋
                  </Link>
                </Button>
              </div>
            </div>

            {renderTags()}
            {renderPlayerCounts()}
          </div>
        )}

        {showReviewContent && (
          <div className="space-y-3">
            <Link 
              href={`/reviews/${review.id}`}
              className="hover:text-blue-600 transition-colors"
            >
              <h4 className="font-medium text-base line-clamp-2">
                {review.title}
              </h4>
            </Link>

            {!showGameInfo && showOverallScore && (
              <div className="flex items-center justify-between">
                {renderStarRating(review.rating, 'md')}
              </div>
            )}

            <p 
              className={`text-gray-700 text-sm line-clamp-${maxContentLines}`}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: maxContentLines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {review.content}
            </p>

            {(review.pros && review.pros.length > 0) && variant === 'detailed' && (
              <div className="space-y-1">
                <h5 className="text-xs font-medium text-green-700">良い点:</h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  {review.pros.slice(0, 2).map((pro, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">+</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(review.cons && review.cons.length > 0) && variant === 'detailed' && (
              <div className="space-y-1">
                <h5 className="text-xs font-medium text-red-700">改善点:</h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  {review.cons.slice(0, 2).map((con, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-red-500 mt-0.5">-</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {renderDetailedScores()}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={userData?.avatar_url || undefined} />
              <AvatarFallback>{userDisplayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <Link 
                href={`/users/${userData?.username || ''}`}
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                {userDisplayName}
              </Link>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(review.created_at), { 
                  addSuffix: true, 
                  locale: ja 
                })}
              </div>
            </div>
          </div>

          {isOwner && (
            <Link href={`/reviews/${review.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>

      {variant === 'detailed' && (
        <CardActions className="px-4 pb-4">
          <div className="flex items-center gap-4 w-full">
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-xs">いいね</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">コメント</span>
            </Button>
          </div>
        </CardActions>
      )}
    </Card>
  )
}