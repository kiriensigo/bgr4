'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/layout/Container'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Star, 
  ThumbsUp, 
  MessageCircle, 
  Calendar, 
  User, 
  ArrowLeft,
  Edit,
  Share2,
  Bookmark,
  Flag
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAuth } from '@/hooks/useAuth'
import ReviewStats from '@/components/reviews/ReviewStats'

interface DetailedReview {
  id: string
  title: string
  content: string
  rating: number
  overall_score?: number
  complexity_score?: number
  luck_score?: number
  interaction_score?: number
  downtime_score?: number
  pros?: string[]
  cons?: string[]
  categories?: string[]
  mechanics?: string[]
  recommended_player_counts?: number[]
  created_at: string
  updated_at?: string
  is_published: boolean
  profiles: {
    id: string
    username: string
    full_name?: string
    avatar_url?: string
  }
  games: {
    id: number
    name: string
    name_jp?: string
    image_url?: string
    bgg_id?: number
    year_published?: number
    min_players?: number
    max_players?: number
    playing_time?: number
  }
  likes?: number
  comments?: number
  userHasLiked?: boolean
  userHasBookmarked?: boolean
}

interface ReviewDetailContentProps {
  params: Promise<{ id: string }>
}

export default function ReviewDetailContent({ params }: ReviewDetailContentProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [review, setReview] = useState<DetailedReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liking, setLiking] = useState(false)
  const [reviewId, setReviewId] = useState<string>('')

  useEffect(() => {
    params.then(({ id }) => {
      setReviewId(id)
    })
  }, [params])

  useEffect(() => {
    if (reviewId) {
      fetchReview()
    }
  }, [reviewId])

  const fetchReview = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reviews/${reviewId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('レビューが見つかりませんでした')
        } else {
          setError('レビューの読み込みに失敗しました')
        }
        return
      }

      const { data } = await response.json()
      setReview(data)
    } catch (err) {
      console.error('Error fetching review:', err)
      setError('レビューの読み込み中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!user || !review || liking) return

    try {
      setLiking(true)
      const response = await fetch(`/api/reviews/${review.id}/likes`, {
        method: review.userHasLiked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setReview(prev => prev ? {
          ...prev,
          userHasLiked: !prev.userHasLiked,
          likes: prev.userHasLiked ? (prev.likes || 0) - 1 : (prev.likes || 0) + 1
        } : null)
      }
    } catch (err) {
      console.error('Error liking review:', err)
    } finally {
      setLiking(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: review?.title,
          text: `${review?.games.name}のレビュー: ${review?.title}`,
          url: window.location.href
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const renderStarRating = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const stars = Math.round(rating / 2) // Convert 10-point to 5-star
    const sizeClass = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    }[size]

    return (
      <div className="flex items-center gap-2">
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
        <span className="font-semibold text-lg">
          {rating.toFixed(1)} / 10
        </span>
      </div>
    )
  }

  const renderDetailedScores = () => {
    if (!review) return null

    const scores = {
      overall: review.overall_score || review.rating,
      complexity: review.complexity_score,
      luck: review.luck_score,
      interaction: review.interaction_score,
      downtime: review.downtime_score
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            詳細評価
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewStats stats={scores} size="md" />
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Container>
        <div className="py-8 space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </div>
      </Container>
    )
  }

  if (error || !review) {
    return (
      <Container>
        <div className="py-16 text-center">
          <div className="text-gray-400 mb-4">
            <MessageCircle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'レビューが見つかりません'}
          </h2>
          <p className="text-gray-600 mb-6">
            指定されたレビューは存在しないか、削除された可能性があります。
          </p>
          <Button onClick={() => router.push('/reviews')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            レビュー一覧に戻る
          </Button>
        </div>
      </Container>
    )
  }

  const isOwner = user && user.id === review.profiles.id
  const gameName = review.games.name_jp || review.games.name
  const userDisplayName = review.profiles.full_name || review.profiles.username

  return (
    <Container>
      <div className="py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="relative w-full md:w-48 h-48 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {review.games.image_url ? (
                      <Image
                        src={review.games.image_url}
                        alt={gameName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No Image
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <Link 
                      href={`/games/${review.games.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      <h1 className="text-2xl font-bold mb-2">{gameName}</h1>
                    </Link>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                      {review.games.year_published && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>{review.games.year_published}年</span>
                        </div>
                      )}
                      
                      {review.games.min_players && review.games.max_players && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span>
                            {review.games.min_players === review.games.max_players
                              ? `${review.games.min_players}人`
                              : `${review.games.min_players}-${review.games.max_players}人`
                            }
                          </span>
                        </div>
                      )}

                      {review.games.playing_time && (
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 text-center text-gray-500 font-bold">⏱</span>
                          <span>{review.games.playing_time}分</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {(review.categories || review.mechanics) && (
                      <div className="flex flex-wrap gap-2">
                        {review.categories?.map(category => (
                          <Badge key={category} variant="secondary">
                            {category}
                          </Badge>
                        ))}
                        {review.mechanics?.map(mechanic => (
                          <Badge key={mechanic} variant="outline">
                            {mechanic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Content */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-4">{review.title}</h2>
                    {renderStarRating(review.overall_score || review.rating, 'lg')}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleShare}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    
                    {user && (
                      <Button variant="ghost" size="sm">
                        <Bookmark className="w-4 h-4" />
                      </Button>
                    )}

                    {isOwner && (
                      <Link href={`/reviews/${review.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}

                    {!isOwner && user && (
                      <Button variant="ghost" size="sm">
                        <Flag className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="prose prose-gray max-w-none mb-6">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {review.content}
                  </p>
                </div>

                {/* Pros and Cons */}
                {(review.pros || review.cons) && (
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {review.pros && review.pros.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                          <ThumbsUp className="w-4 h-4" />
                          良い点
                        </h3>
                        <ul className="space-y-2">
                          {review.pros.map((pro, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-green-500 mt-1">+</span>
                              <span className="text-gray-700">{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {review.cons && review.cons.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                          <span className="rotate-180">
                            <ThumbsUp className="w-4 h-4" />
                          </span>
                          改善点
                        </h3>
                        <ul className="space-y-2">
                          {review.cons.map((con, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-red-500 mt-1">-</span>
                              <span className="text-gray-700">{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommended Player Counts */}
                {review.recommended_player_counts && review.recommended_player_counts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-3">推奨プレイ人数</h3>
                    <div className="flex flex-wrap gap-2">
                      {review.recommended_player_counts.sort((a, b) => a - b).map(count => (
                        <Badge key={count} variant="outline">
                          {count}人
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Author and Actions */}
                <div className="flex items-center justify-between pt-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.profiles.avatar_url} />
                      <AvatarFallback>{userDisplayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Link 
                        href={`/users/${review.profiles.username}`}
                        className="font-semibold hover:text-blue-600 transition-colors"
                      >
                        {userDisplayName}
                      </Link>
                      <div className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(review.created_at), { 
                          addSuffix: true, 
                          locale: ja 
                        })}
                        {review.updated_at && new Date(review.updated_at) > new Date(review.created_at) && (
                          <span className="ml-2">(編集済み)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {user && (
                      <Button 
                        variant={review.userHasLiked ? "default" : "outline"}
                        size="sm"
                        onClick={handleLike}
                        disabled={liking}
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        {review.likes || 0}
                      </Button>
                    )}

                    <Button variant="outline" size="sm">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {review.comments || 0}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Detailed Scores */}
            {renderDetailedScores()}

            {/* Related Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>関連レビュー</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  このゲームの他のレビューを表示します。
                </p>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href={`/games/${review.games.id}/reviews`}>
                    他のレビューを見る
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {user && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Link href={`/games/${review.games.id}/review`} className="w-full">
                      <Button className="w-full">
                        このゲームをレビューする
                      </Button>
                    </Link>
                    
                    <Link href={`/games/${review.games.id}`} className="w-full">
                      <Button variant="outline" className="w-full">
                        ゲーム詳細を見る
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Container>
  )
}