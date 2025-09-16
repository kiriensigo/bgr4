# BGR v2 コンポーネント設計ガイド

## 🧩 コンポーネントアーキテクチャ

BGRv2のUIコンポーネント設計指針とコンポーネントカタログ。

### 設計原則

1. **単一責任の原則**: 各コンポーネントは1つの機能に集中
2. **再利用性**: 複数の場所で利用できる汎用設計
3. **型安全性**: TypeScript strict modeでの完全な型定義
4. **アクセシビリティ**: WCAG 2.1 AA準拠
5. **パフォーマンス**: React.memo、useMemo等の最適化

## 📁 コンポーネント階層構造

```
src/components/
├── ui/                     # 基盤UIコンポーネント
├── games/                  # ゲーム関連コンポーネント
├── reviews/                # レビュー関連コンポーネント
├── home/                   # ホームページ専用
├── admin/                  # 管理機能専用
├── auth/                   # 認証関連
├── layout/                 # レイアウト系
├── search/                 # 検索機能
├── forms/                  # フォーム系
└── seo/                    # SEO関連
```

## 🎨 基盤UIコンポーネント (`/ui`)

shadcn/uiベースの再利用可能なプリミティブコンポーネント群。

### Button
```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
  children: React.ReactNode
}

// 使用例
<Button variant="outline" size="sm" onClick={handleClick}>
  検索
</Button>
```

### Card
```typescript
interface CardProps {
  className?: string
  children: React.ReactNode
}

// 使用例
<Card className="p-6">
  <CardHeader>
    <CardTitle>ゲーム情報</CardTitle>
  </CardHeader>
  <CardContent>
    コンテンツ
  </CardContent>
</Card>
```

### Input
```typescript
interface InputProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
}

// 使用例
<Input 
  type="text" 
  placeholder="ゲーム名を入力..." 
  value={query}
  onChange={(e) => setQuery(e.target.value)}
/>
```

### Slider
```typescript
interface SliderProps {
  value?: number[]
  onValueChange?: (value: number[]) => void
  max?: number
  min?: number
  step?: number
  className?: string
}

// 使用例
<Slider
  value={[rating]}
  onValueChange={(value) => setRating(value[0])}
  max={10}
  min={1}
  step={0.1}
  className="w-full"
/>
```

### その他のUIコンポーネント
- **Badge**: タグ・カテゴリー表示
- **Alert**: 通知・エラーメッセージ
- **Dialog**: モーダルダイアログ
- **Select**: セレクトボックス
- **Textarea**: マルチラインテキスト入力
- **Tabs**: タブ切り替え
- **Progress**: プログレスバー
- **Skeleton**: ローディング状態
- **Tooltip**: ツールチップ

## 🎮 ゲーム関連コンポーネント (`/games`)

### GameCard
ゲーム一覧・検索結果で使用するカードコンポーネント。

```typescript
interface GameCardProps {
  game: Game
  className?: string
  variant?: 'default' | 'compact' | 'detailed'
}

// 特徴
- レスポンシブ対応
- 5つ星評価表示（部分表示対応）
- いいね機能統合
- ホバーアニメーション
- プレイ人数・時間表示
```

### GameDetail
ゲーム詳細ページのメインコンポーネント。

```typescript
interface GameDetailProps {
  game: Game
  reviews: Review[]
  stats: GameStats
}

// 特徴
- 画像ギャラリー表示
- カテゴリー・メカニクスタグ
- 統計情報統合表示
- レビューセクション
- 関連ゲーム表示
```

### GameStatsComponent
BGG重み付け統計表示コンポーネント。

```typescript
interface GameStatsComponentProps {
  gameId: number
}

// 特徴
- リアルタイム統計取得
- 30%/70%閾値での表示制御
- プログレスバー付き統計
- SWRキャッシング
```

### SearchForm
ゲーム検索フォームコンポーネント。

