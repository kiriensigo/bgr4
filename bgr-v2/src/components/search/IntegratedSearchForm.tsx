'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, RotateCcw, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import {
  REVIEW_MECHANIC_OPTIONS,
  REVIEW_CATEGORY_OPTIONS,
  REVIEW_RECOMMENDED_PLAYER_COUNTS,
  REVIEW_GAME_PLAYER_COUNTS
} from '@/shared/constants/review-search'
import {
  ReviewSearchFormValues,
  mergeWithDefaultReviewFilters,
  getActiveReviewFilterCount
} from '@/lib/search/review-filters'

interface IntegratedSearchFormProps {
  initialValues?: Partial<ReviewSearchFormValues>
  onSubmit: (filters: ReviewSearchFormValues) => void
  loading?: boolean
  className?: string
}

const formatRangeLabel = (label: string, range: [number, number], suffix = '点') => {
  return `${label}: ${range[0].toFixed(1)}${suffix}〜${range[1].toFixed(1)}${suffix}`
}

export default function IntegratedSearchForm({
  initialValues,
  onSubmit,
  loading = false,
  className = ''
}: IntegratedSearchFormProps) {
  const [filters, setFilters] = useState<ReviewSearchFormValues>(
    mergeWithDefaultReviewFilters(initialValues)
  )

  useEffect(() => {
    setFilters(mergeWithDefaultReviewFilters(initialValues))
  }, [initialValues])

  const activeFilterCount = useMemo(() => getActiveReviewFilterCount(filters), [filters])

  const handleSubmit = () => {
    onSubmit(mergeWithDefaultReviewFilters(filters))
  }

  const handleReset = () => {
    const reset = mergeWithDefaultReviewFilters()
    setFilters(reset)
    onSubmit(reset)
  }

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
            onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
            onKeyDown={(event) => {
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
            <Button onClick={handleSubmit} disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              検索
            </Button>
          </div>
        </div>

        <section className="space-y-6">
          <header>
            <h3 className="text-base font-semibold text-muted-foreground">5段階指標で絞り込む</h3>
            <p className="text-sm text-muted-foreground">レビューで収集した各指標のレンジを設定できます。</p>
          </header>

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
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, overallScore: value as [number, number] }))
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
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, ruleComplexity: value as [number, number] }))
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
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, luckFactor: value as [number, number] }))
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
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, interaction: value as [number, number] }))
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
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, downtime: value as [number, number] }))
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
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, playTimeRange: value as [number, number] }))
                }
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>短時間</span>
                <span>長時間</span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-base font-semibold text-muted-foreground">おすすめプレイ人数</h3>
          <ToggleGroup
            type="multiple"
            value={filters.selectedRecommendedCounts.map(String)}
            onValueChange={(values) =>
              setFilters((prev) => ({
                ...prev,
                selectedRecommendedCounts: values
                  .map((value) => Number(value))
                  .filter((value) => !Number.isNaN(value))
              }))
            }
            className="flex flex-wrap gap-2"
          >
            {REVIEW_RECOMMENDED_PLAYER_COUNTS.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value.toString()}
                variant="outline"
                className="min-w-[72px]"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-muted-foreground">対応プレイ人数</h3>
            <p className="text-xs text-muted-foreground">ゲームの推奨プレイ人数ではなく、ルール上プレイ可能な人数で絞り込めます。</p>
          </div>
          <ToggleGroup
            type="multiple"
            value={filters.selectedGameCounts.map(String)}
            onValueChange={(values) =>
              setFilters((prev) => ({
                ...prev,
                selectedGameCounts: values
                  .map((value) => Number(value))
                  .filter((value) => !Number.isNaN(value))
              }))
            }
            className="flex flex-wrap gap-2"
          >
            {REVIEW_GAME_PLAYER_COUNTS.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value.toString()}
                variant="outline"
                className="min-w-[72px]"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-muted-foreground">メカニクス</h3>
            <p className="text-xs text-muted-foreground">ゲーム詳細ページの統計ラベルと同じ名称で指定できます。</p>
          </div>
          <ToggleGroup
            type="multiple"
            value={filters.selectedMechanics}
            onValueChange={(values) =>
              setFilters((prev) => ({ ...prev, selectedMechanics: values }))
            }
            className="flex flex-wrap gap-2"
          >
            {REVIEW_MECHANIC_OPTIONS.map((option) => (
              <ToggleGroupItem
                key={option.label}
                value={option.label}
                variant="outline"
                className="min-w-[120px]"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-muted-foreground">カテゴリー</h3>
            <p className="text-xs text-muted-foreground">レビューで人気のカテゴリーから AND 条件で絞り込めます。</p>
          </div>
          <ToggleGroup
            type="multiple"
            value={filters.selectedCategories}
            onValueChange={(values) =>
              setFilters((prev) => ({ ...prev, selectedCategories: values }))
            }
            className="flex flex-wrap gap-2"
          >
            {REVIEW_CATEGORY_OPTIONS.map((option) => (
              <ToggleGroupItem
                key={option.label}
                value={option.label}
                variant="outline"
                className="min-w-[120px]"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </section>
      </CardContent>
    </Card>
  )
}
