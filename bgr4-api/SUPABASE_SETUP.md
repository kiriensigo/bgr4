# Supabase データベース設定・移行ガイド

## 📋 概要

ローカル PostgreSQL データベースから Supabase へのデータ移行手順

### 現在のデータ量

- **ゲーム**: 2,180 件
- **ユーザー**: 6 件
- **レビュー**: 4 件
- **その他**: 編集履歴、拡張情報等

## 🚀 Supabase セットアップ手順

### Step 1: Supabase プロジェクト作成

1. [Supabase](https://supabase.com) にアクセス
2. 「New Project」をクリック
3. プロジェクト情報を入力:
   - **Name**: `BGR4 Production`
   - **Database Password**: 強力なパスワードを生成
   - **Region**: `Northeast Asia (Tokyo)`
4. 「Create new project」をクリック

### Step 2: 接続情報の取得

1. Supabase ダッシュボード → Settings → Database
2. 「Connection string」セクションから以下をコピー:
   ```
   postgresql://postgres:[パスワード]@[ホスト]:[ポート]/postgres
   ```

### Step 3: 環境変数設定

**Render の環境変数に設定:**

```bash
DATABASE_URL=postgresql://postgres:[パスワード]@[ホスト]:[ポート]/postgres
```

## 🔄 データ移行手順

### Option 1: 自動マイグレーション（推奨）

**Render デプロイ時に自動実行:**

1. `./bin/render-build.sh` でマイグレーション実行
2. `rails db:seed` でシステムユーザー作成
3. 空のデータベースから開始

**メリット:**

- クリーンな環境
- Render デプロイと同時に実行
- トラブルが少ない

### Option 2: 既存データ移行

**📦 エクスポート済みデータ:**

- **ファイル**: `tmp/games_export_20250703_195219.json`
- **サイズ**: 7.24 MB
- **ゲーム件数**: 2,180 件
- **エクスポート日時**: 2025-07-03 19:52:19

**移行手順:**

1. **ローカルでデータエクスポート（完了）:**

   ```bash
   bundle exec rake data:export_games
   ```

2. **Supabase にインポート:**

   ```bash
   # マイグレーション実行後
   bundle exec rake data:import_from_file[tmp/games_export_20250703_195219.json]
   ```

3. **その他のデータ移行:**

   ```bash
   # ユーザー・レビューデータ
   bundle exec rake data:migrate_users
   bundle exec rake data:migrate_reviews
   ```

### Option 3: データダンプ移行

**大量データを移行する場合:**

1. **ローカルでデータエクスポート:**

   ```bash
   pg_dump bgr4_development > bgr4_backup.sql
   ```

2. **Supabase にインポート:**
   - Supabase SQL Editor 使用
   - または Rails seed ファイル作成

## 🎯 推奨アプローチ

### 段階的移行戦略

**Phase 1: スキーマ移行**

- Render デプロイでマイグレーション実行
- システムユーザー作成
- 基本動作確認

**Phase 2: 重要データ移行**

- BGG ゲームデータの再登録（BGG API 使用）
- システムレビューの再生成
- より信頼性の高いデータ構築

**Phase 3: ユーザーデータ**

- 必要に応じてユーザー・レビューデータ移行

## 🔧 技術的詳細

### Supabase 特有の設定

1. **Row Level Security (RLS)**

   ```sql
   -- 必要に応じてRLSを無効化
   ALTER TABLE games DISABLE ROW LEVEL SECURITY;
   ```

2. **拡張機能の有効化**

   ```sql
   -- 必要な拡張機能
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

3. **インデックス最適化**
   - ローカルで使用しているインデックスを確認
   - Supabase で同様のパフォーマンス確保

## 💡 トラブルシューティング

### よくある問題

1. **接続エラー**

   - DATABASE_URL の形式確認
   - ファイアウォール設定確認

2. **権限エラー**

   - Supabase ユーザー権限確認
   - テーブル作成権限確認

3. **データ型エラー**
   - PostgreSQL バージョン差異
   - JSON/配列型の互換性

## 📊 移行後の確認項目

- [ ] 全テーブルが作成されている
- [ ] システムユーザーが存在する
- [ ] マイグレーションが全て適用済み
- [ ] API が正常に動作する
- [ ] BGG からのゲーム登録が可能

## 🚦 次のステップ

1. **Supabase プロジェクト作成**
2. **DATABASE_URL を Render に設定**
3. **Render でバックエンドデプロイ**
4. **動作確認**
5. **BGG ゲームデータの再登録**
