'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase'
import { ValidationError } from '@/domain/errors/DomainErrors'

// 手動ゲーム登録用スキーマ
const ManualGameSchema = z.object({
  nameEnglish: z.string().optional(),
  nameJapanese: z.string().optional(),
  description: z.string().optional(),
  yearPublished: z.string().optional(),
  minPlayers: z.string().min(1, "最小人数は必須です"),
  maxPlayers: z.string().min(1, "最大人数は必須です"),
  minPlayingTime: z.string().min(1, "最小プレイ時間は必須です"),
  maxPlayingTime: z.string().min(1, "最大プレイ時間は必須です"),
  imageUrl: z.string().min(1, "画像URLは必須です"),
  designers: z.string().optional(),
  publishers: z.string().optional(),
  
  // カテゴリーBoolean列
  cat_acting: z.boolean().default(false),
  cat_animals: z.boolean().default(false),
  cat_bluffing: z.boolean().default(false),
  cat_cardgame: z.boolean().default(false),
  cat_children: z.boolean().default(false),
  cat_deduction: z.boolean().default(false),
  cat_legacy_campaign: z.boolean().default(false),
  cat_memory: z.boolean().default(false),
  cat_negotiation: z.boolean().default(false),
  cat_paper_pen: z.boolean().default(false),
  cat_party: z.boolean().default(false),
  cat_puzzle: z.boolean().default(false),
  cat_solo: z.boolean().default(false),
  cat_pair: z.boolean().default(false),
  cat_multiplayer: z.boolean().default(false),
  cat_trivia: z.boolean().default(false),
  cat_wargame: z.boolean().default(false),
  cat_word: z.boolean().default(false),
  
  // メカニクスBoolean列
  mech_area_control: z.boolean().default(false),
  mech_auction: z.boolean().default(false),
  mech_betting: z.boolean().default(false),
  mech_cooperative: z.boolean().default(false),
  mech_deckbuild: z.boolean().default(false),
  mech_dice: z.boolean().default(false),
  mech_draft: z.boolean().default(false),
  mech_engine_build: z.boolean().default(false),
  mech_hidden_roles: z.boolean().default(false),
  mech_modular_board: z.boolean().default(false),
  mech_route_build: z.boolean().default(false),
  mech_burst: z.boolean().default(false),
  mech_set_collection: z.boolean().default(false),
  mech_simultaneous: z.boolean().default(false),
  mech_tile_placement: z.boolean().default(false),
  mech_variable_powers: z.boolean().default(false),
  
  // 認証用トークン
  accessToken: z.string().optional()
})

type ManualGameInput = z.infer<typeof ManualGameSchema>

