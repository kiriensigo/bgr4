import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getGameDetailForAutoRegistration } from '@/lib/bgg-api'
import { convertBggToSiteData } from '@/lib/bgg-mapping'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const gameId = parseInt(id)
    
    if (isNaN(gameId)) {
      return NextResponse.json(
        { error: 'Invalid game ID' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // SQL関数を並列実行してパフォーマンスを向上
    const [mechanicsResult, categoriesResult, playerCountResult] = await Promise.all([
      // @ts-ignore - Supabase型生成にない関数のため型チェックを無効化
      supabase.rpc('get_weighted_mechanics_stats', { target_game_id: gameId }),
      // @ts-ignore - Supabase型生成にない関数のため型チェックを無効化
      supabase.rpc('get_weighted_categories_stats', { target_game_id: gameId }),
      // @ts-ignore - Supabase型生成にない関数のため型チェックを無効化
      supabase.rpc('get_weighted_player_count_stats', { target_game_id: gameId })
    ])

    // エラーハンドリング
    if ((mechanicsResult as any).error) {
      console.error('Mechanics stats error:', (mechanicsResult as any).error)
      throw new Error('Failed to fetch mechanics statistics')
    }

    if ((categoriesResult as any).error) {
      console.error('Categories stats error:', (categoriesResult as any).error)
      throw new Error('Failed to fetch categories statistics')
    }

    if ((playerCountResult as any).error) {
      console.error('Player count stats error:', (playerCountResult as any).error)
      throw new Error('Failed to fetch player count statistics')
    }

    // データ整形と型安全性の確保
    const formatStats = (data: any[]) => {
      return data
        .filter(item => parseFloat(item.percentage) >= 30) // 30%以上のみ表示
        .map(item => ({
          name: item.mechanic_name || item.category_name || item.player_count_name,
          reviewVotes: parseInt(item.review_votes || '0'),
          bggVotes: parseInt(item.bgg_votes || '0'),
          totalVotes: parseInt(item.total_votes || '0'),
          totalReviews: parseInt(item.total_reviews || '0'),
          percentage: parseFloat(item.percentage || '0'),
          displayPriority: item.display_priority as 'highlight' | 'normal' | 'hidden'
        }))
        .sort((a, b) => b.percentage - a.percentage) // パーセンテージ順でソート
    }

    const stats = {
      mechanics: formatStats((mechanicsResult as any).data || []),
      categories: formatStats((categoriesResult as any).data || []),
      playerCounts: formatStats((playerCountResult as any).data || [])
    }

    // Seed with BGG-converted tags when no reviews yet
    if (stats.mechanics.length === 0 || stats.categories.length === 0) {
      const { data: gameRow, error: gameErr } = await supabase
        .from('games')
        .select('mechanics, categories, bgg_id')
        .eq('id', gameId)
        .single()

      if (!gameErr && gameRow) {
        const seedVotes = 10
        if (stats.mechanics.length === 0 && Array.isArray(gameRow.mechanics) && gameRow.mechanics.length > 0) {
          stats.mechanics = (gameRow.mechanics as string[]).map((name: string) => ({
            name,
            reviewVotes: 0,
            bggVotes: seedVotes,
            totalVotes: seedVotes,
            totalReviews: 0,
            percentage: 100,
            displayPriority: 'normal' as const,
          }))
        }
        if (stats.categories.length === 0 && Array.isArray(gameRow.categories) && gameRow.categories.length > 0) {
          stats.categories = (gameRow.categories as string[]).map((name: string) => ({
            name,
            reviewVotes: 0,
            bggVotes: seedVotes,
            totalVotes: seedVotes,
            totalReviews: 0,
            percentage: 100,
            displayPriority: 'normal' as const,
          }))
        }

        // If DBに保存が無い場合は、BGGからその場で変換してシード
        if ((stats.mechanics.length === 0 || stats.categories.length === 0)) {
          try {
            const bggId = typeof (gameRow as any).bgg_id === 'number' ? (gameRow as any).bgg_id : parseInt((gameRow as any).bgg_id || '0')
            if (!bggId || isNaN(bggId)) throw new Error('No valid BGG ID')
            const enhanced = await getGameDetailForAutoRegistration(bggId)
            const bggCats = enhanced?.gameDetail?.categories || []
            const bggMechs = enhanced?.gameDetail?.mechanics || []
            const bggPubs = enhanced?.gameDetail?.publishers || []
            const converted = convertBggToSiteData(bggCats, bggMechs, bggPubs)

            if (stats.mechanics.length === 0 && converted.siteMechanics.length > 0) {
              stats.mechanics = converted.siteMechanics.map((name: string) => ({
                name,
                reviewVotes: 0,
                bggVotes: seedVotes,
                totalVotes: seedVotes,
                totalReviews: 0,
                percentage: 100,
                displayPriority: 'normal' as const,
              }))
            }
            if (stats.categories.length === 0 && converted.siteCategories.length > 0) {
              stats.categories = converted.siteCategories.map((name: string) => ({
                name,
                reviewVotes: 0,
                bggVotes: seedVotes,
                totalVotes: seedVotes,
                totalReviews: 0,
                percentage: 100,
                displayPriority: 'normal' as const,
              }))
            }
          } catch (e) {
            // 無視（BGG失敗時はそのまま）
            console.warn('Fallback BGG conversion failed for stats seed:', e)
          }
        }
      }
    }

    // 統計のメタデータを追加
    const metadata = {
      generatedAt: new Date().toISOString(),
      gameId,
      totalItems: stats.mechanics.length + stats.categories.length + stats.playerCounts.length,
      cacheKey: `game-stats-${gameId}`,
      version: '1.0'
    }

    // キャッシュヘッダーを設定（1分間のキャッシュ、5分間のstale-while-revalidate）
    return NextResponse.json({
      ...stats,
      metadata
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'ETag': `W/"stats-${gameId}-${Date.now()}"`,
        'Vary': 'Accept-Encoding'
      }
    })

  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game statistics' },
      { status: 500 }
    )
  }
}
