'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save, Star, Plus, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import ReviewStats from '@/components/reviews/ReviewStats'

interface EditableReview {
  id: string
  title: string
  content: string
  rating: number
  overallScore?: number
  complexityScore?: number
  luckScore?: number
  interactionScore?: number
  downtimeScore?: number
  pros?: string[]
  cons?: string[]
  categories?: string[]
  mechanics?: string[]
  recommendedPlayerCounts?: number[]
  isPublished: boolean
  games: {
    id: number
    name: string
    nameJp?: string
    imageUrl?: string
  }
}

export default function EditReviewPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  
  const [review, setReview] = useState<EditableReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form states
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [overallScore, setOverallScore] = useState(5)
  const [complexityScore, setComplexityScore] = useState(3)
  const [luckScore, setLuckScore] = useState(3)
  const [interactionScore, setInteractionScore] = useState(3)
  const [downtimeScore, setDowntimeScore] = useState(3)
  const [pros, setPros] = useState<string[]>([])
  const [cons, setCons] = useState<string[]>([])
  const [recommendedPlayerCounts, setRecommendedPlayerCounts] = useState<number[]>([])
  const [isPublished, setIsPublished] = useState(true)
  
  const [newPro, setNewPro] = useState('')
  const [newCon, setNewCon] = useState('')
  const [newPlayerCount, setNewPlayerCount] = useState('')

  const reviewId = params['id'] as string

  useEffect(() => {
    fetchReview()
  }, [reviewId])

  const fetchReview = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reviews/${reviewId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('レビューが見つかりませんでした')
        } else if (response.status === 403) {
          setError('このレビューを編集する権限がありません')
        } else {
          setError('レビューの読み込みに失敗しました')
        }
        return
      }

      const data = await response.json()
      
      // Check if current user owns the review
      if (!user || user.id !== data.profiles.id) {
        setError('このレビューを編集する権限がありません')
        return
      }

      setReview(data)
      
      // Set form values
      setTitle(data.title || '')
      setContent(data.content || '')
      setOverallScore(data.overallScore || data.rating || 5)
      setComplexityScore(data.complexityScore || 3)
      setLuckScore(data.luckScore || 3)
      setInteractionScore(data.interactionScore || 3)
      setDowntimeScore(data.downtimeScore || 3)
      setPros(data.pros || [])
      setCons(data.cons || [])
      setRecommendedPlayerCounts(data.recommendedPlayerCounts || [])
      setIsPublished(data.isPublished !== false)
      
    } catch (err) {
      console.error('Error fetching review:', err)
      setError('レビューの読み込み中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!review || !title.trim() || !content.trim()) {
      setError('タイトルと内容は必須です')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          overallScore,
          complexityScore,
          luckScore,
          interactionScore,
          downtimeScore,
          pros: pros.filter(p => p.trim()),
          cons: cons.filter(c => c.trim()),
          recommendedPlayerCounts,
          isPublished
        })
      })

      if (!response.ok) {
        throw new Error('レビューの更新に失敗しました')
      }

      router.push(`/reviews/${reviewId}`)
    } catch (err) {
      console.error('Error saving review:', err)
      setError(err instanceof Error ? err.message : '保存中にエラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  const addPro = () => {
    if (newPro.trim() && !pros.includes(newPro.trim())) {
      setPros([...pros, newPro.trim()])
      setNewPro('')
    }
  }

  const removePro = (index: number) => {
    setPros(pros.filter((_, i) => i !== index))
  }

  const addCon = () => {
    if (newCon.trim() && !cons.includes(newCon.trim())) {
      setCons([...cons, newCon.trim()])
      setNewCon('')
    }
  }

  const removeCon = (index: number) => {
    setCons(cons.filter((_, i) => i !== index))
  }

  const addPlayerCount = () => {
    const count = parseInt(newPlayerCount)
    if (count > 0 && count <= 20 && !recommendedPlayerCounts.includes(count)) {
      setRecommendedPlayerCounts([...recommendedPlayerCounts, count].sort((a, b) => a - b))
      setNewPlayerCount('')
    }
  }

  const removePlayerCount = (count: number) => {
    setRecommendedPlayerCounts(recommendedPlayerCounts.filter(c => c !== count))
  }

  const renderStarRating = (value: number, onChange: (value: number) => void, max: number = 10) => {
    return (
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = star <= Math.round(value / (max / 5))
            return (
              <button
                key={star}
                type="button"
                onClick={() => onChange(star * (max / 5))}
                className={`h-6 w-6 ${isActive ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
              >
                <Star className="h-6 w-6 fill-current" />
              </button>
            )
          })}
        </div>
        <span className="font-medium min-w-[3rem]">
          {value.toFixed(1)}
        </span>
      </div>
    )
  }

  if (!user) {
    return (
      <Container>
        <div className="py-16 text-center">
          <p className="text-gray-600 mb-4">ログインが必要です</p>
          <Button onClick={() => router.push('/login')}>
            ログイン
          </Button>
        </div>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container>
        <div className="py-8 space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </Container>
    )
  }

  if (error || !review) {
    return (
      <Container>
        <div className="py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'レビューが見つかりません'}
          </h2>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              戻る
            </Button>
            <Button onClick={() => router.push('/reviews')}>
              レビュー一覧
            </Button>
          </div>
        </div>
      </Container>
    )
  }

  const gameName = review.games.nameJp || review.games.name

  return (
    <Container>
      <div className="py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">レビューの編集</h1>
          <p className="text-gray-600">
            「{gameName}」のレビューを編集
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">レビュータイトル *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="レビューのタイトルを入力してください"
                  maxLength={100}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {title.length}/100文字
                </p>
              </div>

              <div>
                <Label htmlFor="content">レビュー内容 *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="ゲームの詳細なレビューを書いてください"
                  rows={10}
                  maxLength={2000}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {content.length}/2000文字
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ratings */}
          <Card>
            <CardHeader>
              <CardTitle>評価</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>総合評価 *</Label>
                {renderStarRating(overallScore, setOverallScore, 10)}
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>ルール複雑さ</Label>
                  <p className="text-sm text-gray-600 mb-2">1=簡単, 5=非常に複雑</p>
                  {renderStarRating(complexityScore, setComplexityScore, 5)}
                </div>

                <div>
                  <Label>運要素</Label>
                  <p className="text-sm text-gray-600 mb-2">1=戦略的, 5=運ゲー</p>
                  {renderStarRating(luckScore, setLuckScore, 5)}
                </div>

                <div>
                  <Label>プレイヤー間の相互作用</Label>
                  <p className="text-sm text-gray-600 mb-2">1=個人戦, 5=高い相互作用</p>
                  {renderStarRating(interactionScore, setInteractionScore, 5)}
                </div>

                <div>
                  <Label>ダウンタイム</Label>
                  <p className="text-sm text-gray-600 mb-2">1=短い, 5=長い待ち時間</p>
                  {renderStarRating(downtimeScore, setDowntimeScore, 5)}
                </div>
              </div>

              {/* Preview of ratings */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">評価プレビュー</h4>
                <ReviewStats 
                  stats={{
                    overall: overallScore,
                    complexity: complexityScore,
                    luck: luckScore,
                    interaction: interactionScore,
                    downtime: downtimeScore
                  }} 
                  size="sm" 
                />
              </div>
            </CardContent>
          </Card>

          {/* Pros and Cons */}
          <Card>
            <CardHeader>
              <CardTitle>良い点・改善点</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>良い点</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newPro}
                      onChange={(e) => setNewPro(e.target.value)}
                      placeholder="良い点を追加"
                      onKeyPress={(e) => e.key === 'Enter' && addPro()}
                    />
                    <Button type="button" onClick={addPro} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pros.map((pro, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {pro}
                        <button type="button" onClick={() => removePro(index)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>改善点</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newCon}
                      onChange={(e) => setNewCon(e.target.value)}
                      placeholder="改善点を追加"
                      onKeyPress={(e) => e.key === 'Enter' && addCon()}
                    />
                    <Button type="button" onClick={addCon} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cons.map((con, index) => (
                      <Badge key={index} variant="destructive" className="gap-1">
                        {con}
                        <button type="button" onClick={() => removeCon(index)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Player Counts */}
          <Card>
            <CardHeader>
              <CardTitle>推奨プレイ人数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={newPlayerCount}
                    onChange={(e) => setNewPlayerCount(e.target.value)}
                    placeholder="推奨人数"
                    onKeyPress={(e) => e.key === 'Enter' && addPlayerCount()}
                    className="w-32"
                  />
                  <Button type="button" onClick={addPlayerCount} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recommendedPlayerCounts.map((count) => (
                    <Badge key={count} variant="outline" className="gap-1">
                      {count}人
                      <button type="button" onClick={() => removePlayerCount(count)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">公開する</span>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => router.back()}
                    disabled={saving}
                  >
                    キャンセル
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={saving || !title.trim() || !content.trim()}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? '保存中...' : '保存する'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  )
}