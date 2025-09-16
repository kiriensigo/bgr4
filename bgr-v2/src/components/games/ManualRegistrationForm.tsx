'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase-client'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle } from 'lucide-react'
import Image from 'next/image'

interface ManualGameData {
  nameEnglish: string
  nameJapanese: string
  description: string
  yearPublished: string
  minPlayers: string
  maxPlayers: string
  minPlayingTime: string
  maxPlayingTime: string
  imageUrl: string
  designers: string
  publishers: string
  
  // Boolean category fields
  cat_acting: boolean
  cat_animals: boolean
  cat_bluffing: boolean
  cat_cardgame: boolean
  cat_children: boolean
  cat_deduction: boolean
  cat_legacy_campaign: boolean
  cat_memory: boolean
  cat_negotiation: boolean
  cat_paper_pen: boolean
  cat_party: boolean
  cat_puzzle: boolean
  cat_solo: boolean
  cat_pair: boolean
  cat_multiplayer: boolean
  cat_trivia: boolean
  cat_wargame: boolean
  cat_word: boolean
  
  // Boolean mechanic fields
  mech_area_control: boolean
  mech_auction: boolean
  mech_betting: boolean
  mech_cooperative: boolean
  mech_deckbuild: boolean
  mech_dice: boolean
  mech_draft: boolean
  mech_engine_build: boolean
  mech_hidden_roles: boolean
  mech_modular_board: boolean
  mech_route_build: boolean
  mech_burst: boolean
  mech_set_collection: boolean
  mech_simultaneous: boolean
  mech_tile_placement: boolean
  mech_variable_powers: boolean
}

const categoryLabels = {
  cat_acting: '演技',
  cat_animals: '動物',
  cat_bluffing: 'ブラフ',
  cat_cardgame: 'カードゲーム',
  cat_children: '子供向け',
  cat_deduction: '推理',
  cat_legacy_campaign: 'レガシー・キャンペーン',
  cat_memory: '記憶',
  cat_negotiation: '交渉',
  cat_paper_pen: '紙ペン',
  cat_party: 'パーティー',
  cat_puzzle: 'パズル',
  cat_solo: 'ソロ向き',
  cat_pair: 'ペア向き',
  cat_multiplayer: '多人数向き',
  cat_trivia: 'トリテ',
  cat_wargame: 'ウォーゲーム',
  cat_word: 'ワードゲーム'
}

const mechanicLabels = {
  mech_area_control: 'エリア支配',
  mech_auction: 'オークション',
  mech_betting: '賭け',
  mech_cooperative: '協力',
  mech_deckbuild: 'デッキ/バッグビルド',
  mech_dice: 'ダイスロール',
  mech_draft: 'ドラフト',
  mech_engine_build: 'エンジンビルド',
  mech_hidden_roles: '正体隠匿',
  mech_modular_board: 'モジュラーボード',
  mech_route_build: 'ルート構築',
  mech_burst: 'バースト',
  mech_set_collection: 'セット収集',
  mech_simultaneous: '同時手番',
  mech_tile_placement: 'タイル配置',
  mech_variable_powers: 'プレイヤー別能力'
}

