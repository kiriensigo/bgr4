// データベース型定義
export interface Game {
  id: number
  bgg_id: number | string | null
  name: string
  japanese_name?: string | null
  description: string | null
  year_published: number | null
  min_players: number
  max_players: number
  playing_time: number | null
  min_age: number | null
  image_url: string | null
  thumbnail_url: string | null
  bgg_categories: string[]
  bgg_mechanics: string[]
  bgg_publishers: string[]
  site_categories: string[]
  site_mechanics: string[]
  site_publishers: string[]
  categories: string[]
  mechanics: string[]
  publishers: string[]
  designers: string[]
  rating_average: number | null
  rating_count: number | null
  review_stats?: {
    overall_avg?: number
    complexity_avg?: number
    luck_avg?: number
    interaction_avg?: number
    downtime_avg?: number
    review_count?: number
  }
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  updated_at: string | null
  username: string | null
  full_name: string | null
  avatar_url: string | null
  website: string | null
  is_admin: boolean
}

export interface Review {
  id: number
  user_id: string
  game_id: number
  title: string
  content: string
  rating: number
  pros: string[]
  cons: string[]
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Favorite {
  id: number
  user_id: string
  game_id: number
  created_at: string
}

export interface Comment {
  id: number
  review_id: number
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

// API レスポンス型
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
  }
}

// BGG API型定義
export interface BGGGame {
  id: number
  name: string
  description?: string
  yearPublished?: number
  minPlayers?: number
  maxPlayers?: number
  playingTime?: number
  minAge?: number
  imageUrl?: string
  thumbnailUrl?: string
  mechanics?: string[]
  categories?: string[]
  designers?: string[]
  publishers?: string[]
  averageRating?: number
  ratingCount?: number
}