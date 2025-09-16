# 006: レビューシステム

## 概要
ゲームレビューの投稿・編集・表示機能の実装

## 作業内容

### レビュー投稿機能
- [x] `components/reviews/EnhancedReviewForm.tsx`（大幅拡張実装）
- [x] `app/reviews/new/page.tsx`（レビュー投稿ページ実装）
- [x] バリデーション（zod使用）
- [x] 拡張評価システム（複雑さ、運要素、相互作用、ダウンタイム）
- [x] タブ式フォームインターフェース
- [x] メカニクス・カテゴリー選択機能
- [x] リッチテキストエディター検討（Textareaで実装、将来拡張予定）
- [ ] 画像アップロード機能（将来実装予定）

### レビュー表示機能
- [x] `components/reviews/EnhancedReviewCard.tsx`（大幅拡張実装）
- [x] 詳細レビュー表示（detailed/compact/defaultバリアント）
- [x] 評価表示（星・数値・詳細評価バー）
- [x] Pros/Cons表示
- [x] メカニクス・カテゴリーバッジ表示
- [x] プレイ体験情報表示
- [x] カスタムタグ表示
- [x] `components/reviews/ReviewDetail.tsx`（EnhancedReviewCardで代替実装）

### レビュー一覧・検索
- [x] `app/reviews/page.tsx`（レビュー一覧実装）
- [x] 統計情報表示（総レビュー数、平均評価、詳細評価付き数）
- [x] EnhancedReviewCard使用
- [x] 高度な検索機能（`/search`ページで実装）
- [x] ゲーム別レビュー表示（API実装済み）
- [x] ユーザー別レビュー表示（API実装済み）
- [x] 評価順ソート（API実装済み）

### レビュー編集・削除
- [x] `app/reviews/[id]/edit/page.tsx`（編集ページ実装済み）
- [x] 権限チェック（自分のレビューのみ）
- [x] 編集履歴管理（updated_atフィールドで管理）
- [x] 削除確認モーダル（UIコンポーネント実装済み）

### コメント機能
- [x] `components/reviews/CommentForm.tsx`（コメント機能実装済み）
- [x] `components/reviews/CommentsList.tsx`（コメント一覧実装済み）
- [x] ネストコメント対応検討（フラット構造で実装）
- [ ] コメント通知機能（将来実装予定）

### API Route
- [x] `app/api/local/reviews/route.ts`（拡張版作成・一覧）
- [x] 詳細評価フィールド対応
- [x] 複合検索API（`/api/search`）
- [x] ファセット検索対応
- [x] ゲーム情報結合取得
- [x] 統計情報計算
- [x] `app/api/reviews/[id]/route.ts`（詳細・編集・削除）
- [x] `app/api/reviews/[id]/comments/route.ts`（コメント）

### バリデーション・型定義
- [x] `types/enhanced-review.ts`（拡張レビュー型定義）
- [x] `types/search.ts`（検索型定義）
- [x] `lib/game-constants.ts`（ゲーム定数・ユーティリティ）
- [x] Zodバリデーション完全対応
- [x] サニタイズ機能

### カスタムフック
- [x] `hooks/useReviews.ts`
- [x] `hooks/useReview.ts`
- [x] `hooks/useReviewComments.ts`

## 受け入れ条件
- [x] 拡張レビューを投稿できる（詳細評価含む）
- [x] レビューが適切に表示される（複数バリアント）
- [x] 評価（星・数値・詳細評価バー）が表示される
- [x] 高度な検索・フィルタリングが動作する
- [x] メカニクス・カテゴリー管理ができる
- [x] 統計情報が表示される
- [x] レビューを編集・削除できる
- [x] コメント機能が動作する
- [x] 権限チェックが適切に動作する

## 想定作業時間
8-10時間

## 関連ファイル
- `src/app/reviews/*`
- `src/components/reviews/*`
- `src/hooks/useReview*.ts`
- `src/app/api/reviews/*`
- `src/lib/validations.ts`

## 備考
レビューシステムはサイトの核となる機能のため、UI/UXに特に注意する。