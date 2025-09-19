'use client'

import { useState, useEffect } from 'react'
import '@/styles/slider.css'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
// import { CardHeader } from '@/components/ui/card'
// import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
// import { Slider } from '@/components/ui/slider'
import { Star, Save, Loader2, Info, Users, Dice6, Timer, MessageSquare } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'

import {
  MECHANICS,
  CATEGORIES,
  PLAYER_COUNT_OPTIONS,
  // COMPLEXITY_LEVELS,
  // LUCK_LEVELS,
  // INTERACTION_LEVELS,
  // DOWNTIME_LEVELS,
  // getComplexityDescription,
  // getLuckDescription,
  // getInteractionDescription,
  // getDowntimeDescription,
  // getComplexityColor
} from '@/lib/game-constants'
import { type ReviewFormData } from '@/types/enhanced-review'
import { createFiveAxisReview, updateFiveAxisReview } from '@/app/actions/review-actions'

const enhancedReviewSchema = z.object({
  overall_score: z.number().min(5).max(9.9),
  complexity_score: z.number().min(1).max(5),
  luck_factor: z.number().min(1).max(5),
  interaction_score: z.number().min(1).max(5),
  downtime_score: z.number().min(1).max(5),
  recommended_players: z.array(z.string()).optional(),
  mechanics: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  content: z.string().max(150, 'コメントは150文字以内で入力してください').optional(),
  is_published: z.boolean().default(true)
})

export interface EnhancedReviewFormProps {
  gameId: number
  initialData?: Partial<ReviewFormData> & { id?: number }
  loading?: boolean
  mode?: 'create' | 'edit'
  gameName?: string
}

