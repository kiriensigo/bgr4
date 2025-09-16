'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, BookOpen, Search, X, Gamepad2 } from 'lucide-react'
import { useEffect } from 'react'

interface MobileNavigationProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  // Escape キーでメニューを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // ボディのスクロールを無効にする
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* オーバーレイ */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* モバイルメニュー */}
      <div className="fixed top-0 right-0 h-full w-64 bg-background border-l shadow-lg z-50 md:hidden animate-in slide-in-from-right duration-300">
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-lg">メニュー</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="メニューを閉じる"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* ナビゲーションリンク */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                asChild
                onClick={onClose}
              >
                <Link href="/" className="flex items-center gap-3">
                  <Home className="w-5 h-5" />
                  ホーム
                </Link>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                asChild
                onClick={onClose}
              >
                <Link href="/games" className="flex items-center gap-3">
                  <Gamepad2 className="w-5 h-5" />
                  ゲーム一覧
                </Link>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                asChild
                onClick={onClose}
              >
                <Link href="/reviews" className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5" />
                  レビュー
                </Link>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                asChild
                onClick={onClose}
              >
                <Link href="/search" className="flex items-center gap-3">
                  <Search className="w-5 h-5" />
                  検索
                </Link>
              </Button>
            </div>
          </nav>
          
          {/* フッター情報 */}
          <div className="p-4 border-t text-sm text-muted-foreground">
            <p>&copy; 2024 BGR</p>
            <p>Board Game Review</p>
          </div>
        </div>
      </div>
    </>
  )
}