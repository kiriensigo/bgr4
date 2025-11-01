import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/auth/UserMenu'
import { Home, BookOpen, Gamepad2, List, TestTube, Search, Plus } from 'lucide-react'

export function Navigation() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-xl transition-all duration-200 hover:opacity-80 hover:text-primary"
            >
              <Gamepad2 className="w-7 h-7 text-primary transition-colors duration-200" />
              <span className="tracking-tight">BGR</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  <span>ホーム</span>
                </Link>
              </Button>

              <Button variant="ghost" size="sm" asChild>
                <Link href="/games" className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  <span>ゲーム一覧</span>
                </Link>
              </Button>

              <Button variant="ghost" size="sm" asChild>
                <Link href="/reviews" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>レビュー</span>
                </Link>
              </Button>

              <Button variant="ghost" size="sm" asChild>
                <Link href="/search" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span>検索</span>
                </Link>
              </Button>

              <Button variant="ghost" size="sm" asChild>
                <Link href="/games/register" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>ゲーム登録</span>
                </Link>
              </Button>

              <Button variant="ghost" size="sm" asChild>
                <Link href="/local-test" className="flex items-center gap-2">
                  <TestTube className="w-4 h-4" />
                  <span>テスト</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center">
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  )
}
