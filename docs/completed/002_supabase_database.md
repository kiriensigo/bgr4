# 002: Supabaseデータベース設定

## 概要
Supabaseプロジェクト作成、PostgreSQLスキーマ設計、RLSポリシー設定

## 作業内容

### Supabaseプロジェクト作成
- [x] Supabaseプロジェクト作成（完了済み）
- [x] データベースURL・APIキー取得（完了済み）
- [x] 環境変数設定

### データベーススキーマ作成
- [x] `profiles`テーブル作成（ユーザープロフィール）
- [x] `games`テーブル作成（ゲーム情報）
- [x] `reviews`テーブル作成（レビュー）
- [x] `favorites`テーブル作成（お気に入り）
- [x] `comments`テーブル作成（レビューコメント）

### RLS（Row Level Security）設定
- [x] `profiles`テーブルのRLSポリシー
- [x] `games`テーブルのRLSポリシー
- [x] `reviews`テーブルのRLSポリシー
- [x] `favorites`テーブルのRLSポリシー
- [x] `comments`テーブルのRLSポリシー

### Supabaseクライアント設定
- [x] `src/lib/supabase.ts`作成
- [x] TypeScript型定義生成
- [x] 接続テスト（MCP経由で接続確認済み）

## SQL実行
```sql
-- Enable RLS
alter table auth.users enable row level security;

-- profiles テーブル
create table public.profiles (
  id uuid references auth.users on delete cascade,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  is_admin boolean default false,
  primary key (id),
  constraint username_length check (char_length(username) >= 3)
);

-- 他のテーブルも作成...
```

## 受け入れ条件
- [x] Supabaseプロジェクトが作成されている
- [x] 全テーブルが正しく作成されている
- [x] RLSポリシーが適切に設定されている
- [x] Next.jsアプリからSupabaseに接続できる
- [x] 型安全性が確保されている

## 🎉 完了状況

### ✅ 完了済み項目
- **Supabaseプロジェクト**: https://fjjpkzhmrufwzjxqvres.supabase.co で稼働中
- **データベーススキーマ**: 全5テーブル（profiles, games, reviews, favorites, comments）作成済み
- **RLSポリシー**: 全テーブルでRow Level Security有効化済み
- **MCP接続確認**: ユーザー4名登録済み、データベース操作正常
- **型安全性**: TypeScript型定義完備

### 📋 現在の状況
Supabaseデータベースは**完全にセットアップ済み**で、アプリケーションから正常にアクセス可能です。

## 想定作業時間
3-4時間

## 関連ファイル
- `src/lib/supabase.ts`
- `src/types/database.ts`
- Supabase SQL Editor

## 備考
データベース設計は後の変更が困難なため、慎重に設計する。