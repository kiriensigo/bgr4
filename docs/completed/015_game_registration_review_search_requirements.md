# チケット 015: ゲーム登録・レビュー・検索システム要件定義

## 概要
BGG（BoardGameGeek）APIからのゲーム登録機能、包括的なレビューシステム、高度な検索システムの要件定義を行い、BGRv2の核となる機能を設計する。

## 参考資料
- BGR4プロジェクトの仕様書（`bgr4/.cursor/rules/`）
- BGG API仕様
- 既存のSupabaseスキーマ

## 1. ゲーム登録システム

### 1.1 登録方法
**二つの登録モード：**

#### A. BGG API連携登録
- **BGG ID検索**: 数値ID（例：`123456`）でBGG APIから自動データ取得
- **取得データ**:
  - 基本情報（名前、年度、プレイ人数、プレイ時間、重量度）
  - 画像（サムネイル、フル解像度）
  - カテゴリー・メカニクス
  - デザイナー・パブリッシャー
  - 評価情報（BGG評価、ランキング）

#### B. 手動登録
- **日本語ゲーム対応**: BGGに未登録の日本語ボードゲーム
- **ID形式**: `jp-{Base64エンコードされた日本語名}`
- **必須フィールド**: 日本語名、プレイ人数、プレイ時間
- **オプションフィール**: 説明、カテゴリー、メカニクス、パブリッシャー

### 1.2 データ変換・正規化

#### BGG → サイト内分類変換（実際のマッピング）
```typescript
interface ConversionMapping {
  // BGGカテゴリー → サイトカテゴリー（シンプル設計）
  bggCategoryToSiteCategory: {
    'Animals': '動物',
    'Bluffing': 'ブラフ',
    'Card Game': 'カードゲーム',
    "Children's Game": '子供向け',
    'Deduction': '推理',
    'Memory': '記憶',
    'Negotiation': '交渉',
    'Party Game': 'パーティー',
    'Puzzle': 'パズル',
    'Wargame': 'ウォーゲーム',
    'Word Game': 'ワードゲーム'
  },
  
  // BGGカテゴリー → サイトメカニクス（混合マッピング）
  bggCategoryToSiteMechanic: {
    'Dice': 'ダイスロール'
  },
  
  // BGGメカニクス → サイトカテゴリー（混合マッピング）
  bggMechanicToSiteCategory: {
    'Acting': '演技',
    'Deduction': '推理',
    'Legacy Game': 'レガシー・キャンペーン',
    'Memory': '記憶',
    'Negotiation': '交渉',
    'Paper-and-Pencil': '紙ペン',
    'Scenario / Mission / Campaign Game': 'レガシー・キャンペーン',
    'Solo / Solitaire Game': 'ソロ向き',
    'Pattern Building': 'パズル',
    'Trick-taking': 'トリテ'
  },
  
  // BGGメカニクス → サイトメカニクス（主要マッピング）
  bggMechanicToSiteMechanic: {
    'Area Majority / Influence': 'エリア支配',
    'Auction / Bidding': 'オークション',
    'Auction Compensation': 'オークション',
    'Auction: Dutch': 'オークション',
    'Auction: English': 'オークション',
    'Auction: Sealed Bid': 'オークション',
    'Betting and Bluffing': '賭け',
    'Closed Drafting': 'ドラフト',
    'Cooperative Game': '協力',
    'Deck Construction': 'デッキ/バッグビルド',
    'Deck, Bag, and Pool Building': 'デッキ/バッグビルド',
    'Dice Rolling': 'ダイスロール',
    'Hidden Roles': '正体隠匿',
    'Modular Board': 'モジュラーボード',
    'Network and Route Building': 'ルート構築',
    'Open Drafting': 'ドラフト',
    'Push Your Luck': 'バースト',
    'Set Collection': 'セット収集',
    'Simultaneous Action Selection': '同時手番',
    'Tile Placement': 'タイル配置',
    'Variable Player Powers': 'プレイヤー別能力',
    'Variable Set-up': 'プレイヤー別能力',
    'Worker Placement': 'ワカプレ',
    'Worker Placement with Dice Workers': 'ワカプレ',
    'Worker Placement, Different Worker Types': 'ワカプレ'
  },
  
  // BGG推奨プレイ人数 → サイトカテゴリー（厳選）
  bggBestPlayerToSiteCategories: {
    '1': 'ソロ向き',
    '2': 'ペア向き',
    '6': '多人数向き',
    '7': '多人数向き',
    '8': '多人数向き',
    '9': '多人数向き',
    '10': '多人数向き'
  },
  
  // 日本語パブリッシャー正規化（実際のマッピング）
  japanesePublisherMapping: {
    'hobby japan': 'ホビージャパン',
    'hobbyjapan': 'ホビージャパン',
    'arclight': 'アークライト',
    'arclightgames': 'アークライト',
    'groupsne': 'グループSNE',
    'group sne': 'グループSNE',
    'kanai': 'カナイ製作所',
    'new games order': 'ニューゲームズオーダー',
    'ngo': 'ニューゲームズオーダー',
    'colon arc': 'コロンアーク',
    'suki games': '数寄ゲームズ',
    'dice tower': 'ダイスタワー',
    'oink games': 'オインクゲームズ',
    'ten days games': 'テンデイズゲームズ',
    'grounding': 'グラウンディング',
    'asmodee japan': 'アズモデージャパン'
  }
}
```

