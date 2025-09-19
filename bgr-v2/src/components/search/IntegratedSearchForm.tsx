'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, RotateCcw, Filter } from 'lucide-react'

// レビューシステムと完全一致のメカニクス・カテゴリー
const MECHANICS = [
  'エリア支配', 'オークション', '賭け', 'ドラフト', '協力', 'デッキ/バッグビルド',
  'ダイスロール', '正体隠匿', 'モジュラーボード', 'ルート構築', 'バースト', 'セット収集',
  '同時手番', 'タイル配置', 'プレイヤー別能力', 'ワカプレ'
]

const CATEGORIES = [
  '動物', 'ブラフ', 'カードゲーム', '子供向け', '推理', '記憶', '交渉', 'パーティー',
  'パズル', 'ウォーゲーム', 'ワードゲーム', '演技', 'レガシー・キャンペーン', '紙ペン',
  'ソロ向き', 'トリテ', 'ペア向き', '多人数向き'
]

interface SearchFilters {
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

interface IntegratedSearchFormProps {
  initialFilters?: Partial<SearchFilters>
  onSearch: (filters: SearchFilters) => void
  loading?: boolean
  className?: string
}

export default function IntegratedSearchForm({ 
  initialFilters, 
  onSearch, 
  loading = false,
  className = ''
}: IntegratedSearchFormProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: initialFilters?.query || '',
    overallScore: initialFilters?.overallScore || [1, 10],
    ruleComplexity: initialFilters?.ruleComplexity || [1, 5],
    luckFactor: initialFilters?.luckFactor || [1, 5],
    interaction: initialFilters?.interaction || [1, 5],
    downtime: initialFilters?.downtime || [1, 5],
    selectedPlayerCounts: initialFilters?.selectedPlayerCounts || [],
    selectedGamePlayerCounts: initialFilters?.selectedGamePlayerCounts || [],
    playTimeRange: initialFilters?.playTimeRange || [15, 180],
    selectedMechanics: initialFilters?.selectedMechanics || [],
    selectedCategories: initialFilters?.selectedCategories || []
  })

  const [searchMode, setSearchMode] = useState<'review' | 'traditional'>('review')

  // フィルター操作関数
  const toggleGamePlayerCount = useCallback((count: number) => {
    setFilters(prev => ({
      ...prev,
      selectedGamePlayerCounts: prev.selectedGamePlayerCounts.includes(count)
        ? prev.selectedGamePlayerCounts.filter(c => c !== count)
        : [...prev.selectedGamePlayerCounts, count]
    }))
  }, [])

  const togglePlayerCount = useCallback((count: number) => {
    setFilters(prev => ({
      ...prev,
      selectedPlayerCounts: prev.selectedPlayerCounts.includes(count)
        ? prev.selectedPlayerCounts.filter(c => c !== count)
        : [...prev.selectedPlayerCounts, count]
    }))
  }, [])

  const toggleMechanic = useCallback((mechanic: string) => {
    setFilters(prev => {
      const isCurrentlySelected = prev.selectedMechanics.includes(mechanic)
      const newMechanics = isCurrentlySelected
        ? prev.selectedMechanics.filter(m => m !== mechanic)
        : [...prev.selectedMechanics, mechanic]
      
      return {
        ...prev,
        selectedMechanics: newMechanics
      }
    })
  }, [])

  const toggleCategory = useCallback((category: string) => {
    setFilters(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter(c => c !== category)
        : [...prev.selectedCategories, category]
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      query: '',
      overallScore: [1, 10],
      ruleComplexity: [1, 5],
      luckFactor: [1, 5],
      interaction: [1, 5],
      downtime: [1, 5],
      selectedPlayerCounts: [],
      selectedGamePlayerCounts: [],
      playTimeRange: [15, 180],
      selectedMechanics: [],
      selectedCategories: []
    })
  }, [])

  const handleSearch = useCallback(() => {
    onSearch(filters)
  }, [filters, onSearch])

  // アクティブフィルターカウント
  const activeFilterCount = [
    filters.selectedGamePlayerCounts.length,
    filters.selectedPlayerCounts.length,
    filters.selectedMechanics.length,
    filters.selectedCategories.length,
    filters.overallScore[0] !== 1 || filters.overallScore[1] !== 10 ? 1 : 0,
    filters.ruleComplexity[0] !== 1 || filters.ruleComplexity[1] !== 5 ? 1 : 0,
    filters.luckFactor[0] !== 1 || filters.luckFactor[1] !== 5 ? 1 : 0,
    filters.interaction[0] !== 1 || filters.interaction[1] !== 5 ? 1 : 0,
    filters.downtime[0] !== 1 || filters.downtime[1] !== 5 ? 1 : 0,
    filters.playTimeRange[0] !== 15 || filters.playTimeRange[1] !== 180 ? 1 : 0
  ].reduce((a, b) => a + b, 0)

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              ゲーム検索
            </CardTitle>
            <Tabs value={searchMode} onValueChange={(value) => setSearchMode(value as 'review' | 'traditional')}>
              <TabsList>
                <TabsTrigger value="review">レビューベース検索</TabsTrigger>
                <TabsTrigger value="traditional">従来の検索</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 検索バー */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Input
                placeholder="ゲーム名で検索..."
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                className="pr-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              検索
            </Button>
          </div>

          <Tabs value={searchMode}>
            <TabsContent value="review" className="mt-6 space-y-6">
              {/* 5軸評価スライダー */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">5軸評価で絞り込み</h3>
                
                <div className="grid gap-6 md:grid-cols-2">
                  {/* 総合得点 */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium">
                      総合得点: {filters.overallScore[0].toFixed(1)}点～{filters.overallScore[1].toFixed(1)}点
                    </div>
                    <Slider
                      value={filters.overallScore}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, overallScore: value as [number, number] }))}
                      min={1}
                      max={10}
                      step={0.1}
                      className="w-full [&_[role=slider]]:border-blue-500 [&_[role=slider]]:bg-blue-500 [&_[role=slider]]:ring-blue-500 [&>*[data-orientation=horizontal]]:bg-gray-200 [&>*[data-orientation=horizontal]>*]:bg-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>低評価</span>
                      <span>高評価</span>
                    </div>
                  </div>

                  {/* ゲーム対応プレイ人数 */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium">ゲーム対応プレイ人数</div>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                        <Button
                          key={count}
                          variant="outline"
                          size="sm"
                          className={filters.selectedGamePlayerCounts.includes(count) ? 
                            "bg-blue-500 hover:bg-blue-600 text-white border-blue-500 min-w-[60px]" : 
                            "hover:bg-gray-50 min-w-[60px]"}
                          onClick={() => toggleGamePlayerCount(count)}
                        >
                          {count === 8 ? "8人以上" : `${count}人`}
                        </Button>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500">ゲームが対応している人数で絞り込み</div>
                  </div>

                  {/* ルール難度 */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium">
                      ルール難度: {filters.ruleComplexity[0].toFixed(1)}点～{filters.ruleComplexity[1].toFixed(1)}点
                    </div>
                    <Slider
                      value={filters.ruleComplexity}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, ruleComplexity: value as [number, number] }))}
                      min={1}
                      max={5}
                      step={0.1}
                      className="w-full [&_[role=slider]]:border-blue-500 [&_[role=slider]]:bg-blue-500 [&_[role=slider]]:ring-blue-500 [&>*[data-orientation=horizontal]]:bg-gray-200 [&>*[data-orientation=horizontal]>*]:bg-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>シンプル</span>
                      <span>複雑</span>
                    </div>
                  </div>

                  {/* 運要素 */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium">
                      運要素: {filters.luckFactor[0].toFixed(1)}点～{filters.luckFactor[1].toFixed(1)}点
                    </div>
                    <Slider
                      value={filters.luckFactor}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, luckFactor: value as [number, number] }))}
                      min={1}
                      max={5}
                      step={0.1}
                      className="w-full [&_[role=slider]]:border-blue-500 [&_[role=slider]]:bg-blue-500 [&_[role=slider]]:ring-blue-500 [&>*[data-orientation=horizontal]]:bg-gray-200 [&>*[data-orientation=horizontal]>*]:bg-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>戦略的</span>
                      <span>運ゲー</span>
                    </div>
                  </div>

                  {/* 相互作用 */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium">
                      相互作用: {filters.interaction[0].toFixed(1)}点～{filters.interaction[1].toFixed(1)}点
                    </div>
                    <Slider
                      value={filters.interaction}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, interaction: value as [number, number] }))}
                      min={1}
                      max={5}
                      step={0.1}
                      className="w-full [&_[role=slider]]:border-blue-500 [&_[role=slider]]:bg-blue-500 [&_[role=slider]]:ring-blue-500 [&>*[data-orientation=horizontal]]:bg-gray-200 [&>*[data-orientation=horizontal]>*]:bg-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>ソロ感</span>
                      <span>インタラクティブ</span>
                    </div>
                  </div>

                  {/* ダウンタイム */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium">
                      ダウンタイム: {filters.downtime[0].toFixed(1)}点～{filters.downtime[1].toFixed(1)}点
                    </div>
                    <Slider
                      value={filters.downtime}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, downtime: value as [number, number] }))}
                      min={1}
                      max={5}
                      step={0.1}
                      className="w-full [&_[role=slider]]:border-blue-500 [&_[role=slider]]:bg-blue-500 [&_[role=slider]]:ring-blue-500 [&>*[data-orientation=horizontal]]:bg-gray-200 [&>*[data-orientation=horizontal]>*]:bg-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>テンポ良い</span>
                      <span>待ち時間多い</span>
                    </div>
                  </div>

                  {/* プレイ時間 */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium">
                      プレイ時間: {filters.playTimeRange[0]}分～{filters.playTimeRange[1] >= 180 ? '180分以上' : `${filters.playTimeRange[1]}分`}
                    </div>
                    <Slider
                      value={filters.playTimeRange}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, playTimeRange: value as [number, number] }))}
                      min={15}
                      max={180}
                      step={15}
                      className="w-full [&_[role=slider]]:border-blue-500 [&_[role=slider]]:bg-blue-500 [&_[role=slider]]:ring-blue-500 [&>*[data-orientation=horizontal]]:bg-gray-200 [&>*[data-orientation=horizontal]>*]:bg-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>短時間</span>
                      <span>180分以上</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* プレイ特性フィルター */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">プレイ特性で絞り込み</h3>
                
                <div className="space-y-4">
                  {/* おすすめプレイ人数 */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium">
                      おすすめプレイ人数 {filters.selectedPlayerCounts.length > 0 && `(${filters.selectedPlayerCounts.length}個選択)`}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[2, 3, 4, 5, 6, 7].map((count) => (
                        <Button
                          key={count}
                          variant="outline"
                          size="sm"
                          className={filters.selectedPlayerCounts.includes(count) ? 
                            "bg-blue-500 hover:bg-blue-600 text-white border-blue-500 min-w-[60px]" : 
                            "hover:bg-gray-50 min-w-[60px]"}
                          onClick={() => togglePlayerCount(count)}
                        >
                          {count === 7 ? "7人以上" : `${count}人`}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* メカニクス */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium">
                      メカニクス {filters.selectedMechanics.length > 0 && `(${filters.selectedMechanics.length}個選択)`}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {MECHANICS.map((mechanic) => (
                        <Button
                          key={`${mechanic}-${filters.selectedMechanics.includes(mechanic)}`}
                          variant="outline"
                          size="sm"
                          className={filters.selectedMechanics.includes(mechanic) ? 
                            "bg-blue-500 hover:bg-blue-600 text-white border-blue-500 min-w-fit" : 
                            "hover:bg-gray-50 min-w-fit"}
                          onClick={() => toggleMechanic(mechanic)}
                        >
                          {mechanic}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* カテゴリー */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium">
                      カテゴリー {filters.selectedCategories.length > 0 && `(${filters.selectedCategories.length}個選択)`}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((category) => (
                        <Button
                          key={category}
                          variant="outline"
                          size="sm"
                          className={filters.selectedCategories.includes(category) ? 
                            "bg-blue-500 hover:bg-blue-600 text-white border-blue-500 min-w-fit" : 
                            "hover:bg-gray-50 min-w-fit"}
                          onClick={() => toggleCategory(category)}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="traditional" className="mt-6">
              <div className="text-center py-8 text-gray-500">
                従来の検索機能は準備中です。現在はレビューベース検索をお試しください。
              </div>
            </TabsContent>
          </Tabs>

          {/* フィルターリセット */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {activeFilterCount > 0 && (
                <Badge variant="secondary">
                  <Filter className="w-3 h-3 mr-1" />
                  {activeFilterCount}個のフィルター適用中
                </Badge>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              disabled={activeFilterCount === 0}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              リセット
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
