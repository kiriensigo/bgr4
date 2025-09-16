'use client'

import { useState } from 'react'
import { Star, TrendingUp, Users, Info, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useWeightedScore } from '@/hooks/useWeightedScore'
import { cn } from '@/lib/utils'

interface WeightedScoreDisplayProps {
  gameId: number
  className?: string
  showUpdateButton?: boolean
  showDetails?: boolean
}

export function WeightedScoreDisplay({ 
  gameId, 
  className,
  showUpdateButton = false,
  showDetails = true
}: WeightedScoreDisplayProps) {
  const { scoreData, loading, updateScore } = useWeightedScore(gameId)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)

  const handleUpdateScore = async () => {
    setIsUpdating(true)
    await updateScore()
    setIsUpdating(false)
  }

  const renderStars = (score: number) => {
    const fullStars = Math.floor(score)
    const hasHalfStar = score % 1 >= 0.5
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(10)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'w-4 h-4',
              i < fullStars 
                ? 'fill-yellow-400 text-yellow-400'
                : i === fullStars && hasHalfStar
                ? 'fill-yellow-200 text-yellow-400'
                : 'text-gray-300'
            )}
          />
        ))}
        <span className="ml-2 font-semibold">{score.toFixed(1)}/10</span>
      </div>
    )
  }

  const getConfidenceColor = (level: number) => {
    if (level >= 0.8) return 'text-green-600'
    if (level >= 0.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceLabel = (level: number) => {
    if (level >= 0.8) return '高信頼度'
    if (level >= 0.5) return '中信頼度'
    return '低信頼度'
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground ml-2">スコア計算中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!scoreData) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>重み付きスコア</span>
            {scoreData.methodology === 'insufficient_data' && (
              <Badge variant="outline" className="text-xs">
                データ不足
              </Badge>
            )}
          </div>
          {showUpdateButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpdateScore}
              disabled={isUpdating}
              className="ml-2"
            >
              {isUpdating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              更新
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* メインスコア表示 */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">重み付きスコア</span>
              <span className={cn(
                'text-xs font-medium',
                getConfidenceColor(scoreData.confidence_level)
              )}>
                {getConfidenceLabel(scoreData.confidence_level)}
              </span>
            </div>
            {renderStars(scoreData.weighted_score)}
          </div>

          {scoreData.methodology !== 'insufficient_data' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">単純平均との比較</span>
                <span className="text-xs text-muted-foreground">
                  {scoreData.weighted_score > scoreData.simple_average ? '+' : ''}
                  {(scoreData.weighted_score - scoreData.simple_average).toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                単純平均: {scoreData.simple_average.toFixed(1)}/10
              </div>
            </div>
          )}
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{scoreData.total_reviews}</div>
              <div className="text-xs text-muted-foreground">レビュー数</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">
                {Math.round(scoreData.confidence_level * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">信頼度</div>
            </div>
          </div>
        </div>

        {/* 信頼度プログレスバー */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>信頼度レベル</span>
            <span>{Math.round(scoreData.confidence_level * 100)}%</span>
          </div>
          <Progress 
            value={scoreData.confidence_level * 100} 
            className="h-2"
          />
        </div>

        {/* 詳細表示 */}
        {showDetails && scoreData.methodology !== 'insufficient_data' && scoreData.score_breakdown && (
          <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between p-2">
                <span>スコア詳細を表示</span>
                {showBreakdown ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3 border-t">
              <div className="text-sm">
                <div className="font-medium mb-2">重み付け方法</div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>• ユーザー信頼度（レビュー履歴・管理者権限）</div>
                  <div>• レビュー品質（文字数・詳細度）</div>
                  <div>• コミュニティ評価（いいね数）</div>
                </div>
              </div>

              {scoreData.score_breakdown.review_weights.length > 0 && (
                <div className="text-sm">
                  <div className="font-medium mb-2">
                    レビュー重み付け例（最初の3件）
                  </div>
                  <div className="space-y-2">
                    {scoreData.score_breakdown.review_weights.slice(0, 3).map((review, index) => (
                      <div key={review.review_id} className="text-xs border rounded p-2">
                        <div className="flex justify-between mb-1">
                          <span>レビュー #{index + 1}</span>
                          <span className="font-medium">重み: {review.weight}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>評価: {review.rating}/10</span>
                          <span>いいね: {review.factors.likes_count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {scoreData.methodology === 'insufficient_data' && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <Info className="w-5 h-5 mx-auto mb-2" />
            <div>信頼できるスコア計算には</div>
            <div>より多くのレビューが必要です</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}