#### プレイ時間マッピング
```typescript
const playTimeCategories = {
  "短時間": "～30分",
  "中時間": "30-60分", 
  "長時間": "60-120分",
  "超長時間": "120分～"
}
```

### 1.3 重複防止・検証
- **BGG ID重複チェック**: 既存レコード確認
- **日本語名重複チェック**: 完全一致での重複防止
- **データ整合性検証**: 必須フィールド、データ型チェック

### 1.4 権限管理
```typescript
interface RegistrationPermission {
  adminUser: boolean          // 管理者は無制限
  experiencedUser: boolean    // 3件以上レビュー投稿者
  newUser: boolean           // 新規ユーザーは制限あり
}
```

## 2. レビューシステム

### 2.1 レビューデータモデル

#### 基本レビュー情報
```typescript
interface Review {
  id: number
  userId: string
  gameId: number
  
  // 基本評価
  overallScore: number        // 1-10点総合評価
  
  // 詳細評価（1-5点スケール）
  ruleComplexity: number      // ルール複雑さ
  luckFactor: number         // 運要素
  interaction: number        // プレイヤー間相互作用  
  downtime: number          // ダウンタイム
  
  // プレイ情報
  playTime?: number         // 実際のプレイ時間
  recommendedPlayerCount?: number[] // 推奨プレイ人数
  
  // テキストレビュー
  title: string
  content: string
  pros?: string[]           // 良い点
  cons?: string[]           // 改善点
  
  // 分類・タグ
  customMechanics?: string[]   // カスタムメカニクス
  customCategories?: string[]  // カスタムカテゴリー
  customTags?: string[]       // フリータグ
  
  // メタデータ
  isPublished: boolean
  createdAt: string
  updatedAt: string
  
  // ソーシャル機能
  likesCount: number
  commentsCount: number
}
```

#### 重み付きスコアリングシステム（重要変更）
```typescript
interface ScoringSystem {
  deprecated: "10件システムレビュー方式は廃止"
  currentMethod: "データソース別重み付けスコア算出"
  
  bggRegisteredGames: {
    formula: "(ユーザーレビュー合計 + BGG評価 × 10) / (ユーザーレビュー数 + 10)"
    purpose: "BGGデータベースを基準値として活用"
    bggWeighting: 10         // BGGスコアの重み係数
    bggReviewCount: 10       // BGG評価を10件分として扱う
  }
  
  manualRegisteredGames: {
    formula: "(ユーザーレビュー合計 + 7.5 × 10) / (ユーザーレビュー数 + 10)"
    purpose: "BGGデータがない日本語ゲームの基準値設定"
    defaultScore: 7.5        // 手動登録ゲームの基準スコア
    defaultWeighting: 10     // 基準スコアの重み係数
    defaultReviewCount: 10   // 基準スコアを10件分として扱う
    rationale: "中程度の評価（7.5/10）を基準として極端スコアを防止"
  }
  
  calculation: {
    userReviews: number        // ユーザーレビューの合計点
    baselineScore: number     // BGG評価 or 7.5（手動登録）
    userReviewCount: number   // ユーザーレビュー数
    finalScore: "(userReviews + baselineScore * 10) / (userReviewCount + 10)"
  }
}
```

