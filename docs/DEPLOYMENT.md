# デプロイメントガイド

## 本番環境設定

### 1. 環境変数設定

#### Netlify環境変数
Netlify管理画面の「Site settings > Environment variables」で以下を設定：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# OAuth (本番設定)
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret
TWITTER_CLIENT_ID=your_production_twitter_client_id
TWITTER_CLIENT_SECRET=your_production_twitter_client_secret

# アプリケーション
NEXT_PUBLIC_APP_URL=https://bgrq.netlify.app
NEXT_PUBLIC_APP_NAME="BGR - Board Game Review"
NEXT_PUBLIC_APP_VERSION=1.0.0

# セキュリティ
NEXTAUTH_SECRET=your_strong_production_secret
NEXTAUTH_URL=https://bgrq.netlify.app
```

### 2. OAuth プロバイダー設定

#### Google Cloud Console
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 「認証情報」→「OAuth 2.0 クライアント ID」を選択
3. 承認済みのリダイレクト URI に追加：
   ```
   https://bgrq.netlify.app/auth/callback
   ```

#### Twitter Developer Portal
1. [Twitter Developer Portal](https://developer.twitter.com/)にアクセス
2. アプリの設定を開く
3. Authentication settings で以下を設定：
   ```
   Callback URLs: https://bgrq.netlify.app/auth/callback
   Website URL: https://bgrq.netlify.app
   ```

### 3. Supabase設定

#### Authentication設定
1. Supabase Dashboard の「Authentication > Settings」を開く
2. Site URLを設定：
   ```
   https://bgrq.netlify.app
   ```
3. Redirect URLsに追加：
   ```
   https://bgrq.netlify.app/auth/callback
   ```

#### Storage設定
1. 「Storage」セクションで以下のバケットを作成：
   - `images` (public)
   - `avatars` (public)
2. RLS (Row Level Security) ポリシーを設定

### 4. ドメイン設定

#### Netlify Domain
1. Netlify管理画面の「Domain settings」を開く
2. カスタムドメインを設定（オプション）
3. HTTPS証明書が自動生成されることを確認

#### DNS設定（カスタムドメイン使用時）
```dns
Type: CNAME
Name: @
Value: your-site-name.netlify.app
```

### 5. ビルド設定

#### netlify.toml
```toml
[build]
  publish = ".next"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--prefer-offline --no-audit"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  directory = "netlify/functions"

# セキュリティヘッダー
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://boardgamegeek.com;"
```

### 6. GitHub Actions CI/CD

#### Secrets設定
GitHub リポジトリの「Settings > Secrets and variables > Actions」で設定：

```bash
NETLIFY_AUTH_TOKEN=your_netlify_auth_token
NETLIFY_SITE_ID=your_netlify_site_id
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=https://bgrq.netlify.app
```

### 7. モニタリング設定

#### Google Analytics
1. [Google Analytics](https://analytics.google.com/)でプロパティを作成
2. GA4測定IDを取得
3. 環境変数 `NEXT_PUBLIC_GA_ID` に設定

#### Sentry (オプション)
```bash
# .env.production
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 8. パフォーマンス最適化

#### Next.js設定
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['your-supabase-project.supabase.co']
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  distDir: '.next'
}

module.exports = nextConfig
```

#### 画像最適化
- WebP形式の使用
- レスポンシブ画像の実装
- 遅延読み込みの活用

### 9. セキュリティ設定

#### Content Security Policy
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https: blob:;
connect-src 'self' https://*.supabase.co https://boardgamegeek.com;
```

#### Environment Variables Security
- 本番環境では開発用の値を使用しない
- シークレットキーは強力なランダム文字列を使用
- 定期的にキーをローテーション

### 10. バックアップとリカバリ

#### Supabaseバックアップ
- 自動バックアップが有効になっていることを確認
- 重要なデータの定期エクスポート

#### コードバックアップ
- GitHubリポジトリのプライベート設定確認
- ブランチ保護ルールの設定

### 11. デプロイフロー

#### 本番デプロイ手順
1. `main`ブランチに変更をマージ
2. GitHub Actionsが自動実行
3. テストとビルドが成功
4. Netlifyに自動デプロイ
5. デプロイ後の動作確認

#### ロールバック手順
1. Netlify管理画面でデプロイ履歴を確認
2. 前のバージョンに手動でロールバック
3. または、GitHubで前のコミットにrevert

### 12. 監視とアラート

#### 必要な監視項目
- アプリケーションの可用性
- レスポンス時間
- エラー率
- データベース性能
- OAuth認証の成功率

#### アラート設定
- 5xx エラーが発生した場合
- レスポンス時間が3秒を超えた場合
- データベース接続エラーが発生した場合

## トラブルシューティング

### よくある問題

#### ビルドエラー
```bash
# 依存関係の問題
npm ci
npm run build

# 型エラー
npm run type-check
```

#### OAuth認証エラー
- リダイレクトURLの確認
- クライアントIDとシークレットの確認
- Supabase設定の確認

#### データベース接続エラー
- 環境変数の確認
- Supabaseの接続制限確認
- RLSポリシーの確認

### ログ確認方法

#### Netlify Function Logs
```bash
netlify functions:logs --name=function-name
```

#### Supabase Logs
1. Supabase Dashboard
2. 「Logs」セクション
3. 時間範囲とログレベルを指定

#### ブラウザ Console
- 本番環境でもdeveloper toolsでエラー確認可能
- Network タブでAPI呼び出しを監視

## 参考リンク

- [Next.js デプロイメント](https://nextjs.org/docs/deployment)
- [Netlify ドキュメント](https://docs.netlify.com/)
- [Supabase ドキュメント](https://supabase.com/docs)
- [Google OAuth設定](https://developers.google.com/identity/protocols/oauth2)
- [Twitter OAuth設定](https://developer.twitter.com/en/docs/authentication/oauth-2-0)