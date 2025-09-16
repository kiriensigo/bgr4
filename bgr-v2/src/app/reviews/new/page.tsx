import { Suspense } from 'react'
import { EnhancedReviewForm } from '@/components/reviews/EnhancedReviewForm'

// 動的レンダリングを強制
export const dynamic = 'force-dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function ReviewFormSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
            <div className="grid gap-4">
              <div className="h-20 bg-muted rounded"></div>
              <div className="h-20 bg-muted rounded"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function NewReviewPageContent() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/reviews" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              レビュー一覧に戻る
            </Link>
          </Button>
          
          <h1 className="text-3xl font-bold">新しいレビューを書く</h1>
          <p className="text-muted-foreground mt-2">
            詳細な評価とゲーム体験を共有しましょう
          </p>
        </div>

        {/* Enhanced Review Form */}
        <EnhancedReviewForm
          mode="create"
          gameId={30549} // Existing game ID (Pandemic)
          gameName="Pandemic" // Existing game name
        />

        {/* Help Text */}
        <div className="max-w-4xl mx-auto mt-8 p-6 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-3">レビュー作成のヒント</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>総合評価：</strong> このゲームを総合的にどう評価するかを10段階で表現してください</li>
            <li>• <strong>詳細評価：</strong> ルールの複雑さ、運要素、相互作用、ダウンタイムを5段階で評価</li>
            <li>• <strong>ゲーム体験：</strong> 実際にプレイした感想や推奨人数を共有してください</li>
            <li>• <strong>ゲーム特徴：</strong> メカニクスやカテゴリーを選択して、検索しやすくしましょう</li>
            <li>• <strong>詳細な感想：</strong> 50文字以上で具体的な体験談を書いてください</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function NewReviewPage() {
  return (
    <Suspense fallback={<ReviewFormSkeleton />}>
      <NewReviewPageContent />
    </Suspense>
  )
}

export const metadata = {
  title: '新しいレビューを書く - BGR',
  description: 'ボードゲームの詳細なレビューを書いて、コミュニティに貢献しましょう。詳細評価システムで他のプレイヤーの参考になる情報を共有できます。',
}