### 2.2 レビュー統計・集計

#### ゲーム統計
```typescript
interface GameStatistics {
  // 平均評価
  averageOverallScore: number
  averageRuleComplexity: number
  averageLuckFactor: number
  averageInteraction: number
  averageDowntime: number
  
  // レビュー数
  totalReviews: number
  systemReviews: number
  userReviews: number
  
  // 人気要素
  popularMechanics: string[]    // 50%以上が言及
  popularCategories: string[]
  recommendedPlayerCounts: number[] // 50%以上が推奨
  
  // ソーシャル統計
  totalLikes: number
  totalComments: number
}
```

### 2.3 レビュー投稿フロー

#### 評価入力UI
```typescript
interface ReviewForm {
  // スライダー入力（1-5点）
  detailedEvaluations: {
    ruleComplexity: SliderComponent
    luckFactor: SliderComponent  
    interaction: SliderComponent
    downtime: SliderComponent
  }
  
  // 総合評価（1-10点）
  overallScore: StarRatingComponent
  
  // テキスト入力
  textFields: {
    title: TextInput
    content: TextArea
    pros: TagInput[]
    cons: TagInput[]
  }
  
  // プレイ情報
  playInfo: {
    playTime: NumberInput
    recommendedPlayerCount: MultiSelect
  }
  
  // 分類
  classification: {
    customMechanics: TagInput[]
    customCategories: TagInput[]
    customTags: TagInput[]
  }
}
```

### 2.4 レビュー表示・ソート

#### 表示オプション
```typescript
interface ReviewDisplayOptions {
  sortBy: "newest" | "oldest" | "highest_rated" | "most_liked"
  filterBy: {
    scoreRange: [number, number]
    playerCount?: number
    playTime?: [number, number]
    mechanics?: string[]
    categories?: string[]
  }
  viewMode: "compact" | "detailed" | "cards"
}
```

## 3. 検索システム

### 3.1 検索パラメーター

#### 基本検索
```typescript
interface BasicSearchParams {
  keyword?: string            // ゲーム名、デザイナー、パブリッシャー
  playerCount?: {
    min?: number
    max?: number  
    exact?: number
  }
  playTime?: {
    min?: number             // 分単位
    max?: number
    category?: "短時間" | "中時間" | "長時間" | "超長時間"
  }
  yearPublished?: {
    min?: number
    max?: number
  }
}
```

#### 評価フィルター
```typescript
interface RatingFilters {
  overallScore?: {
    min?: number
    max?: number
  }
  ruleComplexity?: [number, number]    // 1-5範囲
  luckFactor?: [number, number]
  interaction?: [number, number]
  downtime?: [number, number]
  
  minReviews?: number          // 最低レビュー数
  onlyUserReviewed?: boolean   // ユーザーレビューありのみ
}
```

#### 分類フィルター
```typescript
interface ClassificationFilters {
  mechanics?: {
    include: string[]
    exclude?: string[]
    logic: "AND" | "OR"
  }
  categories?: {
    include: string[]
    exclude?: string[]  
    logic: "AND" | "OR"
  }
  recommendedPlayerCounts?: number[]
  publishers?: string[]
  designers?: string[]
  
  // 特殊フィルター
  hasExpansions?: boolean
  isBaseGame?: boolean
  language?: "japanese" | "english" | "multilingual"
}
```

### 3.2 検索結果・ソート

#### ソートオプション
```typescript
interface SearchSortOptions {
  sortBy: 
    | "relevance"           // 関連度（デフォルト）
    | "name_asc" | "name_desc"
    | "year_asc" | "year_desc"  
    | "rating_asc" | "rating_desc"
    | "review_count_asc" | "review_count_desc"
    | "complexity_asc" | "complexity_desc"
    | "play_time_asc" | "play_time_desc"
    | "player_count_asc" | "player_count_desc"
    | "recently_added"      // 最近追加
    | "recently_reviewed"   // 最近レビューされた
}
```

