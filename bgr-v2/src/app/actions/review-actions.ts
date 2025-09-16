'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase'
// import { headers } from 'next/headers'
// import { ReviewUseCaseImpl } from '@/application/usecases/ReviewUseCaseImpl'
// import { SupabaseReviewRepository } from '@/infrastructure/repositories/SupabaseReviewRepository'
// import { SupabaseGameRepository } from '@/infrastructure/repositories/SupabaseGameRepository'
import { ValidationError } from '@/domain/errors/DomainErrors'

// 5軸レビューフォーム用スキーマ（簡単レビュー）
const FiveAxisReviewSchema = z.object({
  gameId: z.number(),
  title: z.string().min(1),
  content: z.string().optional(),
  overallScore: z.number().min(5.0).max(10.0),
  complexityScore: z.number().min(1).max(5),
  luckFactor: z.number().min(1).max(5),
  interactionScore: z.number().min(1).max(5),
  downtimeScore: z.number().min(1).max(5),
  recommendedPlayers: z.array(z.number()).optional(),
  mechanics: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  pros: z.string().optional(),
  cons: z.string().optional(),
  isPublished: z.boolean().default(true),
  accessToken: z.string().optional() // クライアントから認証トークンを受け取る
})

type FiveAxisReviewInput = z.infer<typeof FiveAxisReviewSchema>

