'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/auth/UserMenu'
import { MobileNavigation } from './MobileNavigation'
import { Home, BookOpen, Search, Gamepad2, Menu } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl transition-all duration-200 hover:scale-105 hover:text-brand-800">
              <Gamepad2 className="w-6 h-6 text-brand-600 transition-colors duration-200" />
              <span className="text-brand-700 transition-colors duration-200">BGR</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  ホーム
                </Link>
              </Button>
              
              <Button variant="ghost" size="sm" asChild>
                <Link href="/games" className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" />
                  ゲーム一覧
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
            </nav>
          </div>
          
          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center">
            <UserMenu />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <UserMenu />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="メニュー"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <MobileNavigation 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />
      </div>
    </header>
  )
}