#### 検索結果表示
```typescript
interface SearchResults {
  games: GameWithStats[]
  pagination: {
    total: number
    perPage: number
    currentPage: number
    totalPages: number
  }
  facets: {                 // ファセット検索用
    availableMechanics: FacetCount[]
    availableCategories: FacetCount[] 
    playerCountDistribution: Record<number, number>
    playTimeDistribution: Record<string, number>
    publisherDistribution: FacetCount[]
  }
  searchMetadata: {
    query: string
    executionTime: number
    appliedFilters: SearchFilters
    suggestions?: string[]  // 検索候補
  }
}

interface FacetCount {
  name: string
  count: number
  selected: boolean
}
```

### 3.3 高度な検索機能

#### マルチモーダル検索システム
```typescript
interface MultiModalSearch {
  reviewBasedSearch: {
    description: "ユーザーレビューデータに基づく検索"
    source: "user_reviews_mechanics_categories"
    weight: "user_input_priority"
  }
  bggBasedSearch: {
    description: "BGG変換データに基づく検索"
    source: "bgg_converted_data"
    weight: "bgg_data_×10_weighting"
  }
  logicSwitching: {
    perCategory: boolean     // カテゴリーごとにAND/OR切り替え
    andLogic: "全ての条件を満たす"
    orLogic: "いずれかの条件を満たす"
  }
}
```

#### BGGランキングスクレイピング（重要）
```typescript
interface BGGRankingScraping {
  criticalInfo: "ページ11以降はJavaScript遅延読み込みのため特別処理が必要"
  urlFormat: "https://boardgamegeek.com/browse/boardgame?rank=<start_rank>"
  pageUrlProhibited: "/page/ 形式のURLは使用不可"
  calculation: "start_rank = ((page - 1) * 100) + 1"
  gamesPerRequest: 100
  rankRange: "rank to rank+99"
  rateLimit: "1 request per second"
}
```

#### ファセット検索
```typescript
interface FacetSearch {
  interactiveFilters: boolean   // 検索結果から更に絞り込み
  urlStatePersistence: boolean  // URLにフィルター状態保存
  realTimeUpdate: boolean      // リアルタイム結果更新
  facetCounting: boolean       // 各ファセットのアイテム数表示
  
  displayLimits: {
    topCategories: 7         // 上位7カテゴリーのみ表示
    topMechanics: 7         // 上位7メカニクスのみ表示
    bggWeighting: 10        // BGGデータの重み係数
    recommendationThreshold: 0.5 // 50%以上で推奨プレイ人数表示
  }
}
```

#### 検索履歴・保存
```typescript
interface SearchHistory {
  savedSearches: {
    name: string
    filters: SearchFilters
    createdAt: string
    userId: string
  }[]
  recentSearches: string[]     // 最近の検索キーワード
  bookmarkedResults: number[]  // ブックマークしたゲームID
}
```

## 4. API設計

### 4.1 ゲーム登録API

```typescript
// BGG登録
POST /api/games/register-bgg
{
  bggId: number
  forceUpdate?: boolean  // 既存データの強制更新
}

// 手動登録  
POST /api/games/register-manual
{
  name: string
  nameJapanese?: string
  minPlayers: number
  maxPlayers: number
  playingTime: number
  description?: string
  categories?: string[]
  mechanics?: string[]
  publisher?: string
  designer?: string
  yearPublished?: number
  imageUrl?: string
  
  // 自動設定される基準値（APIレスポンスで確認可能）
  autoSet: {
    registrationSource: "manual"
    baselineScore: 7.5
    baselineWeight: 10
    baselineReviewCount: 10
    isJapaneseGame: true
  }
}

// 登録状況確認
GET /api/games/check-registration?bggId=123456
GET /api/games/check-registration?name=ゲーム名
```

### 4.2 レビューAPI