export async function createFiveAxisReview(input: FiveAxisReviewInput) {
  try {
    console.log('🚀 サーバーアクション開始 - createFiveAxisReview')
    console.log('📥 受信データ:', input)
    
    // バリデーション
    const validatedInput = FiveAxisReviewSchema.parse(input)
    console.log('✅ バリデーション成功:', validatedInput)
    
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

    // メカニクス・カテゴリー・プレイ人数をBoolean列にマッピング
    const mechanicsMapping = {
      'エリア支配': 'mech_area_control',
      'オークション': 'mech_auction',
      '賭け': 'mech_betting',
      '協力': 'mech_cooperative',
      'デッキ/バッグビルド': 'mech_deck_building',
      'ダイスロール': 'mech_dice_rolling',
      'ドラフト': 'mech_drafting',
      'エンジンビルド': 'mech_expansion_1', // エンジンビルドは拡張フィールドを使用
      '正体隠匿': 'mech_hidden_roles',
      'モジュラーボード': 'mech_modular_board',
      'ルート構築': 'mech_route_building',
      'バースト': 'mech_push_luck',
      'セット収集': 'mech_set_collection',
      '同時手番': 'mech_simultaneous',
      'タイル配置': 'mech_tile_placement',
      'プレイヤー別能力': 'mech_variable_powers'
    }

    const categoriesMapping = {
      '動物': 'cat_animals',
      'ブラフ': 'cat_bluffing',
      'カードゲーム': 'cat_card_game',
      '子供向け': 'cat_childrens',
      '推理': 'cat_deduction',
      '記憶': 'cat_memory',
      '交渉': 'cat_negotiation',
      'パーティー': 'cat_party',
      'パズル': 'cat_puzzle',
      'ウォーゲーム': 'cat_wargame',
      'ワードゲーム': 'cat_word_game',
      '演技': 'cat_acting',
      'レガシー・キャンペーン': 'cat_legacy_campaign',
      '紙ペン': 'cat_paper_pencil',
      'ソロ向き': 'cat_solo',
      'トリテ': 'cat_trick_taking',
      'ペア向き': 'cat_pair',
      '多人数向き': 'cat_large_group'
    }

    const playersMapping = {
      1: 'rec_players_1',
      2: 'rec_players_2',
      3: 'rec_players_3',
      4: 'rec_players_4',
      5: 'rec_players_5',
      6: 'rec_players_6plus' // 6以上は6+に統合
    }

    // Boolean列用のデータを準備
    const mechanicsData: Record<string, boolean> = {}
    const categoriesData: Record<string, boolean> = {}
    const playersData: Record<string, boolean> = {}

    // メカニクスのマッピング
    if (validatedInput.mechanics) {
      validatedInput.mechanics.forEach(mechanic => {
        const column = mechanicsMapping[mechanic as keyof typeof mechanicsMapping]
        if (column) {
          mechanicsData[column] = true
        }
      })
    }

    // カテゴリーのマッピング
    if (validatedInput.categories) {
      validatedInput.categories.forEach(category => {
        const column = categoriesMapping[category as keyof typeof categoriesMapping]
        if (column) {
          categoriesData[column] = true
        }
      })
    }

    // プレイ人数のマッピング
    if (validatedInput.recommendedPlayers) {
      validatedInput.recommendedPlayers.forEach(playerCount => {
        const count = parseInt(playerCount.toString())
        if (count >= 6) {
          playersData['rec_players_6plus'] = true
        } else {
          const column = playersMapping[count as keyof typeof playersMapping]
          if (column) {
            playersData[column] = true
          }
        }
      })
    }
    
    console.log('📊 Boolean列データ準備:', {
      mechanics: Object.keys(mechanicsData).length,
      categories: Object.keys(categoriesData).length,
      players: Object.keys(playersData).length
    })
    
    // Admin クライアントでRLSをバイパスして挿入
    console.log('💾 データベース挿入開始 - Admin権限使用')
    const { data: review, error: insertError } = await supabaseAdmin
      .from('reviews')
      .insert({
        user_id: user.id,
        game_id: validatedInput.gameId,
        title: validatedInput.title,
        content: validatedInput.content || '',
        rating: Math.round(validatedInput.overallScore),
        overall_score: validatedInput.overallScore,
        complexity_score: validatedInput.complexityScore,
        luck_factor: validatedInput.luckFactor,
        interaction_score: validatedInput.interactionScore,
        downtime_score: validatedInput.downtimeScore,
        is_published: validatedInput.isPublished,
        // メカニクスBoolean列
        ...mechanicsData,
        // カテゴリーBoolean列
        ...categoriesData,
        // プレイ人数Boolean列
        ...playersData
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw new Error(`データベースエラー: ${insertError.message}`)
    }

    // キャッシュ更新
    revalidatePath(`/games/${validatedInput.gameId}`)
    revalidatePath('/reviews')
    
    // 統計キャッシュの無効化（バックグラウンドで実行）
    try {
      console.log('📊 統計キャッシュ無効化開始')
      // 統計APIに直接リクエストして新しいデータを生成
      await fetch(`${process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3001'}/api/games/${validatedInput.gameId}/stats`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      console.log('✅ 統計キャッシュ無効化完了')
    } catch (cacheError) {
      // キャッシュエラーはレビュー投稿の成功に影響しない
      console.warn('⚠️ 統計キャッシュ無効化失敗（非致命的）:', cacheError)
    }
    
    return { 
      success: true, 
      data: review,
      message: 'レビューを投稿しました（新しいBoolean列スキーマ対応）' 
    }

  } catch (error) {
    console.error('Failed to create review:', error)
    
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
      message: error instanceof Error ? error.message : 'レビューの投稿に失敗しました'
    }
  }
}

export async function updateFiveAxisReview(reviewId: number, input: Partial<FiveAxisReviewInput>) {
  try {
    console.log('Update review input received:', input)
    
    // 認証確認
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    const user = session?.user
    
    if (authError || !user) {
      throw new Error('認証が必要です')
    }

    // 現在のレビューデータを取得（既存のタグデータを保持するため）
    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select('pros, cons')
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      throw new Error(`既存データ取得エラー: ${fetchError.message}`)
    }

    // タグデータの前処理 - 更新データがある場合のみ処理
    let updatedPros = existingReview.pros
    
    if (input.mechanics !== undefined || input.categories !== undefined || input.recommendedPlayers !== undefined) {
      const tagMetadata = {
        mechanics: input.mechanics || [],
        categories: input.categories || [],
        recommended_players: input.recommendedPlayers || []
      }
      
      // 既存のプロスからタグメタデータを除外
      const cleanExistingPros = existingReview.pros ? 
        existingReview.pros.filter((item: string) => !item.startsWith('__TAGS__:')) : []
      
      console.log('📊 更新用タグデータ処理:', {
        mechanics: tagMetadata.mechanics.length,
        categories: tagMetadata.categories.length,
        recommendedPlayers: tagMetadata.recommended_players.length
      })
      
      // 新しいプロス配列を構築
      updatedPros = [
        ...cleanExistingPros,
        ...(input.pros ? [input.pros] : []),
        `__TAGS__:${JSON.stringify(tagMetadata)}`
      ]
    } else if (input.pros) {
      // タグ更新なし、プロスのみ更新の場合
      const existingTagEntry = existingReview.pros ? 
        existingReview.pros.find((item: string) => item.startsWith('__TAGS__:')) : undefined
      
      updatedPros = [
        input.pros,
        ...(existingTagEntry ? [existingTagEntry] : [])
      ]
    }
    
    // 直接Supabaseで更新（一時的な解決策）
    const { data: review, error: updateError } = await supabase
      .from('reviews')
      .update({
        title: input.title,
        content: input.content || '',
        rating: input.overallScore ? Math.round(input.overallScore) : undefined,
        overall_score: input.overallScore,
        complexity_score: input.complexityScore,
        luck_factor: input.luckFactor,
        interaction_score: input.interactionScore,
        downtime_score: input.downtimeScore,
        pros: updatedPros,
        cons: input.cons ? [input.cons] : undefined,
        is_published: input.isPublished,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Database update error:', updateError)
      throw new Error(`データベースエラー: ${updateError.message}`)
    }

    // キャッシュ更新
    revalidatePath(`/reviews/${reviewId}`)
    
    return { 
      success: true, 
      data: review,
      message: 'レビューを更新しました（タグ情報含む）' 
    }

  } catch (error) {
    console.error('Failed to update review:', error)
    
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
      message: error instanceof Error ? error.message : 'レビューの更新に失敗しました'
    }
  }
}

export async function deleteReview(reviewId: number) {
  try {
    // TypeScriptエラー回避のため、一時的にreviewIdを参照
    console.log('Delete review ID:', reviewId)
    
    // 認証確認
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    const user = session?.user
    
    if (authError || !user) {
      throw new Error('認証が必要です')
    }

    // UseCaseを使って削除
    // const reviewRepository = new SupabaseReviewRepository(supabase)
    // const gameRepository = new SupabaseGameRepository(supabase)
    // const reviewUseCase = new ReviewUseCaseImpl(reviewRepository, gameRepository)

    // await reviewUseCase.deleteReview(reviewId, user.id)
    
    // 直接Supabaseで削除（一時的な解決策）
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Database delete error:', deleteError)
      throw new Error(`データベースエラー: ${deleteError.message}`)
    }

    // キャッシュ更新
    revalidatePath('/reviews')
    
    return { 
      success: true, 
      message: 'レビューを削除しました' 
    }

  } catch (error) {
    console.error('Failed to delete review:', error)
    
    return { 
      success: false, 
      error: 'unknown_error',
      message: error instanceof Error ? error.message : 'レビューの削除に失敗しました'
    }
  }
}