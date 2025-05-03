# Board Game Review API

ボードゲームのレビューシステムのためのバックエンド API

## 概要

このプロジェクトは、ボードゲームのレビューを投稿・閲覧するためのバックエンド API を提供します。主な機能として以下を提供します：

- ボードゲーム情報の管理（BGG からのデータ取得を含む）
- ユーザーによるレビュー投稿・編集・削除
- レビュー評価システム（複雑さ、運要素、プレイヤー間交流など）
- おすすめプレイ人数の集計
- ウィッシュリスト機能
- OAuth 認証（Google、Twitter）

## 技術スタック

- Ruby 3.3.0
- Rails 7.1.3
- PostgreSQL 17
- Docker/Docker Compose

## ローカル開発環境のセットアップ

### 前提条件

- Docker と Docker Compose がインストールされていること
- Git

### 手順

1. リポジトリをクローン

```bash
git clone https://github.com/yourusername/bgr4-api.git
cd bgr4-api
```

2. 環境変数の設定

`.env`ファイルを作成し、必要な環境変数を設定します:

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=bgr4_development
DATABASE_URL=postgresql://postgres:postgres@db/bgr4_development
RAILS_ENV=development
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
DEVISE_JWT_SECRET_KEY=your_devise_jwt_secret_key
FRONTEND_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:3001
DEEPL_API_KEY=your_deepl_api_key
```

3. Docker コンテナを起動

```bash
docker-compose up
```

4. データベースのセットアップ

```bash
docker-compose exec api rails db:create db:migrate db:seed
```

## API エンドポイント

主要な API エンドポイントは以下の通りです：

### ゲーム関連

- `GET /api/v1/games` - ゲーム一覧の取得
- `GET /api/v1/games/:id` - ゲーム詳細の取得
- `POST /api/v1/games` - ゲームの登録（BGG ID または手動入力）
- `GET /api/v1/games/search` - ゲーム検索
- `PUT /api/v1/games/:id/update_system_reviews` - システムレビューの更新

### レビュー関連

- `GET /api/v1/games/:id/reviews` - ゲームのレビュー一覧取得
- `POST /api/v1/games/:id/reviews` - レビューの投稿
- `GET /api/v1/reviews/all` - 全レビュー一覧の取得

### ユーザー関連

- `POST /auth/sign_in` - メールアドレスでのログイン
- `GET /auth/google_oauth2` - Google でのログイン
- `GET /auth/twitter2` - Twitter でのログイン

## Google Cloud Run へのデプロイ

### 前提条件

- Google Cloud SDK
- プロジェクトとサービスアカウントの設定
- PostgreSQL インスタンスのセットアップ（Cloud SQL など）

### デプロイ手順

1. 認証

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

2. Cloud Build の実行

```bash
gcloud builds submit --config=cloudbuild-simple-rails.yaml
```

または環境変数を直接指定する場合:

```bash
gcloud builds submit --config=cloudbuild-simple-rails.yaml --substitutions=_DATABASE_HOST=your-db-host,_DATABASE_PORT=5432,_DATABASE_USERNAME=your-db-user,_DATABASE_PASSWORD=your-db-password,_DATABASE_NAME=bgr4db
```

## トラブルシューティング

- **データベース接続エラー**: 環境変数が正しく設定されているか確認してください
- **BGG データ取得エラー**: BGG API が混雑している可能性があります。再試行してください
- **マイグレーションエラー**: 最新のマイグレーションが適用されているか確認してください

## 貢献

バグレポートやプルリクエストは GitHub リポジトリに提出してください。

## ライセンス

MIT
