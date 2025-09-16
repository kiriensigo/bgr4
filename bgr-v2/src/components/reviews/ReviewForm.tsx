'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Star, Plus, X, Save, Eye, EyeOff, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const reviewFormSchema = z.object({
  title: z.string().min(5, 'タイトルは5文字以上で入力してください').max(100, 'タイトルは100文字以下で入力してください'),
  content: z.string().min(50, 'レビュー内容は50文字以上で入力してください').max(5000, 'レビュー内容は5000文字以下で入力してください'),
  rating: z.number().min(1, '評価は1以上で選択してください').max(10, '評価は10以下で選択してください'),
  pros: z.array(z.string().min(1).max(200)),
  cons: z.array(z.string().min(1).max(200)),
  is_published: z.boolean()
})

type ReviewFormData = z.infer<typeof reviewFormSchema>

export interface ReviewFormProps {
  gameId?: number
  initialData?: Partial<ReviewFormData> & { id?: number }
  onSubmit: (data: ReviewFormData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  mode?: 'create' | 'edit'
  gameName?: string
}

export function ReviewForm({ 
  gameId: _gameId, 
  initialData, 
  onSubmit, 
  onCancel, 
  loading = false, 
  mode = 'create',
  gameName 
}: ReviewFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isDraft, setIsDraft] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      content: initialData?.content || '',
      rating: initialData?.rating || 1,
      pros: initialData?.pros || [],
      cons: initialData?.cons || [],
      is_published: initialData?.is_published ?? true
    }
  })

  const {
    fields: prosFields,
    append: appendPro,
    remove: removePro
  } = useFieldArray({
    control,
    name: 'pros'
  } as any)

  const {
    fields: consFields,
    append: appendCon,
    remove: removeCon
  } = useFieldArray({
    control,
    name: 'cons'
  } as any)

  const currentRating = watch('rating')
  const currentContent = watch('content')
  const isPublished = watch('is_published')

  useEffect(() => {
    setIsDraft(!isPublished)
  }, [isPublished])

  const renderStars = (rating: number, onStarClick?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(10)].map((_, i) => (
          <Star
            key={i}
            className={`w-6 h-6 cursor-pointer transition-colors ${
              i < rating 
                ? 'fill-yellow-400 text-yellow-400 hover:fill-yellow-500 hover:text-yellow-500' 
                : 'text-gray-300 hover:text-yellow-300'
            }`}
            onClick={() => onStarClick && onStarClick(i + 1)}
          />
        ))}
        <span className="ml-2 text-lg font-semibold">{rating}/10</span>
      </div>
    )
  }

  const handleFormSubmit = async (data: ReviewFormData) => {
    try {
      setSubmitError(null)
      await onSubmit(data)
    } catch (error) {
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : 'レビューの保存に失敗しました'
      )
    }
  }

  const handleSaveAsDraft = () => {
    setValue('is_published', false)
    handleSubmit(handleFormSubmit)()
  }


  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === 'create' ? '新しいレビューを書く' : 'レビューを編集'}
          {gameName && (
            <Badge variant="outline" className="ml-2">
              {gameName}
            </Badge>
          )}
        </CardTitle>
        {mode === 'create' && (
          <p className="text-sm text-muted-foreground">
            あなたの体験を詳しく書いて、他のプレイヤーにゲームの魅力を伝えましょう。
          </p>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* タイトル */}
          <div className="space-y-2">
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="レビューのタイトルを入力してください"
              disabled={loading || isSubmitting}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* 評価 */}
          <div className="space-y-2">
            <Label>評価 *</Label>
            <div className="space-y-2">
              {renderStars(currentRating, (rating) => setValue('rating', rating))}
              <p className="text-sm text-muted-foreground">
                クリックして評価を選択してください（1: 最低 〜 10: 最高）
              </p>
            </div>
            {errors.rating && (
              <p className="text-sm text-red-600">{errors.rating.message}</p>
            )}
          </div>

          {/* レビュー内容 */}
          <div className="space-y-2">
            <Label htmlFor="content">レビュー内容 *</Label>
            <Textarea
              id="content"
              {...register('content')}
              placeholder="ゲームの感想、プレイ感、おすすめポイントなどを詳しく書いてください..."
              rows={8}
              disabled={loading || isSubmitting}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{currentContent.length}/5000文字</span>
              {currentContent.length >= 50 ? (
                <span className="text-green-600">✓ 十分な長さです</span>
              ) : (
                <span className="text-amber-600">あと{50 - currentContent.length}文字必要です</span>
              )}
            </div>
            {errors.content && (
              <p className="text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          {/* 良い点 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-green-600" />
              <Label>良い点（オプション）</Label>
            </div>
            <div className="space-y-2">
              {prosFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    {...register(`pros.${index}` as const)}
                    placeholder="このゲームの良い点を入力..."
                    disabled={loading || isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removePro(index)}
                    disabled={loading || isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendPro('')}
                disabled={loading || isSubmitting || prosFields.length >= 10}
              >
                <Plus className="w-4 h-4 mr-2" />
                良い点を追加
              </Button>
            </div>
          </div>

          {/* 気になる点 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ThumbsDown className="w-4 h-4 text-red-600" />
              <Label>気になる点（オプション）</Label>
            </div>
            <div className="space-y-2">
              {consFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    {...register(`cons.${index}` as const)}
                    placeholder="このゲームの気になる点を入力..."
                    disabled={loading || isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeCon(index)}
                    disabled={loading || isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendCon('')}
                disabled={loading || isSubmitting || consFields.length >= 10}
              >
                <Plus className="w-4 h-4 mr-2" />
                気になる点を追加
              </Button>
            </div>
          </div>

          {/* 公開設定 */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Label className="flex items-center gap-2">
              {isDraft ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              公開設定
            </Label>
            <Select
              value={isPublished ? 'published' : 'draft'}
              onValueChange={(value) => {
                const published = value === 'published'
                setValue('is_published', published)
                setIsDraft(!published)
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">すぐに公開</SelectItem>
                <SelectItem value="draft">下書きとして保存</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ボタン */}
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
            
            <div className="flex gap-2 sm:ml-auto">
              {mode === 'create' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveAsDraft}
                  disabled={loading || isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  下書き保存
                </Button>
              )}
              
              <Button
                type="submit"
                disabled={loading || isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {isPublished ? '公開する' : '下書き保存'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}