import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClientForAPI } from '@/lib/supabase/server'

interface ReviewSearchFilters {
  // テキスト検索
  query?: string
  
  // 5軸評価フィルター
  overallScoreMin?: number
  overallScoreMax?: number
  ruleComplexityMin?: number
  ruleComplexityMax?: number
  luckFactorMin?: number
  luckFactorMax?: number
  interactionMin?: number
  interactionMax?: number
  downtimeMin?: number
  downtimeMax?: number
  
  // プレイ特性フィルター
  gamePlayerCounts?: number[]      // ゲーム対応プレイ人数
  recommendedPlayerCounts?: number[] // おすすめプレイ人数
  playTimeMin?: number
  playTimeMax?: number
  
  // メカニクス・カテゴリー
  mechanics?: string[]
  categories?: string[]
  
  // ソート・ページネーション
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClientForAPI(request)
    const { searchParams } = new URL(request.url)
    
    // フィルターパラメータの取得
    const filters: ReviewSearchFilters = {
      query: searchParams.get('query') || undefined,
      overallScoreMin: searchParams.get('overallScoreMin') ? Number(searchParams.get('overallScoreMin')) : undefined,
      overallScoreMax: searchParams.get('overallScoreMax') ? Number(searchParams.get('overallScoreMax')) : undefined,
      ruleComplexityMin: searchParams.get('ruleComplexityMin') ? Number(searchParams.get('ruleComplexityMin')) : undefined,
      ruleComplexityMax: searchParams.get('ruleComplexityMax') ? Number(searchParams.get('ruleComplexityMax')) : undefined,
      luckFactorMin: searchParams.get('luckFactorMin') ? Number(searchParams.get('luckFactorMin')) : undefined,
      luckFactorMax: searchParams.get('luckFactorMax') ? Number(searchParams.get('luckFactorMax')) : undefined,
      interactionMin: searchParams.get('interactionMin') ? Number(searchParams.get('interactionMin')) : undefined,
      interactionMax: searchParams.get('interactionMax') ? Number(searchParams.get('interactionMax')) : undefined,
      downtimeMin: searchParams.get('downtimeMin') ? Number(searchParams.get('downtimeMin')) : undefined,
      downtimeMax: searchParams.get('downtimeMax') ? Number(searchParams.get('downtimeMax')) : undefined,
      gamePlayerCounts: searchParams.getAll('gamePlayerCounts').map(Number),
      recommendedPlayerCounts: searchParams.getAll('recommendedPlayerCounts').map(Number),
      playTimeMin: searchParams.get('playTimeMin') ? Number(searchParams.get('playTimeMin')) : undefined,
      playTimeMax: searchParams.get('playTimeMax') ? Number(searchParams.get('playTimeMax')) : undefined,
      mechanics: searchParams.getAll('mechanics'),
      categories: searchParams.getAll('categories'),
      sortBy: searchParams.get('sortBy') || 'overall_score',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 20
    }

    // ベースクエリ: reviewsテーブルから統計を計算
    let query = supabase
      .from('reviews')
      .select(`
        game_id,
        overall_score,
        complexity_score,
        luck_factor,
        interaction_score,
        downtime_score,
        rec_players_2,
        rec_players_3,
        rec_players_4,
        rec_players_5,
        rec_players_6plus,
        mech_area_control,
        mech_auction,
        mech_betting,
        mech_drafting,
        mech_cooperative,
        mech_deck_building,
        mech_dice_rolling,
        mech_hidden_roles,
        mech_modular_board,
        mech_route_building,
        mech_push_luck,
        mech_set_collection,
        mech_simultaneous,
        mech_tile_placement,
        mech_variable_powers,
        mech_worker_placement,
        cat_animals,
        cat_bluffing,
        cat_card_game,
        cat_childrens,
        cat_deduction,
        cat_memory,
        cat_negotiation,
        cat_party,
        cat_puzzle,
        cat_wargame,
        cat_word_game,
        cat_acting,
        cat_legacy_campaign,
        cat_paper_pencil,
        cat_solo,
        cat_trick_taking,
        cat_pair,
        cat_large_group,
        games!inner(
          id,
          name,
          image_url,
          min_players,
          max_players,
          playing_time,
          year_published
        )
      `)
      .eq('is_published', true)

    // テキスト検索
    if (filters.query) {
      query = query.or(`games.name.ilike.%${filters.query}%,games.japanese_name.ilike.%${filters.query}%`)
    }

