'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Gamepad2,
  Search, 
  Plus, 
  X,
  Tag,
  Wrench,
  Building,
  User,
  Loader2
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// フォームバリデーションスキーマ
const gameFormSchema = z.object({
  name: z.string().min(1, 'ゲーム名は必須です'),
  japaneseName: z.string().optional(),
  description: z.string().optional(),
  yearPublished: z.number().min(1900).max(new Date().getFullYear()).optional(),
  minPlayers: z.number().min(1, '最小プレイヤー数は1以上である必要があります'),
  maxPlayers: z.number().min(1, '最大プレイヤー数は1以上である必要があります'),
  playingTime: z.number().min(1).optional(),
  minAge: z.number().min(1).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  bggId: z.number().optional(),
})

type GameFormData = z.infer<typeof gameFormSchema>

// サイトカテゴリー・メカニクスの選択肢
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

interface GameFormProps {
  onSubmit: (data: GameFormData) => Promise<void>
  onCancel: () => void
  initialData?: Partial<GameFormData>
  loading?: boolean
}

export function GameForm({ onSubmit, onCancel, initialData, loading = false }: GameFormProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedMechanics, setSelectedMechanics] = useState<string[]>([])
  const [designers, setDesigners] = useState<string[]>([])
  const [publishers, setPublishers] = useState<string[]>([])
  const [newDesigner, setNewDesigner] = useState('')
  const [newPublisher, setNewPublisher] = useState('')
  const [bggSearchQuery, setBggSearchQuery] = useState('')
  const [bggSearchResults, setBggSearchResults] = useState<any[]>([])
  const [bggSearchLoading, setBggSearchLoading] = useState(false)

  const form = useForm<GameFormData>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      name: '',
      japaneseName: '',
      description: '',
      minPlayers: 1,
      maxPlayers: 4,
      ...initialData
    }
  })

  const handleSubmit = async (data: GameFormData) => {
    const gameData = {
      ...data,
      siteCategories: selectedCategories,
      siteMechanics: selectedMechanics,
      designers,
      publishers
    }
    
    await onSubmit(gameData)
  }

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

  const addDesigner = () => {
    if (newDesigner.trim() && !designers.includes(newDesigner.trim())) {
      setDesigners(prev => [...prev, newDesigner.trim()])
      setNewDesigner('')
    }
  }

  const removeDesigner = (designer: string) => {
    setDesigners(prev => prev.filter(d => d !== designer))
  }

  const addPublisher = () => {
    if (newPublisher.trim() && !publishers.includes(newPublisher.trim())) {
      setPublishers(prev => [...prev, newPublisher.trim()])
      setNewPublisher('')
    }
  }

  const removePublisher = (publisher: string) => {
    setPublishers(prev => prev.filter(p => p !== publisher))
  }

  const searchBgg = async () => {
    if (!bggSearchQuery.trim()) return
    
    setBggSearchLoading(true)
    try {
      const response = await fetch(`/api/bgg/search?q=${encodeURIComponent(bggSearchQuery)}`)
      const data = await response.json()
      
      if (data.success) {
        setBggSearchResults(data.data)
      }
    } catch (error) {
      console.error('BGG search error:', error)
    } finally {
      setBggSearchLoading(false)
    }
  }

  const importFromBgg = async (bggId: number) => {
    try {
      const response = await fetch(`/api/bgg/game/${bggId}`)
      const data = await response.json()
      
      if (data.success) {
        const game = data.data
        form.reset({
          name: game.name,
          description: game.description,
          yearPublished: game.yearPublished,
          minPlayers: game.minPlayers,
          maxPlayers: game.maxPlayers,
          playingTime: game.playingTime,
          minAge: game.minAge,
          imageUrl: game.imageUrl,
          thumbnailUrl: game.thumbnailUrl,
          bggId: game.id
        })
        
        setSelectedCategories(game.categories || [])
        setSelectedMechanics(game.mechanics || [])
        setDesigners(game.designers || [])
        setPublishers(game.publishers || [])
        setBggSearchResults([])
        setBggSearchQuery('')
      }
    } catch (error) {
      console.error('BGG import error:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Gamepad2 className="h-6 w-6" />
          <span>{initialData ? 'ゲーム情報編集' : '新しいゲーム登録'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual" className="space-y-6">
          <TabsList>
            <TabsTrigger value="manual">手動入力</TabsTrigger>
            <TabsTrigger value="bgg">BGGから取得</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bgg" className="space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  placeholder="BGGでゲーム名を検索..."
                  value={bggSearchQuery}
                  onChange={(e) => setBggSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchBgg()}
                />
              </div>
              <Button onClick={searchBgg} disabled={bggSearchLoading}>
                {bggSearchLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                検索
              </Button>
            </div>
            
            {bggSearchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {bggSearchResults.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <h4 className="font-medium">{game.name}</h4>
                      <p className="text-sm text-gray-500">
                        {game.yearPublished && `${game.yearPublished}年`} • BGG ID: {game.id}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => importFromBgg(game.id)}>
                      取得
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="manual">
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* 基本情報 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">ゲーム名 *</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="ゲーム名を入力"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="japaneseName">日本語名</Label>
                  <Input
                    id="japaneseName"
                    {...form.register('japaneseName')}
                    placeholder="日本語名を入力（任意）"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">ゲーム説明</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="ゲームの説明を入力"
                  rows={3}
                />
              </div>
              
              {/* ゲーム詳細情報 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="yearPublished">発売年</Label>
                  <Input
                    id="yearPublished"
                    type="number"
                    {...form.register('yearPublished', { valueAsNumber: true })}
                    placeholder="2024"
                  />
                </div>
                
                <div>
                  <Label htmlFor="minPlayers">最小人数 *</Label>
                  <Input
                    id="minPlayers"
                    type="number"
                    {...form.register('minPlayers', { valueAsNumber: true })}
                    placeholder="1"
                    min="1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="maxPlayers">最大人数 *</Label>
                  <Input
                    id="maxPlayers"
                    type="number"
                    {...form.register('maxPlayers', { valueAsNumber: true })}
                    placeholder="4"
                    min="1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="playingTime">プレイ時間（分）</Label>
                  <Input
                    id="playingTime"
                    type="number"
                    {...form.register('playingTime', { valueAsNumber: true })}
                    placeholder="60"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minAge">推奨年齢</Label>
                  <Input
                    id="minAge"
                    type="number"
                    {...form.register('minAge', { valueAsNumber: true })}
                    placeholder="10"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bggId">BGG ID</Label>
                  <Input
                    id="bggId"
                    type="number"
                    {...form.register('bggId', { valueAsNumber: true })}
                    placeholder="BGG ID（任意）"
                  />
                </div>
              </div>
              
              {/* 画像URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="imageUrl">画像URL</Label>
                  <Input
                    id="imageUrl"
                    {...form.register('imageUrl')}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="thumbnailUrl">サムネイルURL</Label>
                  <Input
                    id="thumbnailUrl"
                    {...form.register('thumbnailUrl')}
                    placeholder="https://example.com/thumb.jpg"
                  />
                </div>
              </div>
              
              {/* カテゴリー選択 */}
              <div>
                <Label className="flex items-center space-x-2 mb-3">
                  <Tag className="h-4 w-4" />
                  <span>カテゴリー</span>
                </Label>
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
              </div>
              
              {/* メカニクス選択 */}
              <div>
                <Label className="flex items-center space-x-2 mb-3">
                  <Wrench className="h-4 w-4" />
                  <span>メカニクス</span>
                </Label>
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
              </div>
              
              {/* デザイナー */}
              <div>
                <Label className="flex items-center space-x-2 mb-3">
                  <User className="h-4 w-4" />
                  <span>デザイナー</span>
                </Label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    value={newDesigner}
                    onChange={(e) => setNewDesigner(e.target.value)}
                    placeholder="デザイナー名を入力"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDesigner())}
                  />
                  <Button type="button" size="sm" onClick={addDesigner}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {designers.map((designer) => (
                    <Badge key={designer} variant="secondary" className="cursor-pointer">
                      {designer}
                      <X
                        className="h-3 w-3 ml-1"
                        onClick={() => removeDesigner(designer)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* パブリッシャー */}
              <div>
                <Label className="flex items-center space-x-2 mb-3">
                  <Building className="h-4 w-4" />
                  <span>パブリッシャー</span>
                </Label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    value={newPublisher}
                    onChange={(e) => setNewPublisher(e.target.value)}
                    placeholder="パブリッシャー名を入力"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPublisher())}
                  />
                  <Button type="button" size="sm" onClick={addPublisher}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {publishers.map((publisher) => (
                    <Badge key={publisher} variant="secondary" className="cursor-pointer">
                      {publisher}
                      <X
                        className="h-3 w-3 ml-1"
                        onClick={() => removePublisher(publisher)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* フォームアクション */}
              <div className="flex space-x-2 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {initialData ? '更新' : '登録'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  キャンセル
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}