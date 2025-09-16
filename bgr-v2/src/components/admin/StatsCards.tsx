'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Gamepad2, 
  MessageSquare, 
  TrendingUp,
  Star
} from 'lucide-react'
interface AdminStats {
  users: {
    total: number
    admins: number
    recent: number
  }
  games: {
    total: number
  }
  reviews: {
    total: number
    recent: number
    averageRating: number
  }
}

interface StatsCardsProps {
  stats: AdminStats | null
  loading?: boolean
}

export function StatsCards({ stats, loading = false }: StatsCardsProps) {
  if (loading || !stats) {
    return <StatsCardsSkeleton />
  }

  const cards = [
    {
      title: '総ユーザー数',
      value: stats.users.total.toLocaleString(),
      icon: Users,
      description: `管理者: ${stats.users.admins}名`,
      trend: `+${stats.users.recent} 今週`,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      title: '総ゲーム数',
      value: stats.games.total.toLocaleString(),
      icon: Gamepad2,
      description: 'データベース登録済み',
      color: 'text-green-600 bg-green-50'
    },
    {
      title: '総レビュー数',
      value: stats.reviews.total.toLocaleString(),
      icon: MessageSquare,
      description: '公開済みレビュー',
      trend: `+${stats.reviews.recent} 今週`,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      title: '平均評価',
      value: stats.reviews.averageRating.toFixed(1),
      icon: Star,
      description: '全レビューの平均',
      color: 'text-yellow-600 bg-yellow-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-900">
                {card.value}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {card.description}
                </p>
                {card.trend && (
                  <div className="flex items-center text-xs text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {card.trend}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="flex items-center justify-between">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}