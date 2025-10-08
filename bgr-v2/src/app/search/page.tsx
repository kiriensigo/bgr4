'use client'

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Loader2, AlertTriangle } from 'lucide-react'

import IntegratedSearchForm from '@/components/search/IntegratedSearchForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ReviewSearchFormValues,
  mergeWithDefaultReviewFilters,
  buildReviewSearchParams,
  parseReviewSearchParams,
  hasActiveReviewFilters,
  formatRecommendedPlayerLabel
} from '@/lib/search/review-filters'
import {
  REVIEW_MECHANIC_OPTIONS,
  REVIEW_CATEGORY_OPTIONS
} from '@/shared/constants/review-search'

interface ReviewStats {
  review_count: number
  avg_overall_score: number
  avg_rule_complexity: number
  avg_luck_factor: number
  avg_interaction: number
  avg_downtime: number
  avg_actual_play_time: number | null
  popular_mechanics: string[]
  popular_categories: string[]
  popular_player_counts: number[]
}

interface ReviewSearchGame {
  id: number
  name: string
  japanese_name?: string | null
  image_url?: string | null
  min_players?: number | null
  max_players?: number | null
  playing_time?: number | null
  review_stats?: ReviewStats
}

interface ReviewSearchResponse {
  success: boolean
  data: ReviewSearchGame[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: {
    mechanics?: string[]
    categories?: string[]
    recommendedPlayerCounts?: number[]
    gamePlayerCounts?: number[]
  }
  facets?: {
    total_games?: number
    avg_overall_score?: number
  }
  message?: string
}

const mechanicsOptionSet = new Set(REVIEW_MECHANIC_OPTIONS.map((option) => option.label))
const categoriesOptionSet = new Set(REVIEW_CATEGORY_OPTIONS.map((option) => option.label))

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<ReviewSearchFormValues>(mergeWithDefaultReviewFilters())
  const [searchResults, setSearchResults] = useState<ReviewSearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastQueryRef = useRef<string>('')

  const searchParamsString = useMemo(() => searchParams?.toString() ?? '', [searchParams])

