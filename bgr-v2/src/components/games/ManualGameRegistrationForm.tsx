'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { toast } from '@/hooks/useToast'
import { Loader2, Plus, Upload, GamepadIcon } from 'lucide-react'
import { MECHANICS, CATEGORIES } from '@/lib/game-constants'
import { createManualGame } from '@/app/actions/game-actions'

const manualGameSchema = z.object({
  name: z.string().min(1, 'ゲーム名は必須です').max(200, 'ゲーム名は200文字以下で入力してください'),
  name_jp: z.string().optional(),
  description: z.string().min(10, '説明は10文字以上で入力してください').max(5000, '説明は5000文字以下で入力してください'),
  year_published: z.number().min(1900).max(new Date().getFullYear()).optional(),
  min_players: z.number().min(1).max(20),
  max_players: z.number().min(1).max(20),
  min_playing_time: z.number().min(1).max(1440).optional(),
  max_playing_time: z.number().min(1).max(1440).optional(),
  designers: z.array(z.string()).optional(),
  publishers: z.array(z.string()).optional(),
  mechanics: z.array(z.enum(MECHANICS)),
  categories: z.array(z.enum(CATEGORIES)),
  image_url: z.string().url().optional()
})

type ManualGameFormData = z.infer<typeof manualGameSchema>

