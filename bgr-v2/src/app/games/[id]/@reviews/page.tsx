// import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SupabaseReviewRepository } from '@/infrastructure/repositories/SupabaseReviewRepository'

interface GameReviewsProps {
  params: Promise<{ id: string }>
}

async function getLatestReviews(gameId: number) {
  const supabase = await createServerSupabaseClient()
  const reviewRepository = new SupabaseReviewRepository(supabase)
  
  const result = await reviewRepository.findMany({ 
    gameId, 
    isPublished: true,
    limit: 10, // より多く取得して、フィルター後に5件確保
    sortBy: 'created_at',
    sortOrder: 'desc'
  })
  
  // デフォルトテキストを除外してから5件取得
  const filteredReviews = result.data?.filter(review => 
    !review.content || 
    review.content.trim() === '' || 
    (review.content !== '5軸評価によるレビューです。' && 
     review.content !== '5軸評価レビューです')
  ) || []
  
  return filteredReviews.slice(0, 5)
}

async function getCommentReviews(gameId: number) {
  const supabase = await createServerSupabaseClient()
  const reviewRepository = new SupabaseReviewRepository(supabase)
  
  const result = await reviewRepository.findMany({ 
    gameId, 
    isPublished: true,
    limit: 5,
    sortBy: 'created_at',
    sortOrder: 'desc'
  })
  
  // コメントがあるレビューのみフィルター
  const commentReviews = result.data?.filter(review => 
    review.content && 
    review.content.trim() !== '' && 
    review.content !== '5軸評価によるレビューです。' &&
    review.content !== '5軸評価レビューです'
  ) || []
  
  return commentReviews
}


function ReviewCard({ review }: { review: any }) {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium">{review.overallScore || review.rating}</span>
          </div>
        </div>
        
        {review.content && 
         review.content.trim() !== '' && 
         review.content !== '5軸評価によるレビューです。' && 
         review.content !== '5軸評価レビューです' && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
            {review.content}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {review.pros && review.pros.length > 0 && (
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                <span>{review.pros.length}</span>
              </div>
            )}
            {review.cons && review.cons.length > 0 && (
              <div className="flex items-center gap-1">
                <ThumbsDown className="w-3 h-3" />
                <span>{review.cons.length}</span>
              </div>
            )}
          </div>
          <span>
            {new Date(review.createdAt).toLocaleDateString('ja-JP')}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function GameReviewsPage({ params }: GameReviewsProps) {
  const { id } = await params
  const gameId = parseInt(id)
  
  if (isNaN(gameId)) {
    return null
  }

  const [latestReviews, commentReviews] = await Promise.all([
    getLatestReviews(gameId),
    getCommentReviews(gameId)
  ])

  return (
    <div className="space-y-6">
      {/* 最新レビュー */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              最新レビュー
              {latestReviews.length > 0 && (
                <Badge variant="secondary">{latestReviews.length}</Badge>
              )}
            </CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href={`/reviews/new/${gameId}`}>
                レビューを書く
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {latestReviews.length > 0 ? (
            <div className="space-y-4">
              {latestReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                まだレビューがありません
              </p>
              <Button asChild>
                <Link href={`/reviews/new/${gameId}`}>
                  最初のレビューを書く
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* コメント付きレビュー */}
      {commentReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              コメント付きレビュー
              <Badge variant="secondary">{commentReviews.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {commentReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
