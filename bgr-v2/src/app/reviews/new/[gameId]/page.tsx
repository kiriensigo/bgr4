'use client'

import { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { EnhancedReviewForm } from "@/components/reviews/EnhancedReviewForm";
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/hooks/useAuth'
import type { EnhancedGame } from '@/types/enhanced-review'

interface PageProps {
  params: Promise<{
    gameId: string;
  }>;
}

export default function ReviewPage({ params }: PageProps) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [game, setGame] = useState<EnhancedGame | null>(null)
  const [gameId, setGameId] = useState<string>('')
  const [gameLoading, setGameLoading] = useState(true)

  // パラメータを取得
  useEffect(() => {
    params.then(({ gameId }) => {
      setGameId(gameId)
    })
  }, [params])

  // 認証チェック
  useEffect(() => {
    if (!loading && !user && gameId) {
      router.push(`/login?next=${encodeURIComponent(`/reviews/new/${gameId}`)}`)
    }
  }, [user, loading, gameId, router])

  // ゲーム情報を取得
  useEffect(() => {
    if (gameId && user) {
      const fetchGame = async () => {
        try {
          const { data, error } = await supabase
            .from('games')
            .select('*')
            .eq('id', parseInt(gameId))
            .single()

          if (error || !data) {
            notFound()
          } else {
            setGame(data as any)
          }
        } catch (error) {
          console.error('Error fetching game:', error)
          notFound()
        } finally {
          setGameLoading(false)
        }
      }

      fetchGame()
    }
  }, [gameId, user])

  // デバッグ情報
  console.log('📝 Review Page Debug:', {
    loading,
    gameLoading,
    user: !!user,
    gameId,
    game: !!game
  })

  // ローディング状態
  if (loading || gameLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // 認証されていない場合（リダイレクト処理中）
  if (!user) {
    return null
  }

  // ゲームが見つからない場合
  if (!game) {
    return notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">レビューを書く</h1>
        <p className="text-muted-foreground">
          「{game.name}」のレビューを投稿してください
        </p>
      </div>

      <EnhancedReviewForm 
        gameId={game.id!}
        gameName={game.name}
        mode="create"
      />
    </div>
  )
}