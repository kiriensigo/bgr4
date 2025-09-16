import Link from 'next/link'
import { Gamepad2, Github, Twitter, Mail, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* ブランド・概要 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-brand-600" />
              <span className="font-bold text-lg text-brand-700">BGR</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ボードゲームレビューの総合プラットフォーム。<br />
              プレイヤー同士の体験を共有し、<br />
              最高のゲーム体験を見つけよう。
            </p>
          </div>

          {/* ナビゲーション */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">サイト内リンク</h3>
            <nav className="space-y-2">
              <Link 
                href="/" 
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ホーム
              </Link>
              <Link 
                href="/reviews" 
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                レビュー一覧
              </Link>
              <Link 
                href="/search" 
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ゲーム検索
              </Link>
              <Link 
                href="/games" 
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ゲーム一覧
              </Link>
            </nav>
          </div>

          {/* リソース */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">リソース</h3>
            <nav className="space-y-2">
              <a 
                href="https://boardgamegeek.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                BoardGameGeek
              </a>
              <Link 
                href="/about" 
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                BGRについて
              </Link>
              <Link 
                href="/privacy" 
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                プライバシーポリシー
              </Link>
              <Link 
                href="/terms" 
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                利用規約
              </Link>
            </nav>
          </div>

          {/* ソーシャル・お問い合わせ */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">フォロー・連絡</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a 
                  href="mailto:contact@bgr.example.com"
                  aria-label="メール"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              フィードバックやご質問は<br />
              お気軽にお問い合わせください。
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        {/* コピーライト */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} BGR - Board Game Review. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500" /> for board game lovers
          </p>
        </div>
      </div>
    </footer>
  )
}