'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAuth } from '@/hooks/useAuth'
import { useUser } from '@/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  MessageSquare,
  Star,
  Clock,
  User,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

// モックレビューデータ
const mockReviewsData = {
  reviews: [
    {
      id: '1',
      title: '素晴らしいストラテジーゲーム',
      content: 'カタンは初心者から上級者まで楽しめる素晴らしいゲームです。運と戦略のバランスが絶妙で、何度プレイしても飽きません...',
      overall_score: 9,
      is_published: true,
      created_at: '2024-03-01T10:00:00Z',
      updated_at: '2024-03-01T10:00:00Z',
      user: {
        id: 'user-1',
        username: 'gamer123',
        full_name: 'ボードゲーマー太郎',
        email: 'gamer@example.com'
      },
      game: {
        id: '1',
        name: 'Catan',
        japanese_name: 'カタンの開拓者たち'
      }
    },
    {
      id: '2',
      title: '美しいデザインのゲーム',
      content: 'ウイングスパンは鳥をテーマにした美しいゲームです。アートワークが素晴らしく、ゲームプレイも洗練されています...',
      overall_score: 8,
      is_published: false,
      created_at: '2024-03-02T15:30:00Z',
      updated_at: '2024-03-02T15:30:00Z',
      user: {
        id: 'user-2',
        username: 'bird_lover',
        full_name: '鳥好きゲーマー',
        email: 'bird@example.com'
      },
      game: {
        id: '2',
        name: 'Wingspan',
        japanese_name: 'ウイングスパン'
      }
    },
    {
      id: '3',
      title: 'タイル配置の傑作',
      content: 'アズールは簡単なルールなのに奥が深いゲームです。美しいタイルと戦略性が魅力的...',
      overall_score: 7,
      is_published: true,
      created_at: '2024-02-28T20:00:00Z',
      updated_at: '2024-02-28T20:00:00Z',
      user: {
        id: 'user-3',
        username: 'tile_master',
        full_name: 'タイルマスター',
        email: 'tile@example.com'
      },
      game: {
        id: '3',
        name: 'Azul',
        japanese_name: 'アズール'
      }
    }
  ],
  total: 3,
  page: 1,
  totalPages: 1
}

function AdminReviewsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useUser()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (!user) {
        router.push('/login?redirect=/admin/reviews')
        return
      }
      
      if (!profile?.is_admin) {
        router.push('/?error=unauthorized')
        return
      }
      
      setLoading(false)
    }
  }, [user, profile, authLoading, profileLoading, router])

  if (loading || authLoading || profileLoading) {
    return <AdminReviewsPageSkeleton />
  }

  const filteredReviews = mockReviewsData.reviews.filter(review => {
    const matchesSearch = review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.game?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.game?.japanese_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (activeTab === 'published') return matchesSearch && review.is_published
    if (activeTab === 'pending') return matchesSearch && !review.is_published
    return matchesSearch
  })

  const publishedCount = mockReviewsData.reviews.filter(r => r.is_published).length
  const pendingCount = mockReviewsData.reviews.filter(r => !r.is_published).length

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleReviewAction = async (reviewId: string, action: 'publish' | 'unpublish' | 'delete') => {
    console.log(`Review ${reviewId}: ${action}`)
    // 実装: API呼び出し
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < Math.floor(rating / 2) 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-semibold text-yellow-600">
          {rating}/10
        </span>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">レビュー管理</h1>
          <p className="mt-2 text-gray-600">
            ユーザーが投稿したレビューの管理とモデレーションを行えます
          </p>
        </div>

        {/* Reviews List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-6 w-6" />
                <span>レビュー一覧</span>
                <Badge variant="secondary">{mockReviewsData.total}件</Badge>
              </CardTitle>
              
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="レビュー・ゲーム名で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">
                  すべて ({mockReviewsData.total})
                </TabsTrigger>
                <TabsTrigger value="published">
                  公開済み ({publishedCount})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  承認待ち ({pendingCount})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-6">
                {filteredReviews.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-4">レビューが見つかりません</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReviews.map((review) => (
                      <div key={review.id} className="p-6 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Review Header */}
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                                {review.title}
                              </h3>
                              <Badge 
                                variant={review.is_published ? "default" : "secondary"}
                                className={review.is_published ? "bg-green-100 text-green-800" : ""}
                              >
                                {review.is_published ? '公開済み' : '承認待ち'}
                              </Badge>
                            </div>

                            {/* Game and Rating */}
                            <div className="flex items-center space-x-4 mb-3">
                              <Link 
                                href={`/games/${review.game?.id}`}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {review.game?.japanese_name || review.game?.name}
                              </Link>
                              {renderStars(review.overall_score)}
                            </div>

                            {/* Review Content Preview */}
                            <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                              {review.content}
                            </p>

                            {/* Meta Info */}
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{review.user?.full_name || review.user?.username}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>投稿: {formatDate(review.created_at)}</span>
                              </div>
                              {review.updated_at !== review.created_at && (
                                <span>更新: {formatDate(review.updated_at)}</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2 ml-4">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/reviews/${review.id}`} target="_blank">
                                <Eye className="h-4 w-4 mr-1" />
                                表示
                              </Link>
                            </Button>
                            
                            {!review.is_published && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleReviewAction(review.id, 'publish')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                承認
                              </Button>
                            )}
                            
                            {review.is_published && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-yellow-600 hover:text-yellow-700"
                                onClick={() => handleReviewAction(review.id, 'unpublish')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                非公開
                              </Button>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/reviews/${review.id}`}>
                                    詳細を表示
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/users/${review.user?.id}`}>
                                    ユーザー情報
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleReviewAction(review.id, 'delete')}
                                >
                                  レビューを削除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Pagination */}
                {mockReviewsData.totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center">
                    <p className="text-sm text-gray-500">
                      ページング機能は今後実装予定
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

function AdminReviewsPageSkeleton() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        
        <div className="bg-white rounded-lg border">
          <div className="p-6">
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-6 border rounded">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-5 w-16 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default function AdminReviewsPageWrapper() {
  return <AdminReviewsPage />
}