'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/useToast'
import Image from 'next/image'

import { supabase } from '@/lib/supabase-client'

interface BGGGamePreview {
  id: number
  name: string
  yearPublished?: number
  minPlayers?: number
  maxPlayers?: number
  playingTime?: number
  imageUrl?: string
  thumbnailUrl?: string
  description?: string
  averageRating?: number
  ratingCount?: number
  categories: string[]
  mechanics: string[]
  designers: string[]
  publishers: string[]
}

export default function BGGRegistrationForm() {
  const [input, setInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [gamePreview, setGamePreview] = useState<BGGGamePreview | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // BGG URLからIDを抽出する関数
  const extractBGGId = (input: string): number | null => {
    // 直接数値入力
    if (/^\d{1,8}$/.test(input.trim())) {
      return parseInt(input.trim())
    }
    
    // BGG URL解析
    const patterns = [
      /boardgamegeek\.com\/boardgame\/(\d+)/,
      /bgg\.cc\/(\d+)/
    ]
    
    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match) return parseInt(match[1])
    }
    
    return null
  }

  const handleSearch = async () => {
    setError('')
    setGamePreview(null)
    setSuccess('')
    
    const bggId = extractBGGId(input)
    if (!bggId) {
      const msg = '有効なBGG IDまたはURLを入力してください'
      setError(msg)
      toast({ variant: 'destructive', title: '入力エラー', description: msg })
      return
    }

    setIsSearching(true)
    
    try {
      // 実際のBGG APIから取得
      const response = await fetch(`/api/bgg/game/${bggId}`)
      
      if (!response.ok) {
        throw new Error(`BGG API error: ${response.status}`)
      }
      
      const apiResponse = await response.json()
      
      // APIレスポンスの構造を確認: { success: true, data: { ... } }
      if (!apiResponse.success || !apiResponse.data || !apiResponse.data.name) {
        const msg = '指定されたIDのゲームが見つかりませんでした'
        setError(msg)
        toast({ variant: 'destructive', title: '見つかりません', description: msg })
        return
      }
      
      const gameData = apiResponse.data
      
      const gamePreview: BGGGamePreview = {
        id: gameData.id,
        name: gameData.name,
        yearPublished: gameData.yearPublished,
        minPlayers: gameData.minPlayers,
        maxPlayers: gameData.maxPlayers,
        playingTime: gameData.playingTime,
        imageUrl: gameData.imageUrl,
        thumbnailUrl: gameData.thumbnailUrl,
        description: gameData.description,
        averageRating: gameData.averageRating,
        ratingCount: gameData.ratingCount,
        categories: gameData.categories || [],
        mechanics: gameData.mechanics || [],
        designers: gameData.designers || [],
        publishers: gameData.publishers || []
      }
      
      setGamePreview(gamePreview)
    } catch (err) {
      console.error('BGG API error:', err)
      const msg = 'BGGからの情報取得に失敗しました。しばらく後に再度お試しください。'
      setError(msg)
      toast({ variant: 'destructive', title: 'BGG取得エラー', description: msg })
    } finally {
      setIsSearching(false)
    }
  }

  const handleRegister = async () => {
    if (!gamePreview) return
    
    setIsRegistering(true)
    setError('')
    
    try {
      // Supabaseセッション取得
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        const msg = 'ログインが必要です。'
        setError(msg)
        toast({ variant: 'destructive', title: '認証エラー', description: msg })
        return
      }

      // BGG ゲームデータをデータベースに登録
      const response = await fetch('/api/games/register-from-bgg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          bggId: gamePreview.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'ゲーム登録に失敗しました')
      }

      const result = await response.json()
      
      setSuccess('ゲームが正常に登録されました！ゲーム詳細ページに移動します...')
      toast({ variant: 'success', title: '登録完了', description: 'ゲームを登録しました。詳細ページへ移動します。' })
      setTimeout(() => {
        window.location.href = `/games/${result.data.id}`
      }, 1200)
      
    } catch (err) {
      console.error('BGG game registration error:', err)
      const msg = err instanceof Error ? err.message : '登録に失敗しました。すでに登録済みのゲームか、エラーが発生しました。'
      setError(msg)
      toast({ variant: 'destructive', title: '登録エラー', description: msg })
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 入力セクション */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bgg-input" className="text-base font-medium">
            BGG URL または ゲームID
          </Label>
          <div className="flex space-x-2">
            <Input
              id="bgg-input"
              type="text"
              placeholder="例: https://boardgamegeek.com/boardgame/266192/ または 266192"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
              disabled={isSearching}
            />
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !input.trim()}
              className="min-w-[80px]"
            >
              {isSearching ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                '検索'
              )}
            </Button>
          </div>
        </div>

        {/* 入力例の表示 */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-2">入力例:</p>
          <ul className="space-y-1">
            <li>• <code className="bg-gray-200 px-2 py-1 rounded text-xs">266192</code> - BGG ID直接入力</li>
            <li>• <code className="bg-gray-200 px-2 py-1 rounded text-xs">https://boardgamegeek.com/boardgame/266192/wingspan</code></li>
            <li>• <code className="bg-gray-200 px-2 py-1 rounded text-xs">https://bgg.cc/266192</code></li>
          </ul>
        </div>
      </div>

      {/* フラッシュはトーストで表示（バナーは廃止） */}

      {/* ゲームプレビュー */}
      {gamePreview && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>取得したゲーム情報</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                BGG ID: {gamePreview.id}
              </Badge>
            </CardTitle>
            <CardDescription>
              以下の内容で登録されます。問題なければ登録ボタンを押してください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 基本情報 */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* 画像 */}
              {gamePreview.imageUrl && (
                <div className="md:w-48 flex-shrink-0">
                  <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={gamePreview.imageUrl}
                      alt={gamePreview.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 192px"
                    />
                  </div>
                </div>
              )}

              {/* ゲーム情報 */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {gamePreview.name}
                  </h3>
                  {gamePreview.yearPublished && (
                    <p className="text-gray-600">発売年: {gamePreview.yearPublished}</p>
                  )}
                </div>

                {/* スペック */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">プレイ人数:</span>{' '}
                    <span>{gamePreview.minPlayers}～{gamePreview.maxPlayers}人</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">プレイ時間:</span>{' '}
                    <span>{gamePreview.playingTime}分</span>
                  </div>
                  {gamePreview.averageRating && (
                    <>
                      <div>
                        <span className="font-medium text-gray-700">BGG評価:</span>{' '}
                        <span className="font-bold text-amber-600">{gamePreview.averageRating}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">評価数:</span>{' '}
                        <span>{gamePreview.ratingCount?.toLocaleString()}件</span>
                      </div>
                    </>
                  )}
                </div>

                {/* 説明 */}
                {gamePreview.description && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">説明</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {gamePreview.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* 分類情報 */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">カテゴリー</h4>
                <div className="flex flex-wrap gap-2">
                  {gamePreview.categories.map((category) => (
                    <Badge key={category} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">メカニクス</h4>
                <div className="flex flex-wrap gap-2">
                  {gamePreview.mechanics.map((mechanic) => (
                    <Badge key={mechanic} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {mechanic}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">デザイナー</h4>
                <div className="flex flex-wrap gap-2">
                  {gamePreview.designers.map((designer) => (
                    <Badge key={designer} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {designer}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">パブリッシャー</h4>
                <div className="flex flex-wrap gap-2">
                  {gamePreview.publishers.map((publisher) => (
                    <Badge key={publisher} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      {publisher}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* 登録ボタン */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setGamePreview(null)}
                disabled={isRegistering}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleRegister}
                disabled={isRegistering}
                className="min-w-[120px]"
              >
                {isRegistering ? (
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
