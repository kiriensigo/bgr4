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
  Gamepad2,
  Calendar,
  Users,
  Clock,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

// モックゲームデータ
const mockGamesData = {
  games: [
    {
      id: '1',
      name: 'Catan',
      japanese_name: 'カタンの開拓者たち',
      year_published: 1995,
      min_players: 3,
      max_players: 4,
      playing_time: 120,
      bgg_id: 13,
      image_url: 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__original/img/xV7oisd3RaFDfmJEc-SxKPxSYEE=/0x0/filters:format(png)/pic2419375.png',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2', 
      name: 'Wingspan',
      japanese_name: 'ウイングスパン',
      year_published: 2019,
      min_players: 1,
      max_players: 5,
      playing_time: 90,
      bgg_id: 266192,
      image_url: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__original/img/Tbudu2NRxiNf-L4CKxnSArPrz7c=/0x0/filters:format(jpeg)/pic4458123.jpg',
      created_at: '2024-02-01T15:30:00Z',
      updated_at: '2024-02-01T15:30:00Z'
    },
    {
      id: '3',
      name: 'Azul',
      japanese_name: 'アズール',
      year_published: 2017,
      min_players: 2,
      max_players: 4,
      playing_time: 45,
      bgg_id: 230802,
      image_url: 'https://cf.geekdo-images.com/aPSHJO0d0XOpQR5X-wJonw__original/img/Q5X_HhtzDizoxUNJgjJLh-1kVQ4=/0x0/filters:format(jpeg)/pic6973671.jpg',
      created_at: '2024-01-20T09:15:00Z',
      updated_at: '2024-01-20T09:15:00Z'
    }
  ],
  total: 3,
  page: 1,
  totalPages: 1
}

function AdminGamesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useUser()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (!user) {
        router.push('/login?redirect=/admin/games')
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
    return <AdminGamesPageSkeleton />
  }

  const filteredGames = mockGamesData.games.filter(game => 
    game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.japanese_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ゲーム管理</h1>
          <p className="mt-2 text-gray-600">
            登録されているゲーム情報の管理と編集を行えます
          </p>
        </div>

        {/* Games List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Gamepad2 className="h-6 w-6" />
                <span>ゲーム一覧</span>
                <Badge variant="secondary">{mockGamesData.total}件</Badge>
              </CardTitle>
              
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="ゲーム名で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                
                <Button size="sm" className="bg-green-600 hover:bg-green-700" asChild>
                  <Link href="/admin/games/new">
                    新しいゲームを追加
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredGames.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Gamepad2 className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4">ゲームが見つかりません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGames.map((game) => (
                  <div key={game.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      {/* Game Image */}
                      {game.image_url && (
                        <div className="flex-shrink-0">
                          <img
                            src={game.image_url}
                            alt={game.japanese_name || game.name}
                            className="w-16 h-16 object-cover rounded-lg shadow-sm"
                            loading="lazy"
                          />
                        </div>
                      )}
                      
                      {/* Game Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">
                            {game.japanese_name || game.name}
                          </h3>
                          {game.japanese_name && game.name !== game.japanese_name && (
                            <span className="text-sm text-gray-500">({game.name})</span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          {game.year_published && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{game.year_published}年</span>
                            </div>
                          )}
                          {game.min_players && game.max_players && (
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>
                                {game.min_players === game.max_players 
                                  ? `${game.min_players}人` 
                                  : `${game.min_players}-${game.max_players}人`
                                }
                              </span>
                            </div>
                          )}
                          {game.playing_time && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{game.playing_time}分</span>
                            </div>
                          )}
                          <div>
                            登録: {formatDate(game.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/games/${game.id}`} target="_blank">
                          表示
                        </Link>
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            ゲーム情報を編集
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            BGGと同期
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            ゲームを削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {mockGamesData.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center">
                <p className="text-sm text-gray-500">
                  ページング機能は今後実装予定
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

function AdminGamesPageSkeleton() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        
        <div className="bg-white rounded-lg border">
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                  <div className="h-16 w-16 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-8 w-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default function AdminGamesPageWrapper() {
  return <AdminGamesPage />
}