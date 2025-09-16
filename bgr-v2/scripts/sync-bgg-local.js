// ローカルBGG同期スクリプト（タイムアウト制限なし）
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 環境変数を読み込み
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// BGG同期設定
const BGG_SYNC_CONFIG = {
  MAX_BATCH_SIZE: 50, // 一度に処理するゲーム数
  RATE_LIMIT_MS: 1000, // BGG APIのレート制限（1秒に1リクエスト）
  RANKING_FETCH_LIMIT: 100, // BGGランキングから取得する上位ゲーム数
  CACHE_DURATION_HOURS: 6, // キャッシュの有効期間
  RETRY_ATTEMPTS: 3, // 失敗時のリトライ回数
  TIMEOUT_MS: 10000, // APIリクエストのタイムアウト
}

// BGG API関数
async function fetchBGGGameData(gameId) {
  try {
    console.log(`🔄 BGG ID ${gameId} からデータを取得中...`)

    const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&stats=1`, {
      signal: AbortSignal.timeout(BGG_SYNC_CONFIG.TIMEOUT_MS),
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

    const gameData = {
      id: gameId,
      name: nameMatch[1],
      year_published: yearMatch ? parseInt(yearMatch[1]) : null,
      min_players: minPlayersMatch ? parseInt(minPlayersMatch[1]) : null,
      max_players: maxPlayersMatch ? parseInt(maxPlayersMatch[1]) : null,
      playing_time: playingTimeMatch ? parseInt(playingTimeMatch[1]) : null,
      min_playing_time: minPlayingTimeMatch ? parseInt(minPlayingTimeMatch[1]) : null,
      max_playing_time: maxPlayingTimeMatch ? parseInt(maxPlayingTimeMatch[1]) : null,
      description: descriptionMatch ? descriptionMatch[1].replace(/<[^>]*>/g, '') : null,
      image_url: imageMatch ? imageMatch[1] : null,
      thumbnail_url: thumbnailMatch ? thumbnailMatch[1] : null,
      rating_average: ratingMatch ? parseFloat(ratingMatch[1]) : null,
      rating_count: ratingCountMatch ? parseInt(ratingCountMatch[1]) : null,
      rank: rankMatch ? parseInt(rankMatch[1]) : null,
    }

    console.log(`✅ ${gameData.name} のデータ取得成功`)
    return gameData
  } catch (error) {
    console.error(`❌ BGG ID ${gameId} の取得に失敗:`, error.message)
    return null
  }
}

// BGGホットゲームランキング取得
async function fetchBGGHotGames() {
  try {
    console.log('🔥 BGGホットランキングを取得中...')

    const response = await fetch('https://boardgamegeek.com/xmlapi2/hot?type=boardgame')
    if (!response.ok) {
      throw new Error(`BGG API error: ${response.status}`)
    }

    const xmlText = await response.text()
    const gameMatches = xmlText.match(/<item[^>]*id="(\d+)"[^>]*>/g)

    if (!gameMatches) {
      throw new Error('No hot games found')
    }

    const gameIds = gameMatches
      .map(match => {
        const idMatch = match.match(/id="(\d+)"/)
        return idMatch ? parseInt(idMatch[1]) : null
      })
      .filter(Boolean)

    console.log(`✅ ホットランキング ${gameIds.length} ゲーム取得完了`)
    return gameIds.slice(0, BGG_SYNC_CONFIG.RANKING_FETCH_LIMIT)
  } catch (error) {
    console.error('❌ ホットランキング取得に失敗:', error.message)
    return []
  }
}

// ゲームデータをデータベースに保存
async function saveGameToDatabase(gameData) {
  try {
    const { data: existingGame } = await supabase
      .from('games')
      .select('id')
      .eq('bgg_id', gameData.id)
      .single()

    const gameUpdateData = {
      bgg_id: gameData.id,
      name: gameData.name,
      year_published: gameData.year_published,
      min_players: gameData.min_players,
      max_players: gameData.max_players,
      playing_time: gameData.playing_time,
      min_playing_time: gameData.min_playing_time,
      max_playing_time: gameData.max_playing_time,
      description: gameData.description,
      image_url: gameData.image_url,
      thumbnail_url: gameData.thumbnail_url,
      rating_average: gameData.rating_average,
      rating_count: gameData.rating_count,
      updated_at: new Date().toISOString(),
    }

    if (existingGame) {
      // 既存ゲームを更新
      const { error } = await supabase
        .from('games')
        .update(gameUpdateData)
        .eq('id', existingGame.id)

      if (error) {
        throw error
      }
      console.log(`🔄 ${gameData.name} を更新しました`)
      return { action: 'updated', game: gameData }
    } else {
      // 新しいゲームを追加
      const { error } = await supabase.from('games').insert({
        ...gameUpdateData,
        created_at: new Date().toISOString(),
      })

      if (error) {
        throw error
      }
      console.log(`➕ ${gameData.name} を新規追加しました`)
      return { action: 'created', game: gameData }
    }
  } catch (error) {
    console.error(`❌ ${gameData.name} の保存に失敗:`, error.message)
    return { action: 'error', game: gameData, error: error.message }
  }
}

// メイン同期関数
async function syncBGGGames(syncType = 'rankings', gameIds = []) {
  console.log('🎲 BGG同期開始...')
  console.log(`📋 同期タイプ: ${syncType}`)

  let targetGameIds = []
  let syncStats = {
    total_processed: 0,
    successful_updates: 0,
    failed_updates: 0,
    skipped_updates: 0,
    new_games_added: 0,
    errors: [],
  }

  // 同期対象のゲームIDを決定
  switch (syncType) {
    case 'rankings':
      targetGameIds = await fetchBGGHotGames()
      break
    case 'specific_games':
      if (gameIds.length === 0) {
        console.error('❌ ゲームIDが指定されていません')
        return
      }
      targetGameIds = gameIds
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
      console.error('❌ 無効な同期タイプです')
      return
  }

  if (targetGameIds.length === 0) {
    console.log('ℹ️ 同期対象のゲームがありません')
    return
  }

  console.log(`🎯 同期対象: ${targetGameIds.length} ゲーム`)
  console.log('⏰ レート制限のため、1ゲームあたり1秒の間隔で処理します')
  console.log(`⏱️ 推定時間: ${Math.ceil(targetGameIds.length / 60)} 分\n`)

  // 各ゲームを順次処理
  for (let i = 0; i < targetGameIds.length; i++) {
    const gameId = targetGameIds[i]
    syncStats.total_processed++

    try {
      console.log(`\n[${i + 1}/${targetGameIds.length}] 処理中...`)

      // BGGからデータを取得
      const bggData = await fetchBGGGameData(gameId)

      if (!bggData) {
        syncStats.failed_updates++
        syncStats.errors.push(`Failed to fetch data for BGG ID ${gameId}`)
        continue
      }

      // データベースに保存
      const result = await saveGameToDatabase(bggData)

      if (result.action === 'created') {
        syncStats.new_games_added++
      } else if (result.action === 'updated') {
        syncStats.successful_updates++
      } else if (result.action === 'error') {
        syncStats.failed_updates++
        syncStats.errors.push(result.error)
      }

      // レート制限のため1秒待機（最後のゲームは待機不要）
      if (i < targetGameIds.length - 1) {
        console.log('⏳ レート制限のため1秒待機中...')
        await new Promise(resolve => setTimeout(resolve, BGG_SYNC_CONFIG.RATE_LIMIT_MS))
      }
    } catch (error) {
      console.error(`❌ ゲームID ${gameId} の処理でエラー:`, error.message)
      syncStats.failed_updates++
      syncStats.errors.push(`Error processing BGG ID ${gameId}: ${error.message}`)
    }
  }

  // 結果を表示
  console.log('\n🎉 BGG同期完了！')
  console.log('📊 同期結果:')
  console.log(`   - 総処理数: ${syncStats.total_processed}`)
  console.log(`   - 新規追加: ${syncStats.new_games_added}`)
  console.log(`   - 更新成功: ${syncStats.successful_updates}`)
  console.log(`   - 処理失敗: ${syncStats.failed_updates}`)
  console.log(`   - スキップ: ${syncStats.skipped_updates}`)

  if (syncStats.errors.length > 0) {
    console.log('\n❌ エラー一覧:')
    syncStats.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`)
    })
  }
}

// コマンドライン引数の処理
const args = process.argv.slice(2)
const syncType = args[0] || 'rankings'
const gameIds = args[1]
  ? args[1]
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id))
  : []

// 同期実行
syncBGGGames(syncType, gameIds)
  .then(() => {
    console.log('\n✅ 同期処理が正常に完了しました')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ 同期処理でエラーが発生しました:', error.message)
    process.exit(1)
  })

