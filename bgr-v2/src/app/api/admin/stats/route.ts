import { NextResponse } from 'next/server'
import { requireAdmin, getSystemStats } from '@/lib/admin'

export async function GET() {
  try {
    // 管理者権限チェック（認証込み）
    await requireAdmin()

    // 統計情報取得
    const rawStats = await getSystemStats()

    // フロントエンド用の形式に変換
    const formattedStats = {
      users: {
        total: rawStats.totalUsers,
        admins: 1, // TODO: 実際の管理者数を取得
        recent: rawStats.totalUsers // TODO: 最近の新規登録数を計算
      },
      games: {
        total: rawStats.totalGames
      },
      reviews: {
        total: rawStats.totalReviews,
        recent: rawStats.reviewsThisMonth,
        averageRating: rawStats.averageRating
      }
    }

    return NextResponse.json(formattedStats)

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      if (error.message === 'Administrator privileges required') {
        return NextResponse.json(
          { error: 'Administrator privileges required' },
          { status: 403 }
        )
      }
    }

    console.error('Admin stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}