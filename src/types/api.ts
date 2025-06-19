export interface Game {
  id: number;
  bgg_id: number;
  name: string;
  japanese_name: string | null;
  year_published: number;
  min_players: number;
  max_players: number;
  min_play_time: number;
  max_play_time: number;
  min_age: number;
  description: string;
  image_url: string | null;
  thumbnail_url: string | null;
  average_rating: number | null;
  reviews_count: number;
}

export interface Review {
  id: number;
  user_id: number;
  game_id: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  game: Game;
  overall_score: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total_pages: number;
  current_page: number;
}