```typescript
interface SearchFormProps {
  onSearch: (params: SearchParams) => void
  initialParams?: SearchParams
}

// 特徴
- 高度な検索フィルター
- クエリパラメータ同期
- リアルタイム検索
- フィルター永続化
```

## 📝 レビュー関連コンポーネント (`/reviews`)

### EnhancedReviewCard
拡張レビューカード（詳細表示対応）。

```typescript
interface EnhancedReviewCardProps {
  review: Review
  variant?: 'default' | 'compact' | 'detailed'
  showGame?: boolean
}

// 特徴
- 5軸評価表示
- Pros/Cons表示  
- コメント・いいね統合
- 投稿者情報表示
- 編集・削除権限制御
```

### EnhancedReviewForm
レビュー投稿・編集フォーム。

```typescript
interface EnhancedReviewFormProps {
  gameId: number
  initialData?: Review
  onSubmit: (data: ReviewFormData) => void
}

// 特徴
- 5軸スライダー評価
- ボタングループ選択式
- 150文字制限コメント
- リアルタイムバリデーション
- プレビュー機能
```

### ReviewsList
レビュー一覧表示コンポーネント。

```typescript
interface ReviewsListProps {
  reviews: Review[]
  loading?: boolean
  pagination?: PaginationInfo
  onPageChange?: (page: number) => void
}

// 特徴
- 無限スクロール対応
- ソート機能
- フィルタリング
- スケルトンローディング
```

## 🏠 ホームページコンポーネント (`/home`)

### HeroSection
ホームページのメインセクション。

```typescript
interface HeroSectionProps {
  stats?: HomeStats
}

// 特徴
- 検索フォーム統合
- クイック検索ボタン
- グラデーション背景
- レスポンシブデザイン
```

### PopularGames
人気ゲーム表示セクション。

```typescript
interface PopularGamesProps {
  games: PopularGame[]
}

// 特徴
- GameCard コンポーネント統合
- ランキング表示（1-3位特別表示）
- 人気度算出ロジック
- 「もっと見る」リンク
```

### RecentReviews
最新レビュー表示セクション。

```typescript
interface RecentReviewsProps {
  reviews: Review[]
}

// 特徴
- コンパクトレビュー表示
- 投稿時間表示
- ユーザーアバター
- レビュー詳細へのリンク
```

## 🔍 検索コンポーネント (`/search`)

### AdvancedSearchForm
高度検索フォーム。

```typescript
interface AdvancedSearchFormProps {
  onSubmit: (params: SearchParams) => void
  initialParams?: SearchParams
}

// 特徴
- 12+検索パラメータ対応
- 範囲指定（人数・時間・評価）
- マルチセレクト（カテゴリー・メカニクス）
- フォーム状態永続化
```

### SearchResultsList
検索結果一覧表示。

```typescript
interface SearchResultsListProps {
  results: SearchResult[]
  facets: SearchFacets
  onFilterChange: (filters: SearchFilters) => void
}

// 特徴
- ファセット検索サポート
- ソート・フィルター機能
- ページネーション
- 結果統計表示
```

## 🛡️ 管理コンポーネント (`/admin`)

### AdminLayout
管理画面共通レイアウト。

```typescript
interface AdminLayoutProps {
  children: React.ReactNode
  title: string
}

// 特徴
- 管理者権限チェック
- ナビゲーションメニュー
- ブレッドクラム
- アクセス制御
```

### BGGSyncPanel
BGGデータ同期パネル。

```typescript
interface BGGSyncPanelProps {
  onSync: () => Promise<void>
}

// 特徴
- 同期状況表示
- プログレス表示
- エラーハンドリング
- 同期履歴表示
```

## 🔐 認証コンポーネント (`/auth`)

### AuthButton
認証状態に応じたボタン表示。

```typescript
interface AuthButtonProps {
  variant?: 'login' | 'logout'
  className?: string
}

// 特徴
- 認証状態自動判定
- OAuth プロバイダー選択
- ローディング状態表示
- エラーハンドリング
```

### UserMenu
ユーザードロップダウンメニュー。

