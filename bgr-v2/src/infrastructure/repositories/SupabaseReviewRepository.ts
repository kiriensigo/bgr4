import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { Review, ReviewPlainObject } from '@/domain/entities/Review'
import { ReviewRepository, ReviewFilters, PaginatedResult } from '@/domain/repositories/ReviewRepository'

export class SupabaseReviewRepository implements ReviewRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findById(id: number): Promise<Review | null> {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch review: ${error.message}`)
    }

    return this.mapToReviewEntity(data)
  }

  async findMany(filters: ReviewFilters): Promise<PaginatedResult<Review>> {
    const page = filters.page || 1
    const limit = filters.limit || 20
    const offset = (page - 1) * limit

    let query = this.supabase
      .from('reviews')
      .select(`
        *,
        games:game_id (
          id,
          name,
          image_url
        ),
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `, { count: 'exact' })

    // Apply filters
    if (filters.gameId) {
      query = query.eq('game_id', filters.gameId)
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.rating) {
      query = query.eq('rating', filters.rating)
    }

    if (filters.minRating) {
      query = query.gte('overall_score', filters.minRating)
    }

    if (filters.maxRating) {
      query = query.lte('overall_score', filters.maxRating)
    }

    if (filters.isPublished !== undefined) {
      query = query.eq('is_published', filters.isPublished)
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_at'
    const sortOrder = filters.sortOrder || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Pagination
    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch reviews: ${error.message}`)
    }

    return {
      data: (data || []).map(item => this.mapToReviewEntity(item)),
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      // Pass raw data for API transformation
      rawData: data || []
    } as any
  }

  async findByGameId(gameId: number, filters?: Omit<ReviewFilters, 'gameId'>): Promise<Review[]> {
    const result = await this.findMany({ ...filters, gameId })
    return result.data
  }

  async findByUserId(userId: string, filters?: Omit<ReviewFilters, 'userId'>): Promise<Review[]> {
    const result = await this.findMany({ ...filters, userId })
    return result.data
  }

  async findByUserAndGame(userId: string, gameId: number): Promise<Review[]> {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*')
      .eq('user_id', userId)
      .eq('game_id', gameId)

    if (error) {
      throw new Error(`Failed to fetch reviews by user and game: ${error.message}`)
    }

    return (data || []).map(item => this.mapToReviewEntity(item))
  }

  async save(review: Review): Promise<Review> {
    const reviewData = this.mapFromReviewEntity(review)
    const { data, error } = await this.supabase
      .from('reviews')
      .insert(reviewData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save review: ${error.message}`)
    }

    return this.mapToReviewEntity(data)
  }

  async update(review: Review): Promise<Review> {
    if (!review.id) {
      throw new Error('Review ID is required for update')
    }

    const reviewData = this.mapFromReviewEntity(review)
    const { data, error } = await this.supabase
      .from('reviews')
      .update({
        ...reviewData,
        updated_at: new Date().toISOString()
      })
      .eq('id', review.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update review: ${error.message}`)
    }

    return this.mapToReviewEntity(data)
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('reviews')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete review: ${error.message}`)
    }
  }

  async getRecentReviews(limit: number = 10): Promise<Review[]> {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch recent reviews: ${error.message}`)
    }

    return (data || []).map(item => this.mapToReviewEntity(item))
  }

  async getTopRatedReviews(gameId: number, limit: number = 5): Promise<Review[]> {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*')
      .eq('game_id', gameId)
      .eq('is_published', true)
      .order('overall_score', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch top rated reviews: ${error.message}`)
    }

    return (data || []).map(item => this.mapToReviewEntity(item))
  }

  private mapToReviewEntity(row: Database['public']['Tables']['reviews']['Row']): Review {
    // Boolean列からメカニクス・カテゴリー・プレイ人数配列に変換
    const mechanics: string[] = []
    const categories: string[] = []
    const recommendedPlayers: number[] = []

    // メカニクス変換マッピング
    const mechanicsMapping = {
      mech_area_control: 'エリア支配',
      mech_auction: 'オークション',
      mech_betting: '賭け',
      mech_drafting: 'ドラフト',
      mech_cooperative: '協力',
      mech_deck_building: 'デッキ/バッグビルド',
      mech_dice_rolling: 'ダイスロール',
      mech_hidden_roles: '正体隠匿',
      mech_modular_board: 'モジュラーボード',
      mech_route_building: 'ルート構築',
      mech_push_luck: 'バースト',
      mech_set_collection: 'セット収集',
      mech_simultaneous: '同時手番',
      mech_tile_placement: 'タイル配置',
      mech_variable_powers: 'プレイヤー別能力',
      mech_worker_placement: 'ワカプレ'
    } as const

    // カテゴリー変換マッピング
    const categoriesMapping = {
      cat_animals: '動物',
      cat_bluffing: 'ブラフ',
      cat_card_game: 'カードゲーム',
      cat_childrens: '子供向け',
      cat_deduction: '推理',
      cat_memory: '記憶',
      cat_negotiation: '交渉',
      cat_party: 'パーティー',
      cat_puzzle: 'パズル',
      cat_wargame: 'ウォーゲーム',
      cat_word_game: 'ワードゲーム',
      cat_acting: '演技',
      cat_legacy_campaign: 'レガシー・キャンペーン',
      cat_paper_pencil: '紙ペン',
      cat_solo: 'ソロ向き',
      cat_trick_taking: 'トリテ',
      cat_pair: 'ペア向き',
      cat_large_group: '多人数向き'
    } as const

    // プレイ人数変換マッピング
    const playersMapping = {
      rec_players_1: 1,
      rec_players_2: 2,
      rec_players_3: 3,
      rec_players_4: 4,
      rec_players_5: 5,
      rec_players_6plus: 6
    } as const

    // Boolean値をチェックして配列に変換
    Object.entries(mechanicsMapping).forEach(([column, displayName]) => {
      if (row[column as keyof typeof row]) {
        mechanics.push(displayName)
      }
    })

    Object.entries(categoriesMapping).forEach(([column, displayName]) => {
      if (row[column as keyof typeof row]) {
        categories.push(displayName)
      }
    })

    Object.entries(playersMapping).forEach(([column, playerCount]) => {
      if (row[column as keyof typeof row]) {
        recommendedPlayers.push(playerCount)
      }
    })

    const plainObject: ReviewPlainObject = {
      id: row.id,
      user_id: row.user_id || '',
      game_id: row.game_id || 0,
      title: row.title,
      content: row.content,
      overall_score: Number(row.overall_score) || Number(row.rating) || 5,
      rating: Number(row.rating) || Number(row.overall_score) || 5,
      complexity_score: Number(row.rule_complexity) || 3,
      luck_factor: Number(row.luck_factor) || 3,
      interaction_score: Number(row.interaction) || 3,
      downtime_score: Number(row.downtime) || 3,
      pros: undefined, // 新しいスキーマではBoolean列を使用
      cons: undefined, // 新しいスキーマではBoolean列を使用
      is_published: row.is_published ?? true,
      created_at: row.created_at || undefined,
      updated_at: row.updated_at || undefined,
      // 新しく追加されたフィールド
      mechanics: mechanics,
      categories: categories,
      recommended_players: recommendedPlayers
    }

    return Review.fromPlainObject(plainObject)
  }

  private mapFromReviewEntity(review: Review): Database['public']['Tables']['reviews']['Insert'] {
    const plainObject = review.toPlainObject()
    
    return {
      title: plainObject.title,
      content: plainObject.content,
      rating: plainObject.rating,
      overall_score: plainObject.overall_score,
      // complexity_score: plainObject.complexity_score, // Property doesn't exist in type
      luck_factor: plainObject.luck_factor,
      // interaction_score: plainObject.interaction_score, // Property doesn't exist in type
      // downtime_score: plainObject.downtime_score, // Property doesn't exist in type
      pros: plainObject.pros,
      cons: plainObject.cons,
      user_id: plainObject.user_id,
      game_id: plainObject.game_id,
      is_published: plainObject.is_published
      // 存在しない列は除外: recommended_players, mechanics, categories, custom_tags, play_time_actual, player_count_played
    }
  }
}