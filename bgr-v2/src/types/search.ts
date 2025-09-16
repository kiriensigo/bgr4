export interface SearchFilters {
  // 基本検索
  query?: string
  
  // カテゴリ・メカニクス
  mechanics?: string[]
  categories?: string[]
  publishers?: string[]
  designers?: string[]
  
  // 評価・レーティング
  minRating?: number
  maxRating?: number
  minOverallScore?: number
  maxOverallScore?: number
  
  // 詳細評価
  ruleComplexity?: number[]    // [1-5]
  luckFactor?: number[]        // [1-5] 
  interaction?: number[]       // [1-5]
  downtime?: number[]          // [1-5]
  
  // プレイヤー数・時間
  minPlayers?: number
  maxPlayers?: number
  playingTime?: number[]       // [30, 60, 120, 180] etc.
  
  // その他
  yearFrom?: number
  yearTo?: number
  language?: string[]          // ['日本語', '英語'] etc.
  availability?: string[]      // ['入手可能', '絶版'] etc.
  
  // ソート・表示
  sortBy?: 'rating' | 'date' | 'name' | 'year' | 'popularity'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface SearchResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: SearchFilters
  facets?: SearchFacets
}

export interface SearchFacets {
  mechanics: Array<{ value: string; count: number }>
  categories: Array<{ value: string; count: number }>
  publishers: Array<{ value: string; count: number }>
  designers: Array<{ value: string; count: number }>
  yearRange: { min: number; max: number }
  playerCountRange: { min: number; max: number }
  playingTimeRange: { min: number; max: number }
  ratingRange: { min: number; max: number }
}

export interface QuickSearchSuggestion {
  id: string
  type: 'game' | 'designer' | 'publisher' | 'mechanic' | 'category'
  title: string
  subtitle?: string
  imageUrl?: string
  url: string
}

export interface SavedSearch {
  id: string
  userId: string
  name: string
  filters: SearchFilters
  createdAt: string
  updatedAt: string
}