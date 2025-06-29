# 🚀 BGR4 Render デプロイガイド

## 📋 **デプロイ前チェックリスト**

- ✅ TypeScript/ESLint エラー修正完了（82 個 →0 個）
- ✅ フロントエンド・バックエンド動作確認済み
- ✅ Render 設定ファイル作成完了
- ✅ CORS 設定最適化完了

## 🎯 **デプロイ手順**

### **Step 1: Render アカウント設定**

1. [Render.com](https://render.com) でアカウント作成
2. GitHub リポジトリと連携
3. リポジトリを公開設定に変更（Private 可）

### **Step 2: バックエンド（Rails API）デプロイ**

#### **2-1. 新しい Web サービス作成**

- Service Type: `Web Service`
- Repository: あなたの GitHub リポジトリ
- Name: `bgr4-api`
- Environment: `Ruby`
- Build Command: `cd bgr4-api && bundle install && bundle exec rails assets:precompile && bundle exec rails db:migrate`
- Start Command: `cd bgr4-api && bundle exec rails server -p $PORT -e production`

#### **2-2. 環境変数設定（バックエンド）**

```bash
# 必須設定
RAILS_ENV=production
RAILS_LOG_TO_STDOUT=true
RAILS_MASTER_KEY=[your_master_key]
SECRET_KEY_BASE=[generate_new_secret]

# データベース（Supabase継続の場合）
DATABASE_URL=postgresql://postgres.xrjciwduolukeqrrpiky:PmzXSpj3E+4FzCD@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres

# フロントエンドURL（後で更新）
FRONTEND_URL=https://bgr4-front.onrender.com
CORS_ORIGINS=https://bgr4-front.onrender.com

# OAuth設定（Renderドメインに更新）
GOOGLE_CLIENT_ID=[your_google_client_id]
GOOGLE_CLIENT_SECRET=[your_google_client_secret]
GOOGLE_CALLBACK_URL=https://bgr4-api.onrender.com/auth/google_oauth2/callback

TWITTER_CLIENT_ID=[your_twitter_client_id]
TWITTER_CLIENT_SECRET=[your_twitter_client_secret]
TWITTER_CALLBACK_URL=https://bgr4-api.onrender.com/auth/twitter2/callback

# JWT設定
DEVISE_JWT_SECRET_KEY=[generate_new_jwt_secret]

# DeepL API（翻訳機能）
DEEPL_API_KEY=80323fe6-9a44-4ec8-4c11-4e36433cb269:fx
```

#### **2-3. 高度な設定**

- Health Check Path: `/api/v1/health`
- Auto-Deploy: `Yes`

### **Step 3: フロントエンド（Next.js）デプロイ**

#### **3-1. 新しい静的サイト作成**

- Service Type: `Static Site`
- Repository: 同じ GitHub リポジトリ
- Name: `bgr4-front`
- Build Command: `cd bgr4-front && npm install && npm run build`
- Publish Directory: `bgr4-front/out`

#### **3-2. 環境変数設定（フロントエンド）**

```bash
# 必須設定
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://bgr4-api.onrender.com

# アプリケーション情報
NEXT_PUBLIC_APP_NAME=BGReviews
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### **3-3. カスタムドメイン（オプション）**

- `bgr4-reviews.onrender.com` などを設定可能

## 🔐 **秘密鍵の生成方法**

### **SECRET_KEY_BASE 生成**

```bash
cd bgr4-api
bundle exec rails secret
```

### **DEVISE_JWT_SECRET_KEY 生成**

```bash
cd bgr4-api
bundle exec rails secret
```

### **RAILS_MASTER_KEY**

```bash
# bgr4-api/config/master.key の内容を使用
# または新しく生成:
bundle exec rails credentials:edit
```

## 🗃️ **データベース選択肢**

### **Option A: Supabase 継続（推奨）**

- ✅ 既存データ維持
- ✅ 設定変更最小限
- 現在の `DATABASE_URL` をそのまま使用

### **Option B: Render PostgreSQL**

- Render Dashboard → Create Database
- Free Tier: 1GB まで
- 新しい `DATABASE_URL` を環境変数に設定
- データ移行が必要

## 🔄 **OAuth 設定更新**

### **Google OAuth2**

1. [Google Cloud Console](https://console.cloud.google.com/)
2. 「認証情報」→ 既存の OAuth2 クライアント編集
3. 承認済みリダイレクト URI に追加:
   - `https://bgr4-api.onrender.com/auth/google_oauth2/callback`

### **Twitter OAuth2**

1. [Twitter Developer Portal](https://developer.twitter.com/)
2. アプリ設定 → Authentication settings
3. Callback URL を更新:
   - `https://bgr4-api.onrender.com/auth/twitter2/callback`

## 🚨 **デプロイ後の確認項目**

### **バックエンド動作確認**

```bash
# ヘルスチェック
curl https://bgr4-api.onrender.com/api/v1/health

# API疎通確認
curl https://bgr4-api.onrender.com/api/v1/games
```

### **フロントエンド動作確認**

- ✅ ページ表示正常
- ✅ API 通信正常
- ✅ OAuth 認証動作
- ✅ レビュー投稿・表示正常

## 🛠️ **トラブルシューティング**

### **よくある問題と解決法**

#### **バックエンドが起動しない**

- ログを確認: Render Dashboard → Service → Logs
- `RAILS_MASTER_KEY` が正しく設定されているか確認
- `bundle install` で Gem エラーがないか確認

#### **フロントエンドで API 接続エラー**

- `NEXT_PUBLIC_API_URL` が正しく設定されているか確認
- CORS 設定が正しいか確認
- バックエンドが起動しているか確認

#### **OAuth 認証エラー**

- Google や Twitter での設定が正しいか確認
- コールバック URL が正確か確認
- 環境変数の設定値が正しいか確認

#### **データベース接続エラー**

- `DATABASE_URL` が正しく設定されているか確認
- Supabase の接続制限に達していないか確認
- マイグレーションが実行されているか確認

## ⚡ **パフォーマンス最適化**

### **有料プランのメリット**

- より多くのリソース
- 高速なビルド時間
- カスタムドメイン
- より多くの同時接続

### **無料プランの制限**

- 750 時間/月のランタイム
- 15 分間のインアクティブでスリープ
- 冷却時間によるレスポンス遅延

## 🎉 **デプロイ完了後**

1. **ドメイン確認**: フロントエンドとバックエンドの URL を記録
2. **OAuth 設定完了**: Google/Twitter 設定を最終確認
3. **動作テスト**: 全機能のテストを実行
4. **監視設定**: ログとパフォーマンス監視を設定

---

**次のステップ**: 実際のデプロイ開始 🚀