export async function createManualGame(input: ManualGameInput) {
  try {
    console.log('🚀 サーバーアクション開始 - createManualGame')
    console.log('📥 受信データ:', input)
    
    // バリデーション
    const validatedInput = ManualGameSchema.parse(input)
    console.log('✅ バリデーション成功:', validatedInput)
    
    // ゲーム名のバリデーション（英語名または日本語名が必要）
    if (!validatedInput.nameEnglish && !validatedInput.nameJapanese) {
      throw new Error('ゲーム名（英語名または日本語名）は必須です')
    }
    
    // 認証確認 - アクセストークンが提供されている場合はそれを使用
    const supabase = await createServerSupabaseClient()
    
    let user = null
    
    if (validatedInput.accessToken) {
      // クライアントからアクセストークンが提供された場合
      console.log('🔑 Using provided access token for authentication')
      
      // アクセストークンでSupabaseクライアントのセッションを設定
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(validatedInput.accessToken)
      
      if (tokenError || !tokenUser) {
        console.error('🚨 Token Auth Error:', tokenError)
        throw new Error(`認証エラー: ${tokenError?.message || 'ユーザー情報の取得に失敗しました'}`)
      }
      
      // セッションをSupabaseクライアントに設定
      await supabase.auth.setSession({
        access_token: validatedInput.accessToken,
        refresh_token: '' // リフレッシュトークンは不要
      })
      
      user = tokenUser
      
      console.log('🔐 Token-based Auth Success:', {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email
      })
    } else {
      // 従来のクッキーベース認証を試行
      console.log('🍪 Trying cookie-based authentication')
      
      const { data: { user: cookieUser }, error: cookieError } = await supabase.auth.getUser()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      user = cookieUser || session?.user
      
      console.log('🔐 Cookie-based Auth Check:', {
        cookieAuth: {
          hasUser: !!cookieUser,
          error: cookieError?.message
        },
        sessionAuth: {
          hasSession: !!session,
          hasUser: !!session?.user,
          error: sessionError?.message
        },
        finalUser: {
          hasUser: !!user,
          userId: user?.id
        }
      })
    }
    
    if (!user) {
      console.error('🚨 No User Found in Session')
      throw new Error('認証が必要です。ログインしてください。')
    }

    // ゲーム名を決定（日本語名優先、なければ英語名）
    const gameName = validatedInput.nameJapanese || validatedInput.nameEnglish || 'Unnamed Game'
    
    // 数値変換
    const minPlayers = parseInt(validatedInput.minPlayers)
    const maxPlayers = parseInt(validatedInput.maxPlayers)
    const minPlayingTime = parseInt(validatedInput.minPlayingTime)
    const maxPlayingTime = parseInt(validatedInput.maxPlayingTime)
    const yearPublished = validatedInput.yearPublished ? parseInt(validatedInput.yearPublished) : null
    
    // プレイ時間の平均値を計算
    const averagePlayTime = Math.round((minPlayingTime + maxPlayingTime) / 2)

    // カテゴリーとメカニクスを文字列配列として構築
    const categories: string[] = []
    const mechanics: string[] = []
    
    // カテゴリーのマッピング
    if (validatedInput.cat_acting) categories.push('演技')
    if (validatedInput.cat_animals) categories.push('動物')
    if (validatedInput.cat_bluffing) categories.push('ブラフ')
    if (validatedInput.cat_cardgame) categories.push('カードゲーム')
    if (validatedInput.cat_children) categories.push('子供向け')
    if (validatedInput.cat_deduction) categories.push('推理')
    if (validatedInput.cat_legacy_campaign) categories.push('レガシー・キャンペーン')
    if (validatedInput.cat_memory) categories.push('記憶')
    if (validatedInput.cat_negotiation) categories.push('交渉')
    if (validatedInput.cat_paper_pen) categories.push('紙ペン')
    if (validatedInput.cat_party) categories.push('パーティー')
    if (validatedInput.cat_puzzle) categories.push('パズル')
    if (validatedInput.cat_solo) categories.push('ソロ向き')
    if (validatedInput.cat_pair) categories.push('ペア向き')
    if (validatedInput.cat_multiplayer) categories.push('多人数向き')
    if (validatedInput.cat_trivia) categories.push('トリテ')
    if (validatedInput.cat_wargame) categories.push('ウォーゲーム')
    if (validatedInput.cat_word) categories.push('ワードゲーム')
    
    // メカニクスのマッピング
    if (validatedInput.mech_area_control) mechanics.push('エリア支配')
    if (validatedInput.mech_auction) mechanics.push('オークション')
    if (validatedInput.mech_betting) mechanics.push('賭け')
    if (validatedInput.mech_cooperative) mechanics.push('協力')
    if (validatedInput.mech_deckbuild) mechanics.push('デッキ/バッグビルド')
    if (validatedInput.mech_dice) mechanics.push('ダイスロール')
    if (validatedInput.mech_draft) mechanics.push('ドラフト')
    if (validatedInput.mech_engine_build) mechanics.push('エンジンビルド')
    if (validatedInput.mech_hidden_roles) mechanics.push('正体隠匿')
    if (validatedInput.mech_modular_board) mechanics.push('モジュラーボード')
    if (validatedInput.mech_route_build) mechanics.push('ルート構築')
    if (validatedInput.mech_burst) mechanics.push('バースト')
    if (validatedInput.mech_set_collection) mechanics.push('セット収集')
    if (validatedInput.mech_simultaneous) mechanics.push('同時手番')
    if (validatedInput.mech_tile_placement) mechanics.push('タイル配置')
    if (validatedInput.mech_variable_powers) mechanics.push('プレイヤー別能力')

    // Admin クライアントでRLSをバイパスして挿入
    console.log('💾 データベース挿入開始 - Admin権限使用')
    const { data: game, error: insertError } = await supabaseAdmin
      .from('games')
      .insert({
        name: gameName,
        name_japanese: validatedInput.nameJapanese,
        description: validatedInput.description || '',
        year_published: yearPublished,
        min_players: minPlayers,
        max_players: maxPlayers,
        playing_time: averagePlayTime,
        min_playing_time: minPlayingTime,
        max_playing_time: maxPlayingTime,
        image_url: validatedInput.imageUrl,
        designers: validatedInput.designers ? [validatedInput.designers] : [],
        publishers: validatedInput.publishers ? [validatedInput.publishers] : [],
        mechanics: mechanics,
        categories: categories,
        rating_average: 0,
        rating_count: 0
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw new Error(`データベースエラー: ${insertError.message}`)
    }

    console.log('✅ ゲーム登録成功:', game)

    // キャッシュ更新
    revalidatePath('/games')
    revalidatePath('/games/register')
    
    return { 
      success: true, 
      data: game,
      message: `ゲーム「${gameName}」を登録しました！` 
    }

  } catch (error) {
    console.error('Failed to create manual game:', error)
    
    if (error instanceof ValidationError) {
      return { 
        success: false, 
        error: 'validation_error',
        message: error.message,
        details: error.message
      }
    }
    
    return { 
      success: false, 
      error: 'unknown_error',
      message: error instanceof Error ? error.message : 'ゲームの登録に失敗しました'
    }
  }
}

export async function updateManualGame(gameId: number, input: Partial<ManualGameInput>) {
  try {
    // TypeScriptエラー回避のため、一時的にinputを参照
    console.log('Update manual game input received:', input)
    
    // 認証確認
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('認証が必要です')
    }

    // 管理者権限確認
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      throw new Error('管理者権限が必要です')
    }

    // UseCaseを使って更新（一時的にコメントアウト）
    // const gameRepository = new SupabaseGameRepository(supabase)
    // const japaneseGameIdService = new JapaneseGameIdService(supabase)
    // const gameUseCase = new GameUseCaseImpl(gameRepository, japaneseGameIdService)

    // const game = await gameUseCase.updateGame({
    //   gameId,
    //   updates: {
    //     name: input.name,
    //     nameJp: input.name_jp,
    //     description: input.description,
    //     yearPublished: input.year_published,
    //     minPlayers: input.min_players,
    //     maxPlayers: input.max_players,
    //     minPlayingTime: input.min_playing_time,
    //     maxPlayingTime: input.max_playing_time,
    //     playingTime: input.max_playing_time || input.min_playing_time,
    //     designers: input.designers,
    //     publishers: input.publishers,
    //     mechanics: input.mechanics,
    //     categories: input.categories,
    //     imageUrl: input.image_url
    //   }
    // })
    
    // 一時的なダミーレスポンス
    throw new Error('ゲーム更新機能は現在メンテナンス中です')

    // キャッシュ更新
    revalidatePath(`/games/${gameId}`)
    revalidatePath('/games')
    revalidatePath('/admin/games')
    
    // return { 
    //   success: true, 
    //   data: game.toPlainObject(),
    //   message: 'ゲーム情報を更新しました' 
    // }

  } catch (error) {
    console.error('Failed to update manual game:', error)
    
    if (error instanceof ValidationError) {
      return { 
        success: false, 
        error: 'validation_error',
        message: error.message,
        details: error.message
      }
    }
    
    return { 
      success: false, 
      error: 'unknown_error',
      message: error instanceof Error ? error.message : 'ゲーム情報の更新に失敗しました'
    }
  }
}