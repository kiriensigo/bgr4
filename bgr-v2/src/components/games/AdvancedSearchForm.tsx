'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { 
  Search, 
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  Clock,
  Calendar,
  Star
} from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

// フィルター条件の型定義
export interface SearchFilters {
  query?: string
  categories?: string[]
  mechanics?: string[]
  designers?: string[]
  publishers?: string[]
  playerCount?: {
    min?: number
    max?: number
    exact?: number
  }
  playingTime?: {
    min?: number
    max?: number
  }
  yearPublished?: {
    min?: number
    max?: number
  }
  rating?: {
    min?: number
    max?: number
  }
  sortBy?: 'name' | 'year_published' | 'rating_average' | 'created_at' | 'popularity'
  sortOrder?: 'asc' | 'desc'
}

const SITE_CATEGORIES = [
  '動物', 'ブラフ', 'カードゲーム', '子供向け', '推理', '記憶', '交渉', 
  'パーティー', 'パズル', 'ウォーゲーム', 'ワードゲーム', '演技', 
  'レガシー・キャンペーン', '紙ペン', 'ソロ向き', 'トリテ', 'ペア向き', '多人数向き'
]

const SITE_MECHANICS = [
  'ダイスロール', 'エリア支配', 'オークション', '賭け', 'ドラフト', '協力', 
  'デッキ/バッグビルド', '正体隠匿', 'モジュラーボード', 'ルート構築', 
  'バースト', 'セット収集', '同時手番', 'タイル配置', 'プレイヤー別能力', 'ワカプレ'
]

const SORT_OPTIONS = [
  { value: 'name', label: 'ゲーム名' },
  { value: 'year_published', label: '発売年' },
  { value: 'rating_average', label: '評価' },
  { value: 'created_at', label: '登録日' },
  { value: 'popularity', label: '人気度' }
]

interface AdvancedSearchFormProps {
  onSearch: (filters: SearchFilters) => void
  initialFilters?: SearchFilters
  loading?: boolean
}

