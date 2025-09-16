'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  Filter,
  Users,
  Clock,
  Star,
  Tag,
  Target,
  Shuffle,
  Info,
  Timer,
  X,
  Save,
  RotateCcw
} from 'lucide-react'

import { MECHANICS, CATEGORIES, PUBLISHERS } from '@/lib/game-constants'
import { SearchFilters } from '@/types/search'

const searchSchema = z.object({
  query: z.string().optional(),
  mechanics: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  publishers: z.array(z.string()).optional(),
  minRating: z.number().min(1).max(10).optional(),
  maxRating: z.number().min(1).max(10).optional(),
  minPlayers: z.number().min(1).max(20).optional(),
  maxPlayers: z.number().min(1).max(20).optional(),
  playingTime: z.array(z.number()).optional(),
  ruleComplexity: z.array(z.number().min(1).max(5)).optional(),
  luckFactor: z.array(z.number().min(1).max(5)).optional(),
  interaction: z.array(z.number().min(1).max(5)).optional(),
  downtime: z.array(z.number().min(1).max(5)).optional(),
  yearFrom: z.number().min(1900).max(new Date().getFullYear()).optional(),
  yearTo: z.number().min(1900).max(new Date().getFullYear()).optional(),
  sortBy: z.enum(['rating', 'date', 'name', 'year', 'popularity']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

type SearchFormData = z.infer<typeof searchSchema>

interface AdvancedSearchFormProps {
  initialFilters?: Partial<SearchFilters>
  onSearch: (filters: SearchFilters) => void
  onSaveSearch?: (name: string, filters: SearchFilters) => void
  loading?: boolean
}

export function AdvancedSearchForm({
  initialFilters = {},
  onSearch,
  onSaveSearch,
  loading = false
}: AdvancedSearchFormProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { }
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: initialFilters.query || '',
      mechanics: initialFilters.mechanics || [],
      categories: initialFilters.categories || [],
      publishers: initialFilters.publishers || [],
      minRating: initialFilters.minRating || 1,
      maxRating: initialFilters.maxRating || 10,
      minPlayers: initialFilters.minPlayers || 1,
      maxPlayers: initialFilters.maxPlayers || 8,
      playingTime: initialFilters.playingTime || [],
      ruleComplexity: initialFilters.ruleComplexity || [],
      luckFactor: initialFilters.luckFactor || [],
      interaction: initialFilters.interaction || [],
      downtime: initialFilters.downtime || [],
      yearFrom: initialFilters.yearFrom || 1900,
      yearTo: initialFilters.yearTo || new Date().getFullYear(),
      sortBy: initialFilters.sortBy || 'rating',
      sortOrder: initialFilters.sortOrder || 'desc'
    }
  })

  const watchedValues = watch()

  const onSubmit = useCallback((data: SearchFormData) => {
    const filters: SearchFilters = {
      ...data,
      // 空の配列や初期値をクリーンアップ
      mechanics: data.mechanics?.length ? data.mechanics : undefined,
      categories: data.categories?.length ? data.categories : undefined,
      publishers: data.publishers?.length ? data.publishers : undefined,
      playingTime: data.playingTime?.length ? data.playingTime : undefined,
      ruleComplexity: data.ruleComplexity?.length ? data.ruleComplexity : undefined,
      luckFactor: data.luckFactor?.length ? data.luckFactor : undefined,
      interaction: data.interaction?.length ? data.interaction : undefined,
      downtime: data.downtime?.length ? data.downtime : undefined,
      query: data.query?.trim() || undefined,
    }
    
    onSearch(filters)
  }, [onSearch])

  const handleReset = useCallback(() => {
    reset()
    onSearch({})
  }, [reset, onSearch])

  const handleQuickFilter = useCallback((type: string, value: string) => {
    const currentValues = watchedValues[type as keyof SearchFormData] as string[] || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]
    
    setValue(type as keyof SearchFormData, newValues as any)
  }, [watchedValues, setValue])

  const removeFilter = useCallback((type: string, value: string) => {
    const currentValues = watchedValues[type as keyof SearchFormData] as string[] || []
    const newValues = currentValues.filter(v => v !== value)
    setValue(type as keyof SearchFormData, newValues as any)
  }, [watchedValues, setValue])

  const playingTimeOptions = [
    { value: 30, label: '30分以下' },
    { value: 60, label: '30-60分' },
    { value: 120, label: '60-120分' },
    { value: 180, label: '120分以上' },
  ]

  const complexityLevels = [
    { value: 1, label: '簡単' },
    { value: 2, label: 'やや簡単' },
    { value: 3, label: '普通' },
    { value: 4, label: 'やや複雑' },
    { value: 5, label: '複雑' },
  ]

  const getActiveFilterCount = useCallback(() => {
    let count = 0
    if (watchedValues.query?.trim()) count++
    if (watchedValues.mechanics?.length) count++
    if (watchedValues.categories?.length) count++
    if (watchedValues.publishers?.length) count++
    if (watchedValues.playingTime?.length) count++
    if (watchedValues.ruleComplexity?.length) count++
    if (watchedValues.luckFactor?.length) count++
    if (watchedValues.interaction?.length) count++
    if (watchedValues.downtime?.length) count++
    if (watchedValues.minRating && watchedValues.minRating > 1) count++
    if (watchedValues.maxRating && watchedValues.maxRating < 10) count++
    if (watchedValues.minPlayers && watchedValues.minPlayers > 1) count++
    if (watchedValues.maxPlayers && watchedValues.maxPlayers < 8) count++
    if (watchedValues.yearFrom && watchedValues.yearFrom > 1900) count++
    if (watchedValues.yearTo && watchedValues.yearTo < new Date().getFullYear()) count++
    return count
  }, [watchedValues])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            <CardTitle>高度な検索</CardTitle>
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()} フィルター
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              type="button"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              リセット
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              type="button"
            >
              <Filter className="w-4 h-4 mr-1" />
              {isExpanded ? '簡易' : '詳細'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 基本検索 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="query">ゲーム名・説明文で検索</Label>
              <Input
                id="query"
                placeholder="カタン、ドミニオン、協力ゲーム..."
                {...register('query')}
                className="mt-1"
              />
            </div>
          </div>

          {/* 展開可能な詳細フィルター */}
          {isExpanded && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  基本
                </TabsTrigger>
                <TabsTrigger value="mechanics" className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  特徴
                </TabsTrigger>
                <TabsTrigger value="players" className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  人数・時間
                </TabsTrigger>
                <TabsTrigger value="ratings" className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  評価
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                {/* 出版社 */}
                <div>
                  <Label>出版社</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PUBLISHERS.slice(0, 12).map((publisher) => (
                      <Badge
                        key={publisher}
                        variant={watchedValues.publishers?.includes(publisher) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleQuickFilter('publishers', publisher)}
                      >
                        {publisher}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 発売年 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="yearFrom">発売年（開始）</Label>
                    <Input
                      id="yearFrom"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      {...register('yearFrom', { valueAsNumber: true })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="yearTo">発売年（終了）</Label>
                    <Input
                      id="yearTo"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      {...register('yearTo', { valueAsNumber: true })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="mechanics" className="space-y-4">
                {/* メカニクス */}
                <div>
                  <Label>ゲームメカニクス</Label>
                  <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                    {MECHANICS.map((mechanic) => (
                      <Badge
                        key={mechanic}
                        variant={watchedValues.mechanics?.includes(mechanic) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => handleQuickFilter('mechanics', mechanic)}
                      >
                        {mechanic}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* カテゴリー */}
                <div>
                  <Label>ゲームカテゴリー</Label>
                  <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                    {CATEGORIES.map((category) => (
                      <Badge
                        key={category}
                        variant={watchedValues.categories?.includes(category) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => handleQuickFilter('categories', category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 選択されたフィルターの表示 */}
                {(watchedValues.mechanics?.length || watchedValues.categories?.length) && (
                  <>
                    <Separator />
                    <div>
                      <Label>選択中のフィルター</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {watchedValues.mechanics?.map((mechanic) => (
                          <Badge
                            key={mechanic}
                            variant="default"
                            className="cursor-pointer"
                            onClick={() => removeFilter('mechanics', mechanic)}
                          >
                            {mechanic}
                            <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                        {watchedValues.categories?.map((category) => (
                          <Badge
                            key={category}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeFilter('categories', category)}
                          >
                            {category}
                            <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="players" className="space-y-4">
                {/* プレイヤー数 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minPlayers">最小人数</Label>
                    <Input
                      id="minPlayers"
                      type="number"
                      min="1"
                      max="20"
                      {...register('minPlayers', { valueAsNumber: true })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxPlayers">最大人数</Label>
                    <Input
                      id="maxPlayers"
                      type="number"
                      min="1"
                      max="20"
                      {...register('maxPlayers', { valueAsNumber: true })}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* プレイ時間 */}
                <div>
                  <Label>プレイ時間</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {playingTimeOptions.map((option) => (
                      <Badge
                        key={option.value}
                        variant={watchedValues.playingTime?.includes(option.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleQuickFilter('playingTime', option.value.toString())}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {option.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ratings" className="space-y-4">
                {/* 評価範囲 */}
                <div>
                  <Label>総合評価範囲</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="minRating" className="text-sm">最低評価</Label>
                      <Input
                        id="minRating"
                        type="number"
                        min="1"
                        max="10"
                        step="0.1"
                        {...register('minRating', { valueAsNumber: true })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxRating" className="text-sm">最高評価</Label>
                      <Input
                        id="maxRating"
                        type="number"
                        min="1"
                        max="10"
                        step="0.1"
                        {...register('maxRating', { valueAsNumber: true })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* 詳細評価 */}
                <div className="space-y-3">
                  <Label>詳細評価フィルター</Label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4" />
                        <span className="text-sm">ルール複雑さ</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {complexityLevels.map((level) => (
                          <Badge
                            key={level.value}
                            variant={watchedValues.ruleComplexity?.includes(level.value) ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            onClick={() => handleQuickFilter('ruleComplexity', level.value.toString())}
                          >
                            {level.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Shuffle className="w-4 h-4" />
                        <span className="text-sm">運要素</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {complexityLevels.map((level) => (
                          <Badge
                            key={level.value}
                            variant={watchedValues.luckFactor?.includes(level.value) ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            onClick={() => handleQuickFilter('luckFactor', level.value.toString())}
                          >
                            {level.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">プレイヤー間の相互作用</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {complexityLevels.map((level) => (
                          <Badge
                            key={level.value}
                            variant={watchedValues.interaction?.includes(level.value) ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            onClick={() => handleQuickFilter('interaction', level.value.toString())}
                          >
                            {level.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Timer className="w-4 h-4" />
                        <span className="text-sm">ダウンタイム</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {complexityLevels.map((level) => (
                          <Badge
                            key={level.value}
                            variant={watchedValues.downtime?.includes(level.value) ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            onClick={() => handleQuickFilter('downtime', level.value.toString())}
                          >
                            {level.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* ソート */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>並び順</Label>
              <Select defaultValue={watchedValues.sortBy} onValueChange={(value) => setValue('sortBy', value as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">評価順</SelectItem>
                  <SelectItem value="date">新しい順</SelectItem>
                  <SelectItem value="name">名前順</SelectItem>
                  <SelectItem value="year">発売年順</SelectItem>
                  <SelectItem value="popularity">人気順</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>順序</Label>
              <Select defaultValue={watchedValues.sortOrder} onValueChange={(value) => setValue('sortOrder', value as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">降順（高→低）</SelectItem>
                  <SelectItem value="asc">昇順（低→高）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 検索ボタン */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              <Search className="w-4 h-4 mr-2" />
              {loading ? '検索中...' : '検索'}
            </Button>
            
            {onSaveSearch && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const name = prompt('検索条件の名前を入力してください')
                  if (name) {
                    handleSubmit(data => onSaveSearch(name, data))()
                  }
                }}
              >
                <Save className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}