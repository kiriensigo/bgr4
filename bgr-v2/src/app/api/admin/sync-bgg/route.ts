import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getBggRankings, getGameDetail } from '@/lib/bgg-api'
import { convertBggToSiteData } from '@/lib/bgg-mapping'

// 管理者向けBGG同期エンドポイント
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // 管理者権限チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (!profile?.is_admin) {
      return NextResponse.json(
        { success: false, message: 'Admin privileges required' },
        { status: 403 }
      )
    }
    
    const { type = 'rankings' } = await request.json()
    
    if (type === 'rankings') {
      return await syncBggRankings(supabase)
    } else if (type === 'game') {
      const { gameId } = await request.json()
      return await syncSingleGame(supabase, gameId)
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid sync type' },
        { status: 400 }
      )
    }
    
  } catch (error) {
    console.error('BGG Sync Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error during BGG sync',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function syncBggRankings(supabase: any) {
  console.log('[ADMIN-SYNC] Starting BGG rankings sync...')
  
  const rankings = await getBggRankings('boardgame', 1)
  
  if (rankings.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No rankings data available',
      synced: 0
    })
  }
  
  let syncedCount = 0
  let errorCount = 0
  
  for (const rankingGame of rankings.slice(0, 10)) { // 最初の10件のみ処理（管理者操作）
    try {
      // 既存ゲームを検索
      const { data: existingGame } = await supabase
        .from('games')
        .select('id, bgg_id')
        .eq('bgg_id', rankingGame.id)
        .single()
      
      if (existingGame) {
        // ランキング情報更新
        const { error } = await supabase
          .from('games')
          .update({
            ranking_position: rankingGame.rank,
            ranking_updated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingGame.id)
          
        if (!error) {
          syncedCount++
        } else {
          console.error(`Failed to update ranking for game ${rankingGame.id}:`, error)
          errorCount++
        }
      } else {
        // 新しいゲームを詳細情報付きで登録
        const gameDetail = await getGameDetail(rankingGame.id)
        if (gameDetail) {
          const mappingResult = convertBggToSiteData(
            gameDetail.categories || [],
            gameDetail.mechanics || [],
            gameDetail.publishers || [],
            [], // bestPlayerCounts
            []  // recommendedPlayerCounts
          )
          
          const { error } = await supabase
            .from('games')
            .insert({
              bgg_id: gameDetail.id,
              name: gameDetail.name,
              description: gameDetail.description,
              year_published: gameDetail.yearPublished,
              min_players: gameDetail.minPlayers || 1,
              max_players: gameDetail.maxPlayers || 1,
              playing_time: gameDetail.playingTime,
              min_age: gameDetail.minAge,
              image_url: gameDetail.imageUrl,
              thumbnail_url: gameDetail.thumbnailUrl,
              
              // BGG original data
              bgg_categories: gameDetail.categories,
              bgg_mechanics: gameDetail.mechanics,
              bgg_publishers: gameDetail.publishers,
              
              // Site-specific mapped data
              site_categories: mappingResult.siteCategories,
              site_mechanics: mappingResult.siteMechanics,
              site_publishers: mappingResult.normalizedPublishers,
              
              designers: gameDetail.designers,
              rating_average: gameDetail.averageRating || 0,
              rating_count: gameDetail.ratingCount || 0,
              
              ranking_position: rankingGame.rank,
              ranking_updated_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            
          if (!error) {
            syncedCount++
          } else {
            console.error(`Failed to insert new game ${rankingGame.id}:`, error)
            errorCount++
          }
        }
      }
    } catch (error) {
      console.error(`Error processing game ${rankingGame.id}:`, error)
      errorCount++
    }
  }
  
  return NextResponse.json({
    success: true,
    message: 'BGG rankings sync completed',
    synced: syncedCount,
    errors: errorCount,
    total: rankings.length
  })
}

async function syncSingleGame(supabase: any, gameId: number) {
  if (!gameId) {
    return NextResponse.json(
      { success: false, message: 'Game ID is required' },
      { status: 400 }
    )
  }
  
  try {
    const gameDetail = await getGameDetail(gameId)
    if (!gameDetail) {
      return NextResponse.json(
        { success: false, message: 'Game not found in BGG' },
        { status: 404 }
      )
    }
    
    const mappingResult = convertBggToSiteData(
      gameDetail.categories || [],
      gameDetail.mechanics || [],
      gameDetail.publishers || [],
      [],
      []
    )
    
    // 既存ゲームチェック
    const { data: existingGame } = await supabase
      .from('games')
      .select('id')
      .eq('bgg_id', gameId)
      .single()
    
    if (existingGame) {
      // 既存ゲーム更新
      const { error } = await supabase
        .from('games')
        .update({
          name: gameDetail.name,
          description: gameDetail.description,
          year_published: gameDetail.yearPublished,
          min_players: gameDetail.minPlayers || 1,
          max_players: gameDetail.maxPlayers || 1,
          playing_time: gameDetail.playingTime,
          min_age: gameDetail.minAge,
          image_url: gameDetail.imageUrl,
          thumbnail_url: gameDetail.thumbnailUrl,
          
          bgg_categories: gameDetail.categories,
          bgg_mechanics: gameDetail.mechanics,
          bgg_publishers: gameDetail.publishers,
          
          site_categories: mappingResult.siteCategories,
          site_mechanics: mappingResult.siteMechanics,
          site_publishers: mappingResult.normalizedPublishers,
          
          designers: gameDetail.designers,
          rating_average: gameDetail.averageRating || 0,
          rating_count: gameDetail.ratingCount || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingGame.id)
        
      if (error) throw error
      
      return NextResponse.json({
        success: true,
        message: 'Game updated successfully',
        gameId: existingGame.id
      })
    } else {
      // 新規ゲーム作成
      const { data, error } = await supabase
        .from('games')
        .insert({
          bgg_id: gameDetail.id,
          name: gameDetail.name,
          description: gameDetail.description,
          year_published: gameDetail.yearPublished,
          min_players: gameDetail.minPlayers || 1,
          max_players: gameDetail.maxPlayers || 1,
          playing_time: gameDetail.playingTime,
          min_age: gameDetail.minAge,
          image_url: gameDetail.imageUrl,
          thumbnail_url: gameDetail.thumbnailUrl,
          
          bgg_categories: gameDetail.categories,
          bgg_mechanics: gameDetail.mechanics,
          bgg_publishers: gameDetail.publishers,
          
          site_categories: mappingResult.siteCategories,
          site_mechanics: mappingResult.siteMechanics,
          site_publishers: mappingResult.normalizedPublishers,
          
          designers: gameDetail.designers,
          rating_average: gameDetail.averageRating || 0,
          rating_count: gameDetail.ratingCount || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()
        
      if (error) throw error
      
      return NextResponse.json({
        success: true,
        message: 'Game created successfully',
        gameId: data.id
      })
    }
    
  } catch (error) {
    console.error('Single game sync error:', error)
    throw error
  }
}