```typescript
// レビュー投稿
POST /api/reviews
{
  gameId: number
  review: ReviewData
}

// レビュー取得
GET /api/reviews?gameId=123&sort=newest&page=1&limit=20

// レビュー統計
GET /api/games/{id}/statistics

// レビューいいね
POST /api/reviews/{id}/like
DELETE /api/reviews/{id}/like
```

### 4.3 検索API

```typescript
// ゲーム検索
GET /api/search/games?{searchParams}

// オートコンプリート
GET /api/search/suggest?q=キーワード

// ファセット情報
GET /api/search/facets?{currentFilters}

// 高度な検索
POST /api/search/advanced
{
  filters: SearchFilters
  sort: SortOptions
  pagination: PaginationOptions
}
```

## 5. データベース設計

### 5.1 テーブル拡張

#### gamesテーブル拡張
```sql
-- BGG連携フィールド
ALTER TABLE games ADD COLUMN bgg_id INTEGER UNIQUE;
ALTER TABLE games ADD COLUMN bgg_rank INTEGER;
ALTER TABLE games ADD COLUMN bgg_rating DECIMAL(3,2);
ALTER TABLE games ADD COLUMN bgg_rating_count INTEGER;
ALTER TABLE games ADD COLUMN bgg_weight DECIMAL(3,2);

-- 日本語対応
ALTER TABLE games ADD COLUMN name_japanese TEXT;
ALTER TABLE games ADD COLUMN description_japanese TEXT;
ALTER TABLE games ADD COLUMN publisher_japanese TEXT;

-- 統計フィールド  
ALTER TABLE games ADD COLUMN average_rule_complexity DECIMAL(3,2);
ALTER TABLE games ADD COLUMN average_luck_factor DECIMAL(3,2);
ALTER TABLE games ADD COLUMN average_interaction DECIMAL(3,2);
ALTER TABLE games ADD COLUMN average_downtime DECIMAL(3,2);
ALTER TABLE games ADD COLUMN user_reviews_count INTEGER DEFAULT 0;
ALTER TABLE games ADD COLUMN total_likes_count INTEGER DEFAULT 0;

-- 人気要素（JSON配列）
ALTER TABLE games ADD COLUMN popular_mechanics JSONB;
ALTER TABLE games ADD COLUMN popular_categories JSONB;
ALTER TABLE games ADD COLUMN recommended_player_counts JSONB;

-- メタデータ
ALTER TABLE games ADD COLUMN registration_source TEXT; -- 'bgg' | 'manual'
ALTER TABLE games ADD COLUMN last_bgg_sync TIMESTAMP;
ALTER TABLE games ADD COLUMN is_japanese_game BOOLEAN DEFAULT FALSE;

-- スコアリング基準値
ALTER TABLE games ADD COLUMN baseline_score DECIMAL(3,2); -- BGG評価 or 7.5（手動登録）
ALTER TABLE games ADD COLUMN baseline_weight INTEGER DEFAULT 10; -- 基準値の重み係数
ALTER TABLE games ADD COLUMN baseline_review_count INTEGER DEFAULT 10; -- 基準値のレビュー数相当
```

#### reviewsテーブル拡張
```sql
-- 詳細評価フィールド
ALTER TABLE reviews ADD COLUMN rule_complexity INTEGER CHECK (rule_complexity >= 1 AND rule_complexity <= 5);
ALTER TABLE reviews ADD COLUMN luck_factor INTEGER CHECK (luck_factor >= 1 AND luck_factor <= 5);
ALTER TABLE reviews ADD COLUMN interaction INTEGER CHECK (interaction >= 1 AND interaction <= 5);
ALTER TABLE reviews ADD COLUMN downtime INTEGER CHECK (downtime >= 1 AND downtime <= 5);

-- プレイ情報
ALTER TABLE reviews ADD COLUMN actual_play_time INTEGER; -- 分単位
ALTER TABLE reviews ADD COLUMN recommended_player_count JSONB; -- [2,3,4]

-- 分類・タグ（JSON配列）
ALTER TABLE reviews ADD COLUMN custom_mechanics JSONB;
ALTER TABLE reviews ADD COLUMN custom_categories JSONB;
ALTER TABLE reviews ADD COLUMN custom_tags JSONB;

-- ソーシャル機能
ALTER TABLE reviews ADD COLUMN likes_count INTEGER DEFAULT 0;
ALTER TABLE reviews ADD COLUMN comments_count INTEGER DEFAULT 0;

-- システムレビュー識別
ALTER TABLE reviews ADD COLUMN is_system_review BOOLEAN DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN system_review_source TEXT; -- 'bgg_ratings'
```

