import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getGameDetailForAutoRegistration } from '@/lib/bgg-api'
// import { convertBggToSiteData } from '@/lib/bgg-mapping'
import { translateToJapanese } from '@/lib/translate'

export async function POST(request: NextRequest) {
  try {
    const { bggId } = await request.json()
    
    if (!bggId || typeof bggId !== 'number') {
      return NextResponse.json(
        { success: false, message: 'Valid BGG ID is required' },
        { status: 400 }
      )
    }

    

    // Authorizationヘッダーからトークンを取得
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authorization token required' },
        { status: 401 }
      )
    }

    // Service Role Keyを使ってSupabaseクライアント作成（管理者権限）
    const supabase = createServerClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!,
      {
        cookies: {
          get() { return undefined },
          set() {},
          remove() {},
        },
        auth: {
          persistSession: false,
        },
      }
    )

    // トークンを使ってユーザー認証
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // 既存のBGG IDをチェック
    const { data: existingGame } = await supabase
      .from('games')
      .select('id, name')
      .eq('bgg_id', bggId)
      .single()

    if (existingGame) {
      return NextResponse.json(
        { 
          success: false, 
          message: `このゲーム「${existingGame.name}」は既に登録されています`,
          existingGameId: existingGame.id
        },
        { status: 409 }
      )
    }

    // BGG APIから日本語版判定付きでゲームデータを取得
    const gameRegistrationData = await getGameDetailForAutoRegistration(bggId)
    
    if (!gameRegistrationData) {
      return NextResponse.json(
        { success: false, message: 'BGG からゲーム情報を取得できませんでした' },
        { status: 404 }
      )
    }

    const { gameDetail: bggGameData, registrationData } = gameRegistrationData

    console.log(`Registering game with decision: ${registrationData.reason}`)
    console.log(`Using name: ${registrationData.useName}`)
    console.log(`Using publisher: ${registrationData.usePublisher}`)

    // BGGデータをサイト向けに変換
    // bggGameData.categories / mechanics は既にサイト向けにマッピング済み
    // ここでの再変換は行わない（再変換すると空になるケースがある）

    // ゲーム説明文を日本語に翻訳
    let translatedDescription = bggGameData.description
    if (bggGameData.description && bggGameData.description.trim().length > 0) {
      try {
        const translationResult = await translateToJapanese(bggGameData.description)
        translatedDescription = translationResult.translatedText
        console.log(`Translation completed: ${bggGameData.description.substring(0, 100)}... -> ${translatedDescription.substring(0, 100)}...`)
      } catch (error) {
        console.warn('Translation failed, using original description:', error)
        // Keep original description if translation fails
      }
    }

    // 日本語版情報を含む追加データベースフィールド用のデータ
    const japaneseVersionData: any = {}
    
    // 既存のname_japaneseフィールドを使用
    if (bggGameData.japaneseName) {
      japaneseVersionData.name_japanese = bggGameData.japaneseName
    }
    
    // 他の日本語版情報は将来のフィールド追加まで一時的にコメントアウト
    /*
    if (bggGameData.japanesePublisher) {
      japaneseVersionData.japanese_publisher = bggGameData.japanesePublisher
    }
    
    if (bggGameData.japaneseReleaseDate) {
      japaneseVersionData.japanese_release_date = bggGameData.japaneseReleaseDate
    }
    
    if (bggGameData.japaneseImageUrl) {
      japaneseVersionData.japanese_image_url = bggGameData.japaneseImageUrl
    }

    // 登録判定データ（デバッグ用）
    japaneseVersionData.registration_decision = registrationData.reason
    */

    // データベースに保存するゲームデータを構築（日本語版優先）
    const gameData: any = {
      // Use BGG ID as primary key for BGG-imported records
      id: bggGameData.id,
      bgg_id: bggGameData.id,
      name: registrationData.useName, // 日本語版優先の名前
      description: translatedDescription, // 翻訳された説明文を使用
      year_published: bggGameData.yearPublished,
      min_players: bggGameData.minPlayers,
      max_players: bggGameData.maxPlayers,
      playing_time: bggGameData.playingTime,
      min_playing_time: bggGameData.minPlayingTime,
      max_playing_time: bggGameData.maxPlayingTime,
      min_age: bggGameData.minAge,
      image_url: bggGameData.japaneseImageUrl || bggGameData.imageUrl, // 日本語版画像を優先
      thumbnail_url: bggGameData.thumbnailUrl,
      // 変換されたサイト向けデータ
      // Use mapped site data as-is; empty is allowed by design
      categories: bggGameData.categories || [],
      mechanics: bggGameData.mechanics || [],
      designers: bggGameData.designers,
      // パブリッシャーは指定がなければ空を許容
      publishers: registrationData.usePublisher ? [registrationData.usePublisher] : [],
      rating_average: bggGameData.averageRating,
      rating_count: bggGameData.ratingCount,
      // 日本語版情報を追加
      ...japaneseVersionData
    }

    console.log('[register-from-bgg] Prepared insert payload', {
      bgg_id: gameData.bgg_id,
      name: gameData.name,
      min_players: gameData.min_players,
      max_players: gameData.max_players,
      playing_time: gameData.playing_time,
      min_playing_time: gameData.min_playing_time,
      max_playing_time: gameData.max_playing_time,
      categories_len: Array.isArray(gameData.categories) ? gameData.categories.length : null,
      mechanics_len: Array.isArray(gameData.mechanics) ? gameData.mechanics.length : null,
      publishers_len: Array.isArray(gameData.publishers) ? gameData.publishers.length : null,
    })

    // データベースにゲームを登録
    const { data: newGame, error: insertError } = await supabase
      .from('games')
      .insert(gameData)
      .select('*')
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { success: false, message: 'ゲームの登録に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'ゲームが正常に登録されました',
      data: newGame
    })

  } catch (error) {
    console.error('BGG game registration error:', error)
    return NextResponse.json(
      { success: false, message: '内部サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}


