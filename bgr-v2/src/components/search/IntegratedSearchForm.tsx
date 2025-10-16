'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, RotateCcw, Filter, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  REVIEW_MECHANIC_OPTIONS,
  REVIEW_CATEGORY_OPTIONS,
  REVIEW_RECOMMENDED_PLAYER_COUNTS,
  REVIEW_GAME_PLAYER_COUNTS,
} from '@/shared/constants/review-search'
import {
  ReviewSearchFormValues,
  mergeWithDefaultReviewFilters,
  getActiveReviewFilterCount,
  REVIEW_DEFAULT_FORM_VALUES,
} from '@/lib/search/review-filters'
import { cn } from '@/lib/utils'

interface IntegratedSearchFormProps {
  initialValues?: Partial<ReviewSearchFormValues>
  onSubmit: (filters: ReviewSearchFormValues) => void
  loading?: boolean
  className?: string
}

type AdvancedFilterSection =
  | 'scores'
  | 'recommendedPlayers'
  | 'gamePlayers'
  | 'mechanics'
  | 'categories'

const FILTER_SECTION_WRAPPER =
  'rounded-lg border border-border/40 bg-background/80 shadow-sm w-full'
const FILTER_TRIGGER_DEFAULT =
  'flex w-full items-start justify-between px-5 py-4 text-left transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
const FILTER_TRIGGER_COMPACT =
  'flex w-full items-center justify-between px-5 py-4 text-left transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
const FILTER_CONTENT_CLASSES = 'border-t border-border/30 px-5 pb-6 pt-5 space-y-4'

const SECTION_KEYS: AdvancedFilterSection[] = [
  'scores',
  'recommendedPlayers',
  'gamePlayers',
  'mechanics',
  'categories',
]

const createSectionState = (defaultOpen: boolean): Record<AdvancedFilterSection, boolean> =>
  SECTION_KEYS.reduce(
    (acc, key) => {
      acc[key] = defaultOpen
      return acc
    },
    {} as Record<AdvancedFilterSection, boolean>
  )

const formatRangeLabel = (label: string, range: [number, number], suffix = '点') => {
  return `${label}: ${range[0].toFixed(1)}${suffix}〜${range[1].toFixed(1)}${suffix}`
}

const isRangeEqual = (value: [number, number], defaults: [number, number]) =>
  value[0] === defaults[0] && value[1] === defaults[1]

