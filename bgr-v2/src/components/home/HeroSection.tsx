import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface HeroSectionProps {
  stats?: {
    totalReviews: number
    totalGames: number
    activeReviewers: number
    averageRating: number
  }
}

export function HeroSection({ stats: _stats }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container relative mx-auto flex min-h-[55vh] items-center px-4 py-16 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
            ボードゲームの今がわかるレビューコミュニティ
          </h1>
          <p className="mt-6 text-lg text-gray-700 dark:text-gray-200">
            話題作から名作まで、実際に遊んだプレイヤーの声をもとに次の一本を見つけましょう。
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/games">ゲーム一覧を見る</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/reviews">最新レビューをチェック</Link>
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/search?mechanics=エリアベース">エリアベース</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/search?mechanics=協力型">協力型</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/search?mechanics=デッキ">デッキ構築</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/search?categories=戦略">戦略ゲーム</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/search?minPlayers=2&maxPlayers=2">2人プレイ</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/search?minPlayers=3&maxPlayers=4">3〜4人</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/search?minPlayers=5">大人数向け</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
