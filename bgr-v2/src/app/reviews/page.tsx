'use client'

// Force recompilation
import React, { useState, useEffect, useRef } from 'react'
import { Container } from '@/components/layout/Container'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Filter, BookOpen, Star, Search, X, Sliders } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'

interface Review {
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
  profiles: {
    username: string
    full_name?: string
    avatar_url?: string
  }
  games: {
    name: string
    japanese_name?: string
    image_url?: string
    bgg_id: string
  }
}

interface ReviewsResponse {
  reviews: Review[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [limit, setLimit] = useState(12)
  const [latestTimestamp, setLatestTimestamp] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  
  // フィルタリング状態
  const [searchQuery, setSearchQuery] = useState('')
  const [minRating, setMinRating] = useState<number | null>(null)
  const [maxRating, setMaxRating] = useState<number | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedMechanics, setSelectedMechanics] = useState<string[]>([])
  const [minPlayers, setMinPlayers] = useState<number | null>(null)
  const [maxPlayers, setMaxPlayers] = useState<number | null>(null)
  const [hasDetailedRatings, setHasDetailedRatings] = useState<boolean | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  // 利用可能なフィルタオプション
  const availableCategories = [
    'ストラテジー', '家族向け', 'パーティー', 'カードゲーム', '協力ゲーム',
    'ダイス', 'タイル配置', 'ワーカープレイスメント', '競り/入札', 'エリア支配'
  ]
  
