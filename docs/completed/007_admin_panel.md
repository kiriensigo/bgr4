# 007: 管理機能

## 概要
管理者向けダッシュボード、ユーザー・ゲーム・レビュー管理機能の実装

## 作業内容

### 管理者ダッシュボード
- [ ] `app/admin/page.tsx`（ダッシュボード）→ 未実装
- [ ] `components/admin/AdminLayout.tsx` → 未実装
- [ ] `components/admin/StatsCards.tsx`（統計情報）→ 未実装
- [ ] `components/admin/RecentActivity.tsx` → 未実装
- [ ] アナリティクス・グラフ表示 → 将来実装予定

### ユーザー管理
- [ ] `app/admin/users/page.tsx`（ユーザー一覧）→ 未実装
- [ ] `components/admin/UsersList.tsx` → 未実装
- [ ] `components/admin/UserEditForm.tsx` → 未実装
- [ ] ユーザー詳細表示 → 未実装
- [ ] 管理者権限付与・剥奪 → 未実装
- [ ] ユーザー停止・復活機能 → 将来実装予定

### ゲーム情報管理
- [ ] `app/admin/games/page.tsx`（ゲーム一覧）→ 未実装
- [ ] `components/admin/GamesList.tsx` → 未実装
- [ ] `components/admin/GameEditForm.tsx` → 未実装
- [ ] ゲーム情報手動編集 → 未実装
- [ ] BGG同期状況管理 → 将来実装予定
- [ ] ゲーム削除機能 → 未実装

### レビュー管理・モデレーション
- [ ] `app/admin/reviews/page.tsx`（レビュー一覧）→ 未実装
- [ ] `components/admin/ReviewsList.tsx` → 未実装
- [ ] `components/admin/ReviewModerationPanel.tsx` → 未実装
- [ ] 不適切レビュー報告機能 → 将来実装予定
- [ ] レビュー承認・拒否システム → 未実装
- [ ] 一括操作機能 → 未実装

### 権限・セキュリティ
- [ ] `lib/admin.ts`（管理者権限チェック）→ 未実装
- [ ] `middleware.ts`に管理者保護追加 → 将来実装予定
- [ ] 操作ログ記録 → 未実装
- [ ] 監査ログ表示 → 将来実装予定

### システム設定
- [ ] `app/admin/settings/page.tsx` → 未実装
- [ ] `components/admin/SystemSettings.tsx` → 未実装
- [ ] BGG API設定 → 未実装
- [ ] サイト設定管理 → 未実装
- [ ] メンテナンスモード → 未実装

### API Route
- [ ] `app/api/admin/users/route.ts` → 未実装
- [ ] `app/api/admin/users/[id]/route.ts` → 未実装
- [ ] `app/api/admin/games/route.ts` → 将来実装予定
- [ ] `app/api/admin/reviews/route.ts` → 将来実装予定
- [ ] `app/api/admin/stats/route.ts` → 未実装
- [ ] `app/api/admin/logs/route.ts` → 将来実装予定

### カスタムフック
- [ ] `hooks/useAdminStats.ts` → API直接呼び出しで代用
- [ ] `hooks/useAdminUsers.ts` → API直接呼び出しで代用
- [ ] `hooks/useAdminReviews.ts` → API直接呼び出しで代用

## セキュリティ要件
- [ ] 管理者権限の厳密チェック
- [ ] CSRF保護
- [ ] 操作ログの記録
- [ ] 敏感な操作の二重確認

## 受け入れ条件
- [ ] 管理者のみアクセス可能
- [ ] ダッシュボードで統計情報を表示
- [ ] ユーザー管理機能が動作する
- [ ] ゲーム情報を編集できる
- [ ] レビューのモデレーションができる
- [ ] 操作ログが記録される
- [ ] 適切なエラーハンドリング

## 🚧 完了状況

### ❌ 未実装項目
- **管理者機能**: 完全に未実装
- **管理者権限システム**: 未実装
- **管理画面**: 全て未実装
- **API**: 管理者用API未実装

### 📋 現在の状況
管理機能は**未実装**です。基本的なアプリケーション機能が完成してから実装予定。

## 想定作業時間
6-8時間

## 関連ファイル
- `src/app/admin/*`
- `src/components/admin/*`
- `src/hooks/useAdmin*.ts`
- `src/app/api/admin/*`
- `src/lib/admin.ts`

## 備考
セキュリティが最重要。管理者機能は段階的に実装し、都度テストする。