export default function ManualRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState<ManualGameData>({
    nameEnglish: '',
    nameJapanese: '',
    description: '',
    yearPublished: '',
    minPlayers: '',
    maxPlayers: '',
    minPlayingTime: '',
    maxPlayingTime: '',
    imageUrl: '',
    designers: '',
    publishers: '',
    
    // Initialize all boolean fields to false
    cat_acting: false,
    cat_animals: false,
    cat_bluffing: false,
    cat_cardgame: false,
    cat_children: false,
    cat_deduction: false,
    cat_legacy_campaign: false,
    cat_memory: false,
    cat_negotiation: false,
    cat_paper_pen: false,
    cat_party: false,
    cat_puzzle: false,
    cat_solo: false,
    cat_pair: false,
    cat_multiplayer: false,
    cat_trivia: false,
    cat_wargame: false,
    cat_word: false,
    
    mech_area_control: false,
    mech_auction: false,
    mech_betting: false,
    mech_cooperative: false,
    mech_deckbuild: false,
    mech_dice: false,
    mech_draft: false,
    mech_engine_build: false,
    mech_hidden_roles: false,
    mech_modular_board: false,
    mech_route_build: false,
    mech_burst: false,
    mech_set_collection: false,
    mech_simultaneous: false,
    mech_tile_placement: false,
    mech_variable_powers: false
  })

  const handleInputChange = (field: keyof ManualGameData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const toggleField = (field: keyof ManualGameData) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const validateStep = (step: number): boolean => {
    setError('')
    switch (step) {
      case 1: {
        if (!formData.nameEnglish.trim() && !formData.nameJapanese.trim()) {
          const msg = '英語名または日本語名のどちらかは必須です'
          setError(msg)
          toast({ variant: 'destructive', title: '入力エラー', description: msg })
          return false
        }
        if (!formData.imageUrl.trim()) {
          const msg = 'ゲーム画像URLは必須です'
          setError(msg)
          toast({ variant: 'destructive', title: '入力エラー', description: msg })
          return false
        }
        if (
          formData.yearPublished &&
          (parseInt(formData.yearPublished) < 1900 || parseInt(formData.yearPublished) > new Date().getFullYear())
        ) {
          const msg = '発売年は1900年から現在年までで入力してください'
          setError(msg)
          toast({ variant: 'destructive', title: '入力エラー', description: msg })
          return false
        }
        if (!formData.minPlayers || !formData.maxPlayers) {
          const msg = '最小・最大プレイ人数は必須です'
          setError(msg)
          toast({ variant: 'destructive', title: '入力エラー', description: msg })
          return false
        }
        if (parseInt(formData.minPlayers) > parseInt(formData.maxPlayers)) {
          const msg = '最小プレイ人数は最大プレイ人数以下にしてください'
          setError(msg)
          toast({ variant: 'destructive', title: '入力エラー', description: msg })
          return false
        }
        if (!formData.minPlayingTime || !formData.maxPlayingTime) {
          const msg = '最小・最大プレイ時間は必須です'
          setError(msg)
          toast({ variant: 'destructive', title: '入力エラー', description: msg })
          return false
        }
        if (parseInt(formData.minPlayingTime) > parseInt(formData.maxPlayingTime)) {
          const msg = '最小プレイ時間は最大プレイ時間以下にしてください'
          setError(msg)
          toast({ variant: 'destructive', title: '入力エラー', description: msg })
          return false
        }
        return true
      }
      case 2:
        return true
      case 3:
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return
    
    setIsSubmitting(true)
    setError('')
    
    try {
      // 認証トークンを取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error('認証が必要です。ログインしてください。')
      }
      
      // createManualGame Server Actionを呼び出し
      const { createManualGame } = await import('@/app/actions/game-actions')
      
      const result = await createManualGame({
        ...formData,
        accessToken: session.access_token
      })
      
      if (result.success) {
        const msg = 'ゲームを登録しました。詳細ページへ移動します。'
        setSuccess(result.message)
        toast({ variant: 'success', title: '登録完了', description: msg })
        setTimeout(() => {
          window.location.href = `/games/${result.data?.id || ''}`
        }, 1200)
      } else {
        const msg = result.message || '登録に失敗しました'
        setError(msg)
        toast({ variant: 'destructive', title: '登録エラー', description: msg })
      }
      
    } catch (err) {
      console.error('Registration error:', err)
      setError('登録に失敗しました。入力内容を確認してください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSelectedCategories = () => {
    return Object.entries(categoryLabels).filter(([key]) => formData[key as keyof ManualGameData])
  }

  const getSelectedMechanics = () => {
    return Object.entries(mechanicLabels).filter(([key]) => formData[key as keyof ManualGameData])
  }

  return (
    <div className="space-y-6">
      {/* プログレスバー */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Step {currentStep} of 3</span>
          <span>{Math.round((currentStep / 3) * 100)}%</span>
        </div>
        <Progress value={(currentStep / 3) * 100} className="h-2" />
        <div className="flex justify-between text-xs text-gray-500">
          <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : ''}>基本情報</span>
          <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : ''}>カテゴリー・メカニクス</span>
          <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : ''}>確認・登録</span>
        </div>
      </div>

      {/* エラー・成功表示 */}
      {/* フラッシュはトーストで表示するためバナーは廃止 */}

      {/* Step 1: 基本情報 */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: 基本情報</CardTitle>
            <CardDescription>
              ゲームの基本的な情報を入力してください。英語名または日本語名のどちらかは必須です。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ゲーム名 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name-english">英語名</Label>
                <Input
                  id="name-english"
                  value={formData.nameEnglish}
                  onChange={handleInputChange('nameEnglish')}
                  placeholder="例: Wingspan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name-japanese">日本語名</Label>
                <Input
                  id="name-japanese"
                  value={formData.nameJapanese}
                  onChange={handleInputChange('nameJapanese')}
                  placeholder="例: ウイングスパン"
                />
              </div>
            </div>

            {/* 画像URL */}
            <div className="space-y-2">
              <Label htmlFor="image-url">ゲーム画像URL *</Label>
              <Input
                id="image-url"
                value={formData.imageUrl}
                onChange={handleInputChange('imageUrl')}
                placeholder="https://example.com/game-image.jpg"
                required
              />
              {formData.imageUrl && (
                <div className="mt-2">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-500">画像プレビュー</span>
                  </div>
                </div>
              )}
            </div>

            {/* 説明 */}
            <div className="space-y-2">
              <Label htmlFor="description">ゲーム説明</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleInputChange('description')}
                placeholder="ゲームの概要や特徴を説明してください..."
                rows={4}
              />
            </div>

            {/* 発売年・人数・時間 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">発売年</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.yearPublished}
                  onChange={handleInputChange('yearPublished')}
                  placeholder="2019"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-players">最小人数 *</Label>
                <Input
                  id="min-players"
                  type="number"
                  value={formData.minPlayers}
                  onChange={handleInputChange('minPlayers')}
                  placeholder="1"
                  min="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-players">最大人数 *</Label>
                <Input
                  id="max-players"
                  type="number"
                  value={formData.maxPlayers}
                  onChange={handleInputChange('maxPlayers')}
                  placeholder="5"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-time">最小プレイ時間 (分) *</Label>
                <Input
                  id="min-time"
                  type="number"
                  value={formData.minPlayingTime}
                  onChange={handleInputChange('minPlayingTime')}
                  placeholder="60"
                  min="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-time">最大プレイ時間 (分) *</Label>
                <Input
                  id="max-time"
                  type="number"
                  value={formData.maxPlayingTime}
                  onChange={handleInputChange('maxPlayingTime')}
                  placeholder="90"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* デザイナー・パブリッシャー */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="designers">デザイナー</Label>
                <Input
                  id="designers"
                  value={formData.designers}
                  onChange={handleInputChange('designers')}
                  placeholder="例: Elizabeth Hargrave"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publishers">パブリッシャー</Label>
                <Input
                  id="publishers"
                  value={formData.publishers}
                  onChange={handleInputChange('publishers')}
                  placeholder="例: Stonemaier Games"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: カテゴリー・メカニクス */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: カテゴリー・メカニクス</CardTitle>
            <CardDescription>
              ゲームに当てはまるカテゴリーとメカニクスを選択してください。複数選択可能です。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* カテゴリー */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">カテゴリー</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={formData[key as keyof ManualGameData] ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleField(key as keyof ManualGameData)}
                    className="h-10 px-2 text-xs justify-center"
                  >
                    {formData[key as keyof ManualGameData] ? (
                      <CheckCircle2 className="w-3 h-3 mr-1 flex-shrink-0" />
                    ) : (
                      <Circle className="w-3 h-3 mr-1 flex-shrink-0" />
                    )}
                    <span className="truncate">{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* メカニクス */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">メカニクス</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {Object.entries(mechanicLabels).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={formData[key as keyof ManualGameData] ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleField(key as keyof ManualGameData)}
                    className="h-10 px-2 text-xs justify-center"
                  >
                    {formData[key as keyof ManualGameData] ? (
                      <CheckCircle2 className="w-3 h-3 mr-1 flex-shrink-0" />
                    ) : (
                      <Circle className="w-3 h-3 mr-1 flex-shrink-0" />
                    )}
                    <span className="truncate">{label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: 確認・登録 */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: 登録内容の確認</CardTitle>
            <CardDescription>
              入力内容を確認して、問題なければ登録ボタンを押してください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 基本情報確認 */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">基本情報</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {formData.nameEnglish && (
                  <div><strong>英語名:</strong> {formData.nameEnglish}</div>
                )}
                {formData.nameJapanese && (
                  <div><strong>日本語名:</strong> {formData.nameJapanese}</div>
                )}
                {formData.yearPublished && (
                  <div><strong>発売年:</strong> {formData.yearPublished}</div>
                )}
                <div><strong>プレイ人数:</strong> {formData.minPlayers}～{formData.maxPlayers}人</div>
                <div><strong>プレイ時間:</strong> {formData.minPlayingTime}～{formData.maxPlayingTime}分</div>
                {formData.designers && (
                  <div><strong>デザイナー:</strong> {formData.designers}</div>
                )}
                {formData.publishers && (
                  <div><strong>パブリッシャー:</strong> {formData.publishers}</div>
                )}
              </div>
            </div>

            {/* カテゴリー確認 */}
            {getSelectedCategories().length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">選択されたカテゴリー</h4>
                <div className="flex flex-wrap gap-2">
                  {getSelectedCategories().map(([key, label]) => (
                    <Badge key={key} variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* メカニクス確認 */}
            {getSelectedMechanics().length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">選択されたメカニクス</h4>
                <div className="flex flex-wrap gap-2">
                  {getSelectedMechanics().map(([key, label]) => (
                    <Badge key={key} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 画像プレビュー */}
            {formData.imageUrl && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">ゲーム画像</h4>
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-sm text-gray-500">画像プレビュー</span>
                    <div className="text-xs text-gray-400 mt-1">URL: {formData.imageUrl.substring(0, 30)}...</div>
                  </div>
                </div>
              </div>
            )}

            {/* 説明 */}
            {formData.description && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">説明</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{formData.description}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ナビゲーションボタン */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1 || isSubmitting}
        >
          前へ
        </Button>
        
        <div className="flex space-x-3">
          {currentStep < 3 ? (
            <Button onClick={nextStep} disabled={isSubmitting}>
              次へ
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  登録中...
                </>
              ) : (
                'ゲームを登録'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