  const availableMechanics = [
    'ドラフト', 'デッキ構築', 'セット収集', 'パターン構築', '正体隠匿',
    'バースト', 'モジュラーボード', 'ルート構築', 'プレイヤー別能力', '同時アクション'
  ]

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      })
      
      // フィルタパラメータを追加
      if (searchQuery) params.set('search', searchQuery)
      if (minRating !== null) params.set('minRating', minRating.toString())
      if (maxRating !== null) params.set('maxRating', maxRating.toString())
      if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','))
      if (selectedMechanics.length > 0) params.set('mechanics', selectedMechanics.join(','))
      if (minPlayers !== null) params.set('minPlayers', minPlayers.toString())
      if (maxPlayers !== null) params.set('maxPlayers', maxPlayers.toString())
      if (hasDetailedRatings !== null) params.set('hasDetailedRatings', hasDetailedRatings.toString())

      const response = await fetch(`/api/reviews?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data: ReviewsResponse = await response.json()
      setReviews(data.reviews)
      setTotalPages(data.totalPages)
      setTotal(data.total)
      if (data.latestTimestamp) setLatestTimestamp(data.latestTimestamp)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [currentPage, sortBy, sortOrder, limit, searchQuery, minRating, maxRating, 
      selectedCategories, selectedMechanics, minPlayers, maxPlayers, hasDetailedRatings])

  // 差分フェッチ（簡易ポーリング）
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current as unknown as number)
    }
    pollingRef.current = setInterval(async () => {
      try {
        if (!latestTimestamp) return
        const res = await fetch(`/api/reviews?after=${encodeURIComponent(latestTimestamp)}`)
        if (!res.ok) return
        const diff = await res.json()
        const items = diff.items || []
        if (items.length > 0) {
          // 既存と重複除去して先頭に追加
          const existingIds = new Set(reviews.map(r => r.id))
          const merged = [...items.filter((it: any) => !existingIds.has(it.id)), ...reviews]
          setReviews(merged as any)
          if (diff.latestTimestamp) setLatestTimestamp(diff.latestTimestamp)
        }
      } catch {
        // no-op
      }
    }, 45000) // 45秒
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current as unknown as number)
    }
  }, [latestTimestamp, reviews])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-')
    setSortBy(field || 'created_at')
    setSortOrder((order as 'asc' | 'desc') || 'desc')
    setCurrentPage(1)
  }

  const handleLimitChange = (value: string) => {
    setLimit(parseInt(value))
    setCurrentPage(1)
  }
  
  // フィルタ関連ハンドラ
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
  }
  
  const addCategory = (category: string) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category])
      setCurrentPage(1)
    }
  }
  
  const removeCategory = (category: string) => {
    setSelectedCategories(selectedCategories.filter(cat => cat !== category))
    setCurrentPage(1)
  }
  
  const addMechanic = (mechanic: string) => {
    if (!selectedMechanics.includes(mechanic)) {
      setSelectedMechanics([...selectedMechanics, mechanic])
      setCurrentPage(1)
    }
  }
  
  const removeMechanic = (mechanic: string) => {
    setSelectedMechanics(selectedMechanics.filter(mech => mech !== mechanic))
    setCurrentPage(1)
  }
  
  const clearAllFilters = () => {
    setSearchQuery('')
    setMinRating(null)
    setMaxRating(null)
    setSelectedCategories([])
    setSelectedMechanics([])
    setMinPlayers(null)
    setMaxPlayers(null)
    setHasDetailedRatings(null)
    setCurrentPage(1)
  }

  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

  return (
    <Container>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">レビュー一覧</h1>
          
          {/* Search and Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
            {/* Search Form */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md">
              <Input
                type="search"
                placeholder="レビューを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </form>
            
            {/* Sort and Limit Controls */}
            <div className="flex gap-2 items-center">
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={handleSortChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">新着順</SelectItem>
                  <SelectItem value="created_at-asc">古い順</SelectItem>
                  <SelectItem value="rating-desc">高評価順</SelectItem>
                  <SelectItem value="rating-asc">低評価順</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={limit.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12件表示</SelectItem>
                  <SelectItem value="24">24件表示</SelectItem>
                  <SelectItem value="48">48件表示</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Sliders className="w-4 h-4 mr-2" />
                フィルタ
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedCategories.length > 0 || selectedMechanics.length > 0 || minRating !== null || maxRating !== null) && (
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <span className="text-sm font-medium">適用中のフィルタ:</span>
              
              {selectedCategories.map(category => (
                <Badge key={category} variant="secondary" className="flex items-center gap-1">
                  {category}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeCategory(category)} />
                </Badge>
              ))}
              
              {selectedMechanics.map(mechanic => (
                <Badge key={mechanic} variant="outline" className="flex items-center gap-1">
                  {mechanic}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeMechanic(mechanic)} />
                </Badge>
              ))}
              
              {minRating !== null && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  評価{minRating}.0以上
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setMinRating(null)} />
                </Badge>
              )}
              
              {maxRating !== null && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  評価{maxRating}.0以下
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setMaxRating(null)} />
                </Badge>
              )}
              
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                すべて削除
              </Button>
            </div>
          )}

          {/* Filters Panel */}
          <Collapsible open={showFilters}>
            <CollapsibleContent>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    詳細フィルタ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Categories Filter */}
                  <div>
                    <h4 className="font-medium mb-3">カテゴリー</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableCategories.map(category => (
                        <Button
                          key={category}
                          variant={selectedCategories.includes(category) ? "default" : "outline"}
                          size="sm"
                          onClick={() => 
                            selectedCategories.includes(category) 
                              ? removeCategory(category)
                              : addCategory(category)
                          }
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Mechanics Filter */}
                  <div>
                    <h4 className="font-medium mb-3">メカニクス</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableMechanics.map(mechanic => (
                        <Button
                          key={mechanic}
                          variant={selectedMechanics.includes(mechanic) ? "default" : "outline"}
                          size="sm"
                          onClick={() => 
                            selectedMechanics.includes(mechanic)
                              ? removeMechanic(mechanic)
                              : addMechanic(mechanic)
                          }
                        >
                          {mechanic}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <h4 className="font-medium mb-3">評価</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">最低評価</label>
                        <Select value={minRating?.toString() || ''} onValueChange={(value) => setMinRating(value ? parseFloat(value) : null)}>
                          <SelectTrigger>
                            <SelectValue placeholder="指定なし" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">指定なし</SelectItem>
                            {[1,2,3,4,5,6,7,8,9,10].map(rating => (
                              <SelectItem key={rating} value={rating.toString()}>
                                {rating}.0以上
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">最高評価</label>
                        <Select value={maxRating?.toString() || ''} onValueChange={(value) => setMaxRating(value ? parseFloat(value) : null)}>
                          <SelectTrigger>
                            <SelectValue placeholder="指定なし" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">指定なし</SelectItem>
                            {[1,2,3,4,5,6,7,8,9,10].map(rating => (
                              <SelectItem key={rating} value={rating.toString()}>
                                {rating}.0以下
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Reviews Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-20 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                showGameInfo={true}
              />
            ))}
          </div>
        )}

        {/* Results Info and Pagination */}
        {!loading && totalPages > 1 && (
          <div className="space-y-4 mt-8">
            {/* Stats */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{total}件のレビュー</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>平均評価: {averageRating.toFixed(1)}/10</span>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-2">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                  if (pageNum > totalPages) return null
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && reviews.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">レビューが見つかりませんでした</h3>
              <p className="text-muted-foreground mb-4">
                検索条件を変更するか、フィルタをクリアしてお試しください。
              </p>
              <Button variant="outline" onClick={clearAllFilters}>
                フィルタをクリア
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  )
}
