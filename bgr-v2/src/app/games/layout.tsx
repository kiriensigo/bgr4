import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ボードゲーム一覧 | BGR',
  description: '人気順・評価順で探せるボードゲーム一覧。人数やプレイ時間で絞り込みもできます。',
}

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return children
}

