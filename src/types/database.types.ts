export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: number
          review_id: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: number
          review_id?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: number
          review_id?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          game_id: number | null
          id: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          game_id?: number | null
          id?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          game_id?: number | null
          id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          bgg_id: number | null
          categories: string[] | null
          created_at: string | null
          description: string | null
          designers: string[] | null
          id: number
          image_url: string | null
          max_players: number | null
          max_playing_time: number | null
          mechanics: string[] | null
          min_age: number | null
          min_players: number | null
          min_playing_time: number | null
          name: string
          playing_time: number | null
          publishers: string[] | null
          rating_average: number | null
          rating_count: number | null
          thumbnail_url: string | null
          updated_at: string | null
          year_published: number | null
        }
        Insert: {
          bgg_id?: number | null
          categories?: string[] | null
          created_at?: string | null
          description?: string | null
          designers?: string[] | null
          id?: number
          image_url?: string | null
          max_players?: number | null
          max_playing_time?: number | null
          mechanics?: string[] | null
          min_age?: number | null
          min_players?: number | null
          min_playing_time?: number | null
          name: string
          playing_time?: number | null
          publishers?: string[] | null
          rating_average?: number | null
          rating_count?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          year_published?: number | null
        }
        Update: {
          bgg_id?: number | null
          categories?: string[] | null
          created_at?: string | null
          description?: string | null
          designers?: string[] | null
          id?: number
          image_url?: string | null
          max_players?: number | null
          max_playing_time?: number | null
          mechanics?: string[] | null
          min_age?: number | null
          min_players?: number | null
          min_playing_time?: number | null
          name?: string
          playing_time?: number | null
          publishers?: string[] | null
          rating_average?: number | null
          rating_count?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          year_published?: number | null
        }
        Relationships: []
      }
      jp_game_sequence: {
        Row: {
          last_number: number | null
        }
        Insert: {
          last_number?: number | null
        }
        Update: {
          last_number?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          cat_acting: boolean | null
          cat_animals: boolean | null
          cat_bluffing: boolean | null
          cat_card_game: boolean | null
          cat_childrens: boolean | null
          cat_deduction: boolean | null
          cat_expansion_1: boolean | null
          cat_expansion_2: boolean | null
          cat_expansion_3: boolean | null
          cat_large_group: boolean | null
          cat_legacy_campaign: boolean | null
          cat_memory: boolean | null
          cat_negotiation: boolean | null
          cat_pair: boolean | null
          cat_paper_pencil: boolean | null
          cat_party: boolean | null
          cat_puzzle: boolean | null
          cat_solo: boolean | null
          cat_trick_taking: boolean | null
          cat_wargame: boolean | null
          cat_word_game: boolean | null
          complexity_score: number | null
          content: string
          created_at: string | null
          downtime_score: number | null
          game_id: number | null
          id: number
          interaction_score: number | null
          is_published: boolean | null
          luck_factor: number | null
          mech_area_control: boolean | null
          mech_auction: boolean | null
          mech_betting: boolean | null
          mech_cooperative: boolean | null
          mech_deck_building: boolean | null
          mech_dice_rolling: boolean | null
          mech_drafting: boolean | null
          mech_expansion_1: boolean | null
          mech_expansion_2: boolean | null
          mech_expansion_3: boolean | null
          mech_hidden_roles: boolean | null
          mech_modular_board: boolean | null
          mech_push_luck: boolean | null
          mech_route_building: boolean | null
          mech_set_collection: boolean | null
          mech_simultaneous: boolean | null
          mech_tile_placement: boolean | null
          mech_variable_powers: boolean | null
          mech_worker_placement: boolean | null
          overall_score: number | null
          rating: number | null
          rec_players_1: boolean | null
          rec_players_2: boolean | null
          rec_players_3: boolean | null
          rec_players_4: boolean | null
          rec_players_5: boolean | null
          rec_players_6plus: boolean | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cat_acting?: boolean | null
          cat_animals?: boolean | null
          cat_bluffing?: boolean | null
          cat_card_game?: boolean | null
          cat_childrens?: boolean | null
          cat_deduction?: boolean | null
          cat_expansion_1?: boolean | null
          cat_expansion_2?: boolean | null
          cat_expansion_3?: boolean | null
          cat_large_group?: boolean | null
          cat_legacy_campaign?: boolean | null
          cat_memory?: boolean | null
          cat_negotiation?: boolean | null
          cat_pair?: boolean | null
          cat_paper_pencil?: boolean | null
          cat_party?: boolean | null
          cat_puzzle?: boolean | null
          cat_solo?: boolean | null
          cat_trick_taking?: boolean | null
          cat_wargame?: boolean | null
          cat_word_game?: boolean | null
          complexity_score?: number | null
          content: string
          created_at?: string | null
          downtime_score?: number | null
          game_id?: number | null
          id?: number
          interaction_score?: number | null
          is_published?: boolean | null
          luck_factor?: number | null
          mech_area_control?: boolean | null
          mech_auction?: boolean | null
          mech_betting?: boolean | null
          mech_cooperative?: boolean | null
          mech_deck_building?: boolean | null
          mech_dice_rolling?: boolean | null
          mech_drafting?: boolean | null
          mech_expansion_1?: boolean | null
          mech_expansion_2?: boolean | null
          mech_expansion_3?: boolean | null
          mech_hidden_roles?: boolean | null
          mech_modular_board?: boolean | null
          mech_push_luck?: boolean | null
          mech_route_building?: boolean | null
          mech_set_collection?: boolean | null
          mech_simultaneous?: boolean | null
          mech_tile_placement?: boolean | null
          mech_variable_powers?: boolean | null
          mech_worker_placement?: boolean | null
          overall_score?: number | null
          rating?: number | null
          rec_players_1?: boolean | null
          rec_players_2?: boolean | null
          rec_players_3?: boolean | null
          rec_players_4?: boolean | null
          rec_players_5?: boolean | null
          rec_players_6plus?: boolean | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cat_acting?: boolean | null
          cat_animals?: boolean | null
          cat_bluffing?: boolean | null
          cat_card_game?: boolean | null
          cat_childrens?: boolean | null
          cat_deduction?: boolean | null
          cat_expansion_1?: boolean | null
          cat_expansion_2?: boolean | null
          cat_expansion_3?: boolean | null
          cat_large_group?: boolean | null
          cat_legacy_campaign?: boolean | null
          cat_memory?: boolean | null
          cat_negotiation?: boolean | null
          cat_pair?: boolean | null
          cat_paper_pencil?: boolean | null
          cat_party?: boolean | null
          cat_puzzle?: boolean | null
          cat_solo?: boolean | null
          cat_trick_taking?: boolean | null
          cat_wargame?: boolean | null
          cat_word_game?: boolean | null
          complexity_score?: number | null
          content?: string
          created_at?: string | null
          downtime_score?: number | null
          game_id?: number | null
          id?: number
          interaction_score?: number | null
          is_published?: boolean | null
          luck_factor?: number | null
          mech_area_control?: boolean | null
          mech_auction?: boolean | null
          mech_betting?: boolean | null
          mech_cooperative?: boolean | null
          mech_deck_building?: boolean | null
          mech_dice_rolling?: boolean | null
          mech_drafting?: boolean | null
          mech_expansion_1?: boolean | null
          mech_expansion_2?: boolean | null
          mech_expansion_3?: boolean | null
          mech_hidden_roles?: boolean | null
          mech_modular_board?: boolean | null
          mech_push_luck?: boolean | null
          mech_route_building?: boolean | null
          mech_set_collection?: boolean | null
          mech_simultaneous?: boolean | null
          mech_tile_placement?: boolean | null
          mech_variable_powers?: boolean | null
          mech_worker_placement?: boolean | null
          overall_score?: number | null
          rating?: number | null
          rec_players_1?: boolean | null
          rec_players_2?: boolean | null
          rec_players_3?: boolean | null
          rec_players_4?: boolean | null
          rec_players_5?: boolean | null
          rec_players_6plus?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      review_categories_stats: {
        Row: {
          category_name: string | null
          column_name: string | null
          review_count: number | null
        }
        Relationships: []
      }
      review_mechanics_stats: {
        Row: {
          column_name: string | null
          mechanic_name: string | null
          review_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_next_jp_game_id: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never