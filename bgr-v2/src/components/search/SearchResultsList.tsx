'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  ChevronUp, 
  ChevronDown,
  Star,
  Users,
  Clock,
  Calendar,
  Gamepad2
} from 'lucide-react'

import { EnhancedReviewCard } from '@/components/reviews/EnhancedReviewCard'
import { type EnhancedReview } from '@/types/enhanced-review'
import { type SearchResult, type SearchFilters } from '@/types/search'

interface SearchResultsListProps {
  results: SearchResult<EnhancedReview>
  onFiltersChange: (filters: SearchFilters) => void
  loading?: boolean
  viewMode?: 'list' | 'grid'
  onViewModeChange?: (mode: 'list' | 'grid') => void
}

export function SearchResultsList({
  results,
  onFiltersChange,
  loading = false,
  viewMode = 'list',
  onViewModeChange
}: SearchResultsListProps) {
  const [showFacets, setShowFacets] = useState(true)
  
  const handleFacetClick = (facetType: string, value: string) => {
    const currentFilters = results.filters
    const currentValues = (currentFilters as any)[facetType] || []
    
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v: string) => v !== value)
      : [...currentValues, value]
    
    onFiltersChange({
      ...currentFilters,
      [facetType]: newValues.length > 0 ? newValues : undefined
    })
  }
  
  const getActiveFilterCount = () => {
    let count = 0
    const filters = results.filters
    if (filters.query?.trim()) count++
    if (filters.mechanics?.length) count++
    if (filters.categories?.length) count++
    if (filters.publishers?.length) count++
    if (filters.playingTime?.length) count++
    if (filters.ruleComplexity?.length) count++
    if (filters.minRating && filters.minRating > 1) count++
    if (filters.maxRating && filters.maxRating < 10) count++
    return count
  }

  const formatResultsText = () => {
    const { total } = results.pagination
    if (total === 0) return '検索結果なし'
    if (total === 1) return '1件の検索結果'
    return `${total.toLocaleString()}件の検索結果`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Results Header Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="h-6 bg-muted rounded w-48"></div>
              <div className="h-10 bg-muted rounded w-32"></div>
            </div>
          </CardHeader>
        </Card>

        {/* Results Skeleton */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                <CardTitle>{formatResultsText()}</CardTitle>
              </div>
              
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary">
                  {getActiveFilterCount()} フィルター適用中
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              {onViewModeChange && (
                <div className="flex rounded-md overflow-hidden border">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onViewModeChange('list')}
                    className="rounded-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onViewModeChange('grid')}
                    className="rounded-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              {/* Facets Toggle */}
              {results.facets && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFacets(!showFacets)}
                >
                  <Filter className="w-4 h-4 mr-1" />
                  絞り込み
                  {showFacets ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {getActiveFilterCount() > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">適用中のフィルター:</div>
                <div className="flex flex-wrap gap-2">
                  {results.filters.query && (
                    <Badge variant="default" className="cursor-pointer" onClick={() => onFiltersChange({ ...results.filters, query: undefined })}>
                      検索: "{results.filters.query}"
                      <span className="ml-1">×</span>
                    </Badge>
                  )}
                  
                  {results.filters.mechanics?.map(mechanic => (
                    <Badge key={mechanic} variant="secondary" className="cursor-pointer" onClick={() => handleFacetClick('mechanics', mechanic)}>
                      {mechanic}
                      <span className="ml-1">×</span>
                    </Badge>
                  ))}
                  
                  {results.filters.categories?.map(category => (
                    <Badge key={category} variant="secondary" className="cursor-pointer" onClick={() => handleFacetClick('categories', category)}>
                      {category}
                      <span className="ml-1">×</span>
                    </Badge>
                  ))}
                  
                  {results.filters.publishers?.map(publisher => (
                    <Badge key={publisher} variant="outline" className="cursor-pointer" onClick={() => handleFacetClick('publishers', publisher)}>
                      {publisher}
                      <span className="ml-1">×</span>
                    </Badge>
                  ))}

                  {(results.filters.minRating && results.filters.minRating > 1) && (
                    <Badge variant="outline" className="cursor-pointer" onClick={() => onFiltersChange({ ...results.filters, minRating: undefined })}>
                      評価: {results.filters.minRating}以上
                      <span className="ml-1">×</span>
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </CardHeader>

        {/* Search Facets */}
        {showFacets && results.facets && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Mechanics Facet */}
              {results.facets.mechanics.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm">メカニクス</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {results.facets.mechanics.slice(0, 8).map(facet => (
                      <Button
                        key={facet.value}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between h-auto py-1 px-2"
                        onClick={() => handleFacetClick('mechanics', facet.value)}
                      >
                        <span className="text-xs truncate">{facet.value}</span>
                        <Badge variant="outline" className="ml-1 text-xs">
                          {facet.count}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories Facet */}
              {results.facets.categories.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm">カテゴリー</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {results.facets.categories.slice(0, 8).map(facet => (
                      <Button
                        key={facet.value}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between h-auto py-1 px-2"
                        onClick={() => handleFacetClick('categories', facet.value)}
                      >
                        <span className="text-xs truncate">{facet.value}</span>
                        <Badge variant="outline" className="ml-1 text-xs">
                          {facet.count}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Publishers Facet */}
              {results.facets.publishers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-sm">出版社</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {results.facets.publishers.slice(0, 8).map(facet => (
                      <Button
                        key={facet.value}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between h-auto py-1 px-2"
                        onClick={() => handleFacetClick('publishers', facet.value)}
                      >
                        <span className="text-xs truncate">{facet.value}</span>
                        <Badge variant="outline" className="ml-1 text-xs">
                          {facet.count}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div>
                <h4 className="font-medium mb-2 text-sm">統計</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  {results.facets.ratingRange && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      <span>評価: {results.facets.ratingRange.min.toFixed(1)} - {results.facets.ratingRange.max.toFixed(1)}</span>
                    </div>
                  )}
                  {results.facets.playerCountRange && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>人数: {results.facets.playerCountRange.min} - {results.facets.playerCountRange.max}人</span>
                    </div>
                  )}
                  {results.facets.playingTimeRange && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>時間: {results.facets.playingTimeRange.min} - {results.facets.playingTimeRange.max}分</span>
                    </div>
                  )}
                  {results.facets.yearRange && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>年代: {results.facets.yearRange.min} - {results.facets.yearRange.max}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Search Results */}
      {results.data.length > 0 ? (
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-6'}`}>
          {results.data.map((review) => (
            <EnhancedReviewCard
              key={review.id}
              review={review}
              showGame={true}
              showUser={true}
              variant={viewMode === 'grid' ? 'compact' : 'detailed'}
              showDetailedRatings={viewMode === 'list'}
            />
          ))}
        </div>
      ) : (
        /* No Results */
        <Card className="text-center py-16">
          <CardContent>
            <div className="space-y-4">
              <Gamepad2 className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold mb-2">検索結果が見つかりませんでした</h3>
                <p className="text-muted-foreground">
                  検索条件を変更してもう一度お試しください
                </p>
              </div>
              
              {getActiveFilterCount() > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    現在 {getActiveFilterCount()} つのフィルターが適用されています
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => onFiltersChange({})}
                  >
                    すべてのフィルターをクリア
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {results.pagination.totalPages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {results.pagination.page * results.pagination.limit - results.pagination.limit + 1} - {Math.min(results.pagination.page * results.pagination.limit, results.pagination.total)} / {results.pagination.total}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!results.pagination.hasPrev}
                  onClick={() => onFiltersChange({
                    ...results.filters,
                    page: results.pagination.page - 1
                  })}
                >
                  前へ
                </Button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, results.pagination.totalPages) }, (_, i) => {
                    const page = i + Math.max(1, results.pagination.page - 2)
                    if (page > results.pagination.totalPages) return null
                    
                    return (
                      <Button
                        key={page}
                        variant={page === results.pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => onFiltersChange({
                          ...results.filters,
                          page: page
                        })}
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  disabled={!results.pagination.hasNext}
                  onClick={() => onFiltersChange({
                    ...results.filters,
                    page: results.pagination.page + 1
                  })}
                >
                  次へ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}