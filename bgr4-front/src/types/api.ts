export interface Game {
  id: string;
  bgg_id?: string;
  name: string;
  japanese_name?: string;
  description?: string | null;
  japanese_description?: string | null;
  image_url?: string | null;
  japanese_image_url?: string | null;
  thumbnail?: string | null;
  min_players?: number | null;
  max_players?: number | null;
  play_time?: number | null;
  min_play_time?: number | null;
  weight?: number | null;
  publisher?: string | null;
  designer?: string | null;
  release_date?: string | null;
  japanese_release_date?: string | null;
  japanese_publisher?: string | null;
  expansions?: any[]; // より具体的な型が望ましい
  base_game?: any; // より具体的な型が望ましい
  user_reviews_count?: number;
  average_score?: number | null;
  averageRating?: number; // BGGからのデータで使用
  reviews_count?: number;
  minPlayers?: number; // BGGからのデータで使用
  maxPlayers?: number; // BGGからのデータで使用
  playingTime?: number; // BGGからのデータで使用
  site_recommended_players?: any[];
  popular_categories?: any[];
  popular_mechanics?: any[];
  bgg_url?: string;
  in_wishlist?: boolean;
}

export interface Review {
  id: number;
  user?: {
    id: number;
    name: string;
    image?: string;
  };
  game?: Game;
  overall_score?: number;
  short_comment?: string;
  comment?: string;
  created_at?: string;
  updated_at?: string;
  likes_count?: number;
  rule_complexity?: number;
  luck_factor?: number;
  interaction?: number;
  downtime?: number;
  categories?: string[];
  mechanics?: string[];
  recommended_players?: string[];
}

export interface PaginationInfo {
  total_pages: number;
  total_count: number;
  current_page: number;
  per_page: number;
}

export interface GamesResponse {
  games: Game[];
  pagination: PaginationInfo;
  totalItems: number;
  totalPages: number;
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: PaginationInfo;
  totalItems: number;
  totalPages: number;
}

export interface WishlistItem {
  id: number;
  game_id: string;
  user_id: number;
  created_at: string;
  game: Game;
}

export interface ExpansionsResponse {
  expansions: GameExpansion[];
  unregistered_expansions: UnregisteredExpansion[];
}

export interface GameExpansion {
  id: string;
  name: string;
  // 他に必要なプロパティを追加
}

export interface UnregisteredExpansion {
  bgg_id: string;
  name: string;
  // 他に必要なプロパティを追加
}

export interface GameEditHistory {
  id: number;
  game_id: string;
  user_id: number;
  action: string;
  details: any;
  created_at: string;
  user: {
    name: string;
  };
}

export interface GameEditHistoriesResponse {
  histories: GameEditHistory[];
  pagination: PaginationInfo;
}
