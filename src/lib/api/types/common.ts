// 共通型定義

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface PaginationInfo {
  current_page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
  next_page?: number;
  prev_page?: number;
}

export interface SortParams {
  sort_by?: string;
}

export interface SearchFilters {
  keyword?: string;
  min_players?: number | null;
  max_players?: number | null;
  play_time_min?: number;
  play_time_max?: number;
  complexity_min?: number;
  complexity_max?: number;
  total_score_min?: number;
  total_score_max?: number;
  interaction_min?: number;
  interaction_max?: number;
  luck_factor_min?: number;
  luck_factor_max?: number;
  downtime_min?: number;
  downtime_max?: number;
  mechanics?: string[];
  categories?: string[];
  recommended_players?: string[];
  publisher?: string;
  categories_match_all?: string;
  mechanics_match_all?: string;
  recommended_players_match_all?: string;
  use_reviews_mechanics?: string;
  use_reviews_categories?: string;
  use_reviews_recommended_players?: string;
}

export interface User {
  id: number;
  name: string;
  email?: string;
  bio?: string;
  avatar_url?: string;
  image?: string;
}

export interface AuthHeaders {
  "access-token"?: string;
  client?: string;
  uid?: string;
  expiry?: string;
  "token-type"?: string;
}