interface ManualGameRegistrationFormProps {
  onSubmit?: (data: ManualGameFormData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  initialData?: Partial<ManualGameFormData>
}

export function ManualGameRegistrationForm({ 
  onSubmit, 
  onCancel, 
  loading = false,
  initialData 
}: ManualGameRegistrationFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [designerInput, setDesignerInput] = useState('')
  const [publisherInput, setPublisherInput] = useState('')
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ManualGameFormData>({
    resolver: zodResolver(manualGameSchema),
    defaultValues: {
      name: initialData?.name || '',
      name_jp: initialData?.name_jp || '',
      description: initialData?.description || '',
      year_published: initialData?.year_published || new Date().getFullYear(),
      min_players: initialData?.min_players || 2,
      max_players: initialData?.max_players || 4,
      min_playing_time: initialData?.min_playing_time || 30,
      max_playing_time: initialData?.max_playing_time || 60,
      designers: initialData?.designers || [],
      publishers: initialData?.publishers || [],
      mechanics: initialData?.mechanics || [],
      categories: initialData?.categories || [],
      image_url: initialData?.image_url || ''
    }
  })

  const watchedValues = watch()

  const handleFormSubmit = async (data: ManualGameFormData) => {
    try {
      setSubmitError(null)
      
      // プレイ人数の妥当性チェック
      if (data.max_players < data.min_players) {
        throw new Error('最大人数は最小人数以上で設定してください')
      }
      
      // プレイ時間の妥当性チェック
      if (data.max_playing_time && data.min_playing_time && data.max_playing_time < data.min_playing_time) {
        throw new Error('最大プレイ時間は最小プレイ時間以上で設定してください')
      }

      if (onSubmit) {
        await onSubmit(data)
        toast({ variant: 'success', title: '登録完了', description: 'ゲームを登録しました。' })
      } else {
        // デフォルトのServer Actions統合
        await createManualGame(data)
        toast({ variant: 'success', title: '登録完了', description: 'ゲームを登録しました。' })
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : 'ゲームの登録に失敗しました'
      )
      const __msg = error instanceof Error ? error.message : 'ゲームの登録に失敗しました'
      toast({ variant: 'destructive', title: '登録エラー', description: __msg })
    }
  }

  const addDesigner = () => {
    if (designerInput.trim()) {
      const currentDesigners = watchedValues.designers || []
      setValue('designers', [...currentDesigners, designerInput.trim()])
      setDesignerInput('')
    }
  }

  const removeDesigner = (index: number) => {
    const currentDesigners = watchedValues.designers || []
    setValue('designers', currentDesigners.filter((_, i) => i !== index))
  }

  const addPublisher = () => {
    if (publisherInput.trim()) {
      const currentPublishers = watchedValues.publishers || []
      setValue('publishers', [...currentPublishers, publisherInput.trim()])
      setPublisherInput('')
    }
  }

  const removePublisher = (index: number) => {
    const currentPublishers = watchedValues.publishers || []
    setValue('publishers', currentPublishers.filter((_, i) => i !== index))
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <GamepadIcon className="w-6 h-6 text-primary" />
          <div>
            <CardTitle className="text-2xl">ゲーム手動登録</CardTitle>
            <p className="text-muted-foreground">
              BGGにないゲーム（同人ゲーム等）を手動で登録できます
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* フラッシュはトーストで表示するためバナーは廃止 */}

          {/* 基本情報 */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">基本情報</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">ゲーム名 (英語) *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Game Name (English)"
                  disabled={loading || isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name_jp">ゲーム名 (日本語)</Label>
                <Input
                  id="name_jp"
                  {...register('name_jp')}
                  placeholder="ゲーム名（日本語）"
                  disabled={loading || isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">ゲーム説明 *</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="ゲームの内容、ルール、面白さなどを詳しく説明してください..."
                rows={4}
                disabled={loading || isSubmitting}
              />
              <div className="text-sm text-muted-foreground">
                {watchedValues.description?.length || 0}/5000文字
              </div>
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">画像URL</Label>
              <Input
                id="image_url"
                {...register('image_url')}
                placeholder="https://example.com/game-image.jpg"
                disabled={loading || isSubmitting}
              />
              {errors.image_url && (
                <p className="text-sm text-red-600">{errors.image_url.message}</p>
              )}
            </div>
          </div>

          {/* ゲーム仕様 */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">ゲーム仕様</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year_published">発行年</Label>
                <Input
                  id="year_published"
                  type="number"
                  {...register('year_published', { valueAsNumber: true })}
                  placeholder="2024"
                  disabled={loading || isSubmitting}
                />
                {errors.year_published && (
                  <p className="text-sm text-red-600">{errors.year_published.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_players">最小人数 *</Label>
                <Input
                  id="min_players"
                  type="number"
                  {...register('min_players', { valueAsNumber: true })}
                  placeholder="2"
                  disabled={loading || isSubmitting}
                />
                {errors.min_players && (
                  <p className="text-sm text-red-600">{errors.min_players.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_players">最大人数 *</Label>
                <Input
                  id="max_players"
                  type="number"
                  {...register('max_players', { valueAsNumber: true })}
                  placeholder="4"
                  disabled={loading || isSubmitting}
                />
                {errors.max_players && (
                  <p className="text-sm text-red-600">{errors.max_players.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_playing_time">最小プレイ時間 (分)</Label>
                <Input
                  id="min_playing_time"
                  type="number"
                  {...register('min_playing_time', { valueAsNumber: true })}
                  placeholder="30"
                  disabled={loading || isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_playing_time">最大プレイ時間 (分)</Label>
                <Input
                  id="max_playing_time"
                  type="number"
                  {...register('max_playing_time', { valueAsNumber: true })}
                  placeholder="60"
                  disabled={loading || isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* デザイナー・パブリッシャー */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">制作情報</h3>
            
            <div className="space-y-4">
              <div>
                <Label>ゲームデザイナー</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={designerInput}
                    onChange={(e) => setDesignerInput(e.target.value)}
                    placeholder="デザイナー名を入力"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDesigner())}
                  />
                  <Button type="button" onClick={addDesigner} variant="outline" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {watchedValues.designers && watchedValues.designers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {watchedValues.designers.map((designer, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {designer}
                        <button
                          type="button"
                          onClick={() => removeDesigner(index)}
                          className="hover:text-blue-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>出版社</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={publisherInput}
                    onChange={(e) => setPublisherInput(e.target.value)}
                    placeholder="出版社名を入力"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPublisher())}
                  />
                  <Button type="button" onClick={addPublisher} variant="outline" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {watchedValues.publishers && watchedValues.publishers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {watchedValues.publishers.map((publisher, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {publisher}
                        <button
                          type="button"
                          onClick={() => removePublisher(index)}
                          className="hover:text-green-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* メカニクス・カテゴリー */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">ゲーム特徴</h3>
            
            <div className="space-y-4">
              <div>
                <Label>メカニクス</Label>
                <Controller
                  control={control}
                  name="mechanics"
                  render={({ field }) => (
                    <ToggleGroup
                      type="multiple"
                      value={field.value}
                      onValueChange={field.onChange}
                      className="justify-start flex-wrap mt-2"
                    >
                      {MECHANICS.map((mechanic) => (
                        <ToggleGroupItem 
                          key={mechanic} 
                          value={mechanic} 
                          variant="outline"
                          className="text-sm"
                        >
                          {mechanic}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  )}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  このゲームに使われているメカニクスを選択してください（複数選択可）
                </p>
              </div>

              <div>
                <Label>カテゴリー</Label>
                <Controller
                  control={control}
                  name="categories"
                  render={({ field }) => (
                    <ToggleGroup
                      type="multiple"
                      value={field.value}
                      onValueChange={field.onChange}
                      className="justify-start flex-wrap mt-2"
                    >
                      {CATEGORIES.map((category) => (
                        <ToggleGroupItem 
                          key={category} 
                          value={category} 
                          variant="outline"
                          className="text-sm"
                        >
                          {category}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  )}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  このゲームに当てはまるカテゴリーを選択してください（複数選択可）
                </p>
              </div>
            </div>
          </div>

          {/* 登録前確認 */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-800 mb-2">⚠️ 登録前の確認</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• BGGで検索してもこのゲームが見つからないことを確認しましたか？</li>
              <li>• ゲーム情報は正確で、他のユーザーの参考になる内容ですか？</li>
              <li>• 著作権や商標権を侵害する内容は含まれていませんか？</li>
            </ul>
          </div>

          {/* 送信ボタン */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading || isSubmitting}
              >
                キャンセル
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={loading || isSubmitting}
              className="flex items-center gap-2 sm:ml-auto"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              ゲームを登録
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
