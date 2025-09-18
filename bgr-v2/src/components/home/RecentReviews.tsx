import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Star, Clock, ArrowRight, User, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { EnhancedReview } from '@/types/enhanced-review'

interface RecentReviewsProps {
  reviews: EnhancedReview[]
}

export function RecentReviews({ reviews }: RecentReviewsProps) {
  if (reviews.length === 0) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">最新のレビュー</h2>
            <p className="text-muted-foreground mb-8">
              まだレビューがありません。最初のレビューを投稿してみませんか？
            </p>
            <Button asChild size="lg">
              <Link href="/reviews/new">
                <Star className="w-5 h-5 mr-2" />
                最初のレビューを書く
              </Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < Math.floor(rating / 2) 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-semibold text-yellow-600">
          {rating}/10
        </span>
      </div>
    )
  }

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">最新のレビュー</h2>
            <p className="text-muted-foreground">
              コミュニティの最新ゲーム体験をチェック
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/reviews" className="hidden sm:flex items-center gap-2">
              すべて見る
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Reviews Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 6).map((review) => (
            <Card 
              key={review.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800"
            >
              <CardHeader className="pb-4">
                <div className="flex gap-3">
                  {/* Game Image */}
                  {review.game?.image_url && (
                    <div className="flex-shrink-0 w-16 h-16 relative">
                      <Image
                        src={review.game.image_url}
                        alt={review.game.japanese_name || review.game.name}
                        fill
                        className="object-cover rounded-lg shadow-sm"
                        sizes="64px"
                        loading="lazy"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight mb-2">
                      <Link 
                        href={`/reviews/${review.id}`}
                        className="hover:text-primary transition-colors line-clamp-2"
                      >
                        {review.title}
                      </Link>
                    </CardTitle>
                    
                    {/* Game Info */}
                    {review.game && (
                      <div className="mb-3">
                        <Link 
                          href={`/games/${review.game.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {review.game.japanese_name || review.game.name}
                        </Link>
                      </div>
                    )}

                    {/* Rating */}
                    <div className="mb-3">
                      {renderStars(review.overall_score)}
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {review.user ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={review.user.avatar_url || undefined} />
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span>{review.user.full_name || review.user.username}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>匿名ユーザー</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {format(new Date(review.created_at), 'M月d日', { locale: ja })}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Review Content Preview */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {review.content}
                </p>

                {/* Detailed Ratings Indicators */}
                {(review.rule_complexity || review.luck_factor || review.interaction || review.downtime) && (
                  <div className="mb-4">
                    <div className="text-xs text-muted-foreground mb-2">詳細評価</div>
                    <div className="flex flex-wrap gap-2">
                      {review.rule_complexity && (
                        <Badge variant="secondary" className="text-xs">
                          複雑さ {review.rule_complexity}/5
                        </Badge>
                      )}
                      {review.luck_factor && (
                        <Badge variant="secondary" className="text-xs">
                          運要素 {review.luck_factor}/5
                        </Badge>
                      )}
                      {review.interaction && (
                        <Badge variant="secondary" className="text-xs">
                          相互作用 {review.interaction}/5
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Mechanics/Categories */}
                {(review.mechanics?.length || review.categories?.length) && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {review.mechanics?.slice(0, 2).map((mechanic, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {mechanic}
                        </Badge>
                      ))}
                      {review.categories?.slice(0, 1).map((category, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                      {(review.mechanics?.length || 0) + (review.categories?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +他
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/reviews/${review.id}`}>
                      続きを読む
                    </Link>
                  </Button>
                  
                  {review._count && review._count.comments > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="w-3 h-3" />
                      <span>{review._count.comments}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="text-center mt-8 sm:hidden">
          <Button variant="outline" asChild>
            <Link href="/reviews" className="flex items-center gap-2">
              すべてのレビューを見る
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
