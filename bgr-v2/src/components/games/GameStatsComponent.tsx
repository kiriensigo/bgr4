'use client'

import { useGameStats, GameStatItem } from '@/hooks/useGameStats'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, BarChart3 } from 'lucide-react'
import StatisticItem from './StatisticItem'

interface GameStatsComponentProps {
  gameId: number
}


function StatisticsList({ items, emptyMessage }: { items: GameStatItem[], emptyMessage: string }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <StatisticItem 
          key={`${item.name}-${index}`}
          name={item.name}
          percentage={item.percentage}
          reviewCount={item.reviewVotes}
          bggWeight={item.bggVotes}
          priority={item.displayPriority}
          showDetails={false}
        />
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-8 w-20 rounded-full" />
      ))}
    </div>
  )
}

export default function GameStatsComponent({ gameId }: GameStatsComponentProps) {
  const { stats, isLoading, error, refetch } = useGameStats(gameId)

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            統計データの取得に失敗しました
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            再試行
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          統計
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* プレイ人数統計 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">おすすめのプレイ人数</h3>
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <StatisticsList 
                items={stats?.playerCounts || []} 
                emptyMessage="データなし"
              />
            )}
          </div>

          {/* メカニクス統計 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">メカニクス</h3>
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <StatisticsList 
                items={stats?.mechanics || []} 
                emptyMessage="データなし"
              />
            )}
          </div>

          {/* カテゴリー統計 */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">カテゴリー</h3>
            {isLoading ? (
              <LoadingSkeleton />
            ) : (
              <StatisticsList 
                items={stats?.categories || []} 
                emptyMessage="データなし"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}