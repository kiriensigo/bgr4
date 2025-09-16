import { NextRequest, NextResponse } from 'next/server'
import { getBggRankings } from '@/lib/bgg-api'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { BGGApiError } from '@/types/bgg'

// Cron jobエンドポイント（Netlify Functions対応）
export async function POST(request: NextRequest) {
  try {
    // 認証チェック（cron秘密キーまたは管理者権限）
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env['CRON_SECRET_KEY']
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('[CRON] Starting BGG rankings sync...')
    const supabase = await createServerSupabaseClient()
    
    // BGGランキングを取得
    const rankings = await getBggRankings('boardgame', 1)
    
    if (rankings.length === 0) {
      console.log('[CRON] No rankings data received from BGG')
      return NextResponse.json({
        success: true,
        message: 'No rankings data to sync',
        synced: 0
      })
    }
    
    let syncedCount = 0
    let errorCount = 0
    
    // 各ランキングゲームをデータベースと同期
    for (const rankingGame of rankings) {
      try {
        // 既存ゲームを検索
        const { data: existingGame } = await supabase
          .from('games')
          .select('id, bgg_id, ranking_position, ranking_updated_at')
          .eq('bgg_id', rankingGame.id)
          .single()
        
        if (existingGame) {
          // 既存ゲームのランキング情報を更新
          const { error: updateError } = await supabase
            .from('games')
            .update({
              ranking_position: rankingGame.rank,
              ranking_updated_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingGame.id)
            
          if (updateError) {
            console.error(`[CRON] Failed to update ranking for game ${rankingGame.id}:`, updateError)
            errorCount++
          } else {
            syncedCount++
          }
        } else {
          // 新しいゲームとして登録（自動登録機能を使用）
          try {
            const autoRegisterResponse = await fetch(`${process.env['NEXT_PUBLIC_APP_URL']}/api/games`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                bggId: rankingGame.id,
                auto_register: true
              })
            })
            
            if (autoRegisterResponse.ok) {
              // 新規登録したゲームにランキング情報を設定
              const { error: rankingError } = await supabase
                .from('games')
                .update({
                  ranking_position: rankingGame.rank,
                  ranking_updated_at: new Date().toISOString()
                })
                .eq('bgg_id', rankingGame.id)
                
              if (!rankingError) {
                syncedCount++
              }
            }
          } catch (registerError) {
            console.error(`[CRON] Failed to auto-register game ${rankingGame.id}:`, registerError)
            errorCount++
          }
        }
      } catch (error) {
        console.error(`[CRON] Error processing game ${rankingGame.id}:`, error)
        errorCount++
      }
    }
    
    console.log(`[CRON] BGG rankings sync completed: ${syncedCount} synced, ${errorCount} errors`)
    
    return NextResponse.json({
      success: true,
      message: 'BGG rankings sync completed',
      synced: syncedCount,
      errors: errorCount,
      total: rankings.length
    })
    
  } catch (error) {
    console.error('[CRON] BGG rankings sync failed:', error)
    
    if (error instanceof BGGApiError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'BGG API service temporarily unavailable',
          error: error.message 
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error during rankings sync',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'This endpoint only accepts POST requests for cron jobs'
  }, { status: 405 })
}