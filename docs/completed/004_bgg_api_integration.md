# 004: BGG API連携機能

## 概要
BoardGameGeek APIからのゲーム情報取得、データ変換・保存機能の実装

## 作業内容

### BGG API基盤
- [x] `lib/bgg-api.ts`作成（API呼び出しロジック）
- [x] XMLパーサー実装（xml2js使用）
- [x] レート制限対策（1秒/1リクエスト）
- [x] エラーハンドリング・リトライ機能

### データ変換・正規化
- [x] BGGデータ→Game型変換関数
- [x] 画像URL処理
- [x] メカニクス・カテゴリ情報抽出
- [x] デザイナー・パブリッシャー情報抽出

### API Route作成
- [x] `app/api/bgg/search/route.ts`（ゲーム検索）
- [x] `app/api/bgg/game/[id]/route.ts`（ゲーム詳細）
- [x] `app/api/bgg/hot/route.ts`（人気ゲーム）
- [x] `app/api/bgg/sync/route.ts`（データ同期機能実装済み）

### キャッシュ戦略
- [x] Next.js cache設定
- [x] Supabaseキャッシュ実装（ローカルDB使用）
- [x] 定期同期バッチ処理（API Route実装済み）

### BGG連携フック
- [x] `hooks/useBGGSearch.ts`
- [x] `hooks/useBGGGame.ts`
- [x] `hooks/useBGGHot.ts`

### エラー処理・型定義
- [x] `types/bgg.ts`（BGG API型定義）
- [x] BGGApiError（カスタムエラー）
- [x] バリデーション・サニタイズ

## BGG API仕様
```typescript
// ゲーム検索
GET https://boardgamegeek.com/xmlapi2/search?query={query}&type=boardgame

// ゲーム詳細
GET https://boardgamegeek.com/xmlapi2/thing?id={id}&stats=1

// 人気ゲーム
GET https://boardgamegeek.com/xmlapi2/hot?type=boardgame
```

## 受け入れ条件
- [x] BGG APIからゲーム検索ができる
- [x] ゲーム詳細情報を取得・保存できる
- [x] レート制限が適切に処理される
- [x] エラー時の適切なフォールバック
- [x] 取得データがSupabaseに正しく保存される
- [x] 画像URLが正しく処理される

## 🎉 完了状況

### ✅ 完了済み項目
- **BGG API連携**: 検索、詳細取得、人気ゲーム取得全て実装済み
- **高度なエラーハンドリング**: レート制限、リトライ、フォールバック機能完備
- **データ変換システム**: BGG XML→PostgreSQL完全対応
- **キャッシュ戦略**: Next.js + Supabase二重キャッシュ実装
- **型安全性**: TypeScript完全対応、バリデーション機能

### 📋 現在の状況
BGG API連携は**完全に実装済み**で、プロダクション環境で安定動作しています。

## 想定作業時間
5-6時間

## 関連ファイル
- `src/lib/bgg-api.ts`
- `src/types/bgg.ts`
- `src/hooks/useBGG*.ts`
- `src/app/api/bgg/*`

## 備考
BGG APIは不安定なため、エラーハンドリングとキャッシュ戦略が重要。→ **実装済み**