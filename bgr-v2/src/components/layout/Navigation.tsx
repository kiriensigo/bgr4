import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/auth/UserMenu'
import { Home, BookOpen, Gamepad2, TestTube, Search, Plus } from 'lucide-react'

export function Navigation() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl transition-all duration-200 hover:scale-105 hover:text-primary">
              <Gamepad2 className="w-6 h-6 transition-colors duration-200" />
              BGR
            </Link>
            
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  ホーム
                </Link>
              </Button>
              
              <Button variant="ghost" size="sm" asChild>
                <Link href="/reviews" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  レビュー
                </Link>
              </Button>
              
              <Button variant="ghost" size="sm" asChild>
                <Link href="/search" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  検索
                </Link>
              </Button>
              
              <Button variant="ghost" size="sm" asChild>
                <Link href="/games/register" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  ゲーム登録
                </Link>
              </Button>
              
              <Button variant="ghost" size="sm" asChild>
                <Link href="/local-test" className="flex items-center gap-2">
                  <TestTube className="w-4 h-4" />
                  テスト
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