export default function IntegratedSearchForm({
  initialValues,
  onSubmit,
  loading = false,
  className = '',
}: IntegratedSearchFormProps) {
  const [filters, setFilters] = useState<ReviewSearchFormValues>(
    mergeWithDefaultReviewFilters(initialValues)
  )
  const [sectionsOpen, setSectionsOpen] = useState<Record<AdvancedFilterSection, boolean>>(() =>
    createSectionState(false)
  )

  useEffect(() => {
    setFilters(mergeWithDefaultReviewFilters(initialValues))
  }, [initialValues])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(min-width: 1024px)')

    const applyState = () => {
      setSectionsOpen(createSectionState(false))
    }

    applyState()

    const handler = () => {
      applyState()
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }

    mediaQuery.addListener(handler)
    return () => mediaQuery.removeListener(handler)
  }, [])

  const setSectionOpen = (key: AdvancedFilterSection) => (open: boolean) => {
    setSectionsOpen(prev => ({ ...prev, [key]: open }))
  }

  const activeFilterCount = useMemo(() => getActiveReviewFilterCount(filters), [filters])

  const handleSubmit = () => {
    onSubmit(mergeWithDefaultReviewFilters(filters))
  }

  const handleReset = () => {
    const reset = mergeWithDefaultReviewFilters()
    setFilters(reset)
    onSubmit(reset)
  }

  const hasScoreFilters = useMemo(() => {
    return (
      !isRangeEqual(filters.overallScore, REVIEW_DEFAULT_FORM_VALUES.overallScore) ||
      !isRangeEqual(filters.ruleComplexity, REVIEW_DEFAULT_FORM_VALUES.ruleComplexity) ||
      !isRangeEqual(filters.luckFactor, REVIEW_DEFAULT_FORM_VALUES.luckFactor) ||
      !isRangeEqual(filters.interaction, REVIEW_DEFAULT_FORM_VALUES.interaction) ||
      !isRangeEqual(filters.downtime, REVIEW_DEFAULT_FORM_VALUES.downtime) ||
      !isRangeEqual(filters.playTimeRange, REVIEW_DEFAULT_FORM_VALUES.playTimeRange)
    )
  }, [filters])

  const recommendedCount = filters.selectedRecommendedCounts.length
  const gameCount = filters.selectedGameCounts.length
  const mechanicsCount = filters.selectedMechanics.length
  const categoriesCount = filters.selectedCategories.length

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Search className="h-5 w-5" />
            レビュー基準で探す
          </CardTitle>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              {activeFilterCount}件のフィルタ
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            placeholder="ゲーム名やキーワードで検索"
            value={filters.query}
            onChange={event => setFilters(prev => ({ ...prev, query: event.target.value }))}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleSubmit()
              }
            }}
            className="md:flex-1"
            aria-label="ゲーム名・キーワード検索"
          />
          <div className="flex items-center gap-2 md:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={loading || activeFilterCount === 0}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              リセット
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 min-w-[120px]"
            >
              <Search className="mr-2 h-5 w-5" />
              検索
            </Button>
          </div>
        </div>

        <Collapsible
          open={sectionsOpen.scores}
          onOpenChange={setSectionOpen('scores')}
          className={FILTER_SECTION_WRAPPER}
        >
          <CollapsibleTrigger asChild>
            <button type="button" className={FILTER_TRIGGER_DEFAULT}>
              <span className="space-y-1">
                <span className="block text-base font-semibold text-muted-foreground">
                  5段階指標で絞り込む
                </span>
                <span className="block text-xs text-muted-foreground">
                  レビューで集計した各指標のレンジを設定できます。
                </span>
              </span>
              <span className="flex items-center gap-2">
                {hasScoreFilters && (
                  <Badge variant="secondary" className="pointer-events-none">
                    調整中
                  </Badge>
                )}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    sectionsOpen.scores ? '-rotate-180' : 'rotate-0'
                  )}
                  aria-hidden
                />
              </span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className={cn('space-y-6', FILTER_CONTENT_CLASSES)}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">
                  {formatRangeLabel('総合評価', filters.overallScore)}
                </div>
                <Slider
                  min={1}
                  max={10}
                  step={0.1}
                  value={filters.overallScore}
                  onValueChange={value =>
                    setFilters(prev => ({ ...prev, overallScore: value as [number, number] }))
                  }
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>低評価</span>
                  <span>高評価</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">
                  {formatRangeLabel('ルールの複雑さ', filters.ruleComplexity)}
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={0.1}
                  value={filters.ruleComplexity}
                  onValueChange={value =>
                    setFilters(prev => ({ ...prev, ruleComplexity: value as [number, number] }))
                  }
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>シンプル</span>
                  <span>複雑</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">
                  {formatRangeLabel('運要素', filters.luckFactor)}
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={0.1}
                  value={filters.luckFactor}
                  onValueChange={value =>
                    setFilters(prev => ({ ...prev, luckFactor: value as [number, number] }))
                  }
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>戦略寄り</span>
                  <span>運寄り</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">
                  {formatRangeLabel('インタラクション', filters.interaction)}
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={0.1}
                  value={filters.interaction}
                  onValueChange={value =>
                    setFilters(prev => ({ ...prev, interaction: value as [number, number] }))
                  }
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>ソロプレイ寄り</span>
                  <span>インタラクティブ</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">
                  {formatRangeLabel('ダウンタイム', filters.downtime)}
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={0.1}
                  value={filters.downtime}
                  onValueChange={value =>
                    setFilters(prev => ({ ...prev, downtime: value as [number, number] }))
                  }
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>テンポ重視</span>
                  <span>じっくり型</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">
                  プレイ時間: {filters.playTimeRange[0]}分〜
                  {filters.playTimeRange[1] >= 180 ? '180分以上' : `${filters.playTimeRange[1]}分`}
                </div>
                <Slider
                  min={15}
                  max={180}
                  step={15}
                  value={filters.playTimeRange}
                  onValueChange={value =>
                    setFilters(prev => ({ ...prev, playTimeRange: value as [number, number] }))
                  }
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>短時間</span>
                  <span>長時間</span>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={sectionsOpen.recommendedPlayers}
          onOpenChange={setSectionOpen('recommendedPlayers')}
          className={FILTER_SECTION_WRAPPER}
        >
          <CollapsibleTrigger asChild>
            <button type="button" className={FILTER_TRIGGER_COMPACT}>
              <span className="text-base font-semibold text-muted-foreground">
                おすすめプレイ人数
              </span>
              <span className="flex items-center gap-2">
                {recommendedCount > 0 ? (
                  <Badge variant="secondary" className="pointer-events-none">
                    {recommendedCount}件選択中
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">未選択</span>
                )}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    sectionsOpen.recommendedPlayers ? '-rotate-180' : 'rotate-0'
                  )}
                  aria-hidden
                />
              </span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className={cn(FILTER_CONTENT_CLASSES, 'min-h-[116px]')}>
            <ToggleGroup
              type="multiple"
              value={filters.selectedRecommendedCounts.map(String)}
              onValueChange={values =>
                setFilters(prev => ({
                  ...prev,
                  selectedRecommendedCounts: values
                    .map(value => Number(value))
                    .filter(value => !Number.isNaN(value)),
                }))
              }
              className="flex flex-wrap gap-3"
            >
              {REVIEW_RECOMMENDED_PLAYER_COUNTS.map(option => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value.toString()}
                  variant="outline"
                  className="min-w-[72px] data-[state=on]:bg-blue-500 data-[state=on]:text-white data-[state=on]:border-blue-500"
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={sectionsOpen.gamePlayers}
          onOpenChange={setSectionOpen('gamePlayers')}
          className={FILTER_SECTION_WRAPPER}
        >
          <CollapsibleTrigger asChild>
            <button type="button" className={FILTER_TRIGGER_COMPACT}>
              <span className="text-base font-semibold text-muted-foreground">対応プレイ人数</span>
              <span className="flex items-center gap-2">
                {gameCount > 0 ? (
                  <Badge variant="secondary" className="pointer-events-none">
                    {gameCount}件選択中
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">未選択</span>
                )}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    sectionsOpen.gamePlayers ? '-rotate-180' : 'rotate-0'
                  )}
                  aria-hidden
                />
              </span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className={cn(FILTER_CONTENT_CLASSES, 'min-h-[220px]')}>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                ゲームの推奨プレイ人数ではなく、ルール上プレイ可能な人数で絞り込めます。
              </p>
              <ToggleGroup
                type="multiple"
                value={filters.selectedGameCounts.map(String)}
                onValueChange={values =>
                  setFilters(prev => ({
                    ...prev,
                    selectedGameCounts: values
                      .map(value => Number(value))
                      .filter(value => !Number.isNaN(value)),
                  }))
                }
                className="flex flex-wrap gap-3 w-full"
              >
                {REVIEW_GAME_PLAYER_COUNTS.map(option => (
                  <ToggleGroupItem
                    key={option.value}
                    value={option.value.toString()}
                    variant="outline"
                    className="min-w-[72px] data-[state=on]:bg-blue-500 data-[state=on]:text-white data-[state=on]:border-blue-500"
                  >
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={sectionsOpen.mechanics}
          onOpenChange={setSectionOpen('mechanics')}
          className={FILTER_SECTION_WRAPPER}
        >
          <CollapsibleTrigger asChild>
            <button type="button" className={FILTER_TRIGGER_DEFAULT}>
              <span className="space-y-1">
                <span className="block text-base font-semibold text-muted-foreground">
                  メカニクス
                </span>
                <span className="block text-xs text-muted-foreground">
                  ゲーム詳細ページの統計ラベルと同じ名称で指定できます。
                </span>
              </span>
              <span className="flex items-center gap-2">
                {mechanicsCount > 0 ? (
                  <Badge variant="secondary" className="pointer-events-none">
                    {mechanicsCount}件選択中
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">未選択</span>
                )}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    sectionsOpen.mechanics ? '-rotate-180' : 'rotate-0'
                  )}
                  aria-hidden
                />
              </span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className={cn(FILTER_CONTENT_CLASSES)}>
            <div className="space-y-3">
              <ToggleGroup
                type="multiple"
                value={filters.selectedMechanics}
                onValueChange={values =>
                  setFilters(prev => ({ ...prev, selectedMechanics: values }))
                }
                className="flex flex-wrap gap-3 w-full"
              >
                {REVIEW_MECHANIC_OPTIONS.map(option => (
                  <ToggleGroupItem
                    key={option.label}
                    value={option.label}
                    variant="outline"
                    className="min-w-[120px] data-[state=on]:bg-blue-500 data-[state=on]:text-white data-[state=on]:border-blue-500"
                  >
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={sectionsOpen.categories}
          onOpenChange={setSectionOpen('categories')}
          className={FILTER_SECTION_WRAPPER}
        >
          <CollapsibleTrigger asChild>
            <button type="button" className={FILTER_TRIGGER_DEFAULT}>
              <span className="space-y-1">
                <span className="block text-base font-semibold text-muted-foreground">
                  カテゴリー
                </span>
                <span className="block text-xs text-muted-foreground">
                  レビューで人気のカテゴリーから AND 条件で絞り込めます。
                </span>
              </span>
              <span className="flex items-center gap-2">
                {categoriesCount > 0 ? (
                  <Badge variant="secondary" className="pointer-events-none">
                    {categoriesCount}件選択中
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">未選択</span>
                )}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    sectionsOpen.categories ? '-rotate-180' : 'rotate-0'
                  )}
                  aria-hidden
                />
              </span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className={cn(FILTER_CONTENT_CLASSES)}>
            <div className="space-y-3">
              <ToggleGroup
                type="multiple"
                value={filters.selectedCategories}
                onValueChange={values =>
                  setFilters(prev => ({ ...prev, selectedCategories: values }))
                }
                className="flex flex-wrap gap-3 w-full"
              >
                {REVIEW_CATEGORY_OPTIONS.map(option => (
                  <ToggleGroupItem
                    key={option.label}
                    value={option.label}
                    variant="outline"
                    className="min-w-[120px] data-[state=on]:bg-blue-500 data-[state=on]:text-white data-[state=on]:border-blue-500"
                  >
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
