'use client'

import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface HeroSectionProps {
  stats?: {
    totalReviews: number
    totalGames: number
    activeReviewers: number
    averageRating: number
  }
}

export function HeroSection({ stats }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative container mx-auto px-4 py-16 lg:py-24">
        {/* Hero Content */}
        <div className="text-center max-w-4xl mx-auto mb-12">

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="ゲーム名、デザイナー、メカニクスで検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button type="submit" size="lg" className="h-12">
                検索
              </Button>
            </div>
          </form>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Button variant="outline" size="sm" asChild>
              <Link href="/search?mechanics=エリア支配">エリア支配</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/search?mechanics=協力ゲーム">協力ゲーム</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/search?mechanics=デッキ構築">デッキ構築</Link>
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