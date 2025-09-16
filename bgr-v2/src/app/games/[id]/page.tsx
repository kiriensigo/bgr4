import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SupabaseGameRepository } from '@/infrastructure/repositories/SupabaseGameRepository'

interface GamePageProps {
  params: Promise<{ id: string }>
}

async function getGame(id: number) {
  const supabase = await createServerSupabaseClient()
  const repo = new SupabaseGameRepository(supabase)
  return await repo.findById(id)
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { id } = await params
  const gameId = parseInt(id)

  if (isNaN(gameId)) {
    return {
      title: 'ゲームが見つかりません | BGR',
      description: '指定されたゲームは存在しません。'
    }
  }

  const game = await getGame(gameId)
  if (!game) {
    return {
      title: 'ゲームが見つかりません | BGR',
      description: '指定されたゲームは存在しません。'
    }
  }

  const title = `${game.name} - ボードゲームレビュー`
  const description = game.description
    ? `${game.name}のレビューと詳細情報。${game.yearPublished ? `${game.yearPublished}年発売、` : ''}${game.minPlayers && game.maxPlayers ? `${game.minPlayers}-${game.maxPlayers}人向け。` : ''}${game.description.substring(0, 100)}${game.description.length > 100 ? '...' : ''}`
    : `${game.name}のレビューと詳細情報。`

  return {
    title,
    description,
    keywords: [
      game.name,
      'ボードゲーム',
      'レビュー',
      'ボドゲ',
      ...(game.getDisplayMechanics ? (game.getDisplayMechanics() as string[]) : []),
      ...(game.getDisplayCategories ? (game.getDisplayCategories() as string[]) : []),
      ...((game as any).designers || [])
    ],
    openGraph: {
      title: game.name,
      description: game.description || `${game.name}のボードゲームレビュー`,
      type: 'article',
      images: game.imageUrl ? [{ url: game.imageUrl, width: 500, height: 500, alt: game.name }] : [],
      publishedTime: game.createdAt ? new Date(game.createdAt).toISOString() : undefined,
      modifiedTime: (game as any).updatedAt ? new Date((game as any).updatedAt).toISOString() : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: game.name,
      description: game.description || `${game.name}のボードゲームレビュー`,
      images: game.imageUrl ? [game.imageUrl] : [],
    },
    alternates: {
      canonical: `https://bgrq.netlify.app/games/${(game as any).id}`
    }
  }
}

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params
  const gameId = parseInt(id)
  if (isNaN(gameId)) notFound()

  const game = await getGame(gameId)
  if (!game) notFound()

  // 右側の詳細(@details)・レビュー(@reviews)はレイアウト側で描画するため、ここは最小のコンテナのみ
  return <div className="container mx-auto px-4 py-0" />
}