export function AdvancedSearchForm({ onSearch, initialFilters, loading = false }: AdvancedSearchFormProps) {
  const [query, setQuery] = useState(initialFilters?.query || '')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialFilters?.categories || [])
  const [selectedMechanics, setSelectedMechanics] = useState<string[]>(initialFilters?.mechanics || [])
  const [playerCountMode, setPlayerCountMode] = useState<'range' | 'exact'>('range')
  const [playerCountRange, setPlayerCountRange] = useState([
    initialFilters?.playerCount?.min || 1, 
    initialFilters?.playerCount?.max || 8
  ])
  const [exactPlayerCount, setExactPlayerCount] = useState(initialFilters?.playerCount?.exact || 4)
  const [playingTimeRange, setPlayingTimeRange] = useState([
    initialFilters?.playingTime?.min || 15, 
    initialFilters?.playingTime?.max || 240
  ])
  const [yearRange, setYearRange] = useState([
    initialFilters?.yearPublished?.min || 1995, 
    initialFilters?.yearPublished?.max || new Date().getFullYear()
  ])
  const [ratingRange, setRatingRange] = useState([
    initialFilters?.rating?.min || 0, 
    initialFilters?.rating?.max || 10
  ])
  const [sortBy, setSortBy] = useState(initialFilters?.sortBy || 'name')
  const [sortOrder, setSortOrder] = useState(initialFilters?.sortOrder || 'asc')
  
  // 折りたたみ状態
  const [expandedSections, setExpandedSections] = useState({
    categories: false,
    mechanics: false,
    advanced: false
  })

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleMechanic = (mechanic: string) => {
    setSelectedMechanics(prev => 
      prev.includes(mechanic) 
        ? prev.filter(m => m !== mechanic)
        : [...prev, mechanic]
    )
  }

  const clearCategory = (category: string) => {
    setSelectedCategories(prev => prev.filter(c => c !== category))
  }

  const clearMechanic = (mechanic: string) => {
    setSelectedMechanics(prev => prev.filter(m => m !== mechanic))
  }

  const clearAllFilters = () => {
    setQuery('')
    setSelectedCategories([])
    setSelectedMechanics([])
    setPlayerCountRange([1, 8])
    setExactPlayerCount(4)
    setPlayingTimeRange([15, 240])
    setYearRange([1995, new Date().getFullYear()])
    setRatingRange([0, 10])
    setSortBy('name')
    setSortOrder('asc')
  }

  const handleSearch = () => {
    const filters: SearchFilters = {
      ...(query.trim() && { query: query.trim() }),
      ...(selectedCategories.length > 0 && { categories: selectedCategories }),
      ...(selectedMechanics.length > 0 && { mechanics: selectedMechanics }),
      playerCount: (() => {
        if (playerCountMode === 'exact') {
          return exactPlayerCount ? { exact: exactPlayerCount } : {}
        } else {
          const obj: any = {}
          if (playerCountRange[0]) obj.min = playerCountRange[0]
          if (playerCountRange[1]) obj.max = playerCountRange[1]
          return obj
        }
      })(),
      playingTime: (() => {
        const obj: any = {}
        if (playingTimeRange[0]) obj.min = playingTimeRange[0]
        if (playingTimeRange[1]) obj.max = playingTimeRange[1]
        return obj
      })(),
      yearPublished: (() => {
        const obj: any = {}
        if (yearRange[0]) obj.min = yearRange[0]
        if (yearRange[1]) obj.max = yearRange[1]
        return obj
      })(),
      rating: (() => {
        const obj: any = {}
        if (ratingRange[0]) obj.min = ratingRange[0]
        if (ratingRange[1]) obj.max = ratingRange[1]
        return obj
      })(),
      sortBy,
      sortOrder
    }
    
    onSearch(filters)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const hasActiveFilters = 
    query.trim() ||
    selectedCategories.length > 0 ||
    selectedMechanics.length > 0 ||
    (playerCountMode === 'range' && (playerCountRange[0] !== 1 || playerCountRange[1] !== 8)) ||
    (playerCountMode === 'exact' && exactPlayerCount !== 4) ||
    playingTimeRange[0] !== 15 ||
    playingTimeRange[1] !== 240 ||
    yearRange[0] !== 1995 ||
    yearRange[1] !== new Date().getFullYear() ||
    ratingRange[0] !== 0 ||
    ratingRange[1] !== 10

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="h-5 w-5" />
          <span>高度な検索</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              フィルター適用中
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 基本検索 */}
        <div className="space-y-2">
          <Label htmlFor="search-query">ゲーム名・説明で検索</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="search-query"
              placeholder="検索キーワードを入力..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>

        {/* 選択済みフィルターの表示 */}
        {(selectedCategories.length > 0 || selectedMechanics.length > 0) && (
          <div className="space-y-3">
            <Label>選択中のフィルター</Label>
            <div className="space-y-2">
              {selectedCategories.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-600 mb-1">カテゴリー</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.map((category) => (
                      <Badge key={category} variant="default" className="cursor-pointer">
                        {category}
                        <X
                          className="h-3 w-3 ml-1 hover:text-red-600"
                          onClick={() => clearCategory(category)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedMechanics.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-600 mb-1">メカニクス</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedMechanics.map((mechanic) => (
                      <Badge key={mechanic} variant="secondary" className="cursor-pointer">
                        {mechanic}
                        <X
                          className="h-3 w-3 ml-1 hover:text-red-600"
                          onClick={() => clearMechanic(mechanic)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* カテゴリー選択 */}
        <Collapsible 
          open={expandedSections.categories} 
          onOpenChange={() => toggleSection('categories')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <Label className="cursor-pointer">カテゴリーで絞り込み</Label>
              {expandedSections.categories ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            <div className="flex flex-wrap gap-2">
              {SITE_CATEGORIES.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategories.includes(category) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* メカニクス選択 */}
        <Collapsible 
          open={expandedSections.mechanics} 
          onOpenChange={() => toggleSection('mechanics')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <Label className="cursor-pointer">メカニクスで絞り込み</Label>
              {expandedSections.mechanics ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            <div className="flex flex-wrap gap-2">
              {SITE_MECHANICS.map((mechanic) => (
                <Badge
                  key={mechanic}
                  variant={selectedMechanics.includes(mechanic) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleMechanic(mechanic)}
                >
                  {mechanic}
                </Badge>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* 詳細フィルター */}
        <Collapsible 
          open={expandedSections.advanced} 
          onOpenChange={() => toggleSection('advanced')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <Label className="cursor-pointer">詳細フィルター</Label>
              {expandedSections.advanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-6 mt-3">
            {/* プレイヤー数 */}
            <div className="space-y-3">
              <Label className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>プレイヤー数</span>
              </Label>
              <div className="space-y-3">
                <div className="flex space-x-4">
                  <Button
                    variant={playerCountMode === 'range' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPlayerCountMode('range')}
                  >
                    範囲指定
                  </Button>
                  <Button
                    variant={playerCountMode === 'exact' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPlayerCountMode('exact')}
                  >
                    正確な人数
                  </Button>
                </div>
                
                {playerCountMode === 'range' ? (
                  <div className="space-y-2">
                    <Slider
                      min={1}
                      max={12}
                      step={1}
                      value={playerCountRange}
                      onValueChange={setPlayerCountRange}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{playerCountRange[0]}人</span>
                      <span>{playerCountRange[1]}人</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={exactPlayerCount}
                      onChange={(e) => setExactPlayerCount(parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500">人</span>
                  </div>
                )}
              </div>
            </div>

            {/* プレイ時間 */}
            <div className="space-y-3">
              <Label className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>プレイ時間（分）</span>
              </Label>
              <div className="space-y-2">
                <Slider
                  min={5}
                  max={480}
                  step={5}
                  value={playingTimeRange}
                  onValueChange={setPlayingTimeRange}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{playingTimeRange[0]}分</span>
                  <span>{playingTimeRange[1]}分</span>
                </div>
              </div>
            </div>

            {/* 発売年 */}
            <div className="space-y-3">
              <Label className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>発売年</span>
              </Label>
              <div className="space-y-2">
                <Slider
                  min={1990}
                  max={new Date().getFullYear()}
                  step={1}
                  value={yearRange}
                  onValueChange={setYearRange}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{yearRange[0]}年</span>
                  <span>{yearRange[1]}年</span>
                </div>
              </div>
            </div>

            {/* 評価 */}
            <div className="space-y-3">
              <Label className="flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span>評価</span>
              </Label>
              <div className="space-y-2">
                <Slider
                  min={0}
                  max={10}
                  step={0.1}
                  value={ratingRange}
                  onValueChange={setRatingRange}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{ratingRange[0]}</span>
                  <span>{ratingRange[1]}</span>
                </div>
              </div>
            </div>

            {/* ソート */}
            <div className="space-y-3">
              <Label>並び順</Label>
              <div className="flex space-x-2">
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border rounded px-3 py-2 text-sm"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant={sortOrder === 'asc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortOrder('asc')}
                >
                  昇順
                </Button>
                <Button
                  variant={sortOrder === 'desc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortOrder('desc')}
                >
                  降順
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* アクションボタン */}
        <div className="flex space-x-2">
          <Button onClick={handleSearch} disabled={loading} className="flex-1">
            {loading ? '検索中...' : '検索'}
          </Button>
          <Button 
            variant="outline" 
            onClick={clearAllFilters}
            disabled={!hasActiveFilters}
          >
            クリア
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}