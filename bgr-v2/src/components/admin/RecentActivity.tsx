'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  Users, 
  Clock, 
  ExternalLink,
  User,
  Star
} from 'lucide-react'
import Link from 'next/link'

interface RecentActivityProps {
  type: 'reviews' | 'users'
}

interface ActivityItem {
  id: string
  title: string
  subtitle: string
  timestamp: string
  status?: string
  rating?: number
  href?: string
}

export function RecentActivity({ type }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [type])

  const loadActivities = async () => {
    try {
      if (type === 'reviews') {
        // レビューデータを取得
        const response = await fetch('/api/seed?type=recent-reviews')
        const data = await response.json()
        
        if (data.success) {
          const reviewActivities = data.data.slice(0, 5).map((review: any) => ({
            id: review.id,
            title: review.title,
            subtitle: review.game?.name || review.game?.japanese_name || 'Unknown Game',
            timestamp: review.created_at,
            status: review.is_published ? 'published' : 'pending',
            rating: review.overall_score || review.rating,
            href: `/reviews/${review.id}`
          }))
          setActivities(reviewActivities)
        }
      } else {
        // ユーザーアクティビティはモックデータ
        setActivities([
          {
            id: '1',
            title: 'ユーザー登録',
            subtitle: 'test@example.com',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          },
          {
            id: '2',
            title: 'プロフィール更新',
            subtitle: 'ボードゲーマー太郎',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            status: 'updated'
          },
          {
            id: '3',
            title: 'ログイン',
            subtitle: 'admin@bgr.com',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: 'login'
          }
        ])
      }
    } catch (error) {
      console.error('Failed to load activities:', error)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="bg-green-100 text-green-800">公開済み</Badge>
      case 'pending':
        return <Badge variant="secondary">承認待ち</Badge>
      case 'active':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">アクティブ</Badge>
      case 'updated':
        return <Badge variant="outline">更新済み</Badge>
      case 'login':
        return <Badge variant="outline">ログイン</Badge>
      default:
        return null
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}秒前`
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分前`
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}時間前`
    } else {
      return `${Math.floor(diffInSeconds / 86400)}日前`
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2">
          {type === 'reviews' ? (
            <>
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <span>最新レビュー</span>
            </>
          ) : (
            <>
              <Users className="h-5 w-5 text-blue-600" />
              <span>ユーザーアクティビティ</span>
            </>
          )}
        </CardTitle>
        
        <Button variant="ghost" size="sm" asChild>
          <Link href={type === 'reviews' ? '/admin/reviews' : '/admin/users'}>
            すべて表示
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-sm">データがありません</div>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {type === 'reviews' ? (
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                  ) : (
                    <User className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-500 truncate">
                          {activity.subtitle}
                        </p>
                        {activity.rating && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-gray-600">
                              {activity.rating}/10
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {activity.status && (
                      <div className="ml-2 flex-shrink-0">
                        {getStatusBadge(activity.status)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                    
                    {activity.href && (
                      <Button variant="ghost" size="sm" className="h-6 px-2" asChild>
                        <Link href={activity.href} className="text-xs">
                          詳細
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}