// ゲーム関連の型定義

export interface Game {
  id: number
  bgg_id: string | number
  name: string
  japanese_name?: string
  description?: string
  year_published?: number
  min_players: number
  max_players: number
  playing_time?: number
  min_playing_time?: number
  max_playing_time?: number
  min_age?: number
  image_url?: string
  thumbnail_url?: string
  
  // BGG原データ（保存用）
  bgg_categories: string[]
  bgg_mechanics: string[]
  bgg_publishers: string[]
  
  // サイト専用データ（表示用）
  site_categories: string[]
  site_mechanics: string[]
  site_publishers: string[]
  
  // 既存フィールド（互換性のため残す）
  categories: string[]
  mechanics: string[]
  publishers: string[]
  designers: string[]
  
  rating_average?: number
  rating_count?: number
  created_at: string
  updated_at: string
}

export interface GameCreateInput {
  bgg_id?: string | number
  name: string
  japanese_name?: string
  description?: string
  year_published?: number
  min_players: number
  max_players: number
  playing_time?: number
  min_age?: number
  image_url?: string
  thumbnail_url?: string
  
  // BGG原データ
  bgg_categories?: string[]
  bgg_mechanics?: string[]
  bgg_publishers?: string[]
  
  // サイト専用データ
  site_categories?: string[]
  site_mechanics?: string[]
  site_publishers?: string[]
  
  // 既存フィールド（互換性）
  categories?: string[]
  mechanics?: string[]
  publishers?: string[]
  designers?: string[]
}

export interface GameUpdateInput {
  name?: string
  japanese_name?: string
  description?: string
  year_published?: number
  min_players?: number
  max_players?: number
  playing_time?: number
  min_age?: number
  image_url?: string
  thumbnail_url?: string
  
  // BGG原データ更新
  bgg_categories?: string[]
  bgg_mechanics?: string[]
  bgg_publishers?: string[]
  
  // サイト専用データ更新
  site_categories?: string[]
  site_mechanics?: string[]
  site_publishers?: string[]
  
  // 既存フィールド（互換性）
  categories?: string[]
  mechanics?: string[]
  publishers?: string[]
  designers?: string[]
}

// 表示用の統合データ
export interface GameDisplayData extends Game {
  // フロントエンドで使用する表示用データ
  displayCategories: string[]  // site_categories を優先、なければ bgg_categories から変換
  displayMechanics: string[]   // site_mechanics を優先、なければ bgg_mechanics から変換
  displayPublishers: string[]  // site_publishers を優先、なければ bgg_publishers
}