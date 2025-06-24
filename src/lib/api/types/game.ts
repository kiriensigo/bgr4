import { PaginationInfo } from "./common";

export interface Game {
  id: string | number;
  bgg_id: string;
  name: string;
  japanese_name?: string;
  description?: string;
  japanese_description?: string;
  image_url?: string;
  japanese_image_url?: string;
  thumbnail?: string;
  min_players?: number;
  max_players?: number;
  play_time?: number;
  min_play_time?: number;
  average_score?: number;
  average_overall_score?: number;
  weight?: number;
  publisher?: string;
  designer?: string;
  release_date?: string;
  japanese_publisher?: string;
  japanese_release_date?: string;
  reviews?: Review[];
  reviews_count?: number;
  average_rule_complexity?: number;
  average_luck_factor?: number;
  average_interaction?: number;
  average_downtime?: number;
  popular_mechanics?: string[];
  site_recommended_players?: string[];
  in_wishlist?: boolean;
  wishlist_item_id?: number;
  bgg_url?: string;
  expansions?: Array<{ id: string; name: string }>;
  categories?: string[];
  mechanics?: string[];
  best_num_players?: string[];
  recommended_num_players?: string[];
  popular_categories?: string[];
  registered_on_site?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GameBasicInfo {
  id: string | number;
  bgg_id: string;
  name: string;
  japanese_name?: string;
  description?: string;
  japanese_description?: string;
  image_url?: string;
  japanese_image_url?: string;
  thumbnail?: string;
  min_players?: number;
  max_players?: number;
  play_time?: number;
  min_play_time?: number;
  publisher?: string;
  japanese_publisher?: string;
  designer?: string;
  release_date?: string;
  japanese_release_date?: string;
  weight?: number;
  in_wishlist?: boolean;
  wishlist_item_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GameStatistics {
  average_rule_complexity?: number;
  average_luck_factor?: number;
  average_interaction?: number;
  average_downtime?: number;
  average_overall_score?: number;
  reviews_count?: number;
  popular_categories?: string[];
  popular_mechanics?: string[];
  recommended_players?: string[];
  site_recommended_players?: string[];
}

export interface GameExpansion {
  id: string | number;
  bgg_id: string;
  name: string;
  japanese_name?: string;
  image_url?: string;
  japanese_image_url?: string;
  registered_on_site: boolean;
  relationship_type: string;
}

export interface UnregisteredExpansion {
  id: string;
  type: string;
}

export interface ExpansionsResponse {
  expansions: GameExpansion[];
  base_games: GameExpansion[];
  unregistered_expansion_ids: UnregisteredExpansion[];
  unregistered_base_game_ids: UnregisteredExpansion[];
}

export interface Review {
  id: number;
  user: {
    id: number;
    name: string;
    avatar_url?: string;
    image?: string;
  };
  game_id: string;
  overall_score: number;
  rule_complexity?: number;
  luck_factor?: number;
  interaction?: number;
  downtime?: number;
  play_time?: number;
  recommended_players?: string[];
  mechanics?: string[];
  categories?: string[];
  custom_tags?: string[];
  short_comment: string;
  created_at: string;
  updated_at?: string;
  likes_count: number;
  liked_by_current_user: boolean;
}

export interface GamesResponse {
  games: Game[];
  pagination: PaginationInfo;
  totalItems?: number; // 後方互換性
  totalPages?: number; // 後方互換性
}

export interface WishlistItem {
  id: number;
  game_id: string;
  position: number;
  created_at: string;
  game: Game | null;
}

export interface GameEditHistory {
  id: number;
  game_id: string;
  game_name: string;
  user_id: number;
  user_name: string;
  user_email: string;
  action: string;
  details: any;
  created_at: string;
}

export interface GameCreateParams {
  bgg_id: string;
  name?: string;
  description?: string;
  image_url?: string;
  min_players?: number;
  max_players?: number;
  play_time?: number;
  weight?: number;
  best_num_players?: string[];
  recommended_num_players?: string[];
}
