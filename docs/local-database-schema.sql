-- ローカルPostgreSQL用のスキーマ（Supabaseの機能を削除）

-- UUIDエクステンション有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- profiles テーブル（auth.usersの代わりに独立したテーブル）
CREATE TABLE public.profiles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password_hash text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  is_admin boolean default false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  constraint username_length check (char_length(username) >= 3)
);

-- games テーブル
CREATE TABLE public.games (
  id bigserial PRIMARY KEY,
  bgg_id integer unique,
  name text not null,
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
  rating_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- reviews テーブル
CREATE TABLE public.reviews (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  game_id bigint references public.games(id) on delete cascade,
  title text not null,
  content text not null,
  rating integer check (rating >= 1 and rating <= 10),
  pros text[],
  cons text[],
  is_published boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- favorites テーブル
CREATE TABLE public.favorites (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  game_id bigint references public.games(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, game_id)
);

-- comments テーブル (レビューへのコメント)
CREATE TABLE public.comments (
  id bigserial primary key,
  review_id bigint references public.reviews(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- インデックス作成
CREATE INDEX idx_games_bgg_id ON public.games(bgg_id);
CREATE INDEX idx_games_name ON public.games(name);
CREATE INDEX idx_games_categories ON public.games USING GIN(categories);
CREATE INDEX idx_games_mechanics ON public.games USING GIN(mechanics);
CREATE INDEX idx_reviews_game_id ON public.reviews(game_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_game_id ON public.favorites(game_id);
CREATE INDEX idx_comments_review_id ON public.comments(review_id);

-- サンプルデータ挿入
INSERT INTO public.profiles (id, email, username, full_name, is_admin) 
VALUES 
  (uuid_generate_v4(), 'admin@bgr.com', 'admin', 'Administrator', true),
  (uuid_generate_v4(), 'user@bgr.com', 'testuser', 'Test User', false);

-- サンプルゲームデータ
INSERT INTO public.games (
  name, description, year_published, min_players, max_players, playing_time,
  mechanics, categories, designers, publishers, rating_average, rating_count
) VALUES 
(
  'カタン',
  'カタン島を舞台にした開拓ゲーム。資源を集めて道や街を建設し、10点を先取したプレイヤーの勝利。',
  1995, 3, 4, 75,
  ARRAY['ダイスロール', 'エリア支配', '交易'],
  ARRAY['戦略ゲーム', 'ファミリーゲーム'],
  ARRAY['Klaus Teuber'],
  ARRAY['ジーピー', 'Kosmos'],
  7.2, 1250
),
(
  'アズール',
  'ポルトガルの宮殿を美しいタイルで装飾するタイル配置ゲーム。',
  2017, 2, 4, 45,
  ARRAY['タイル配置', 'パターン構築', 'セットコレクション'],
  ARRAY['抽象戦略', 'ファミリーゲーム'],
  ARRAY['Michael Kiesling'],
  ARRAY['ホビージャパン', 'Plan B Games'],
  7.8, 892
),
(
  'ウイングスパン',
  '鳥をテーマにしたエンジンビルディングゲーム。美しいアートワークが特徴。',
  2019, 1, 5, 90,
  ARRAY['エンジンビルディング', 'カードドラフト', 'セットコレクション'],
  ARRAY['戦略ゲーム', '動物'],
  ARRAY['Elizabeth Hargrave'],
  ARRAY['ホビージャパン', 'Stonemaier Games'],
  8.1, 1567
);

-- 確認用ビュー作成
CREATE VIEW games_with_stats AS
SELECT 
  g.*,
  COUNT(r.id) as review_count,
  AVG(r.rating) as avg_user_rating
FROM games g
LEFT JOIN reviews r ON g.id = r.game_id AND r.is_published = true
GROUP BY g.id
ORDER BY g.name;