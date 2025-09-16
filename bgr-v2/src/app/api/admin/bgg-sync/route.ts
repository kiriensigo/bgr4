import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

// BGG同期の設定
const BGG_SYNC_CONFIG = {
  MAX_BATCH_SIZE: 50,          // 一度に処理するゲーム数
  RATE_LIMIT_MS: 1000,         // BGG APIのレート制限（1秒に1リクエスト）
  RANKING_FETCH_LIMIT: 100,    // BGGランキングから取得する上位ゲーム数
  CACHE_DURATION_HOURS: 6,     // キャッシュの有効期間
  RETRY_ATTEMPTS: 3,           // 失敗時のリトライ回数
  TIMEOUT_MS: 10000           // APIリクエストのタイムアウト
}

const syncRequestSchema = z.object({
  sync_type: z.enum(['rankings', 'specific_games', 'full_sync']),
  game_ids: z.array(z.number()).optional(),
  force_update: z.boolean().default(false)
})

interface BGGGameData {
  id: number
  name: string
  year_published?: number
  min_players?: number
  max_players?: number
  playing_time?: number
  min_playing_time?: number
  max_playing_time?: number
  description?: string
  image_url?: string
  thumbnail_url?: string
  mechanics?: string[]
  categories?: string[]
  designers?: string[]
  publishers?: string[]
  rating_average?: number
  rating_count?: number
  rank?: number
}

