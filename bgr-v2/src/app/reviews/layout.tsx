import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'レビュー一覧 | BGR',
  description: 'ボードゲームレビューの一覧。評価やおすすめポイントをチェックして、自分に合うゲームを見つけよう。',
}

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return children
}

