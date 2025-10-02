import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getGameDetailForAutoRegistration } from '@/lib/bgg-api'
import { convertBggToSiteData } from '@/lib/bgg-mapping'
import { getBggGameDetails } from '@/lib/bgg'

const MIN_VISIBLE_PERCENTAGE = 30

type StatItem = {
  name: string
  reviewVotes: number
  bggVotes: number
  totalVotes: number
  totalReviews: number
  percentage: number
  displayPriority: 'highlight' | 'normal' | 'hidden'
}

type GameRowData = {
  mechanics: string[] | null
  categories: string[] | null
  bgg_id: number | string | null
  bgg_best_players: (string | number)[] | null
  bgg_recommended_players: (string | number)[] | null
}

type FallbackGameRow = {
  mechanics: string[] | null
  categories: string[] | null
  bgg_id: number | string | null
}

const normalizePlayerCounts = (values: unknown): number[] => {
  if (!Array.isArray(values)) return []
  const parsed = values
    .map((value) => {
      const parsedValue = typeof value === 'number' ? value : parseInt(String(value), 10)
      return Number.isNaN(parsedValue) ? null : parsedValue
    })
    .filter((value): value is number => value !== null)
  return Array.from(new Set(parsed))
}

const formatPlayerCountName = (count: number): string => {
  if (count >= 7) {
    // 7 以上は 6 人以上として扱う（6 人超の統合）
    return '6人以上'
  }
  return `${count}人`
}

const createSeedPlayerItem = (count: number, type: 'best' | 'recommended'): StatItem => {
  const isBest = type === 'best'
  const percentage = isBest ? 70 : 50
  const votes = isBest ? 10 : 7

  return {
    name: formatPlayerCountName(count),
    reviewVotes: 0,
    bggVotes: votes,
    totalVotes: votes,
    totalReviews: 0,
    percentage,
    displayPriority: isBest ? 'highlight' : 'normal',
  }
}

const formatStats = (data: any[]): StatItem[] => {
  return (data || [])
    .filter((item) => parseFloat(item.percentage) >= MIN_VISIBLE_PERCENTAGE)
    .map((item) => ({
      name: item.mechanic_name || item.category_name || item.player_count_name,
      reviewVotes: parseInt(item.review_votes || '0'),
      bggVotes: parseInt(item.bgg_votes || '0'),
      totalVotes: parseInt(item.total_votes || '0'),
      totalReviews: parseInt(item.total_reviews || '0'),
      percentage: parseFloat(item.percentage || '0'),
      displayPriority: (item.display_priority as 'highlight' | 'normal' | 'hidden') ?? 'normal',
    }))
    .sort((a, b) => b.percentage - a.percentage)
}

