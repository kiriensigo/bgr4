'use client'

import { Star, User, Calendar, MessageSquare, Info, Shuffle, Users, Timer, Clock, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'

import { 
  getComplexityLabel,
  getLuckLabel,
  getInteractionLabel,
  getDowntimeLabel,
  getComplexityColor
} from '@/lib/game-constants'
import { type EnhancedReview } from '@/types/enhanced-review'

export interface EnhancedReviewCardProps {
  review: EnhancedReview
  showGame?: boolean
  showUser?: boolean
  variant?: 'default' | 'compact' | 'detailed'
  showDetailedRatings?: boolean
}

export function EnhancedReviewCard({ 
  review, 
  showGame = false, 
  showUser = true,
  variant = 'default',
  showDetailedRatings = false
}: EnhancedReviewCardProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(10)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-semibold">{rating}/10</span>
      </div>
    )
  }

  const renderRatingBar = (
    value: number, 
    max: number, 
    label: string, 
    getLabel: (value: number) => string,
    icon: React.ReactNode
  ) => {
    const percentage = (value / max) * 100
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          {icon}
          <span className="text-sm font-medium w-20">{label}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Progress value={percentage} className="flex-1 h-2" />
            <span className={`text-xs px-2 py-1 rounded-full ${getComplexityColor(value)}`}>
              {getLabel(value)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  const truncateContent = (content: string, maxLength: number) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <Card className="hover:shadow-lg transition-shadow max-w-5xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Game Image */}
          {showGame && review.game?.image_url && (
            <div className="flex-shrink-0 self-center sm:self-start">
              <img
                src={review.game.image_url}
                alt={review.game?.japanese_name || review.game?.name || 'Game image'}
                className="w-24 h-24 sm:w-20 sm:h-20 object-cover rounded-lg shadow-sm"
                loading="lazy"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg mb-3 line-clamp-2">
                  <Link 
                    href={`/reviews/${review.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {review.title}
                  </Link>
                </CardTitle>
                
                {/* Overall Rating */}
                <div className="mb-3">
                  {renderStars(review.overall_score)}
                </div>
              </div>
              
              {!review.is_published && (
                <Badge variant="secondary">下書き</Badge>
              )}
            </div>
          </div>
        </div>

        {/* User and Date Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            {showUser && review.user && (
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage 
                    src={review.user.avatar_url || undefined} 
                    alt={review.user.username}
                  />
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <span>{review.user.full_name || review.user.username}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(review.created_at), 'yyyy年M月d日', { locale: ja })}
              </span>
            </div>
          </div>

          {review._count && review._count.comments > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>{review._count.comments}</span>
            </div>
          )}
        </div>

        {/* Game Info */}
        {showGame && review.game && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">ゲーム:</span>
            <Link 
              href={`/games/${review.game?.id}`}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {review.game?.japanese_name || review.game?.name}
            </Link>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-6">
          {/* Review Content */}
          <div className="prose prose-sm max-w-none">
            <p className={`text-sm leading-relaxed text-muted-foreground ${
              variant === 'compact' ? 'line-clamp-2' : 'line-clamp-4'
            }`}>
              {variant === 'compact' 
                ? truncateContent(review.content, 100)
                : truncateContent(review.content, 300)
              }
            </p>
          </div>

          {/* Detailed Ratings */}
          {showDetailedRatings && variant !== 'compact' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span className="text-sm font-medium">詳細評価</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {review.rule_complexity && renderRatingBar(
                  review.rule_complexity,
                  5,
                  "複雑さ",
                  getComplexityLabel,
                  <Info className="w-4 h-4" />
                )}
                
                {review.luck_factor && renderRatingBar(
                  review.luck_factor,
                  5,
                  "運要素",
                  getLuckLabel,
                  <Shuffle className="w-4 h-4" />
                )}
                
                {review.interaction && renderRatingBar(
                  review.interaction,
                  5,
                  "相互作用",
                  getInteractionLabel,
                  <Users className="w-4 h-4" />
                )}
                
                {review.downtime && renderRatingBar(
                  review.downtime,
                  5,
                  "待ち時間",
                  getDowntimeLabel,
                  <Timer className="w-4 h-4" />
                )}
              </div>
            </div>
          )}

          {/* Gameplay Information */}
          {variant === 'detailed' && (
            <div className="space-y-3">
              {/* Recommended Players */}
              {review.recommended_players && review.recommended_players.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">おすすめ人数</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {review.recommended_players.map((count) => (
                      <Badge key={count} variant="secondary" className="text-xs">
                        {count === "7" ? "7人以上" : `${count}人`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Play Experience */}
              {(review.play_time_actual || review.player_count_played) && (
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {review.play_time_actual && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>プレイ時間: {review.play_time_actual}分</span>
                    </div>
                  )}
                  {review.player_count_played && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>
                        {review.player_count_played === 7 ? "7人以上" : `${review.player_count_played}人`}でプレイ
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Mechanics and Categories */}
              {(review.mechanics?.length || review.categories?.length) && (
                <div className="flex flex-wrap gap-1">
                  {review.mechanics?.slice(0, 3).map((mechanic, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {mechanic}
                    </Badge>
                  ))}
                  {review.categories?.slice(0, 2).map((category, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                  {((review.mechanics?.length || 0) + (review.categories?.length || 0)) > 5 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      +他
                    </Badge>
                  )}
                </div>
              )}

              {/* Custom Tags */}
              {review.custom_tags && review.custom_tags.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">タグ: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {review.custom_tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-purple-50 text-purple-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Legacy Pros/Cons */}
              {((review.pros && review.pros.length > 0) || (review.cons && review.cons.length > 0)) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {review.pros && review.pros.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-green-700">良い点</span>
                        </div>
                        <ul className="space-y-1">
                          {review.pros.slice(0, 3).map((pro, index) => (
                            <li key={index} className="text-sm text-muted-foreground pl-2">
                              • {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {review.cons && review.cons.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-sm font-medium text-red-700">気になる点</span>
                        </div>
                        <ul className="space-y-1">
                          {review.cons.slice(0, 3).map((con, index) => (
                            <li key={index} className="text-sm text-muted-foreground pl-2">
                              • {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Footer Actions */}
          {variant !== 'compact' && (
            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/reviews/${review.id}`}>
                  詳細を読む
                </Link>
              </Button>
              
              <div className="flex items-center gap-2">
                {review.created_at !== review.updated_at && (
                  <span className="text-xs text-muted-foreground">
                    更新: {format(new Date(review.updated_at), 'M/d', { locale: ja })}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}