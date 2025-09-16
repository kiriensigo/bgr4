-- BGR v2 Supabase Database Schema
-- Run this in Supabase SQL Editor

-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- profiles テーブル
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE,
  updated_at timestamp with time zone,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  website text,
  is_admin boolean DEFAULT false,

  PRIMARY KEY (id),
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- games テーブル
CREATE TABLE IF NOT EXISTS public.games (
  id bigserial PRIMARY KEY,
  bgg_id integer UNIQUE,
  name text NOT NULL,
  japanese_name text,
  description text,
  year_published integer,
  min_players integer,
  max_players integer,
  playing_time integer,
  min_age integer,
  image_url text,
  thumbnail_url text,
  mechanics text[],
  categories text[],
  designers text[],
  publishers text[],
  rating_average numeric(3,2),
  rating_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- reviews テーブル (拡張評価システム対応)
CREATE TABLE IF NOT EXISTS public.reviews (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id bigint REFERENCES public.games(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  
  -- 評価系
  rating integer CHECK (rating >= 1 AND rating <= 10), -- レガシー互換性
  overall_score integer CHECK (overall_score >= 1 AND overall_score <= 10),
  
  -- 詳細評価 (1-5スケール)
  rule_complexity integer CHECK (rule_complexity >= 1 AND rule_complexity <= 5),
  luck_factor integer CHECK (luck_factor >= 1 AND luck_factor <= 5),
  interaction integer CHECK (interaction >= 1 AND interaction <= 5),
  downtime integer CHECK (downtime >= 1 AND downtime <= 5),
  
  -- ゲーム体験
  recommended_players text[], -- ["2", "3", "4", "5", "6", "7"]
  play_time_actual integer, -- 実際のプレイ時間（分）
  player_count_played text, -- プレイした人数
  
  -- ゲーム特徴
  mechanics text[],
  categories text[],
  custom_tags text[],
  
  -- レガシー評価
  pros text[],
  cons text[],
  
  -- メタ情報
  is_published boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- favorites テーブル
CREATE TABLE IF NOT EXISTS public.favorites (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id bigint REFERENCES public.games(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, game_id)
);

-- comments テーブル (レビューへのコメント)
CREATE TABLE IF NOT EXISTS public.comments (
  id bigserial PRIMARY KEY,
  review_id bigint REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- RLS ポリシー設定
-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- games
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Games are viewable by everyone." ON games FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Only authenticated users can insert games." ON games FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Only authenticated users can update games." ON games FOR UPDATE TO authenticated WITH CHECK (true);

-- reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Published reviews are viewable by everyone." ON reviews FOR SELECT USING (is_published = true);
CREATE POLICY IF NOT EXISTS "Users can view their own reviews." ON reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Authenticated users can insert reviews." ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own reviews." ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete their own reviews." ON reviews FOR DELETE USING (auth.uid() = user_id);

-- favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view their own favorites." ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own favorites." ON favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete their own favorites." ON favorites FOR DELETE USING (auth.uid() = user_id);

-- comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Comments are viewable by everyone." ON comments FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated users can insert comments." ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own comments." ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete their own comments." ON comments FOR DELETE USING (auth.uid() = user_id);

-- 統計更新関数
CREATE OR REPLACE FUNCTION update_game_statistics(game_id_param bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.games 
  SET 
    rating_average = (
      SELECT AVG(COALESCE(overall_score, rating))
      FROM public.reviews 
      WHERE game_id = game_id_param AND is_published = true
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.reviews 
      WHERE game_id = game_id_param AND is_published = true
    ),
    updated_at = now()
  WHERE id = game_id_param;
END;
$$;

-- トリガー関数: レビューの挿入・更新・削除時に統計を更新
CREATE OR REPLACE FUNCTION trigger_update_game_statistics()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- INSERT or UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_game_statistics(NEW.game_id);
    RETURN NEW;
  END IF;
  
  -- DELETE
  IF TG_OP = 'DELETE' THEN
    PERFORM update_game_statistics(OLD.game_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- トリガー作成
DROP TRIGGER IF EXISTS trigger_reviews_stats ON public.reviews;
CREATE TRIGGER trigger_reviews_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_game_statistics();

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_games_bgg_id ON public.games(bgg_id);
CREATE INDEX IF NOT EXISTS idx_reviews_game_id ON public.reviews(game_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_published ON public.reviews(is_published);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_game ON public.favorites(user_id, game_id);
CREATE INDEX IF NOT EXISTS idx_comments_review_id ON public.comments(review_id);