import { Mechanic, Category, PlayerCount } from '@/lib/game-constants'

export interface EnhancedReview {
  id: number
  title: string
  content: string
  
  // Core ratings
  overall_score: number  // 1-10
  rating: number         // Compatibility with existing system
  
  // Detailed ratings (1-5)
  rule_complexity: number
  luck_factor: number
  interaction: number
  downtime: number
  
  // Gameplay details
  recommended_players: PlayerCount[]
  mechanics: Mechanic[]
  categories: Category[]
  custom_tags: string[]
  
  // Play experience
  play_time_actual?: number      // Actual play time in minutes
  player_count_played?: number   // Number of players in the actual game
  
  // Legacy fields
  pros?: string[]
  cons?: string[]
  
  // Meta information
  user_id: string
  game_id: number
  is_published: boolean
  created_at: string
  updated_at: string
  
  // Relations
  user?: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
  game?: {
    id: number
    name: string
    image_url: string | null
    japanese_name?: string | null
  }
  _count?: {
    comments: number
  }
}

export interface GameStatistics {
  id: number
  game_id: number
  
  // Average ratings
  avg_overall_score?: number
  avg_rule_complexity?: number
  avg_luck_factor?: number
  avg_interaction?: number
  avg_downtime?: number
  
  // Review counts
  review_count: number
  
  // Player count recommendations (percentage)
  recommended_2p_percent: number
  recommended_3p_percent: number
  recommended_4p_percent: number
  recommended_5p_percent: number
  recommended_6p_percent: number
  recommended_7p_percent: number
  
  // Popular features
  popular_mechanics?: Array<{ name: string; count: number }>
  popular_categories?: Array<{ name: string; count: number }>
  
  updated_at: string
}

export interface EnhancedGame {
  id: number
  bgg_id?: number
  name: string
  description?: string | null
  
  // Basic game info
  year_published?: number | null
  min_players?: number | null
  max_players?: number | null
  playing_time?: number | null
  min_age?: number | null
  
  // Enhanced BGG data
  weight?: number | null             // BGG complexity (1-5)
  bgg_rank?: number | null          // BGG ranking
  min_play_time?: number | null     // Minimum play time
  max_play_time?: number | null     // Maximum play time
  
  // Images and media
  image_url?: string | null
  thumbnail_url?: string | null
  japanese_image_url?: string | null
  
  // Game features
  mechanics?: string[]
  categories?: string[]
  designers?: string[]
  artists?: string[]
  publishers?: string[]
  
  // Japanese version info
  japanese_name?: string | null
  japanese_publisher?: string | null
  
  // BGG player recommendations
  bgg_best_players?: string[]
  bgg_recommended_players?: string[]
  
  // Ratings
  rating_average?: number | null
  rating_count: number
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Relations
  statistics?: GameStatistics
}

export interface ReviewFormData {
  title: string
  content: string
  
  // Core ratings
  overall_score: number
  
  // Detailed ratings
  complexity_score: number
  luck_factor: number
  interaction_score: number
  downtime_score: number
  
  // Gameplay details
  recommended_players: PlayerCount[]
  mechanics: Mechanic[]
  categories: Category[]
  custom_tags?: string[]
  
  // Play experience (optional)
  play_time_actual?: number
  player_count_played?: PlayerCount
  
  // Legacy fields (optional)
  pros?: string[]
  cons?: string[]
  
  // Meta
  is_published: boolean
}

export interface SearchFilters {
  // Text search
  query?: string
  
  // Game attributes
  min_players?: number
  max_players?: number
  play_time_min?: number
  play_time_max?: number
  complexity_min?: number
  complexity_max?: number
  year_min?: number
  year_max?: number
  
  // Review-based filters
  overall_score_min?: number
  overall_score_max?: number
  luck_factor_min?: number
  luck_factor_max?: number
  interaction_min?: number
  interaction_max?: number
  downtime_min?: number
  downtime_max?: number
  
