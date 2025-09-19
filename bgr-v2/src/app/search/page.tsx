'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Search, Loader2 } from 'lucide-react'

import IntegratedSearchForm from '@/components/search/IntegratedSearchForm'
import { type SearchFilters, type SearchResult } from '@/types/search'
import { type EnhancedReview } from '@/types/enhanced-review'

// レビューベース検索フィルター型定義
interface ReviewSearchFilters {
  query: string
  overallScore: [number, number]
  ruleComplexity: [number, number]
  luckFactor: [number, number]
  interaction: [number, number]
  downtime: [number, number]
  selectedPlayerCounts: number[]
  selectedGamePlayerCounts: number[]
  playTimeRange: [number, number]
  selectedMechanics: string[]
  selectedCategories: string[]
}

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchResults, setSearchResults] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // レビューベース検索実行
  const performReviewBasedSearch = useCallback(async (filters: ReviewSearchFilters) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      
      if (filters.query) params.set('query', filters.query)
      
      // 5軸評価パラメータ
      if (filters.overallScore[0] !== 1 || filters.overallScore[1] !== 10) {
        params.set('overallScoreMin', filters.overallScore[0].toString())
        params.set('overallScoreMax', filters.overallScore[1].toString())
      }
      if (filters.ruleComplexity[0] !== 1 || filters.ruleComplexity[1] !== 5) {
        params.set('ruleComplexityMin', filters.ruleComplexity[0].toString())
        params.set('ruleComplexityMax', filters.ruleComplexity[1].toString())
      }
      if (filters.luckFactor[0] !== 1 || filters.luckFactor[1] !== 5) {
        params.set('luckFactorMin', filters.luckFactor[0].toString())
        params.set('luckFactorMax', filters.luckFactor[1].toString())
      }
      if (filters.interaction[0] !== 1 || filters.interaction[1] !== 5) {
        params.set('interactionMin', filters.interaction[0].toString())
        params.set('interactionMax', filters.interaction[1].toString())
      }
      if (filters.downtime[0] !== 1 || filters.downtime[1] !== 5) {
        params.set('downtimeMin', filters.downtime[0].toString())
        params.set('downtimeMax', filters.downtime[1].toString())
      }
      
      // プレイ時間
      if (filters.playTimeRange[0] !== 15 || filters.playTimeRange[1] !== 180) {
        params.set('playTimeMin', filters.playTimeRange[0].toString())
        params.set('playTimeMax', filters.playTimeRange[1].toString())
      }
      
      // プレイ人数
      filters.selectedGamePlayerCounts.forEach(count => 
        params.append('gamePlayerCounts', count.toString())
      )
      filters.selectedPlayerCounts.forEach(count => 
        params.append('recommendedPlayerCounts', count.toString())
      )
      
      // メカニクス・カテゴリー
      filters.selectedMechanics.forEach(mechanic => 
        params.append('mechanics', mechanic)
      )
      filters.selectedCategories.forEach(category => 
        params.append('categories', category)
      )
      
      const response = await fetch(`/api/search/reviews?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data)
      } else {
        setError(data.message || '検索に失敗しました')
      }
    } catch (err) {
      console.error('Search error:', err)
      setError('検索中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [])

  // URLパラメータから初期フィルターを構築
  const getInitialFilters = useCallback((): SearchFilters => {
    const filters: SearchFilters = {}
    
    if (searchParams.get('query')) filters.query = searchParams.get('query')!
    if (searchParams.get('minRating')) filters.minRating = parseFloat(searchParams.get('minRating')!)
    if (searchParams.get('maxRating')) filters.maxRating = parseFloat(searchParams.get('maxRating')!)
    if (searchParams.get('minPlayers')) filters.minPlayers = parseInt(searchParams.get('minPlayers')!)
    if (searchParams.get('maxPlayers')) filters.maxPlayers = parseInt(searchParams.get('maxPlayers')!)
    if (searchParams.get('yearFrom')) filters.yearFrom = parseInt(searchParams.get('yearFrom')!)
    if (searchParams.get('yearTo')) filters.yearTo = parseInt(searchParams.get('yearTo')!)
    if (searchParams.get('sortBy')) filters.sortBy = searchParams.get('sortBy') as any
    if (searchParams.get('sortOrder')) filters.sortOrder = searchParams.get('sortOrder') as any
    if (searchParams.get('page')) filters.page = parseInt(searchParams.get('page')!)
    
    // 配列パラメータ
    const mechanics = searchParams.getAll('mechanics').filter(Boolean)
    if (mechanics.length > 0) filters.mechanics = mechanics
    
    const categories = searchParams.getAll('categories').filter(Boolean)
    if (categories.length > 0) filters.categories = categories
    
    const publishers = searchParams.getAll('publishers').filter(Boolean)
    if (publishers.length > 0) filters.publishers = publishers

    const ruleComplexity = searchParams.getAll('ruleComplexity').map(Number).filter(Boolean)
    if (ruleComplexity.length > 0) filters.ruleComplexity = ruleComplexity

    const luckFactor = searchParams.getAll('luckFactor').map(Number).filter(Boolean)
    if (luckFactor.length > 0) filters.luckFactor = luckFactor

    const interaction = searchParams.getAll('interaction').map(Number).filter(Boolean)
    if (interaction.length > 0) filters.interaction = interaction

    const downtime = searchParams.getAll('downtime').map(Number).filter(Boolean)
    if (downtime.length > 0) filters.downtime = downtime

    const playingTime = searchParams.getAll('playingTime').map(Number).filter(Boolean)
    if (playingTime.length > 0) filters.playingTime = playingTime
    
    return filters
  }, [searchParams])

  // URLの更新
  const updateURL = useCallback((filters: SearchFilters) => {
    const params = new URLSearchParams()
    
    if (filters.query) params.set('query', filters.query)
    if (filters.minRating) params.set('minRating', filters.minRating.toString())
    if (filters.maxRating) params.set('maxRating', filters.maxRating.toString())
    if (filters.minPlayers) params.set('minPlayers', filters.minPlayers.toString())
    if (filters.maxPlayers) params.set('maxPlayers', filters.maxPlayers.toString())
    if (filters.yearFrom) params.set('yearFrom', filters.yearFrom.toString())
    if (filters.yearTo) params.set('yearTo', filters.yearTo.toString())
    if (filters.sortBy) params.set('sortBy', filters.sortBy)
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)
    if (filters.page && filters.page > 1) params.set('page', filters.page.toString())
    
    // 配列パラメータ
    filters.mechanics?.forEach(mechanic => params.append('mechanics', mechanic))
    filters.categories?.forEach(category => params.append('categories', category))
    filters.publishers?.forEach(publisher => params.append('publishers', publisher))
    filters.ruleComplexity?.forEach(complexity => params.append('ruleComplexity', complexity.toString()))
    filters.luckFactor?.forEach(luck => params.append('luckFactor', luck.toString()))
    filters.interaction?.forEach(inter => params.append('interaction', inter.toString()))
    filters.downtime?.forEach(down => params.append('downtime', down.toString()))
    filters.playingTime?.forEach(time => params.append('playingTime', time.toString()))
    
    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search'
    router.push(newUrl)
  }, [router])
  void updateURL

  // 検索実行
  const performSearch = useCallback(async (filters: SearchFilters) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      
      // フィルターをURLSearchParamsに変換
      if (filters.query) params.set('query', filters.query)
      if (filters.minRating) params.set('minRating', filters.minRating.toString())
      if (filters.maxRating) params.set('maxRating', filters.maxRating.toString())
      if (filters.minPlayers) params.set('minPlayers', filters.minPlayers.toString())
      if (filters.maxPlayers) params.set('maxPlayers', filters.maxPlayers.toString())
      if (filters.yearFrom) params.set('yearFrom', filters.yearFrom.toString())
      if (filters.yearTo) params.set('yearTo', filters.yearTo.toString())
      if (filters.sortBy) params.set('sortBy', filters.sortBy)
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)
      if (filters.page) params.set('page', filters.page.toString())
      if (filters.limit) params.set('limit', filters.limit.toString())
      
      // 配列パラメータ
      filters.mechanics?.forEach(mechanic => params.append('mechanics', mechanic))
      filters.categories?.forEach(category => params.append('categories', category))
      filters.publishers?.forEach(publisher => params.append('publishers', publisher))
      filters.ruleComplexity?.forEach(complexity => params.append('ruleComplexity', complexity.toString()))
      filters.luckFactor?.forEach(luck => params.append('luckFactor', luck.toString()))
      filters.interaction?.forEach(inter => params.append('interaction', inter.toString()))
      filters.downtime?.forEach(down => params.append('downtime', down.toString()))
      filters.playingTime?.forEach(time => params.append('playingTime', time.toString()))

      const response = await fetch(`/api/search?${params.toString()}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Search failed')
      }

      // API応答から SearchResult 形式にマッピング
      const searchResult: SearchResult<EnhancedReview> = {
        data: data.data || [],
        pagination: data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        },
        filters: data.filters || filters,
        facets: data.facets
      }

      setSearchResults(searchResult)
      
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : '検索中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [])

  // 検索フィルターの変更ハンドラ（未使用のため削除）

  // フィルター変更ハンドラ（未使用のため削除）

  // 初期検索（ページロード時・URLパラメータ変更時）
  useEffect(() => {
    const initialFilters = getInitialFilters()
    
    // URLにパラメータがある場合は検索実行
    if (Object.keys(initialFilters).length > 0) {
      performSearch(initialFilters)
    }
  }, [getInitialFilters, performSearch])

  // const initialFilters = getInitialFilters() // unused

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-8 h-8" />
            <h1 className="text-3xl font-bold">ボードゲーム検索</h1>
          </div>
          <p className="text-muted-foreground">
            詳細な検索とフィルターでお気に入りのボードゲームレビューを見つけましょう
          </p>
        </div>

        <div className="space-y-8">
          {/* Review-Based Search Form */}
          <IntegratedSearchForm
            onSearch={performReviewBasedSearch}
            loading={loading}
          />

          {/* Error Display */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <span className="font-medium">エラー:</span>
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>検索中...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          {searchResults && !loading && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    検索結果: {searchResults.pagination?.total || 0}件
                  </h2>
                </div>
                
                {searchResults.data && searchResults.data.length > 0 ? (
                  <div className="grid gap-4">
                    {searchResults.data.map((game: any) => (
                      <Card key={game.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex gap-4">
                            <div className="flex-shrink-0">
                              {game.image_url && (
                                <img 
                                  src={game.image_url} 
                                  alt={game.name}
                                  className="w-16 h-16 rounded object-cover"
                                />
                              )}
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold hover:text-blue-600 cursor-pointer">
                                    {game.name}
                                  </h3>
                                  {game.japanese_name && (
                                    <p className="text-sm text-gray-600">{game.japanese_name}</p>
                                  )}
                                </div>
                                
                                {game.review_stats && (
                                  <div className="text-right">
                                    <div className="flex items-center gap-1">
                                      <div className="flex">
                                        {Array.from({ length: 5 }, (_, i) => {
                                          const filled = i < Math.floor(game.review_stats.avg_overall_score / 2)
                                          return (
                                            <span key={i} className={filled ? 'text-yellow-400' : 'text-gray-300'}>
                                              ★
                                            </span>
                                          )
                                        })}
                                      </div>
                                      <span className="font-semibold">
                                        {game.review_stats.avg_overall_score}点
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      ({game.review_stats.review_count}件のレビュー)
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex gap-4 text-sm text-gray-600">
                                <span>プレイ人数: {game.min_players}-{game.max_players}人</span>
                                {game.review_stats?.avg_actual_play_time && (
                                  <span>実プレイ時間: {game.review_stats.avg_actual_play_time}分</span>
                                )}
                              </div>
                              
                              {game.review_stats && (
                                <div className="grid grid-cols-4 gap-2 text-sm">
                                  <div className="text-center">
                                    <span className="text-gray-500">ルール:</span>
                                    <span className="font-medium ml-1">
                                      {game.review_stats.avg_rule_complexity}
                                    </span>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-gray-500">運要素:</span>
                                    <span className="font-medium ml-1">
                                      {game.review_stats.avg_luck_factor}
                                    </span>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-gray-500">相互作用:</span>
                                    <span className="font-medium ml-1">
                                      {game.review_stats.avg_interaction}
                                    </span>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-gray-500">ダウンタイム:</span>
                                    <span className="font-medium ml-1">
                                      {game.review_stats.avg_downtime}
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex gap-2 flex-wrap">
                                {game.review_stats?.popular_mechanics?.slice(0, 3).map((mechanic: string) => (
                                  <span key={mechanic} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    {mechanic}
                                  </span>
                                ))}
                                {game.review_stats?.popular_categories?.slice(0, 2).map((category: string) => (
                                  <span key={category} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                    {category}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-8">
                    <CardContent>
                      <p className="text-gray-500">検索条件に一致するゲームが見つかりませんでした。</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}

          {/* Welcome State - No search performed */}
          {!searchResults && !loading && !error && (
            <Card className="text-center py-16">
              <CardContent>
                <div className="space-y-4">
                  <Search className="w-16 h-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">レビューベース検索</h3>
                    <p className="text-muted-foreground">
                      5軸評価とプレイ特性で、あなたにぴったりのボードゲームを見つけましょう
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• <strong>5軸評価:</strong> 総合得点、ルール難度、運要素、相互作用、ダウンタイム</p>
                    <p>• <strong>プレイ特性:</strong> おすすめプレイ人数、メカニクス、カテゴリー</p>
                    <p>• <strong>実データベース:</strong> 実際のレビューから統計を計算</p>
                    <p>• <strong>高精度検索:</strong> レビュアーの評価に基づく正確な検索結果</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-10 bg-muted rounded"></div>
                <div className="grid gap-4">
                  <div className="h-20 bg-muted rounded"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchPageContent />
    </Suspense>
  )
}
