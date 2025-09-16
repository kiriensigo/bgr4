# BGR v2 API仕様書

## 📡 API概要

BGRv2のREST API仕様書。Next.js 14 App Routerベースのサーバーサイド実装。

### Base URL
- **開発環境**: `http://localhost:3001/api`
- **本番環境**: `https://bgrq.netlify.app/api`

### 認証
- **認証方式**: Bearer Token (Supabase JWT)
- **ヘッダー**: `Authorization: Bearer {token}`

### レスポンス形式
すべてのAPIレスポンスは以下の共通形式：

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}
```

## 🎮 ゲーム関連API

### GET /api/games
ゲーム一覧取得

**Parameters:**
```typescript
interface GameSearchParams {
  page?: number           // ページ番号 (default: 1)
  limit?: number          // 取得件数 (default: 20, max: 100)
  search?: string         // ゲーム名検索
  categories?: string[]   // カテゴリーフィルター
  mechanics?: string[]    // メカニクスフィルター
  minPlayers?: number     // 最小プレイ人数
  maxPlayers?: number     // 最大プレイ人数
  minTime?: number        // 最小プレイ時間
  maxTime?: number        // 最大プレイ時間
  sortBy?: 'name' | 'year' | 'rating' | 'reviews'
  sortOrder?: 'asc' | 'desc'
}
```

**Response:**
```typescript
interface GameListResponse {
  games: Game[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

### GET /api/games/[id]
ゲーム詳細取得

**Response:**
```typescript
interface GameDetailResponse {
  game: Game
  stats: {
    reviewCount: number
    avgRating: number
    ratingDistribution: number[]
  }
}
```

### POST /api/games
ゲーム登録（管理者のみ）

**Request Body:**
```typescript
interface CreateGameRequest {
  bggId?: string           // BGG IDから自動取得
  name: string             // 手動登録の場合は必須
  japaneseName?: string
  description?: string
  yearPublished?: number
  minPlayers: number
  maxPlayers: number
  playingTime?: number
  categories?: string[]
  mechanics?: string[]
}
```

### GET /api/games/[id]/stats
ゲーム統計情報取得（BGG重み付け統計）

**Response:**
```typescript
interface GameStatsResponse {
  mechanics: StatisticItem[]
  categories: StatisticItem[]
  playerCounts: StatisticItem[]
}

interface StatisticItem {
  name: string
  percentage: number
  priority: 'highlight' | 'normal' | 'hidden'
  reviewCount: number
  bggWeight: number
}
```

## 📝 レビュー関連API

### GET /api/reviews
レビュー一覧取得

**Parameters:**
```typescript
interface ReviewSearchParams {
  gameId?: number         // 特定ゲームのレビュー
  userId?: string         // 特定ユーザーのレビュー
  page?: number
  limit?: number
  sortBy?: 'created' | 'rating' | 'likes'
  sortOrder?: 'asc' | 'desc'
}
```

**Response:**
```typescript
interface ReviewListResponse {
  reviews: Review[]
  pagination: PaginationInfo
}
```

### GET /api/reviews/[id]
レビュー詳細取得

**Response:**
```typescript
interface ReviewDetailResponse {
  review: Review
  comments: Comment[]
  stats: {
    likeCount: number
    commentCount: number
    isLiked: boolean      // 認証ユーザーのみ
  }
}
```

### POST /api/reviews
レビュー投稿

**Request Body:**
```typescript
interface CreateReviewRequest {
  gameId: number
  title: string
  content: string
  rating: number          // 1-10
  // 詳細評価（1-10）
  complexityRating?: number
  luckRating?: number
  interactionRating?: number
  downtimeRating?: number
  // 選択式項目
  playedWith?: string[]   // プレイ人数
  mechanics?: string[]    // 体験したメカニクス
  categories?: string[]   // 該当カテゴリー
  pros?: string[]         // 良い点
  cons?: string[]         // 悪い点
  // コメント（150文字制限）
  comment?: string
}
```

### PUT /api/reviews/[id]
レビュー更新（投稿者のみ）

### DELETE /api/reviews/[id]
レビュー削除（投稿者・管理者のみ）

### POST /api/reviews/[id]/likes
レビューいいね

### DELETE /api/reviews/[id]/likes
レビューいいね解除

## 💬 コメント関連API

### GET /api/reviews/[id]/comments
レビューコメント一覧

### POST /api/reviews/[id]/comments
コメント投稿

**Request Body:**
```typescript
interface CreateCommentRequest {
  content: string
  parentId?: number      // 返信の場合
}
```

### PUT /api/reviews/[reviewId]/comments/[commentId]
コメント更新（投稿者のみ）

### DELETE /api/reviews/[reviewId]/comments/[commentId]
コメント削除（投稿者・管理者のみ）

### POST /api/reviews/[reviewId]/comments/[commentId]/likes
コメントいいね

## 🔍 検索API

### GET /api/search
統合検索

**Parameters:**
```typescript
interface SearchParams {
  query: string           // 検索クエリ
  type?: 'games' | 'reviews' | 'all'
  filters?: {
    categories?: string[]
    mechanics?: string[]
    minPlayers?: number
    maxPlayers?: number
    yearRange?: [number, number]
    ratingRange?: [number, number]
  }
  page?: number
  limit?: number
}
```

**Response:**
```typescript
interface SearchResponse {
  games?: Game[]
  reviews?: Review[]
  total: number
  pagination: PaginationInfo
  facets: {
    categories: FacetItem[]
    mechanics: FacetItem[]
    years: FacetItem[]
  }
}
```

## 👤 ユーザー関連API

### GET /api/auth/user
現在のユーザー情報取得

### PUT /api/auth/user
ユーザー情報更新

**Request Body:**
```typescript
interface UpdateUserRequest {
  username?: string
  fullName?: string
  avatarUrl?: string
  website?: string
}
```

### GET /api/wishlist
ウィッシュリスト取得

### POST /api/wishlist
ウィッシュリスト追加

**Request Body:**
```typescript
interface AddWishlistRequest {
  gameId: number
  priority?: number      // 1-10 (表示順序)
}
```

### DELETE /api/wishlist
ウィッシュリストから削除

## 📊 統計API

### GET /api/home/stats
ホームページ統計情報

**Response:**
```typescript
interface HomeStatsResponse {
  totalReviews: number
  totalGames: number
  activeReviewers: number
  averageRating: number
}
```

### GET /api/home/popular-games
人気ゲーム一覧

### GET /api/home/recent-reviews
最新レビュー一覧

## 🛠️ 管理者API

### GET /api/admin/stats
管理者ダッシュボード統計

### GET /api/admin/users
ユーザー管理

### POST /api/admin/users/[id]/promote
管理者権限付与

### POST /api/admin/users/[id]/demote  
管理者権限剥奪

### GET /api/admin/reviews
レビュー管理（モデレーション）

### POST /api/admin/bgg-sync
BGGデータ同期実行

## 🔌 外部連携API

### GET /api/bgg/search
BGG検索プロキシ

### GET /api/bgg/game/[id]
BGGゲーム情報取得

### GET /api/bgg/hot
BGG人気ゲーム取得

### GET /api/bgg/rankings
BGGランキング取得

## 📈 エラーコード

### 認証エラー
- `AUTH_001`: 認証が必要です
- `AUTH_002`: 不正なトークンです
- `AUTH_003`: トークンの有効期限が切れています
- `AUTH_004`: 権限が不足しています

### バリデーションエラー
- `VALID_001`: 必須フィールドが不足しています
- `VALID_002`: フィールドの形式が正しくありません
- `VALID_003`: 値が許可範囲外です

### データエラー
- `DATA_001`: リソースが見つかりません
- `DATA_002`: 重複するデータです
- `DATA_003`: データベースエラーが発生しました

### 外部サービスエラー
- `BGG_001`: BGG APIエラー
- `BGG_002`: BGG APIレート制限
- `BGG_003`: BGGデータが見つかりません

## 📝 型定義

### Game
```typescript
interface Game {
  id: number
  bggId: string | number
  name: string
  japaneseName?: string
  description?: string
  yearPublished?: number
  minPlayers: number
  maxPlayers: number
  playingTime?: number
  imageUrl?: string
  thumbnailUrl?: string
  categories: string[]
  mechanics: string[]
  publishers: string[]
  designers: string[]
  ratingAverage?: number
  ratingCount?: number
  createdAt: string
  updatedAt: string
}
```

### Review
```typescript
interface Review {
  id: number
  userId: string
  gameId: number
  title: string
  content: string
  rating: number
  complexityRating?: number
  luckRating?: number
  interactionRating?: number
  downtimeRating?: number
  playedWith?: string[]
  mechanics?: string[]
  categories?: string[]
  pros?: string[]
  cons?: string[]
  comment?: string
  isPublished: boolean
  likeCount: number
  commentCount: number
  createdAt: string
  updatedAt: string
  // Relations
  user: User
  game: Game
}
```

### User
```typescript
interface User {
  id: string
  username: string
  fullName?: string
  avatarUrl?: string
  website?: string
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}
```

---

**作成日**: 2025-08-30  
**APIバージョン**: v2.0  
**メンテナンス**: 機能追加時に更新  
**テスト環境**: Playwright E2E テストでカバー済み