```typescript
interface UserMenuProps {
  user: User
}

// 特徴
- ユーザー情報表示
- プロフィール・設定リンク
- ログアウト機能
- 管理者専用メニュー
```

## 📱 レスポンシブ対応

### ブレークポイント
```css
/* Tailwind CSS breakpoints */
sm:  640px   /* スマートフォン（縦） */
md:  768px   /* タブレット */
lg:  1024px  /* ラップトップ */
xl:  1280px  /* デスクトップ */
2xl: 1536px  /* 大画面デスクトップ */
```

### レスポンシブ設計パターン
```typescript
// コンポーネント内でのレスポンシブクラス例
<div className="
  grid 
  grid-cols-1 
  sm:grid-cols-2 
  lg:grid-cols-3 
  xl:grid-cols-4 
  gap-4
">
  {games.map(game => (
    <GameCard key={game.id} game={game} />
  ))}
</div>
```

## ♿ アクセシビリティ

### 実装済み対応
- **キーボードナビゲーション**: Tab/Enter/Escapeサポート
- **スクリーンリーダー**: aria-label/role属性対応
- **色彩コントラスト**: WCAG AA準拠
- **フォーカス管理**: 明確なフォーカスインジケーター

### アクセシビリティコンポーネント
```typescript
// AccessibleButton: フォーカス管理付きボタン
<AccessibleButton onClick={handleClick} aria-label="ゲームを詳細表示">
  詳細
</AccessibleButton>

// ScreenReaderOnly: スクリーンリーダー専用テキスト
<ScreenReaderOnly>
  現在の評価: {rating}点中10点
</ScreenReaderOnly>
```

## 🚀 パフォーマンス最適化

### メモ化戦略
```typescript
// React.memo for props-based memoization
export const GameCard = React.memo(({ game, className }: GameCardProps) => {
  // component implementation
})

// useMemo for expensive calculations
const sortedGames = useMemo(() => 
  games.sort((a, b) => b.rating - a.rating), 
  [games]
)

// useCallback for event handlers
const handleSearch = useCallback((query: string) => {
  // search implementation
}, [])
```

### Lazy Loading
```typescript
// Dynamic imports for code splitting
const GameStatsComponent = dynamic(() => import('./GameStatsComponent'), {
  loading: () => <GameStatsSkeleton />,
  ssr: false
})
```

## 🧪 テスト戦略

### コンポーネントテスト
```typescript
// Jest + React Testing Library
describe('GameCard', () => {
  it('displays game information correctly', () => {
    render(<GameCard game={mockGame} />)
    
    expect(screen.getByText(mockGame.name)).toBeInTheDocument()
    expect(screen.getByText(`${mockGame.minPlayers}-${mockGame.maxPlayers}人`)).toBeInTheDocument()
  })
})
```

### E2Eテスト
```typescript
// Playwright
test('game search works correctly', async ({ page }) => {
  await page.goto('/')
  await page.fill('[data-testid="search-input"]', 'Terraforming Mars')
  await page.click('[data-testid="search-button"]')
  
  await expect(page.locator('.game-card')).toHaveCount.toBeGreaterThan(0)
})
```

## 📋 開発ガイドライン

### 新規コンポーネント作成時のチェックリスト
- [ ] TypeScript型定義完備
- [ ] Props Interface定義
- [ ] レスポンシブ対応
- [ ] アクセシビリティ属性
- [ ] エラーハンドリング
- [ ] ローディング状態
- [ ] テストケース作成
- [ ] Storybook追加（将来）

### 命名規則
- **コンポーネント**: PascalCase（例：`GameCard`）
- **ファイル**: PascalCase（例：`GameCard.tsx`）
- **Props**: Interface + Props（例：`GameCardProps`）
- **CSS Classes**: kebab-case（例：`game-card`）

---

**作成日**: 2025-08-30  
**対象バージョン**: BGR v2.0  
**レビュー周期**: 機能追加毎  
**メンテナンス**: フロントエンドチーム