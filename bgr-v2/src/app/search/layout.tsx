import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ボードゲーム検索 | BGR',
  description: 'キーワード・評価・人数・プレイ時間・メカニクスでボードゲームを横断検索。レビューにもとづく高度なフィルターも可能。',
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}

