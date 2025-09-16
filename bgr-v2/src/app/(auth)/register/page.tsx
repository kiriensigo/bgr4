import { AuthButton } from '@/components/auth/AuthButton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Gamepad2, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-md w-full space-y-8 px-4">
        {/* Logo & Header */}
        <div className="text-center">
          <div className="flex justify-center items-center gap-2 mb-6">
            <div className="p-3 bg-primary rounded-lg">
              <Gamepad2 className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">BGR へようこそ</h1>
          <p className="mt-2 text-sm text-gray-600">
            ボードゲームレビューコミュニティに参加しよう
          </p>
        </div>
        
        {/* Registration Card */}
        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">新規登録</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              ソーシャルアカウントで簡単登録
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <AuthButton provider="google" className="w-full" />
            <AuthButton provider="twitter" className="w-full" />
            
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                すでにアカウントをお持ちですか？{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  ログイン
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Features */}
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">BGRでできること</h3>
          <div className="grid gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>ボードゲームの詳細レビューを投稿・閲覧</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>BGG APIと連携した豊富なゲーム情報</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>高度な検索・フィルタリング機能</span>
            </div>
          </div>
        </div>
        
        {/* Terms */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            登録することで、
            <a href="/terms" className="text-primary hover:underline">利用規約</a>
            および
            <a href="/privacy" className="text-primary hover:underline">プライバシーポリシー</a>
            に同意したものとみなされます。
          </p>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: '新規登録 - BGR',
  description: 'BGR（Board Game Review）への新規登録ページ。Google・Twitter アカウントで簡単にボードゲームレビューコミュニティに参加できます。',
}