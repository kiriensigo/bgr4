import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface HeroSectionProps {
  stats?: {
    totalReviews: number
    totalGames: number
    activeReviewers: number
    averageRating: number
  }
}

export function HeroSection({ stats }: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="relative container mx-auto px-4 py-16 lg:py-24 min-h-[55vh] flex items-center">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-gray-900 dark:text-white">
            Board Game Review をはじめよう
          </h1>
          <form method="GET" action="/search" className="max-w-2xl mx-auto mb-8">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  name="query"
                  placeholder="ゲーム名、デザイナー、メカニクスで検索..."
                  className="h-12 text-base"
                />
              </div>
              <Button type="submit" size="lg" className="h-12">検索</Button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/search?mechanics=エリアベース">エリアベース</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/search?mechanics=協力ゲーム">協力ゲーム</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/search?mechanics=デッキ">デッキ</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/search?categories=戦略ゲーム">戦略ゲーム</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/search?minPlayers=2&maxPlayers=2">2人</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/search?minPlayers=3&maxPlayers=4">3-4人</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/search?minPlayers=5">5人以上</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
