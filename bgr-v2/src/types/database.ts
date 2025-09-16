export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          is_admin: boolean
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          is_admin?: boolean
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          is_admin?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      games: {
        Row: {
          id: number
          bgg_id: number | null
          name: string
          japanese_name: string | null
          description: string | null
          year_published: number | null
          min_players: number | null
          max_players: number | null
          playing_time: number | null
          min_age: number | null
          image_url: string | null
          thumbnail_url: string | null
          mechanics: string[] | null
          categories: string[] | null
          designers: string[] | null
          publishers: string[] | null
          rating_average: number | null
          rating_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          bgg_id?: number | null
          name: string
          description?: string | null
          year_published?: number | null
          min_players?: number | null
          max_players?: number | null
          playing_time?: number | null
          min_age?: number | null
          image_url?: string | null
          thumbnail_url?: string | null
          mechanics?: string[]
          categories?: string[]
          designers?: string[]
          publishers?: string[]
          rating_average?: number | null
          rating_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          bgg_id?: number | null
          name?: string
          description?: string | null
          year_published?: number | null
          min_players?: number | null
          max_players?: number | null
          playing_time?: number | null
          min_age?: number | null
          image_url?: string | null
          thumbnail_url?: string | null
          mechanics?: string[]
          categories?: string[]
          designers?: string[]
          publishers?: string[]
          rating_average?: number | null
          rating_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: number
          user_id: string | null
          game_id: number | null
          title: string
          content: string
          rating: number | null
          overall_score: number | null
          rule_complexity: number | null
          luck_factor: number | null
          interaction: number | null
          downtime: number | null
          recommended_players: string[] | null
          play_time_actual: number | null
          player_count_played: string | null
          mechanics: string[] | null
          categories: string[] | null
          custom_tags: string[] | null
          pros: string[] | null
          cons: string[] | null
          is_published: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          user_id?: string | null
          game_id?: number | null
          title: string
          content: string
          rating?: number | null
          overall_score?: number | null
          rule_complexity?: number | null
          luck_factor?: number | null
          interaction?: number | null
          downtime?: number | null
          recommended_players?: string[] | null
          play_time_actual?: number | null
          player_count_played?: string | null
          mechanics?: string[] | null
          categories?: string[] | null
          custom_tags?: string[] | null
          pros?: string[] | null
          cons?: string[] | null
          is_published?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string | null
          game_id?: number | null
          title?: string
          content?: string
          rating?: number | null
          overall_score?: number | null
          rule_complexity?: number | null
          luck_factor?: number | null
          interaction?: number | null
          downtime?: number | null
          recommended_players?: string[] | null
          play_time_actual?: number | null
          player_count_played?: string | null
          mechanics?: string[] | null
          categories?: string[] | null
          custom_tags?: string[] | null
          pros?: string[] | null
          cons?: string[] | null
          is_published?: boolean | null
          created_at?: string | null
          updated_at?: string | null
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
          }
        ]
      }
      favorites: {
        Row: {
          id: number
          user_id: string
          game_id: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          game_id: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          game_id?: number
          created_at?: string
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
          }
        ]
      }
      comments: {
        Row: {
          id: number
          review_id: number
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          review_id: number
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          review_id?: number
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
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
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_game_statistics: {
        Args: {
          game_id_param: number
        }
        Returns: void
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