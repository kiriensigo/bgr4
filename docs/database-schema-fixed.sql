-- BGR v2 データベーススキーマ（修正版）
-- auth.usersテーブルのRLS設定は不要（Supabaseが自動管理）

-- profiles テーブル
create table public.profiles (
  id uuid references auth.users on delete cascade,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  is_admin boolean default false,

  primary key (id),
  constraint username_length check (char_length(username) >= 3)
);

-- games テーブル
create table public.games (
  id bigserial primary key,
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
create table public.reviews (
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
create table public.favorites (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  game_id bigint references public.games(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, game_id)
);

-- comments テーブル (レビューへのコメント)
create table public.comments (
  id bigserial primary key,
  review_id bigint references public.reviews(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS ポリシー設定
-- profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- games
alter table public.games enable row level security;
create policy "Games are viewable by everyone." on games for select using (true);
create policy "Only authenticated users can insert games." on games for insert to authenticated with check (true);

-- reviews
alter table public.reviews enable row level security;
create policy "Published reviews are viewable by everyone." on reviews for select using (is_published = true);
create policy "Users can view their own reviews." on reviews for select using (auth.uid() = user_id);
create policy "Authenticated users can insert reviews." on reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own reviews." on reviews for update using (auth.uid() = user_id);
create policy "Users can delete their own reviews." on reviews for delete using (auth.uid() = user_id);

-- favorites
alter table public.favorites enable row level security;
create policy "Users can view their own favorites." on favorites for select using (auth.uid() = user_id);
create policy "Users can insert their own favorites." on favorites for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can delete their own favorites." on favorites for delete using (auth.uid() = user_id);

-- comments
alter table public.comments enable row level security;
create policy "Comments are viewable by everyone." on comments for select using (true);
create policy "Authenticated users can insert comments." on comments for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own comments." on comments for update using (auth.uid() = user_id);
create policy "Users can delete their own comments." on comments for delete using (auth.uid() = user_id);

-- プロファイル自動作成のトリガー関数
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- 新規ユーザー登録時にプロファイル自動作成
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();