const formatPlayerCountStats = (
  data: any[],
  bestCounts: number[],
  recommendedCounts: number[],
): StatItem[] => {
  const allowedCounts = new Set([...bestCounts, ...recommendedCounts])
  const items = (data || [])
    .map((item) => {
      const rawName = String(item.player_count_name ?? '')
      const numericMatch = rawName.match(/\d+/)
      const numericCount = numericMatch ? parseInt(numericMatch[0], 10) : Number.NaN

      if (Number.isNaN(numericCount)) {
        return null
      }

      return {
        numericCount,
        name: formatPlayerCountName(numericCount),
        reviewVotes: parseInt(item.review_votes || '0'),
        bggVotes: parseInt(item.bgg_votes || '0'),
        totalVotes: parseInt(item.total_votes || '0'),
        totalReviews: parseInt(item.total_reviews || '0'),
        percentage: parseFloat(item.percentage || '0'),
        displayPriority: (item.display_priority as 'highlight' | 'normal' | 'hidden') ?? 'normal',
      }
    })
    .filter((item): item is StatItem & { numericCount: number } => item !== null)
    .filter((item) => allowedCounts.size === 0 || allowedCounts.has(item.numericCount))

  if (items.length === 0 && allowedCounts.size > 0) {
    const seeds: StatItem[] = []
    bestCounts.forEach((count) => seeds.push(createSeedPlayerItem(count, 'best')))
    recommendedCounts
      .filter((count) => !bestCounts.includes(count))
      .forEach((count) => seeds.push(createSeedPlayerItem(count, 'recommended')))
    return seeds
  }

  const deduped = new Map<number, StatItem>()
  items.forEach(({ numericCount, ...rest }) => {
    const existing = deduped.get(numericCount)
    if (!existing || existing.percentage < rest.percentage) {
      deduped.set(numericCount, rest)
    }
  })

  return Array.from(deduped.entries())
    .sort((a, b) => {
      if (a[1].percentage === b[1].percentage) {
        return b[0] - a[0]
      }
      return b[1].percentage - a[1].percentage
    })
    .map(([, item]) => item)
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const gameId = parseInt(id)

    if (Number.isNaN(gameId)) {
      return NextResponse.json(
        { error: 'Invalid game ID' },
        { status: 400 },
      )
    }

    const supabase = await createServerSupabaseClient()

    const [mechanicsResult, categoriesResult, playerCountResult] = await Promise.all([
      // @ts-ignore - RPC は Supabase 型定義に含まれていない
      supabase.rpc('get_weighted_mechanics_stats', { target_game_id: gameId }),
      // @ts-ignore - RPC は Supabase 型定義に含まれていない
      supabase.rpc('get_weighted_categories_stats', { target_game_id: gameId }),
      // @ts-ignore - RPC は Supabase 型定義に含まれていない
      supabase.rpc('get_weighted_player_count_stats', { target_game_id: gameId }),
    ])

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

    const gameRowResponse = await supabase
      .from('games')
      .select('mechanics, categories, bgg_id, bgg_best_players, bgg_recommended_players')
      .eq('id', gameId)
      .single()

    const gameRow = gameRowResponse.data as GameRowData | null

    const rawBestCounts = normalizePlayerCounts(gameRow?.bgg_best_players)
    let bestPlayerCounts = [...rawBestCounts]
    const rawRecommendedCounts = normalizePlayerCounts(gameRow?.bgg_recommended_players)
    let recommendedPlayerCounts = rawRecommendedCounts.filter((count) => !bestPlayerCounts.includes(count))

    const numericBggId = typeof gameRow?.bgg_id === 'number'
      ? gameRow.bgg_id
      : parseInt(String(gameRow?.bgg_id || ''), 10)

    if ((bestPlayerCounts.length === 0 || recommendedPlayerCounts.length === 0) && !Number.isNaN(numericBggId)) {
      try {
        const detail = await getBggGameDetails(numericBggId)
        if (detail) {
          if (bestPlayerCounts.length === 0) {
            bestPlayerCounts = normalizePlayerCounts((detail as any).bestPlayerCounts)
          }
          if (recommendedPlayerCounts.length === 0) {
            const fallback = normalizePlayerCounts((detail as any).recommendedPlayerCounts)
            recommendedPlayerCounts = fallback.filter((count) => !bestPlayerCounts.includes(count))
          }
        }
      } catch (error) {
        console.warn('Failed to load BGG poll data for player counts:', error)
      }
    }

    const stats = {
      mechanics: formatStats((mechanicsResult as any).data || []),
      categories: formatStats((categoriesResult as any).data || []),
      playerCounts: formatPlayerCountStats(
        (playerCountResult as any).data || [],
        bestPlayerCounts,
        recommendedPlayerCounts,
      ),
    }

    if (stats.mechanics.length === 0 || stats.categories.length === 0) {
      let fallbackGameRow: FallbackGameRow | null = gameRow
      if (!fallbackGameRow && !gameRowResponse.error) {
        const fallbackResponse = await supabase
          .from('games')
          .select('mechanics, categories, bgg_id')
          .eq('id', gameId)
          .single()
        fallbackGameRow = fallbackResponse.data as FallbackGameRow | null
      }

      if (fallbackGameRow) {
        const seedVotes = 10
        if (stats.mechanics.length === 0 && Array.isArray(fallbackGameRow.mechanics) && fallbackGameRow.mechanics.length > 0) {
          stats.mechanics = (fallbackGameRow.mechanics as string[]).map((name: string) => ({
            name,
            reviewVotes: 0,
            bggVotes: seedVotes,
            totalVotes: seedVotes,
            totalReviews: 0,
            percentage: 100,
            displayPriority: 'normal' as const,
          }))
        }
        if (stats.categories.length === 0 && Array.isArray(fallbackGameRow.categories) && fallbackGameRow.categories.length > 0) {
          stats.categories = (fallbackGameRow.categories as string[]).map((name: string) => ({
            name,
            reviewVotes: 0,
            bggVotes: seedVotes,
            totalVotes: seedVotes,
            totalReviews: 0,
            percentage: 100,
            displayPriority: 'normal' as const,
          }))
        }

        if ((stats.mechanics.length === 0 || stats.categories.length === 0) && !Number.isNaN(numericBggId)) {
          try {
            const enhanced = await getGameDetailForAutoRegistration(numericBggId)
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
          } catch (error) {
            console.warn('Fallback BGG conversion failed for stats seed:', error)
          }
        }
      }
    }

    const metadata = {
      generatedAt: new Date().toISOString(),
      gameId,
      totalItems: stats.mechanics.length + stats.categories.length + stats.playerCounts.length,
      cacheKey: `game-stats-${gameId}`,
      version: '1.0',
    }

    return NextResponse.json({
      ...stats,
      metadata,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'ETag': `W/"stats-${gameId}-${Date.now()}"`,
        'Vary': 'Accept-Encoding',
      },
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game statistics' },
      { status: 500 },
    )
  }
}
