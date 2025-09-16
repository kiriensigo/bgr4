'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { HeroSection } from './HeroSection'
import { RecentReviews } from './RecentReviews'
import { PopularGames } from './PopularGames'
import { useHomeData } from '@/hooks/useHomeData'

export function HomePageContent() {
  const { stats, recentReviews, popularGames, loading, error } = useHomeData()

  if (loading) {
    return (
      <div className="min-h-screen">
        {/* Hero Skeleton */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
          <div className="container mx-auto px-4 py-16 lg:py-24">
            <div className="text-center">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6 max-w-2xl mx-auto animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 max-w-xl mx-auto animate-pulse"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded max-w-md mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Loading indicator */}
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">読み込み中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    // エラー時も最小限のコンテンツを表示
    return (
      <div className="min-h-screen">
        {/* Hero Section (エラー用のフォールバック) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
          <div className="relative container mx-auto px-4 py-16 lg:py-24">
            <div className="text-center max-w-4xl mx-auto mb-12">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ボードゲームの世界を
                <br />
                もっと深く楽しもう
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                詳細なレビューと評価システムで、あなたにぴったりのボードゲームを見つけましょう。
                コミュニティと一緒に、新しいゲーム体験を共有しませんか？
              </p>

              {/* 検索フォーム - エラー時でも表示 */}
              <form onSubmit={(e) => {
                e.preventDefault()
                const query = new FormData(e.target as HTMLFormElement).get('query') as string
                if (query?.trim()) {
                  window.location.href = `/search?query=${encodeURIComponent(query.trim())}`
                }
              }} className="max-w-2xl mx-auto mb-8">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      name="query"
                      placeholder="ゲーム名、デザイナー、メカニクスで検索..."
                      className="w-full h-12 pl-10 pr-4 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button type="submit" className="h-12 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    検索
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* エラーメッセージ */}
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto border-yellow-200 bg-yellow-50">
            <CardContent className="p-6 text-center">
              <div className="text-yellow-700 mb-2">データの読み込みに問題が発生しました</div>
              <p className="text-yellow-600 text-sm">{error}</p>
              <p className="text-yellow-600 text-sm mt-2">検索機能は正常に利用できます。</p>
            </CardContent>
          </Card>
        </div>
        
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {stats && <HeroSection stats={stats} />}
      
      {/* Popular Games Section */}
      <PopularGames games={popularGames} />
      
      {/* Recent Reviews Section */}
      <RecentReviews reviews={recentReviews} />
      
    </div>
  )
}