export function EnhancedReviewForm({ 
  gameId, 
  initialData, 
  loading = false, 
  mode = 'create',
  gameName 
}: EnhancedReviewFormProps) {
  const { toast } = useToast()
  const router = useRouter()

  // デバッグ情報
  console.log('🎯 EnhancedReviewForm Debug:', {
    gameId,
    gameName,
    mode,
    hasInitialData: !!initialData,
    loading
  })
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    // setValue,
    formState: { errors, isSubmitting }
  } = useForm<ReviewFormData>({
    resolver: zodResolver(enhancedReviewSchema) as any,
    defaultValues: ({
      overall_score: initialData?.overall_score || 7.5,
      complexity_score: initialData?.complexity_score || 3,
      luck_factor: initialData?.luck_factor || 3,
      interaction_score: initialData?.interaction_score || 3,
      downtime_score: initialData?.downtime_score || 3,
      recommended_players: initialData?.recommended_players || [],
      mechanics: initialData?.mechanics || [],
      categories: initialData?.categories || [],
      content: initialData?.content || '',
      is_published: initialData?.is_published ?? true
    } as any)
  })

  const watchedValues = watch()

  // ドラッグ可能なカスタムスライダー
  const RatingSlider = ({ 
    label, 
    value, 
    onChange, 
    min = 1, 
    max = 5, 
    step = 1,
    icon,
    color = "#3b82f6",
    // bgColor = "bg-blue-500"
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    icon?: React.ReactNode;
    color?: string;
    bgColor?: string;
  }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragValue, setDragValue] = useState<number | null>(null);
    // const pointerIdRef = useRef<number | null>(null);
    // const sliderRef = useRef<HTMLDivElement>(null);

    // 位置から値を計算
    // const calculateValueFromPosition = useCallback((clientX: number) => {
    //   if (!sliderRef.current) return value;
    //   const rect = sliderRef.current.getBoundingClientRect();
    //   const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    //   const rawValue = min + (max - min) * percentage;
    //   return Math.round(rawValue / step) * step;
    // }, [min, max, step, value]);

    // (unused handlers removed)

    // ドラッグ中のイベントリスナー管理
    useEffect(() => { return () => {}; }, []);

    // ドラッグ開始（マウス）
    // const handleMouseDown = (e: React.MouseEvent) => {}

    // ドラッグ開始（タッチ）
    // const handleTouchStart = (e: React.TouchEvent) => {}

    // Pointer events (unified for mouse/touch/pen)
    // const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {}

    // const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {}

    // const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {}

    const effectiveValue = dragValue ?? value;
    const percentage = ((effectiveValue - min) / (max - min)) * 100;

    const snapToStep = (v: number) => {
      const s = step ?? 1;
      const snapped = Math.round((v - min) / s) * s + min;
      const clamped = Math.max(min, Math.min(max, snapped));
      return Number(clamped.toFixed(3));
    };

    // 表示はドラッグ中も刻みに合わせてスナップ（数値のみ）
    const displayValue = snapToStep(effectiveValue);
    const decimals = (() => {
      const s = step ?? 1;
      const str = String(s);
      const idx = str.indexOf('.');
      return idx >= 0 ? (str.length - idx - 1) : 0;
    })();

    // エラーハンドリング
    try {
      // no-op: slider ref checks removed
    } catch (error) {
      console.error('🚨 RatingSlider Error:', error)
      return (
        <div className="p-4 border border-red-300 rounded bg-red-50">
          <span className="text-red-800">スライダーエラー: {label}</span>
        </div>
      )
    }

    return (
      <div className="space-y-4" data-testid={`slider-${label}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 font-semibold text-gray-800">
            <span className={`p-2 rounded-full bg-blue-100`}>
              {icon}
            </span>
            <span className="text-lg">{label}</span>
          </div>
          <div 
            className="text-white px-5 py-3 rounded-2xl text-3xl font-bold min-w-[90px] text-center shadow-xl border-3 border-white bg-blue-500 transform transition-transform duration-150"
            style={{ 
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
            }}
          >
            {displayValue.toFixed(decimals)}
          </div>
        </div>
        
        <div className="relative px-4">
          <div className="flex justify-between text-sm text-gray-600 mb-3 font-medium">
            <span className="px-2 py-1 bg-gray-100 rounded-lg">{min}</span>
            <span className="px-2 py-1 bg-gray-100 rounded-lg">{max}</span>
          </div>
          
          {/* カスタムスライダートラック */}
          <div 
            // ref={sliderRef}
            className="relative h-6 cursor-pointer select-none mx-3"
            style={{ userSelect: 'none', touchAction: 'none' }}
          >
            <input
              type="range"
              min={min}
              max={max}
              step="any"
              value={effectiveValue}
              aria-label={label}
              onChange={(e) => {
                const el = e.target as HTMLInputElement;
                setIsDragging(true);
                setDragValue(el.valueAsNumber);
                requestAnimationFrame(() => el.focus());
              }}
              onInput={(e) => {
                const el = e.target as HTMLInputElement;
                setIsDragging(true);
                setDragValue(el.valueAsNumber);
                requestAnimationFrame(() => el.focus());
              }}
              onMouseDown={(e) => {
                (e.currentTarget as HTMLInputElement).focus();
                setIsDragging(true);
              }}
              onPointerDown={(e) => {
                (e.currentTarget as HTMLInputElement).focus();
                setIsDragging(true);
              }}
              onMouseUp={(e) => {
                const el = e.currentTarget as HTMLInputElement;
                const snapped = snapToStep(el.valueAsNumber);
                setDragValue(null);
                setIsDragging(false);
                onChange(snapped);
              }}
              onPointerUp={(e) => {
                const el = e.currentTarget as HTMLInputElement;
                const snapped = snapToStep(el.valueAsNumber);
                setDragValue(null);
                setIsDragging(false);
                onChange(snapped);
              }}
              onBlur={(e) => {
                const el = e.currentTarget as HTMLInputElement;
                const snapped = snapToStep(el.valueAsNumber);
                setDragValue(null);
                setIsDragging(false);
                onChange(snapped);
              }}
              onKeyDown={(e) => {
                // 矢印キーで step ごとに移動（ネイティブ挙動よりも一貫性を優先）
                const el = e.currentTarget as HTMLInputElement;
                const s = step ?? 1;
                let v = el.valueAsNumber;
                if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  v = v - s;
                } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  v = v + s;
                } else {
                  return;
                }
                const snapped = snapToStep(v);
                setDragValue(snapped);
                onChange(snapped);
                requestAnimationFrame(() => el.focus());
              }}
              className="absolute -top-2 left-0 w-full h-10 opacity-0 z-20 cursor-pointer"
            />
            {/* スライダートラック */}
            <div 
              className="absolute top-2 w-full h-2 rounded-full transition-none"
              style={{
                background: `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
                pointerEvents: 'none'
              }}
            />
            
            {/* スライダーハンドル（つまみ） */}
            <div 
              className={`absolute top-0 w-6 h-6 rounded-full border-3 border-white shadow-lg transition-transform duration-100 ${
                isDragging ? 'scale-125 cursor-grabbing' : 'hover:scale-110 cursor-grab'
              }`}
              style={{ 
                left: `calc(${percentage}% - 12px)`,
                background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                boxShadow: isDragging ? `0 4px 20px ${color}40` : `0 2px 8px rgba(0,0,0,0.2)`,
                pointerEvents: 'none'
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  // ボタングループコンポーネント
  const ButtonGroup = ({ 
    title, 
    options, 
    selected, 
    onChange, 
    multiple = false 
  }: {
    title: string;
    options: Array<{ value: string; label: string }>;
    selected: string[];
    onChange: (values: string[]) => void;
    multiple?: boolean;
  }) => {
    const handleSelect = (value: string) => {
      if (multiple) {
        const newSelected = selected.includes(value)
          ? selected.filter(v => v !== value)
          : [...selected, value];
        onChange(newSelected);
      } else {
        onChange(selected.includes(value) ? [] : [value]);
      }
    };

    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-700 text-lg">{title}</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`px-3 py-2 rounded-md border transition-all duration-200 font-medium text-xs text-center leading-tight min-h-[2.5rem] flex items-center justify-center ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 shadow-sm'
                }`}
              >
                <span className="truncate">{option.label}</span>
              </button>
            )
          })}
        </div>
        {selected.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 font-medium">選択中:</span>
            {selected.map((value) => {
              const option = options.find(opt => opt.value === value);
              return option ? (
                <span key={value} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  {option.label}
                  <button
                    type="button"
                    onClick={() => handleSelect(value)}
                    className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-200 hover:bg-blue-300 transition-colors"
                  >
                    <span className="text-xs">×</span>
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>
    )
  }

  const handleFormSubmit = async (data: ReviewFormData) => {
    try {
      console.log('🎯 フォーム送信開始:', data)
      
      // クライアント側で現在のセッションを取得
      const supabase = getSupabaseClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      console.log('🔐 セッション確認:', { session: !!session, error: sessionError })
      
      if (sessionError || !session?.access_token) {
        throw new Error('認証セッションが見つかりません。再ログインしてください。')
      }
      
      // アクセストークンをServer Actionに渡すためのformData
      const formData = {
        gameId: gameId,
        title: `${gameName}のレビュー`,
        content: data.content || '',
        overallScore: data.overall_score,
        complexityScore: data.complexity_score,
        luckFactor: data.luck_factor,
        interactionScore: data.interaction_score,
        downtimeScore: data.downtime_score,
        recommendedPlayers: data.recommended_players?.map(p => parseInt(p)) || [],
        mechanics: data.mechanics || [],
        categories: data.categories || [],
        pros: '',
        cons: '',
        isPublished: data.is_published,
        // 認証トークンを明示的に渡す
        accessToken: session.access_token
      };
      
      console.log('📤 サーバーアクションに送信するデータ:', formData)
      
      const result = mode === 'create' 
        ? await createFiveAxisReview(formData)
        : await updateFiveAxisReview(initialData?.id!, formData)

      console.log('📥 サーバーアクションの結果:', result)

      if (!result.success) {
        throw new Error(result.message)
      }

      // 投稿成功時の処理
      toast({
        title: '投稿完了',
        description: 'レビューを投稿しました！',
        variant: 'default'
      })
      console.log('✅ レビュー投稿成功!')
      
      // 3秒後にゲームページにリダイレクト
      setTimeout(() => {
        router.push(`/games/${gameId}`)
      }, 2000)
    } catch (error) {
      console.error('❌ フォーム送信エラー:', error)
      toast({
        title: 'エラー',
        description: error instanceof Error 
          ? error.message 
          : 'レビューの保存に失敗しました',
        variant: 'destructive'
      })
    }
  }

  const playerCountOptions = PLAYER_COUNT_OPTIONS.map(count => ({
    value: count,
    label: count === "7" ? "7人以上" : `${count}人`
  }));

  const tagOptions = MECHANICS.map(mechanic => ({
    value: mechanic,
    label: mechanic
  }));

  const categoryOptions = CATEGORIES.map(category => ({
    value: category,
    label: category
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* ゲーム情報カード */}
        <Card className="mb-6 shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">レビューを書く</h1>
            </div>
            {gameName && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-base px-3 py-1">
                  {gameName}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* メインフォーム */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">

              {/* 5軸評価スライダー */}
              <div className="space-y-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">評価</h2>
                
                {/* 総合得点 (5-10, デフォルト7.5) */}
                <Controller
                  control={control}
                  name="overall_score"
                  render={({ field }) => (
                    <RatingSlider
                      label="総合得点"
                      value={field.value}
                      onChange={field.onChange}
                      min={5}
                      max={10}
                      step={0.5}
                      icon={<Star className="w-5 h-5" />}
                      color="#f59e0b"
                      bgColor="bg-yellow-500"
                    />
                  )}
                />

                {/* ルール複雑さ (1-5) */}
                <Controller
                  control={control}
                  name="complexity_score"
                  render={({ field }) => (
                    <RatingSlider
                      label="ルール複雑さ"
                      value={field.value}
                      onChange={field.onChange}
                      icon={<Info className="w-5 h-5" />}
                      color="#3b82f6"
                      bgColor="bg-blue-500"
                    />
                  )}
                />

                {/* 運要素 (1-5) */}
                <Controller
                  control={control}
                  name="luck_factor"
                  render={({ field }) => (
                    <RatingSlider
                      label="運要素"
                      value={field.value}
                      onChange={field.onChange}
                      icon={<Dice6 className="w-5 h-5" />}
                      color="#10b981"
                      bgColor="bg-green-500"
                    />
                  )}
                />

                {/* インタラクション (1-5) */}
                <Controller
                  control={control}
                  name="interaction_score"
                  render={({ field }) => (
                    <RatingSlider
                      label="インタラクション"
                      value={field.value}
                      onChange={field.onChange}
                      icon={<Users className="w-5 h-5" />}
                      color="#8b5cf6"
                      bgColor="bg-purple-500"
                    />
                  )}
                />

                {/* ダウンタイム (1-5) */}
                <Controller
                  control={control}
                  name="downtime_score"
                  render={({ field }) => (
                    <RatingSlider
                      label="ダウンタイム"
                      value={field.value}
                      onChange={field.onChange}
                      icon={<Timer className="w-5 h-5" />}
                      color="#ef4444"
                      bgColor="bg-red-500"
                    />
                  )}
                />
              </div>

              {/* プレイ人数選択 */}
              <div className="space-y-4">
                <Controller
                  control={control}
                  name="recommended_players"
                  render={({ field }) => (
                    <ButtonGroup
                      title="おすすめプレイ人数"
                      options={playerCountOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      multiple
                    />
                  )}
                />
                {errors.recommended_players && (
                  <p className="text-sm text-red-600">{errors.recommended_players.message}</p>
                )}
              </div>

              {/* タグ選択 */}
              <div className="space-y-4">
                <Controller
                  control={control}
                  name="mechanics"
                  render={({ field }) => (
                    <ButtonGroup
                      title="メカニクスタグ"
                      options={tagOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      multiple
                    />
                  )}
                />
              </div>

              {/* カテゴリー選択 */}
              <div className="space-y-4">
                <Controller
                  control={control}
                  name="categories"
                  render={({ field }) => (
                    <ButtonGroup
                      title="カテゴリー"
                      options={categoryOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      multiple
                    />
                  )}
                />
              </div>

              {/* コメント入力 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-700">コメント（任意）</h3>
                </div>
                <div className="space-y-2">
                  <Textarea
                    {...register('content')}
                    placeholder="このゲームについてのコメント（任意）"
                    rows={4}
                    disabled={loading || isSubmitting}
                    className="resize-none border-2 border-gray-200 focus:border-primary rounded-lg"
                  />
                  <div className="flex justify-between text-sm">
                    <span className={watchedValues.content && watchedValues.content.length > 150 ? 'text-red-600' : 'text-gray-500'}>
                      {watchedValues.content?.length || 0}/150文字
                    </span>
                  </div>
                  {errors.content && (
                    <p className="text-sm text-red-600">{errors.content.message}</p>
                  )}
                </div>
              </div>

              {/* 投稿ボタン */}
              <div className="pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={loading || isSubmitting}
                  className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      投稿中...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="w-5 h-5" />
                      投稿する
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
