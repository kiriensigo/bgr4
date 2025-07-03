# Render デプロイ用環境変数設定

## 必須環境変数

### データベース (Supabase)

```
DATABASE_URL=postgresql://postgres.xrjciwduolukeqrrpiky:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

**注意**: `[YOUR-PASSWORD]` には Supabase のデータベースパスワードを設定してください。  
**Transaction Pooler** (ポート 6543) を使用することで Render 環境での最適なパフォーマンスが得られます。

### Rails 設定

```
RAILS_ENV=production
RAILS_MASTER_KEY=[config/master.keyの内容]
RENDER=true
```

### フロントエンド連携

```
FRONTEND_URL=https://bgr4-front.onrender.com
API_URL=https://bgr4-api.onrender.com
```

### 認証設定

```
GOOGLE_CLIENT_ID=[GoogleOAuth ClientID]
GOOGLE_CLIENT_SECRET=[GoogleOAuth Secret]
TWITTER_CLIENT_ID=[TwitterOAuth ClientID]
TWITTER_CLIENT_SECRET=[TwitterOAuth Secret]
```

### メール設定

```
GMAIL_USERNAME=[Gmail送信用アドレス]
GMAIL_APP_PASSWORD=[Gmailアプリパスワード]
```

## ビルドコマンド

```
./bin/render-build.sh
```

## 開始コマンド

```
bundle exec puma -C config/puma.rb
```

## 注意事項

- RAILS_MASTER_KEY は config/master.key の内容をそのままコピー
- データベース URL は Supabase の接続情報を使用
- RENDER=true で Render 環境を識別