### 5.2 新規テーブル

#### ゲーム分類マスター
```sql
CREATE TABLE game_mechanics (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_japanese TEXT,
  description TEXT,
  icon_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE game_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_japanese TEXT,
  description TEXT,
  icon_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### BGG連携管理
```sql
CREATE TABLE bgg_sync_logs (
  id SERIAL PRIMARY KEY,
  game_id BIGINT REFERENCES games(id),
  bgg_id INTEGER,
  sync_type TEXT, -- 'initial' | 'update' | 'failed'
  sync_status TEXT, -- 'success' | 'failed' | 'partial'
  error_message TEXT,
  synced_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bgg_conversion_mappings (
  id SERIAL PRIMARY KEY,
  bgg_type TEXT, -- 'category' | 'mechanic' | 'publisher'
  bgg_name TEXT,
  site_mapping JSONB, -- 対応するサイト内分類
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 検索履歴・保存
```sql
CREATE TABLE saved_searches (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  search_filters JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE search_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  query TEXT,
  filters JSONB,
  results_count INTEGER,
  execution_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 6. フロントエンド実装

### 6.1 ページ構成

```
/games/register          # ゲーム登録ページ
/games/[id]             # ゲーム詳細ページ（拡張）
/games/[id]/reviews     # レビュー一覧ページ
/reviews/new/[gameId]   # レビュー投稿ページ
/search                 # 検索ページ（拡張）
/search/advanced        # 高度な検索ページ
```

### 6.2 主要コンポーネント

```typescript
// ゲーム登録
<GameRegistrationForm />
<BGGSearchDialog />
<ManualGameForm />

// レビューシステム
<ReviewForm />
<DetailedEvaluationSlider />
<ReviewCard />
<ReviewStatistics />

// 検索システム
<AdvancedSearchForm />
<SearchFilters />
<FacetedSearch />
<SearchResults />
<GameGrid />
```

### 6.3 状態管理

```typescript
// Zustand stores
interface GameRegistrationStore {
  selectedBGGGame: BGGGame | null
  registrationStatus: 'idle' | 'searching' | 'registering' | 'complete' | 'error'
  registrationMode: 'bgg' | 'manual'
  
  setSelectedBGGGame: (game: BGGGame) => void
  setRegistrationMode: (mode: 'bgg' | 'manual') => void
  registerGame: (data: RegistrationData) => Promise<void>
  
  // 登録時の基準値設定
  getBaselineScoring: (mode: 'bgg' | 'manual', bggScore?: number) => {
    baselineScore: number    // BGG評価 or 7.5
    baselineWeight: number   // 常に10
    baselineReviewCount: number // 常に10
  }
}

interface SearchStore {
  filters: SearchFilters
  results: SearchResults
  facets: FacetData
  isLoading: boolean
  updateFilters: (filters: Partial<SearchFilters>) => void
  search: () => Promise<void>
  resetFilters: () => void
}

interface ReviewStore {
  currentReview: ReviewData
  isDirty: boolean
  updateReview: (data: Partial<ReviewData>) => void
  saveReview: () => Promise<void>
  resetReview: () => void
}
```

## 7. 品質基準

### 7.1 パフォーマンス要件
- BGG API連携: 5秒以内でデータ取得
- 検索レスポンス: 1秒以内で結果表示
- レビュー投稿: 3秒以内で完了
- ページ読み込み: 2秒以内で初期表示

### 7.2 テスト要件
- BGG API連携テスト（モック含む）
- レビューシステムの統合テスト
- 検索機能のE2Eテスト
- データ変換ロジックのユニットテスト

### 7.3 エラーハンドリング
- BGG API障害時のフォールバック
- 重複登録の適切な処理
- 検索クエリエラーの回復
- レビュー投稿失敗時の復旧

## 8. セキュリティ要件

### 8.1 入力検証
- BGG ID形式の検証
- レビューテキストのサニタイゼーション
- 検索クエリのSQLインジェクション防止
- 評価スコアの範囲チェック

### 8.2 レート制限
- BGG API呼び出し制限（1秒1回）
- ユーザーごとのレビュー投稿制限
- 検索クエリのレート制限
- 登録試行回数の制限

### 8.3 権限管理
- レビュー編集権限（投稿者のみ）
- ゲーム登録権限（経験者・管理者）
- 管理機能アクセス制御
- システムレビューの保護

## 9. ウィッシュリスト機能

### 9.1 ウィッシュリスト仕様
```typescript
interface WishlistSystem {
  maxItems: 10                    // 最大10件まで
  reorderable: boolean           // 順序変更可能（優先順位）
  features: {
    addToWishlist: "ゲーム詳細ページから追加"
    removeFromWishlist: "ウィッシュリストページから削除"
    reorder: "ドラッグ&ドロップで順序変更"
    notification: "ウィッシュリストゲームに新しいレビューが投稿された時の通知"
  }
  restrictions: {
    authenticationRequired: true
    duplicatesPrevented: true
    maxLimitEnforced: true
  }
}
```

### 9.2 ウィッシュリストUI
```typescript
interface WishlistComponents {
  WishlistButton: "ゲーム詳細ページの追加/削除ボタン"
  WishlistPage: "ユーザーのウィッシュリスト管理ページ"
  WishlistCounter: "ヘッダーのウィッシュリスト件数表示"
  ReorderableList: "優先順位変更可能なリスト"
}
```

## 10. 認証・OAuth統合システム

### 10.1 認証プロバイダー
```typescript
interface AuthenticationSystem {
  providers: {
    google: {
      enabled: true
      scope: "email profile"
      strategy: "OAuth 2.0"
    }
    twitter: {
      enabled: true
      scope: "read:user user:email"
      strategy: "OAuth 1.0a/2.0"
    }
    email: {
      enabled: true
      strategy: "devise + devise_token_auth"
      features: ["email_confirmation", "password_reset"]
    }
  }
  tokenManagement: {
    accessToken: "Bearer token in Authorization header"
    refreshToken: "Auto-refresh on expiration"
    tokenStorage: "httpOnly cookies (secure)"
  }
}
```

### 10.2 権限レベル
```typescript
interface UserPermissions {
  guest: {
    actions: ["browse_games", "read_reviews", "search"]
    restrictions: ["no_review_posting", "no_game_registration", "no_wishlist"]
  }
  authenticated: {
    actions: ["post_reviews", "like_reviews", "manage_wishlist"]
    restrictions: ["game_registration_requires_3_reviews"]
  }
  experienced: {
    criteria: "3+ posted reviews"
    actions: ["register_games", "all_authenticated_actions"]
    restrictions: ["no_admin_functions"]
  }
  admin: {
    criteria: "specific_email_addresses"
    actions: ["unlimited_game_registration", "user_management", "system_admin"]
    restrictions: ["none"]
  }
}
```

## 11. 多言語対応・表示優先度

### 11.1 コンテンツ表示優先度
```typescript
interface ContentPriority {
  gameName: "Japanese > English (BGG) > Original"
  gameDescription: "Japanese > English (BGG) > Original"
  publisherName: "Japanese normalized > BGG data"
  categories: "Japanese translated > BGG categories"
  mechanics: "Japanese translated > BGG mechanics"
  
  futureEnhancement: {
    deeplTranslation: "Dynamic translation via DeepL API"
    implementationPhase: "Phase 5 - Advanced Features"
  }
}
```

### 11.2 日本語データ構造
```typescript
interface JapaneseGameData {
  nameJapanese: string           // 日本語ゲーム名
  descriptionJapanese: string    // 日本語説明文
  publisherJapanese: string      // 日本語パブリッシャー名
  categoriesJapanese: string[]   // 日本語カテゴリー
  mechanicsJapanese: string[]    // 日本語メカニクス
  
  fallbackStrategy: {
    primary: "Japanese data"
    secondary: "BGG converted data"  
    tertiary: "Original BGG data"
  }
}
```

## 12. 実装フェーズ（更新版）

### Phase 1: 基盤構築・BGG連携 (3-4週間)
- [x] BGG API連携基盤（レート制限・スクレイピング対応）
- [x] データ変換・正規化システム（大量マッピング）
- [x] 認証システム（OAuth + devise_token_auth）
- [x] 基本データベーススキーマ構築

### Phase 2: ゲーム登録システム (2-3週間)  
- [x] BGG ID/手動登録フォーム
- [x] 重複防止・権限管理
- [ ] 日本語データ優先表示
- [x] ゲーム詳細ページ基盤

### Phase 3: レビューシステム (3-4週間)
- [x] 5項目評価システム
- [x] BGG重み付けスコア算出
- [x] レビュー投稿・表示UI
- [x] いいね・ソーシャル機能

### Phase 4: 検索・ファセットシステム (4-5週間)
- [ ] マルチモーダル検索
- [x] 高度なフィルタリング（12+ パラメーター）
- [x] ファセット検索・リアルタイム更新
- [ ] 検索履歴・保存機能

### Phase 5: ウィッシュリスト・高度機能 (2-3週間)
- [x] ウィッシュリスト機能（最大10件・並び替え）
- [x] BGGランキングスクレイピング
- [ ] 通知システム
- [ ] DeepL翻訳統合（任意）

### Phase 6: 統合・最適化 (2-3週間)
- [x] パフォーマンス最適化
- [x] 包括的E2Eテスト
- [x] SEO・アクセシビリティ対応
- [ ] プロダクションデプロイ

## 13. スコアリング実装例

### 13.1 BGG登録ゲームのスコア計算
```typescript
function calculateGameScore(game: Game, userReviews: Review[]): number {
  if (game.registrationSource === 'bgg' && game.bggRating) {
    const userReviewSum = userReviews.reduce((sum, review) => sum + review.overallScore, 0)
    const userReviewCount = userReviews.length
    const bggBaselineValue = game.bggRating * game.baselineWeight // BGG評価 × 10
    
    return (userReviewSum + bggBaselineValue) / (userReviewCount + game.baselineReviewCount)
  }
  
  // フォールバック処理
  return calculateManualGameScore(game, userReviews)
}
```

### 13.2 手動登録ゲームのスコア計算
```typescript
function calculateManualGameScore(game: Game, userReviews: Review[]): number {
  const userReviewSum = userReviews.reduce((sum, review) => sum + review.overallScore, 0)
  const userReviewCount = userReviews.length
  const manualBaselineValue = game.baselineScore * game.baselineWeight // 7.5 × 10 = 75
  
  return (userReviewSum + manualBaselineValue) / (userReviewCount + game.baselineReviewCount)
}
```

### 13.3 実際の計算例
```typescript
// BGG登録ゲーム（BGG評価8.2）にユーザーレビュー2件（9点、7点）の場合
// (9 + 7 + 8.2 × 10) / (2 + 10) = (16 + 82) / 12 = 8.17点

// 手動登録ゲームにユーザーレビュー2件（9点、7点）の場合  
// (9 + 7 + 7.5 × 10) / (2 + 10) = (16 + 75) / 12 = 7.58点
```

## 完了基準
- [x] BGGからの自動ゲーム登録が正常動作
- [x] 手動登録ゲーム（7.5基準値）が正常動作
- [x] 包括的なレビューシステムが実装済み
- [x] 重み付きスコアリングシステムが正確に動作
- [x] 高度な検索・フィルタリング機能が完成
- [x] ウィッシュリスト機能（最大10件・並び替え）が完成
- [ ] 多言語表示優先度システムが動作
- [x] 全機能のテストが完了
- [x] パフォーマンス要件をクリア
- [x] セキュリティ要件を満たす

---
**作成日**: 2025-08-16  
**最終更新**: 2025-08-16（手動登録基準値7.5追加）
**担当**: Claude Code
**優先度**: 最高
**推定工数**: 16-20週間