    // ゲーム対応プレイ人数フィルター
    if (filters.gamePlayerCounts && filters.gamePlayerCounts.length > 0) {
      // 各プレイ人数に対してチェーンメソッドを使用
      for (const count of filters.gamePlayerCounts) {
        if (count >= 8) {
          query = query.gte('games.max_players', count)
        } else {
          query = query.lte('games.min_players', count).gte('games.max_players', count)
        }
        break; // 最初の条件のみ適用（複数条件は後で改善）
      }
    }

    // データを取得してJavaScriptで5軸評価集計・フィルタリング
    const { data: reviewsData, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'データベースエラーが発生しました' 
      }, { status: 500 })
    }

    // メカニクス・カテゴリーマッピング
    const mechanicsMapping = {
      'エリア支配': 'mech_area_control',
      'オークション': 'mech_auction', 
      '賭け': 'mech_betting',
      'ドラフト': 'mech_drafting',
      '協力': 'mech_cooperative',
      'デッキ/バッグビルド': 'mech_deck_building',
      'ダイスロール': 'mech_dice_rolling',
      '正体隠匿': 'mech_hidden_roles',
      'モジュラーボード': 'mech_modular_board',
      'ルート構築': 'mech_route_building',
      'バースト': 'mech_push_luck',
      'セット収集': 'mech_set_collection',
      '同時手番': 'mech_simultaneous',
      'タイル配置': 'mech_tile_placement',
      'プレイヤー別能力': 'mech_variable_powers',
      'ワカプレ': 'mech_worker_placement'
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

    // ゲームIDごとにレビューを集計
    const gameStats = new Map()
    
    for (const review of reviewsData || []) {
      const gameId = review.game_id
      if (!gameStats.has(gameId)) {
        gameStats.set(gameId, {
          game: review.games,
          reviews: [],
          overallScores: [],
          ruleComplexity: [],
          luckFactor: [],
          interaction: [],
          downtime: [],
          mechanics: new Set(),
          categories: new Set(),
          recommendedPlayers: new Set()
        })
      }
      
      const stats = gameStats.get(gameId)
      stats.reviews.push(review)
      
      if (review.overall_score) stats.overallScores.push(review.overall_score)
      if (review.complexity_score) stats.ruleComplexity.push(review.complexity_score)
      if (review.luck_factor) stats.luckFactor.push(review.luck_factor)
      if (review.interaction_score) stats.interaction.push(review.interaction_score)
      if (review.downtime_score) stats.downtime.push(review.downtime_score)
      
      // メカニクス集計（boolean列から）
      Object.entries(mechanicsMapping).forEach(([japaneseName, columnName]) => {
        if ((review as any)[columnName]) {
          stats.mechanics.add(japaneseName)
        }
      })
      
      // カテゴリー集計（boolean列から）
      Object.entries(categoriesMapping).forEach(([japaneseName, columnName]) => {
        if ((review as any)[columnName]) {
          stats.categories.add(japaneseName)
        }
      })
      
      // おすすめプレイ人数集計
      if (review.rec_players_2) stats.recommendedPlayers.add(2)
      if (review.rec_players_3) stats.recommendedPlayers.add(3)
      if (review.rec_players_4) stats.recommendedPlayers.add(4)
      if (review.rec_players_5) stats.recommendedPlayers.add(5)
      if (review.rec_players_6plus) stats.recommendedPlayers.add(7)
    }

    // 各ゲームの統計を計算してフィルタリング
    const filteredGames = []
    
    for (const stats of gameStats.values()) {
      // 平均値計算（配列が空の場合の対策）
      const avgOverallScore = stats.overallScores.length > 0 ? stats.overallScores.reduce((a: number, b: number) => a + b, 0) / stats.overallScores.length : 0
      const avgRuleComplexity = stats.ruleComplexity.length > 0 ? stats.ruleComplexity.reduce((a: number, b: number) => a + b, 0) / stats.ruleComplexity.length : 0
      const avgLuckFactor = stats.luckFactor.length > 0 ? stats.luckFactor.reduce((a: number, b: number) => a + b, 0) / stats.luckFactor.length : 0
      const avgInteraction = stats.interaction.length > 0 ? stats.interaction.reduce((a: number, b: number) => a + b, 0) / stats.interaction.length : 0
      const avgDowntime = stats.downtime.length > 0 ? stats.downtime.reduce((a: number, b: number) => a + b, 0) / stats.downtime.length : 0

      // 5軸評価フィルター適用（値が0の場合はスキップ）
      if (filters.overallScoreMin && avgOverallScore > 0 && avgOverallScore < filters.overallScoreMin) continue
      if (filters.overallScoreMax && avgOverallScore > 0 && avgOverallScore > filters.overallScoreMax) continue
      if (filters.ruleComplexityMin && avgRuleComplexity > 0 && avgRuleComplexity < filters.ruleComplexityMin) continue
      if (filters.ruleComplexityMax && avgRuleComplexity > 0 && avgRuleComplexity > filters.ruleComplexityMax) continue
      if (filters.luckFactorMin && avgLuckFactor > 0 && avgLuckFactor < filters.luckFactorMin) continue
      if (filters.luckFactorMax && avgLuckFactor > 0 && avgLuckFactor > filters.luckFactorMax) continue
      if (filters.interactionMin && avgInteraction > 0 && avgInteraction < filters.interactionMin) continue
      if (filters.interactionMax && avgInteraction > 0 && avgInteraction > filters.interactionMax) continue
      if (filters.downtimeMin && avgDowntime > 0 && avgDowntime < filters.downtimeMin) continue
      if (filters.downtimeMax && avgDowntime > 0 && avgDowntime > filters.downtimeMax) continue

      // プレイ時間フィルター（ゲームデータから）
      if (stats.game.playing_time) {
        if (filters.playTimeMin && stats.game.playing_time < filters.playTimeMin) continue
        // 180分以上の場合は無制限として扱う
        if (filters.playTimeMax && filters.playTimeMax < 180 && stats.game.playing_time > filters.playTimeMax) continue
      }

      // おすすめプレイ人数フィルター
      if (filters.recommendedPlayerCounts && filters.recommendedPlayerCounts.length > 0) {
        const hasMatchingPlayer = filters.recommendedPlayerCounts.some(count => stats.recommendedPlayers.has(count))
        if (!hasMatchingPlayer) continue
      }

      // メカニクスフィルター（AND条件）
      if (filters.mechanics && filters.mechanics.length > 0) {
        const hasAllMechanics = filters.mechanics.every(mechanic => stats.mechanics.has(mechanic))
        if (!hasAllMechanics) continue
      }

      // カテゴリーフィルター（AND条件）
      if (filters.categories && filters.categories.length > 0) {
        const hasAllCategories = filters.categories.every(category => stats.categories.has(category))
        if (!hasAllCategories) continue
      }

      // 結果に追加
      filteredGames.push({
        ...stats.game,
        review_stats: {
          review_count: stats.reviews.length,
          avg_overall_score: Math.round(avgOverallScore * 10) / 10,
          avg_rule_complexity: Math.round(avgRuleComplexity * 10) / 10,
          avg_luck_factor: Math.round(avgLuckFactor * 10) / 10,
          avg_interaction: Math.round(avgInteraction * 10) / 10,
          avg_downtime: Math.round(avgDowntime * 10) / 10,
          avg_actual_play_time: stats.game.playing_time || null,
          popular_mechanics: Array.from(stats.mechanics),
          popular_categories: Array.from(stats.categories),
          popular_player_counts: Array.from(stats.recommendedPlayers)
        }
      })
    }

    // ソート適用
    const sortField = filters.sortBy === 'overall_score' ? 'avg_overall_score' : 
                     filters.sortBy === 'rule_complexity' ? 'avg_rule_complexity' :
                     filters.sortBy === 'luck_factor' ? 'avg_luck_factor' :
                     filters.sortBy === 'interaction' ? 'avg_interaction' :
                     filters.sortBy === 'downtime' ? 'avg_downtime' :
                     filters.sortBy === 'review_count' ? 'review_count' : 'avg_overall_score'

    filteredGames.sort((a, b) => {
      const aValue = a.review_stats[sortField] || 0
      const bValue = b.review_stats[sortField] || 0
      return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    })

    // ページネーション
    const total = filteredGames.length
    const totalPages = Math.ceil(total / filters.limit!)
    const offset = (filters.page! - 1) * filters.limit!
    const paginatedGames = filteredGames.slice(offset, offset + filters.limit!)

    return NextResponse.json({
      success: true,
      data: paginatedGames,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages,
        hasNext: filters.page! < totalPages,
        hasPrev: filters.page! > 1
      },
      filters: filters,
      facets: {
        total_games: total,
        avg_overall_score: total > 0 ? filteredGames.reduce((sum, game) => sum + game.review_stats.avg_overall_score, 0) / total : 0
      }
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'サーバーエラーが発生しました' 
    }, { status: 500 })
  }
}
