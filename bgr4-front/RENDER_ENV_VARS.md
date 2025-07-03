# Render フロントエンドデプロイ用環境変数設定

## 必須環境変数

### API連携
```
NEXT_PUBLIC_API_URL=https://bgr4-api.onrender.com
```

### Node.js設定
```
NODE_VERSION=18
NODE_ENV=production
```

## ビルドコマンド
```
npm run render-build
```

## 開始コマンド
```
npm start
```

## 注意事項
- NEXT_PUBLIC_API_URLは必ずhttps://で始める
- バックエンドのデプロイが完了してからフロントエンドをデプロイ
- ビルド時にESLintエラーは無視される設定済み 