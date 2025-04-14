# BGRv4 API

ボードゲームレビューアプリケーションのバックエンド API。Ruby on Rails で実装されています。

## 機能概要

- ゲームの登録、検索、更新
- ユーザー認証とレビュー投稿
- BoardGameGeek (BGG) からのデータインポート
- システムレビュー（自動生成レビュー）機能
- ゲームのメタデータ管理（カテゴリ、メカニクスなど）

## 開発環境セットアップ

### 必要な環境

- Ruby 3.3.0
- PostgreSQL 15.x
- Node.js 18.x 以上（Webpacker 用）

### セットアップ手順

1. リポジトリをクローン

   ```
   git clone https://github.com/yourusername/bgr4-api.git
   cd bgr4-api
   ```

2. 依存パッケージをインストール

   ```
   bundle install
   ```

3. データベースを作成

   ```
   bin/rails db:create
   bin/rails db:migrate
   bin/rails db:seed
   ```

4. サーバーを起動
   ```
   bin/rails s
   ```

## デプロイ手順

### Google Cloud Run へのデプロイ

1. Google Cloud プロジェクトのセットアップ

   - Google Cloud プロジェクト ID とリージョンを設定
   - Container Registry を有効化
   - Cloud SQL (PostgreSQL) インスタンスを作成

2. 環境変数の設定
   以下の環境変数を Cloud Run サービスに設定します。

   ```
   PORT=8080
   RAILS_ENV=production
   RAILS_SERVE_STATIC_FILES=true
   RAILS_LOG_TO_STDOUT=true
   SECRET_KEY_BASE=<シークレットキー>
   DATABASE_URL=postgres://<ユーザー名>:<パスワード>@<ホスト名>:5432/<データベース名>
   ```

3. Cloud Build 構成ファイルを使用してデプロイ
   ```
   gcloud builds submit --config cloudbuild.yaml
   ```

### 手動デプロイ手順

1. Docker イメージをビルドして Container Registry にプッシュ

   ```
   docker build -t gcr.io/[PROJECT_ID]/bgr4-api .
   docker push gcr.io/[PROJECT_ID]/bgr4-api
   ```

2. Cloud Run にデプロイ
   ```
   gcloud run deploy bgr4-api \
     --image gcr.io/[PROJECT_ID]/bgr4-api \
     --platform managed \
     --region asia-northeast1 \
     --allow-unauthenticated \
     --set-env-vars "PORT=8080,RAILS_ENV=production,DATABASE_URL=postgres://..."
   ```

## システムレビュー機能

システムレビュー機能は、BGG からのデータに基づいて自動的にレビューを生成します。
この機能は以下のジョブで管理されています：

- `FetchBggDataJob`: BGG からゲームデータを取得
- `UpdateSystemReviewsJob`: システムレビューを更新
- `FetchPopularGamesJob`: BGG の人気ゲームを取得して登録

### システムレビューの生成ロジック

1. BGG の評価を当サイトの評価に変換（10 点満点）
2. BGG の重さを当サイトのルール複雑さに変換（5 点満点）
3. その他の評価項目（運要素、インタラクション、ダウンタイム）は BGG の重さから推定
4. おすすめプレイ人数は BGG のデータから導出
5. カテゴリとメカニクスも BGG のデータから変換

## 主要な API エンドポイント

### ゲーム関連

- `GET /api/v1/games`: ゲーム一覧の取得
- `GET /api/v1/games/:id`: ゲーム詳細の取得
- `POST /api/v1/games`: ゲームの登録
- `PUT /api/v1/games/:id`: ゲームの更新
- `GET /api/v1/games/search`: ゲームの検索
- `GET /api/v1/games/search_by_publisher`: 出版社でゲームを検索
- `GET /api/v1/games/search_by_designer`: デザイナーでゲームを検索
- `GET /api/v1/games/hot`: 人気のゲーム一覧
- `PUT /api/v1/games/:id/update_from_bgg`: BGG からゲーム情報を更新
- `PUT /api/v1/games/:id/update_system_reviews`: システムレビューを更新

### レビュー関連

- `GET /api/v1/games/:game_id/reviews`: ゲームのレビュー一覧
- `POST /api/v1/games/:game_id/reviews`: レビューの投稿
- `PUT /api/v1/games/:game_id/reviews/:id`: レビューの更新
- `GET /api/v1/reviews/all`: 全レビュー一覧
- `GET /api/v1/reviews/my`: 自分のレビュー一覧
- `POST /api/v1/reviews/:id/like`: レビューにいいねを付ける
- `DELETE /api/v1/reviews/:id/like`: レビューのいいねを取り消す

### 認証関連

- `POST /api/v1/auth/sign_up`: アカウント登録
- `POST /api/v1/auth/sign_in`: ログイン
- `DELETE /api/v1/auth/sign_out`: ログアウト
- `GET /api/v1/auth/:provider/callback`: ソーシャルログインのコールバック

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。