  const performSearch = useCallback(async (values: ReviewSearchFormValues) => {
    setLoading(true)
    setError(null)

    try {
      const params = buildReviewSearchParams(values)
      const queryString = params.toString()
      lastQueryRef.current = queryString

      const response = await fetch(`/api/search/reviews?${queryString}`)
      if (!response.ok) {
        throw new Error('検索 API へのリクエストに失敗しました')
      }

      const data = (await response.json()) as ReviewSearchResponse
      if (!data.success) {
        throw new Error(data.message || '検索に失敗しました')
      }

      setSearchResults(data)
    } catch (err) {
      console.error('Review search error:', err)
      setError(err instanceof Error ? err.message : '検索中にエラーが発生しました')
      setSearchResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = useCallback(
    (nextFilters: ReviewSearchFormValues) => {
      setFilters(nextFilters)
      const params = buildReviewSearchParams(nextFilters)
      const query = params.toString()
      lastQueryRef.current = query
      const target = query ? `/search?${query}` : '/search'
      router.replace(target, { scroll: true })
      void performSearch(nextFilters)
    },
    [performSearch, router]
  )

  useEffect(() => {
    if (searchParamsString === lastQueryRef.current) {
      return
    }

    if (!searchParamsString) {
      const defaults = mergeWithDefaultReviewFilters()
      setFilters(defaults)
      setSearchResults(null)
      setError(null)
      lastQueryRef.current = ''
      return
    }

    const parsed = parseReviewSearchParams(new URLSearchParams(searchParamsString))
    setFilters(parsed)
    lastQueryRef.current = searchParamsString
    void performSearch(parsed)
  }, [performSearch, searchParamsString])

  const activeMechanics = new Set(searchResults?.filters?.mechanics ?? [])
  const activeCategories = new Set(searchResults?.filters?.categories ?? [])
  const activeRecommendedCounts = new Set(searchResults?.filters?.recommendedPlayerCounts ?? [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-10 sm:py-14 lg:py-16">
        <div className="max-w-3xl space-y-4">
          <Badge variant="outline" className="w-fit bg-white/80 backdrop-blur">
            レビュー統計ドリブン検索
          </Badge>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            今の気分にぴったりのボードゲームをレビュー統計から探そう
          </h1>
          <p className="text-base text-slate-600 sm:text-lg">
            総合スコアやルール難度、インタラクションといったレビューで集計した指標に加え、
            おすすめプレイ人数・メカニクス・カテゴリーのスイッチを組み合わせて目的のゲームに最短アクセスできます。
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
          <IntegratedSearchForm
            initialValues={filters}
            onSubmit={handleSearch}
            loading={loading}
            className="shadow-lg shadow-blue-100/40 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
          />

          <div className="space-y-6 lg:pl-2 xl:pl-4">
            {loading && (
              <Card>
                <CardContent className="flex items-center justify-center gap-2 py-10 text-slate-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>レビュー統計を集計中です…</span>
                </CardContent>
              </Card>
            )}

            {error && !loading && (
              <Card className="border-destructive/40 bg-destructive/5">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-base text-destructive">検索に失敗しました</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-destructive">
                  {error}
                </CardContent>
              </Card>
            )}

            {searchResults && !loading && !error && (
              <div className="space-y-4">
                <Card className="border-0 bg-white shadow-lg shadow-blue-100/40">
                  <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        {searchResults.pagination.total.toLocaleString()}件ヒットしました
                      </h2>
                      {searchResults.facets?.avg_overall_score && (
                        <p className="text-sm text-slate-600">
                          平均総合スコア: {searchResults.facets.avg_overall_score.toFixed(1)} / 10
                        </p>
                      )}
                    </div>
                    {hasActiveReviewFilters(filters) && (
                      <Badge variant="secondary" className="w-fit">
                        フィルタ適用中
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                {searchResults.data.length === 0 ? (
                  <Card className="border-dashed bg-white/70">
                    <CardContent className="py-12 text-center text-slate-600">
                      条件に一致するゲームが見つかりませんでした。フィルタを緩めて再検索してみてください。
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {searchResults.data.map((game) => {
                      const stats = game.review_stats
                      const playerCounts = stats?.popular_player_counts ?? []
                      const mechanics = (stats?.popular_mechanics ?? []).filter((mechanic) =>
                        mechanicsOptionSet.has(mechanic)
                      )
                      const categories = (stats?.popular_categories ?? []).filter((category) =>
                        categoriesOptionSet.has(category)
                      )

                      return (
                        <Card key={`${game.id}-${game.name}`} className="border-0 bg-white shadow-md shadow-blue-50/60">
                          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row">
                            {game.image_url && (
                              <div className="mx-auto w-28 flex-shrink-0 overflow-hidden rounded-lg border bg-slate-100 sm:mx-0 sm:w-32">
                                <img
                                  src={game.image_url}
                                  alt={game.name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            )}

                            <div className="flex-1 space-y-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold text-slate-900">
                                    {game.name}
                                  </h3>
                                  {game.japanese_name && (
                                    <p className="text-sm text-slate-600">{game.japanese_name}</p>
                                  )}
                                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                                    {typeof game.min_players === 'number' && typeof game.max_players === 'number' && (
                                      <span>
                                        プレイ人数 {game.min_players}〜{game.max_players}人
                                      </span>
                                    )}
                                    {stats?.avg_actual_play_time && (
                                      <span>実測プレイ時間 約 {stats.avg_actual_play_time}分</span>
                                    )}
                                  </div>
                                </div>

                                {stats && (
                                  <div className="rounded-lg bg-blue-50 px-3 py-2 text-right text-sm text-blue-700">
                                    <div className="font-semibold">
                                      総合 {stats.avg_overall_score.toFixed(1)} / 10
                                    </div>
                                    <div className="text-xs text-blue-600/80">
                                      レビュー {stats.review_count.toLocaleString()}件
                                    </div>
                                  </div>
                                )}
                              </div>

                              {stats && (
                                <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                                  <div>
                                    <span className="text-xs text-slate-500">ルール難度</span>
                                    <div className="font-medium text-slate-800">{stats.avg_rule_complexity.toFixed(1)} / 5</div>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-500">運要素</span>
                                    <div className="font-medium text-slate-800">{stats.avg_luck_factor.toFixed(1)} / 5</div>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-500">インタラクション</span>
                                    <div className="font-medium text-slate-800">{stats.avg_interaction.toFixed(1)} / 5</div>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-500">ダウンタイム</span>
                                    <div className="font-medium text-slate-800">{stats.avg_downtime.toFixed(1)} / 5</div>
                                  </div>
                                </div>
                              )}

                              <div className="space-y-3">
                                {playerCounts.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-xs font-semibold text-slate-500">おすすめプレイ人数</span>
                                    <div className="flex flex-wrap gap-2">
                                      {playerCounts.map((count) => {
                                        const active = activeRecommendedCounts.has(count)
                                        return (
                                          <Badge
                                            key={`${game.id}-player-${count}`}
                                            variant={active ? 'default' : 'outline'}
                                            className="rounded-full px-3 py-1 text-xs"
                                          >
                                            {formatRecommendedPlayerLabel(count)}
                                          </Badge>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}

                                {mechanics.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-xs font-semibold text-slate-500">人気のメカニクス</span>
                                    <div className="flex flex-wrap gap-2">
                                      {mechanics.map((mechanic) => {
                                        const active = activeMechanics.has(mechanic)
                                        return (
                                          <Badge
                                            key={`${game.id}-mechanic-${mechanic}`}
                                            variant={active ? 'default' : 'outline'}
                                            className="rounded-full px-3 py-1 text-xs"
                                          >
                                            {mechanic}
                                          </Badge>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}

                                {categories.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-xs font-semibold text-slate-500">人気のカテゴリー</span>
                                    <div className="flex flex-wrap gap-2">
                                      {categories.map((category) => {
                                        const active = activeCategories.has(category)
                                        return (
                                          <Badge
                                            key={`${game.id}-category-${category}`}
                                            variant={active ? 'default' : 'outline'}
                                            className="rounded-full px-3 py-1 text-xs"
                                          >
                                            {category}
                                          </Badge>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {!searchResults && !loading && !error && (
              <Card className="border-dashed bg-white/80">
                <CardContent className="space-y-4 py-12 text-center text-slate-600">
                  <Search className="mx-auto h-10 w-10 text-blue-400" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-900">レビュー基準検索を始めましょう</h3>
                    <p className="text-sm">
                      スイッチ式フィルタを組み合わせると、いま遊びたいボードゲームに素早くたどり着けます。
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-6">
          <div className="h-6 w-32 rounded bg-slate-200/70" />
          <div className="h-10 w-3/4 rounded bg-slate-200/70" />
          <div className="h-4 w-2/3 rounded bg-slate-200/60" />
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div className="h-[540px] rounded-2xl bg-slate-200/60" />
          <div className="space-y-4">
            <div className="h-32 rounded-2xl bg-slate-200/50" />
            <div className="h-48 rounded-2xl bg-slate-200/40" />
          </div>
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
