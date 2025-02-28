export interface Game {
  id: number;
  bgg_id: string;
  name: string;
  japanese_name?: string;
  description?: string;
  image_url?: string;
  min_players?: number;
  max_players?: number;
  play_time?: number;
  average_score?: number;
  weight?: number;
  created_at?: string;
  updated_at?: string;
  bgg_url?: string;
  publisher?: string;
  designer?: string;
  release_date?: string;
  japanese_release_date?: string;
  japanese_publisher?: string;
}

export interface GameWithReviews extends Game {
  reviews: Review[];
  reviews_count: number;
  average_rule_complexity?: number;
  average_luck_factor?: number;
  average_interaction?: number;
  average_downtime?: number;
  popular_tags?: string[];
  popular_mechanics?: string[];
  site_recommended_players?: string[];
  in_wishlist?: boolean;
}

export interface Review {
  id: number;
  user: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  overall_score: number;
  rule_complexity?: number;
  luck_factor?: number;
  interaction?: number;
  downtime?: number;
  play_time?: number;
  short_comment?: string;
  long_comment?: string;
  recommended_players?: string[];
  mechanics?: string[];
  tags?: string[];
  custom_tags?: string[];
  created_at: string;
  updated_at?: string;
  likes_count: number;
  liked_by_current_user: boolean;
}

export interface WishlistItem {
  id: number;
  user_id: number;
  game_id: string;
  position: number;
  created_at: string;
  updated_at: string;
  game: Game;
}
