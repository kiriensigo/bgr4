'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, RotateCcw } from 'lucide-react'

interface SearchFilters {
  query: string
  overallScore: [number, number]
  ruleComplexity: [number, number]
  luckFactor: [number, number]
  interaction: [number, number]
  downtime: [number, number]
  selectedPlayerCounts: number[]
  selectedGamePlayerCounts: number[]  // ゲームの実際のプレイ人数
  playTimeRange: [number, number]
  selectedMechanics: string[]
  selectedCategories: string[]
}

// Using exact mechanics and categories from ReviewFormClient to ensure 100% alignment with review system
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

export default function ReviewBasedSearchForm() {
  const [filters, setFilters] = useState<SearchFilters>({
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

  const [results] = useState([
    {
      id: 1,
      name: 'テラフォーミング・マーズ',
      image: '/game-images/terraforming-mars.jpg',
      overallScore: 8.2,
      ruleComplexity: 4.1,
      luckFactor: 2.8,
      interaction: 3.5,
      downtime: 3.2,
      recommendedPlayers: [3, 4],
      actualPlayTime: 120,
      mechanics: ['ワカプレ', 'エリア支配', 'セット収集'],
      categories: ['戦略'],
      reviewCount: 45
    },
    {
      id: 2,
      name: 'アグリコラ',
      image: '/game-images/agricola.jpg',
      overallScore: 8.5,
      ruleComplexity: 4.3,
      luckFactor: 1.8,
      interaction: 2.9,
      downtime: 2.1,
      recommendedPlayers: [2, 3, 4],
      actualPlayTime: 90,
      mechanics: ['ワカプレ', 'セット収集'],
      categories: ['戦略', 'ファミリー'],
      reviewCount: 67
    },
    {
      id: 3,
      name: 'スプレンダー',
      image: '/game-images/splendor.jpg',
      overallScore: 7.8,
      ruleComplexity: 2.1,
      luckFactor: 2.3,
      interaction: 3.2,
      downtime: 1.9,
      recommendedPlayers: [2, 3],
      actualPlayTime: 30,
      mechanics: ['セット収集'],
      categories: ['戦略', 'ファミリー'],
      reviewCount: 89
    }
  ])

  const handleSliderChange = (key: keyof SearchFilters, value: [number, number]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const togglePlayerCount = (count: number) => {
    setFilters(prev => ({
      ...prev,
      selectedPlayerCounts: prev.selectedPlayerCounts.includes(count)
        ? prev.selectedPlayerCounts.filter(c => c !== count)
        : [...prev.selectedPlayerCounts, count]
    }))
  }

  const toggleGamePlayerCount = (count: number) => {
    setFilters(prev => ({
      ...prev,
      selectedGamePlayerCounts: prev.selectedGamePlayerCounts.includes(count)
        ? prev.selectedGamePlayerCounts.filter(c => c !== count)
        : [...prev.selectedGamePlayerCounts, count]
    }))
  }

  const toggleTag = (tag: string, type: 'mechanics' | 'categories') => {
    const key = type === 'mechanics' ? 'selectedMechanics' : 'selectedCategories'
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(tag)
        ? prev[key].filter(t => t !== tag)
        : [...prev[key], tag]
    }))
  }

  const resetFilters = () => {
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
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.query) count++
    if (filters.overallScore[0] > 1 || filters.overallScore[1] < 10) count++
    if (filters.ruleComplexity[0] > 1 || filters.ruleComplexity[1] < 5) count++
    if (filters.luckFactor[0] > 1 || filters.luckFactor[1] < 5) count++
    if (filters.interaction[0] > 1 || filters.interaction[1] < 5) count++
    if (filters.downtime[0] > 1 || filters.downtime[1] < 5) count++
    if (filters.selectedPlayerCounts.length > 0) count++
    if (filters.selectedGamePlayerCounts.length > 0) count++
    if (filters.playTimeRange[0] > 15 || filters.playTimeRange[1] < 180) count++
    if (filters.selectedMechanics.length > 0) count++
    if (filters.selectedCategories.length > 0) count++
    return count
  }

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating / 2)
    const hasHalfStar = (rating / 2) % 1 >= 0.1
    const starProgress = ((rating / 2) % 1)
    
    const stars = []
    
    // 満点の星
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="text-yellow-500">★</span>)
    }
    
    // 部分的な星
    if (hasHalfStar && fullStars < 5) {
      const percentage = starProgress * 100
      stars.push(
        <span key={`partial-${fullStars}`} className="relative inline-block">
          <span className="text-gray-300">☆</span>
          <span 
            className="absolute top-0 left-0 text-yellow-500 overflow-hidden"
            style={{ width: `${percentage}%` }}
          >
            ★
          </span>
        </span>
      )
    }
    
    // 空の星
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">☆</span>)
    }
    
    return stars
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 検索バー */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="ゲーム名で検索..."
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                className="text-lg"
              />
            </div>
            <Button size="lg" className="px-8">
              <Search className="mr-2 h-5 w-5" />
              検索
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 5軸評価スライダー */}
      <Card>
        <CardHeader>
          <CardTitle>5軸評価で絞り込み</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 総合得点 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                総合得点: {filters.overallScore[0].toFixed(1)}点～{filters.overallScore[1].toFixed(1)}点
              </label>
              <Slider
                value={filters.overallScore}
                onValueChange={(value) => handleSliderChange('overallScore', value as [number, number])}
                max={10}
                min={1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>低評価</span>
                <span>高評価</span>
              </div>
            </div>

            {/* ゲーム対応プレイ人数 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                ゲーム対応プレイ人数 {filters.selectedGamePlayerCounts.length > 0 && `(${filters.selectedGamePlayerCounts.length}個選択)`}
              </label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(count => (
                  <Button
                    key={count}
                    variant={filters.selectedGamePlayerCounts.includes(count) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleGamePlayerCount(count)}
                  >
                    {count === 8 ? '8人以上' : `${count}人`}
                  </Button>
                ))}
              </div>
              <div className="text-xs text-gray-500">
                ゲームが対応している人数で絞り込み
              </div>
            </div>

            {/* ルール難度 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                ルール難度: {filters.ruleComplexity[0].toFixed(1)}点～{filters.ruleComplexity[1].toFixed(1)}点
              </label>
              <Slider
                value={filters.ruleComplexity}
                onValueChange={(value) => handleSliderChange('ruleComplexity', value as [number, number])}
                max={5}
                min={1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>シンプル</span>
                <span>複雑</span>
              </div>
            </div>

            {/* 運要素 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                運要素: {filters.luckFactor[0].toFixed(1)}点～{filters.luckFactor[1].toFixed(1)}点
              </label>
              <Slider
                value={filters.luckFactor}
                onValueChange={(value) => handleSliderChange('luckFactor', value as [number, number])}
                max={5}
                min={1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>戦略的</span>
                <span>運ゲー</span>
              </div>
            </div>

            {/* 相互作用 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                相互作用: {filters.interaction[0].toFixed(1)}点～{filters.interaction[1].toFixed(1)}点
              </label>
              <Slider
                value={filters.interaction}
                onValueChange={(value) => handleSliderChange('interaction', value as [number, number])}
                max={5}
                min={1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>ソロ感</span>
                <span>インタラクティブ</span>
              </div>
            </div>

            {/* ダウンタイム */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                ダウンタイム: {filters.downtime[0].toFixed(1)}点～{filters.downtime[1].toFixed(1)}点
              </label>
              <Slider
                value={filters.downtime}
                onValueChange={(value) => handleSliderChange('downtime', value as [number, number])}
                max={5}
                min={1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>テンポ良い</span>
                <span>待ち時間多い</span>
              </div>
            </div>

            {/* プレイ時間 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                プレイ時間: {filters.playTimeRange[0]}分～{filters.playTimeRange[1]}分
              </label>
              <Slider
                value={filters.playTimeRange}
                onValueChange={(value) => handleSliderChange('playTimeRange', value as [number, number])}
                max={180}
                min={15}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>短時間</span>
                <span>長時間</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* プレイ人数・メカニクス・カテゴリー */}
      <Card>
        <CardHeader>
          <CardTitle>プレイ特性で絞り込み</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* プレイ人数 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">おすすめプレイ人数</label>
            <div className="flex flex-wrap gap-2">
              {[2, 3, 4, 5, 6, 7].map(count => (
                <Button
                  key={count}
                  variant={filters.selectedPlayerCounts.includes(count) ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePlayerCount(count)}
                >
                  {count === 7 ? '7人以上' : `${count}人`}
                </Button>
              ))}
            </div>
          </div>

          {/* メカニクス */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              メカニクス {filters.selectedMechanics.length > 0 && `(${filters.selectedMechanics.length}個選択)`}
            </label>
            <div className="flex flex-wrap gap-2">
              {MECHANICS.map(mechanic => (
                <Button
                  key={mechanic}
                  variant={filters.selectedMechanics.includes(mechanic) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTag(mechanic, 'mechanics')}
                >
                  {mechanic}
                </Button>
              ))}
            </div>
          </div>

          {/* カテゴリー */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              カテゴリー {filters.selectedCategories.length > 0 && `(${filters.selectedCategories.length}個選択)`}
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(category => (
                <Button
                  key={category}
                  variant={filters.selectedCategories.includes(category) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleTag(category, 'categories')}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 検索結果ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">検索結果: {results.length}件</h2>
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary">
              {getActiveFilterCount()}個のフィルター適用中
            </Badge>
          )}
        </div>
        <Button variant="outline" onClick={resetFilters}>
          <RotateCcw className="mr-2 h-4 w-4" />
          リセット
        </Button>
      </div>

      {/* 検索結果 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map(game => (
          <Card key={game.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* ゲーム基本情報 */}
                <div>
                  <h3 className="font-semibold text-lg mb-1">{game.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(game.overallScore)}</div>
                    <span className="text-sm font-medium">{game.overallScore}点</span>
                    <span className="text-xs text-gray-500">({game.reviewCount}件のレビュー)</span>
                  </div>
                </div>

                {/* プレイ情報 */}
                <div className="text-sm text-gray-600">
                  <div>推奨: {game.recommendedPlayers.join('-')}人</div>
                  <div>実プレイ時間: {game.actualPlayTime}分</div>
                </div>

                {/* 5軸評価 */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>ルール: <span className="font-medium">{game.ruleComplexity}</span></div>
                  <div>運要素: <span className="font-medium">{game.luckFactor}</span></div>
                  <div>相互作用: <span className="font-medium">{game.interaction}</span></div>
                  <div>ダウンタイム: <span className="font-medium">{game.downtime}</span></div>
                </div>

                {/* タグ */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {game.mechanics.slice(0, 3).map(mechanic => (
                      <Badge key={mechanic} variant="secondary" className="text-xs">
                        {mechanic}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {game.categories.slice(0, 2).map(category => (
                      <Badge key={category} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}