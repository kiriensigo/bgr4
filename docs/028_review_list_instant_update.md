# レビュー一覧 即時反映戦略（設計ドキュメント）

- 使用技術
  - フロントエンド: Next.js (App Router)
  - バックエンド/DB: Supabase
  - データ取得戦略: ISR + クライアント差分フェッチ + 楽観的UI

---

## 目的
- ISR でパフォーマンスとSEOを確保
- クライアント差分フェッチで「そこそこ最新」を提供（数十秒遅れOK）
- 楽観的UIで「自分の投稿は即反映」を実現

---

## 方針概要

### 1) 一覧ページ（ISR）
- 初期HTML: `fetch(..., { next: { revalidate: 300, tags: ["reviews"] } })`
- キャッシュ: CDN配信で高速レスポンス
- 更新: 投稿成功時に `revalidateTag("reviews")` で前倒し更新

### 2) 差分フェッチ（クライアント）
- 直近のタイムスタンプを保持（例: `latestTimestamp`）
- API: `/api/reviews?after=<timestamp>`
- 間隔: 30〜60秒ポーリング or タブアクティブ時のみ再検証（SWRのrevalidate設定）
- レスポンス: 更新がなければ 304 (Not Modified) を想定（ETag/If-None-Match対応）

### 3) 投稿処理（楽観的UI）
- 直後: ローカルリストに半透明状態のレビューを即挿入
- 成功: DB保存 → レスポンスIDで置換
- 失敗: ロールバック（ローカル削除）＋トースト通知

---

## 実装フロー（擬似コード）

### ISRでの初期取得（Server Component）
```tsx
// app/reviews/page.tsx
export default async function ReviewsPage() {
  const res = await fetch(`${process.env.API_BASE}/reviews?limit=20`, {
    next: { revalidate: 300, tags: ["reviews"] },
  });
  const initial = await res.json();
  return (
    <ReviewsClient initial={initial.items} latest={initial.latestTimestamp} />
  );
}
```

### 差分フェッチAPI（app/api/reviews/route.ts）
```ts
export async function GET(req: Request) {
  const after = new URL(req.url).searchParams.get("after");
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .gt("created_at", after)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    items: data,
    latestTimestamp: data?.[0]?.created_at,
  });
}
```

### 投稿（app/api/reviews/route.ts）
```ts
import { revalidateTag } from "next/cache";

export async function POST(req: Request) {
  const { body } = await req.json();
  const { data, error } = await supabase
    .from("reviews")
    .insert({ body, user_id: "me" })
    .select()
    .single();

  if (error) return NextResponse.json({ error }, { status: 400 });

  // ISRキャッシュを早めに再生成
  revalidateTag("reviews");

  return NextResponse.json(data);
}
```

---

## API/キャッシュ設計メモ
- list GET: `revalidate=300`, `tags=["reviews"]`
- create POST: `revalidateTag("reviews")`
- diff GET: `?after=<timestamp>`、SWRの`refreshInterval`=30–60s、タブ非アクティブ時は停止
- ETag運用（任意）: 変更なし時は 304 を返すと転送量が軽くなる

## UI実装メモ
- 楽観追加アイテムは `status: "pending"` を持たせ、成功で `status: "synced"`
- 直近追加は先頭へ（時系列）
- 失敗時のリトライ導線（再送 or 下書き保存）

## エッジケース
- 投稿失敗（通信/認可）: ロールバック＋トースト
- 連投時: 一時的にpendingアイテムが複数並ぶことを許容
- タイムゾーン: UTCで統一して比較

## モニタリング
- API: レイテンシ/エラー率
- クライアント: 差分ヒット率、304比率

## ロールアウト
- 機能フラグで段階的に有効化
- キャッシュTTL調整（300→180など）

```
依存なし（DBスキーマ変更不要）
```
