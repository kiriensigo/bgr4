# チケット: レビュー一覧 即時反映戦略の実装

- 種別: 機能追加 / パフォーマンス改善
- 関連設計: `docs/028_review_list_instant_update.md`
- 目的: ISR + 差分フェッチ + 楽観的UIで、一覧の体感即時性とSEO/性能の両立を図る

## スコープ
- 一覧ページを ISR 化（300s）し、`tags:["reviews"]` を付与
- POST 成功時に `revalidateTag("reviews")` を実行
- クライアントで `?after=<timestamp>` の差分取得
- 楽観的UIで投稿直後にローカル反映、成功で置換・失敗でロールバック

## 受け入れ条件
- 未ログイン閲覧時、一覧ページが CDNs キャッシュから即時配信される
- 新規投稿後、最大数秒で一覧初期表示が更新（revalidateTag の効果）
- クライアント差分取得で 30–60 秒おきに新規レビューが増分反映される
- 投稿直後、自身の投稿が即時（ローカル）に見える
- 失敗時にローカルロールバックし、トーストで通知される

## タスク分解
1. 一覧ページの Server Component を ISR 化
   - `next: { revalidate: 300, tags: ["reviews"] }` を付与
2. Reviews API（POST）で revalidateTag を呼ぶ
3. 差分 API
   - `GET /api/reviews?after=<timestamp>` を実装
   - ETag/304 は任意（段階2で）
4. クライアント差分フェッチ
   - SWR で `refreshInterval=30-60s`、アクティブタブのみ
   - `latestTimestamp` を維持し、差分を先頭にマージ
5. 楽観的UI
   - 送信前に pending アイテムを先頭に挿入
   - 成功で置換、失敗で削除
6. テスト
   - 未ログイン表示の速度確認
   - 投稿→即時表示（ローカル）→サーバ反映の流れ
   - ポーリングで差分適用

## 非スコープ
- WebSocket/Realtime 導入（将来検討）
- DB スキーマ変更（不要）

## リスク/対策
- ポーリング負荷: インターバル/可視タブ時のみ再検証
- 一貫性: サーバ時刻 vs クライアント時刻 → DBの `created_at` を基準

## 完了の定義
- 受け入れ条件を満たし、E2E/手動確認で UX 問題がないこと
