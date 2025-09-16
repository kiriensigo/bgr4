'use client'

import { useState } from 'react'
import { ReviewCard } from './ReviewCard'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export interface Review {
  id: number
  title: string
  content: string
  rating: number
  pros?: string[]
  cons?: string[]
  created_at: string
  updated_at: string
  user_id: string
  game_id: number
  is_published: boolean
  user?: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
  game?: {
    id: number
    name: string
    image_url: string | null
  }
  _count?: {
    comments: number
  }
}

export interface ReviewsListProps {
  reviews: Review[]
  loading?: boolean
  error?: string | null
  showGame?: boolean
  showUser?: boolean
  variant?: 'default' | 'compact' | 'detailed'
  showFilters?: boolean
  showSearch?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
  pagination?: {
    page: number
    totalPages: number
    total: number
  }
}

type SortOption = 'newest' | 'oldest' | 'rating-high' | 'rating-low'
type FilterOption = 'all' | 'published' | 'draft'

export function ReviewsList({
  reviews,
  loading = false,
  error = null,
  showGame = false,
  showUser: _showUser = true,
  variant = 'default',
  showFilters = true,
  showSearch = true,
  onLoadMore,
  hasMore = false,
  pagination
}: ReviewsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')

  // フィルタリング・ソート処理
  const filteredAndSortedReviews = reviews
    .filter(review => {
      // 検索フィルタ
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          review.title.toLowerCase().includes(searchLower) ||
          review.content.toLowerCase().includes(searchLower) ||
          review.game?.name.toLowerCase().includes(searchLower) ||
          review.user?.username.toLowerCase().includes(searchLower) ||
          review.user?.full_name?.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
    .filter(review => {
      // 公開状態フィルタ
      if (filterBy === 'published') return review.is_published
      if (filterBy === 'draft') return !review.is_published
      return true
    })
    .sort((a, b) => {
      // ソート
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'rating-high':
          return b.rating - a.rating
        case 'rating-low':
          return a.rating - b.rating
        default:
          return 0
      }
    })

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">エラー: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* フィルタ・検索バー */}
      {(showFilters || showSearch) && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="レビュー、ゲーム、ユーザーを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          
          {showFilters && (
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="published">公開済み</SelectItem>
                    <SelectItem value="draft">下書き</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                {sortBy.includes('asc') ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">新しい順</SelectItem>
                    <SelectItem value="oldest">古い順</SelectItem>
                    <SelectItem value="rating-high">評価高い順</SelectItem>
                    <SelectItem value="rating-low">評価低い順</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ローディング状態 */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* レビュー一覧 */}
      {!loading && (
        <>
          {filteredAndSortedReviews.length > 0 ? (
            <div className={`space-y-6 ${
              variant === 'compact' ? 'space-y-3' : 'space-y-6'
            }`}>
              {filteredAndSortedReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review as any}
                  showGameInfo={showGame}
                  variant={variant}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm || filterBy !== 'all' 
                    ? '条件に一致するレビューが見つかりません'
                    : 'まだレビューがありません'
                  }
                </p>
              </CardContent>
            </Card>
          )}

          {/* ページネーション・Load More */}
          {filteredAndSortedReviews.length > 0 && (
            <div className="flex justify-center pt-6">
              {onLoadMore && hasMore && (
                <Button 
                  onClick={onLoadMore}
                  variant="outline"
                  disabled={loading}
                >
                  {loading ? '読み込み中...' : 'もっと見る'}
                </Button>
              )}
              
              {pagination && (
                <div className="text-sm text-muted-foreground text-center">
                  {pagination.total}件中 {Math.min((pagination.page - 1) * 20 + 1, pagination.total)}-{Math.min(pagination.page * 20, pagination.total)}件を表示
                  {pagination.totalPages > 1 && (
                    <span className="ml-2">
                      (ページ {pagination.page} / {pagination.totalPages})
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}