# BGR4 Docker コンテナ設定

このプロジェクトは、以下の 3 つのコンテナで構成されています：

1. **フロントエンド (Next.js)** - ユーザーインターフェース
2. **バックエンド (Ruby on Rails)** - API サービス
3. **データベース (PostgreSQL 17)** - データ永続化

## ローカル開発環境での実行方法

### 前提条件

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 環境変数の設定

`.env`ファイルをプロジェクトのルートディレクトリに作成し、必要な環境変数を設定します：

```
RAILS_MASTER_KEY=your_rails_master_key_here
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### ビルドと起動

```bash
# コンテナをビルドして起動
docker-compose up -d

# ログを確認
docker-compose logs -f
```

### アクセス方法

- フロントエンド: http://localhost:3001
- バックエンド API: http://localhost:8080

## Google Cloud Run へのデプロイ手順

### 前提条件

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- Google Cloud アカウントとプロジェクト
- [Docker](https://docs.docker.com/get-docker/)

### 1. Google Cloud の認証とプロジェクト設定

```bash
# Google Cloudにログイン
gcloud auth login

# プロジェクトの設定
gcloud config set project YOUR_PROJECT_ID
```

### 2. Artifact Registry の準備

```bash
# Artifact Registryリポジトリの作成
gcloud artifacts repositories create bgr4-repo \
    --repository-format=docker \
    --location=asia-northeast1 \
    --description="Repository for BGR4 Docker images"

# Dockerの認証設定
gcloud auth configure-docker asia-northeast1-docker.pkg.dev
```

### 3. PostgreSQL データベースのセットアップ

Google Cloud SQL で PostgreSQL インスタンスを作成します：

```bash
# Cloud SQLインスタンスの作成
gcloud sql instances create bgr4-db \
    --database-version=POSTGRES_17 \
    --cpu=1 \
    --memory=3840MiB \
    --region=asia-northeast1 \
    --root-password=YOUR_ROOT_PASSWORD

# データベースの作成
gcloud sql databases create bgr4_api_production --instance=bgr4-db

# ユーザーの作成
gcloud sql users create bgr4_api --instance=bgr4-db --password=YOUR_USER_PASSWORD
```

### 4. イメージのビルドとプッシュ

#### バックエンドのデプロイ

```bash
# イメージをビルド
docker build -t asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/bgr4-repo/bgr4-api:latest ./bgr4-api

# イメージをプッシュ
docker push asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/bgr4-repo/bgr4-api:latest

# Cloud Runにデプロイ
gcloud run deploy bgr4-api \
    --image=asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/bgr4-repo/bgr4-api:latest \
    --region=asia-northeast1 \
    --platform=managed \
    --allow-unauthenticated \
    --set-env-vars="DATABASE_HOST=CLOUD_SQL_PRIVATE_IP,DATABASE_PORT=5432,POSTGRES_USER=bgr4_api,POSTGRES_PASSWORD=YOUR_USER_PASSWORD,BGR4_API_DATABASE_PASSWORD=YOUR_USER_PASSWORD,RAILS_MASTER_KEY=YOUR_RAILS_MASTER_KEY,RAILS_LOG_TO_STDOUT=true,SEED_DATABASE=true" \
    --add-cloudsql-instances=YOUR_PROJECT_ID:asia-northeast1:bgr4-db
```

#### フロントエンドのデプロイ

```bash
# イメージをビルド
docker build -t asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/bgr4-repo/bgr4-front:latest ./bgr4-front

# イメージをプッシュ
docker push asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/bgr4-repo/bgr4-front:latest

# Cloud Runにデプロイ
gcloud run deploy bgr4-front \
    --image=asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/bgr4-repo/bgr4-front:latest \
    --region=asia-northeast1 \
    --platform=managed \
    --allow-unauthenticated \
    --set-env-vars="NEXT_PUBLIC_API_URL=https://bgr4-api-xxxxxxxxxx-an.a.run.app"
```

### 5. 環境のテスト

デプロイが完了したら、Cloud Run の URL にアクセスしてアプリケーションが正常に動作しているか確認します。

## コンテナの詳細

### フロントエンド (Next.js)

- ビルドとランタイムの 2 段階のステージを使用
- 本番環境用に最適化されたビルド
- ポート: 3001

### バックエンド (Ruby on Rails)

- Ruby 3.3.4 を使用
- プロダクション環境用に設定
- データベースマイグレーションの自動実行
- ポート: 8080

### データベース (PostgreSQL 17)

- 最新の PostgreSQL 17 を使用
- 日本語環境に対応（タイムゾーン設定など）
- 初期化スクリプトによるデータベース自動作成
- ポート: 5432

## トラブルシューティング

### コンテナが起動しない場合

ログを確認して問題を特定します：

```bash
docker-compose logs -f
```

### データベース接続エラー

データベースの接続設定を確認し、必要に応じて環境変数を調整してください。

```bash
# PostgreSQLコンテナに接続してデータベースを確認
docker exec -it bgr4-db psql -U postgres
```

### Cloud Run のデプロイ失敗

Cloud Run のログを確認して問題を特定します：

```bash
gcloud run services logs read bgr4-api --region=asia-northeast1
gcloud run services logs read bgr4-front --region=asia-northeast1
```
