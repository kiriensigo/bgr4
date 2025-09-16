'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WishlistButton } from '@/components/wishlist/WishlistButton'
import { 
  Heart, 
  Search,
  Calendar,
  Users,
  Clock,
  Star,
  ExternalLink,
  Gamepad2
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface WishlistGame {
  id: string
  gameId: number
  addedAt: string
  game: {
    id: number
    name: string
    japaneseName?: string
    description?: string
    yearPublished?: number
    minPlayers: number
    maxPlayers: number
    playingTime?: number
    imageUrl?: string
    thumbnailUrl?: string
    categories: string[]
    mechanics: string[]
    designers: string[]
    publishers: string[]
    ratingAverage?: number
    ratingCount?: number
  }
}

interface WishlistData {
  data: WishlistGame[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function WishlistPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [wishlistData, setWishlistData] = useState<WishlistData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login?redirect=/wishlist')
        return
      }
      loadWishlist()
    }
  }, [user, authLoading, router, currentPage, sortBy, sortOrder])

  const loadWishlist = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy,
        sortOrder
      })
      
      const response = await fetch(`/api/wishlist?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setWishlistData(data)
      } else {
        console.error('Failed to load wishlist:', data.message)
      }
    } catch (error) {
      console.error('Wishlist load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const renderStars = (rating?: number) => {
    if (!rating) return null
    
    return (
      <div className="flex items-center space-x-1">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium text-yellow-600">
          {rating.toFixed(1)}
        </span>
      </div>
    )
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
            
            {/* Content Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border p-6">
                  <div className="space-y-4">
                    <div className="h-48 bg-gray-200 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Heart className="h-8 w-8 text-red-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                ウィッシュリスト
              </h1>
            </div>
            <p className="text-gray-600">
              気になるゲームを保存して、後で確認できます
            </p>
            
            {wishlistData && (
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-base">
                  {wishlistData.pagination.total}件のゲーム
                </Badge>
                
                <div className="flex items-center space-x-2">
                  <select 
                    value={`${sortBy}_${sortOrder}`} 
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] = e.target.value.split('_')
                      setSortBy(newSortBy || 'created_at')
                      setSortOrder(newSortOrder || 'desc')
                      setCurrentPage(1)
                    }}
                    className="border rounded px-3 py-2 text-sm bg-white"
                  >
                    <option value="created_at_desc">追加日（新しい順）</option>
                    <option value="created_at_asc">追加日（古い順）</option>
                    <option value="name_asc">ゲーム名（A-Z）</option>
                    <option value="name_desc">ゲーム名（Z-A）</option>
                    <option value="rating_average_desc">評価（高い順）</option>
                    <option value="rating_average_asc">評価（低い順）</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Wishlist Content */}
          {wishlistData?.data.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="space-y-4">
                  <Heart className="mx-auto h-16 w-16 text-gray-300" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      ウィッシュリストは空です
                    </h3>
                    <p className="text-gray-600 mt-2">
                      気になるゲームを見つけて、ハートボタンで追加してみましょう
                    </p>
                  </div>
                  <Button asChild>
                    <Link href="/games">
                      <Search className="h-4 w-4 mr-2" />
                      ゲームを探す
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Games Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistData?.data.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square relative bg-gray-100">
                      {item.game.imageUrl ? (
                        <Image
                          src={item.game.imageUrl}
                          alt={item.game.japaneseName || item.game.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Gamepad2 className="h-16 w-16 text-gray-300" />
                        </div>
                      )}
                      
                      {/* Wishlist Button Overlay */}
                      <div className="absolute top-3 right-3">
                        <WishlistButton
                          gameId={item.game.id}
                          gameName={item.game.japaneseName || item.game.name}
                          variant="ghost"
                          className="bg-white/80 backdrop-blur-sm hover:bg-white/90"
                        />
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Game Title */}
                        <div>
                          <h3 className="font-semibold text-lg line-clamp-2">
                            {item.game.japaneseName || item.game.name}
                          </h3>
                          {item.game.japaneseName && item.game.name !== item.game.japaneseName && (
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {item.game.name}
                            </p>
                          )}
                        </div>

                        {/* Game Info */}
                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                          {item.game.yearPublished && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{item.game.yearPublished}年</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>
                              {item.game.minPlayers === item.game.maxPlayers 
                                ? `${item.game.minPlayers}人` 
                                : `${item.game.minPlayers}-${item.game.maxPlayers}人`
                              }
                            </span>
                          </div>
                          {item.game.playingTime && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{item.game.playingTime}分</span>
                            </div>
                          )}
                        </div>

                        {/* Rating */}
                        {item.game.ratingAverage && (
                          <div className="flex items-center justify-between">
                            {renderStars(item.game.ratingAverage)}
                            <span className="text-xs text-gray-500">
                              {item.game.ratingCount}件の評価
                            </span>
                          </div>
                        )}

                        {/* Categories */}
                        {item.game.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.game.categories.slice(0, 3).map((category) => (
                              <Badge key={category} variant="secondary" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                            {item.game.categories.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{item.game.categories.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Added Date */}
                        <div className="text-xs text-gray-500 pt-2 border-t">
                          {formatDate(item.addedAt)}に追加
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2 pt-2">
                          <Button asChild variant="outline" size="sm" className="flex-1">
                            <Link href={`/games/${item.game.id}`}>
                              <ExternalLink className="h-3 w-3 mr-1" />
                              詳細
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {wishlistData && wishlistData.pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    前へ
                  </Button>
                  <span className="text-sm text-gray-600">
                    {currentPage} / {wishlistData.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(wishlistData.pagination.totalPages, prev + 1))}
                    disabled={currentPage === wishlistData.pagination.totalPages}
                  >
                    次へ
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function WishlistPageWrapper() {
  return <WishlistPage />
}