  // Feature filters
  mechanics?: Mechanic[]
  categories?: Category[]
  recommended_players?: PlayerCount[]
  japanese_publisher?: string
  
  // Matching logic
  mechanics_match_all?: boolean
  categories_match_all?: boolean
  recommended_players_match_all?: boolean
  
  // BGG filters
  bgg_rank_max?: number
  weight_min?: number
  weight_max?: number
  
  // Sorting
  sort_by?: 'rating' | 'popularity' | 'newest' | 'complexity' | 'play_time' | 'bgg_rank'
  sort_order?: 'asc' | 'desc'
  
  // Pagination
  page?: number
  limit?: number
}

export interface SearchResults {
  games: EnhancedGame[]
  total: number
  page: number
  limit: number
  total_pages: number
  filters_applied: SearchFilters
}

// タグメタデータの型定義
export interface TagMetadata {
  mechanics: string[]
  categories: string[]
  recommended_players: number[]
}

// データベースから取得したレビューデータからタグ情報を抽出するユーティリティ
export function extractTagsFromReview(pros?: string[]): TagMetadata {
  const defaultTags: TagMetadata = {
    mechanics: [],
    categories: [],
    recommended_players: []
  }

  if (!pros || !Array.isArray(pros)) {
    return defaultTags
  }

  // "__TAGS__:" で始まるメタデータエントリを検索
  const tagEntry = pros.find(item => 
    typeof item === 'string' && item.startsWith('__TAGS__:')
  )

  if (!tagEntry) {
    return defaultTags
  }

  try {
    // "__TAGS__:" プレフィックスを削除してJSONパース
    const jsonData = tagEntry.slice(9) // "__TAGS__:".length = 9
    const parsedTags = JSON.parse(jsonData) as TagMetadata
    
    return {
      mechanics: Array.isArray(parsedTags.mechanics) ? parsedTags.mechanics : [],
      categories: Array.isArray(parsedTags.categories) ? parsedTags.categories : [],
      recommended_players: Array.isArray(parsedTags.recommended_players) ? parsedTags.recommended_players : []
    }
  } catch (error) {
    console.error('Failed to parse tag metadata:', error)
    return defaultTags
  }
}

// プロス文字列からタグメタデータを除外して純粋なプロスのみを取得
export function extractCleanPros(pros?: string[]): string[] {
  if (!pros || !Array.isArray(pros)) {
    return []
  }

  return pros.filter(item => 
    typeof item === 'string' && !item.startsWith('__TAGS__:')
  )
}

// データベースレビューオブジェクトをEnhancedReview形式に変換
export function transformDatabaseReviewToEnhanced(dbReview: any): Partial<EnhancedReview> {
  const tags = extractTagsFromReview(dbReview.pros)
  const cleanPros = extractCleanPros(dbReview.pros)

  return {
    id: dbReview.id,
    title: dbReview.title,
    content: dbReview.content,
    overall_score: dbReview.overall_score,
    rating: dbReview.rating,
    rule_complexity: dbReview.complexity_score,
    luck_factor: dbReview.luck_factor,
    interaction: dbReview.interaction_score,
    downtime: dbReview.downtime_score,
    
    // 抽出されたタグデータ
    mechanics: tags.mechanics.map(m => m as any), // Mechanic型へのキャスト
    categories: tags.categories.map(c => c as any), // Category型へのキャスト  
    recommended_players: tags.recommended_players.map(p => p as any), // PlayerCount型へのキャスト
    custom_tags: [], // 現在は未実装
    
    // クリーンアップされたプロス・コンス
    pros: cleanPros.length > 0 ? cleanPros : undefined,
    cons: dbReview.cons,
    
    // メタ情報
    user_id: dbReview.user_id,
    game_id: dbReview.game_id,
    is_published: dbReview.is_published,
    created_at: dbReview.created_at,
    updated_at: dbReview.updated_at,
    
    // リレーション（もし含まれていれば）
    user: dbReview.user,
    game: dbReview.game,
    _count: dbReview._count
  }
}
