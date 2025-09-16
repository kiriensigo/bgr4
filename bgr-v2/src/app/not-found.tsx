import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search, BookOpen, ArrowLeft } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ページが見つかりません - 404 | BGR',
  description: 'お探しのページは見つかりませんでした。BGRのトップページからボードゲームレビューをお楽しみください。',
  robots: {
    index: false,
    follow: true
  }
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl font-bold text-red-600">404</span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                ページが見つかりません
              </CardTitle>
              <p className="text-gray-600 text-lg">
                お探しのページは削除されたか、URLが間違っている可能性があります。
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button asChild size="lg" className="w-full">
                  <Link href="/" className="flex items-center justify-center gap-2">
                    <Home className="w-5 h-5" />
                    トップページへ
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full">
                  <Link href="/search" className="flex items-center justify-center gap-2">
                    <Search className="w-5 h-5" />
                    ゲームを検索
                  </Link>
                </Button>
              </div>
              
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">人気のコンテンツ</h3>
                <div className="space-y-2">
                  <Button asChild variant="ghost" className="w-full justify-start">
                    <Link href="/reviews" className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      最新のレビューを読む
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full justify-start">
                    <Link href="/games" className="flex items-center gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      ゲーム一覧を見る
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              問題が続く場合は、サイト管理者にお問い合わせください。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}