// BGG API関数
async function fetchBGGGameData(gameId: number): Promise<BGGGameData | null> {
  try {
    const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&stats=1`, {
      signal: AbortSignal.timeout(BGG_SYNC_CONFIG.TIMEOUT_MS)
    })

    if (!response.ok) {
      throw new Error(`BGG API error: ${response.status}`)
    }

    const xmlText = await response.text()
    
    // XMLパースの代わりに正規表現でデータを抽出（簡易実装）
    const nameMatch = xmlText.match(/<name[^>]*type="primary"[^>]*value="([^"]+)"/i)
    const yearMatch = xmlText.match(/<yearpublished[^>]*value="(\d+)"/i)
    const minPlayersMatch = xmlText.match(/<minplayers[^>]*value="(\d+)"/i)
    const maxPlayersMatch = xmlText.match(/<maxplayers[^>]*value="(\d+)"/i)
    const playingTimeMatch = xmlText.match(/<playingtime[^>]*value="(\d+)"/i)
    const minPlayingTimeMatch = xmlText.match(/<minplaytime[^>]*value="(\d+)"/i)
    const maxPlayingTimeMatch = xmlText.match(/<maxplaytime[^>]*value="(\d+)"/i)
    const descriptionMatch = xmlText.match(/<description>([\s\S]*?)<\/description>/i)
    const imageMatch = xmlText.match(/<image>(.*?)<\/image>/i)
    const thumbnailMatch = xmlText.match(/<thumbnail>(.*?)<\/thumbnail>/i)
    const ratingMatch = xmlText.match(/<average[^>]*value="([^"]+)"/i)
    const ratingCountMatch = xmlText.match(/<usersrated[^>]*value="(\d+)"/i)
    const rankMatch = xmlText.match(/<rank[^>]*type="subtype"[^>]*value="(\d+)"/i)

    if (!nameMatch) {
      throw new Error('Game name not found in BGG response')
    }

    const gameData: BGGGameData = {
      id: gameId,
      name: nameMatch[1]!,
      year_published: yearMatch ? parseInt(yearMatch[1]!) : undefined,
      min_players: minPlayersMatch ? parseInt(minPlayersMatch[1]!) : undefined,
      max_players: maxPlayersMatch ? parseInt(maxPlayersMatch[1]!) : undefined,
      playing_time: playingTimeMatch ? parseInt(playingTimeMatch[1]!) : undefined,
      min_playing_time: minPlayingTimeMatch ? parseInt(minPlayingTimeMatch[1]!) : undefined,
      max_playing_time: maxPlayingTimeMatch ? parseInt(maxPlayingTimeMatch[1]!) : undefined,
      description: descriptionMatch ? descriptionMatch[1]!.replace(/<[^>]*>/g, '') : undefined,
      image_url: imageMatch?.[1] || undefined,
      thumbnail_url: thumbnailMatch?.[1] || undefined,
      rating_average: ratingMatch ? parseFloat(ratingMatch[1]!) : undefined,
      rating_count: ratingCountMatch ? parseInt(ratingCountMatch[1]!) : undefined,
      rank: rankMatch ? parseInt(rankMatch[1]!) : undefined
    }

    return gameData

  } catch (error) {
    console.error(`Failed to fetch BGG data for game ${gameId}:`, error)
    return null
  }
}

async function fetchBGGHotGames(): Promise<number[]> {
  try {
    const response = await fetch('https://boardgamegeek.com/xmlapi2/hot?type=boardgame', {
      signal: AbortSignal.timeout(BGG_SYNC_CONFIG.TIMEOUT_MS)
    })

    if (!response.ok) {
      throw new Error(`BGG Hot API error: ${response.status}`)
    }

    const xmlText = await response.text()
    const gameIds: number[] = []
    
    // XMLから<item>タグのid属性を抽出
    const itemMatches = xmlText.matchAll(/<item[^>]*id="(\d+)"/g)
    for (const match of itemMatches) {
      gameIds.push(parseInt(match[1]!))
    }

    return gameIds.slice(0, BGG_SYNC_CONFIG.RANKING_FETCH_LIMIT)

  } catch (error) {
    console.error('Failed to fetch BGG hot games:', error)
    return []
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 認証・権限チェック
async function requireAdminAuth(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Authentication required')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    throw new Error('Admin access required')
  }

  return user
}

// POST /api/admin/bgg-sync - BGG同期実行
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    await requireAdminAuth(supabase)

    const body = await request.json()
    const validatedData = syncRequestSchema.parse(body)

    const { sync_type, game_ids, force_update } = validatedData

    let targetGameIds: number[] = []
    let syncStats = {
      total_processed: 0,
      successful_updates: 0,
      failed_updates: 0,
      skipped_updates: 0,
      new_games_added: 0,
      errors: [] as string[]
    }

    // 同期対象のゲームIDを決定
    switch (sync_type) {
      case 'rankings':
        // BGGホットゲームランキングを取得
        targetGameIds = await fetchBGGHotGames()
        break

      case 'specific_games':
        if (!game_ids || game_ids.length === 0) {
          return NextResponse.json(
            { success: false, message: 'Game IDs required for specific games sync' },
            { status: 400 }
          )
        }
        targetGameIds = game_ids
        break

      case 'full_sync':
        // 既存のBGGゲーム全てを同期
        const { data: existingGames } = await supabase
          .from('games')
          .select('bgg_id')
          .not('bgg_id', 'is', null)
          .limit(BGG_SYNC_CONFIG.RANKING_FETCH_LIMIT)

        targetGameIds = existingGames?.map(g => g.bgg_id).filter(Boolean) || []
        break

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid sync type' },
          { status: 400 }
        )
    }

    if (targetGameIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: syncStats,
        message: 'No games to sync'
      })
    }

    // バッチ処理でゲームを同期
    const batches = []
    for (let i = 0; i < targetGameIds.length; i += BGG_SYNC_CONFIG.MAX_BATCH_SIZE) {
      batches.push(targetGameIds.slice(i, i + BGG_SYNC_CONFIG.MAX_BATCH_SIZE))
    }

    for (const batch of batches) {
      for (const gameId of batch) {
        try {
          syncStats.total_processed++

          // キャッシュチェック（force_updateでない場合）
          if (!force_update) {
            const { data: existingGame } = await supabase
              .from('games')
              .select('updated_at')
              .eq('bgg_id', gameId)
              .single()

            if (existingGame) {
              const lastUpdate = new Date(existingGame.updated_at)
              const cacheExpiry = new Date(Date.now() - BGG_SYNC_CONFIG.CACHE_DURATION_HOURS * 60 * 60 * 1000)
              
              if (lastUpdate > cacheExpiry) {
                syncStats.skipped_updates++
                continue
              }
            }
          }

          // BGGからデータを取得
          const bggData = await fetchBGGGameData(gameId)
          
          if (!bggData) {
            syncStats.failed_updates++
            syncStats.errors.push(`Failed to fetch data for BGG ID ${gameId}`)
            continue
          }

          // データベースに保存
          const gameUpdateData = {
            bgg_id: bggData.id,
            name: bggData.name,
            year_published: bggData.year_published,
            min_players: bggData.min_players,
            max_players: bggData.max_players,
            playing_time: bggData.playing_time,
            min_playing_time: bggData.min_playing_time,
            max_playing_time: bggData.max_playing_time,
            description: bggData.description,
            image_url: bggData.image_url,
            thumbnail_url: bggData.thumbnail_url,
            rating_average: bggData.rating_average,
            rating_count: bggData.rating_count,
            updated_at: new Date().toISOString()
          }

          const { data: existingGame } = await supabase
            .from('games')
            .select('id')
            .eq('bgg_id', gameId)
            .single()

          if (existingGame) {
            // 既存ゲームを更新
            const { error: updateError } = await supabase
              .from('games')
              .update(gameUpdateData)
              .eq('bgg_id', gameId)

            if (updateError) {
              syncStats.failed_updates++
              syncStats.errors.push(`Update failed for BGG ID ${gameId}: ${updateError.message}`)
            } else {
              syncStats.successful_updates++
            }
          } else {
            // 新しいゲームを追加
            const { error: insertError } = await supabase
              .from('games')
              .insert(gameUpdateData)

            if (insertError) {
              syncStats.failed_updates++
              syncStats.errors.push(`Insert failed for BGG ID ${gameId}: ${insertError.message}`)
            } else {
              syncStats.new_games_added++
              syncStats.successful_updates++
            }
          }

          // レート制限を遵守
          await sleep(BGG_SYNC_CONFIG.RATE_LIMIT_MS)

        } catch (error) {
          syncStats.failed_updates++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          syncStats.errors.push(`Error processing BGG ID ${gameId}: ${errorMessage}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        sync_type,
        target_game_count: targetGameIds.length,
        ...syncStats,
        completed_at: new Date().toISOString()
      },
      message: `BGG sync completed: ${syncStats.successful_updates} successful, ${syncStats.failed_updates} failed`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation error',
          errors: error.issues.map(issue => issue.message)
        },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('required')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message.includes('Authentication') ? 401 : 403 }
      )
    }

    console.error('BGG sync error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/admin/bgg-sync/status - BGG同期ステータス取得
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    await requireAdminAuth(supabase)

    // 最近の同期統計を取得
    const { data: recentGames } = await supabase
      .from('games')
      .select('bgg_id, updated_at, name')
      .not('bgg_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10)

    // BGGゲームの統計
    const { data: bggGamesCount } = await supabase
      .from('games')
      .select('id', { count: 'exact' })
      .not('bgg_id', 'is', null)

    const { data: totalGamesCount } = await supabase
      .from('games')
      .select('id', { count: 'exact' })

    // 最後の同期から6時間以上経過したゲーム数
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    const { data: staleGamesCount } = await supabase
      .from('games')
      .select('id', { count: 'exact' })
      .not('bgg_id', 'is', null)
      .lt('updated_at', sixHoursAgo)

    return NextResponse.json({
      success: true,
      data: {
        total_games: totalGamesCount?.length || 0,
        bgg_games: bggGamesCount?.length || 0,
        stale_games: staleGamesCount?.length || 0,
        coverage_percentage: totalGamesCount?.length 
          ? Math.round((bggGamesCount?.length || 0) / totalGamesCount.length * 100)
          : 0,
        recent_synced_games: recentGames || [],
        last_check: new Date().toISOString(),
        sync_config: BGG_SYNC_CONFIG
      }
    })

  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.message.includes('Authentication') ? 401 : 403 }
      )
    }

    console.error('BGG sync status error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}