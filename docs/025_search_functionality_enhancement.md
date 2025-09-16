# チケット025: 検索機能実装・強化（レビュー項目対応版）

## 🎯 目標
レビューシステムの評価項目（5軸評価）に完全対応した高度な検索・フィルター機能を実装し、ユーザーが求める具体的なゲーム特性で検索できるようにする。

## 📋 実装項目

### Phase 1: レビュー項目ベース検索機能
- [x] **モックアップ完成** - レビューシステム完全対応
  - [x] ReviewFormClientと100%一致するメカニクス（16種類）・カテゴリー（18種類）
  - [x] 5軸評価スライダーUI完成
  - [x] 2種類のプレイ人数フィルター実装（ゲーム対応 vs おすすめ）
  - [x] トグルボタン式メカニクス・カテゴリー選択
  - [x] モックデータでの動作確認完了

- [x] レビューデータに基づく検索APIの実装
  - [x] `/api/search/reviews` エンドポイント完全実装 ✅
  - [x] reviewsテーブルベースの検索ロジック完成 ✅
  - [x] 5軸評価平均値計算・フィルタリング実装 ✅
  - [x] 複雑なクエリ条件の最適化完了 ✅

- [x] 5軸評価フィルター実装（UI完成）
  - [x] **総合得点フィルター**（1-10点）- スライダーUI ✅
  - [x] **ルール難度フィルター**（1-5点）- スライダーUI ✅
  - [x] **運要素フィルター**（1-5点）- スライダーUI ✅
  - [x] **相互作用フィルター**（1-5点）- スライダーUI ✅
  - [x] **ダウンタイムフィルター**（1-5点）- スライダーUI ✅

### Phase 2: ゲームプレイ特性フィルター
- [x] おすすめプレイ人数フィルター ✅
  - [x] プレイ人数ボタン（2人、3人、4人、5人、6人、7人以上）✅
  - [x] AND条件での複数選択対応 ✅
  - [x] レビューデータからの推奨人数統計活用 ✅

- [x] メカニクス・カテゴリーフィルター（レビューベース） ✅
  - [x] メカニクスボタン群（オンオフ切り替え）- **重要なUI修正完了** ✅
  - [x] カテゴリーボタン群（オンオフ切り替え）✅ 
  - [x] AND条件での絞り込み ✅
  - [x] レビューで実際に言及されたもので検索 ✅

- [x] プレイ時間フィルター ✅
  - [x] 実際のプレイ時間ベース（レビューデータ）✅
  - [x] スライダー範囲指定（分単位）✅
  - [x] 180分以上の無制限オプション対応 ✅

### Phase 3: レビューベースソート・表示機能
- [ ] レビュー統計ベースソート実装
  - [ ] **総合得点順**（レビュー平均値）
  - [ ] **ルール難度順**（シンプル ⇔ 複雑）
  - [ ] **運要素順**（戦略的 ⇔ 運ゲー）
  - [ ] **相互作用順**（ソロプレイ感 ⇔ インタラクティブ）
  - [ ] **ダウンタイム順**（テンポ良い ⇔ 待ち時間多い）
  - [ ] レビュー数順・新着レビュー順

- [ ] 検索結果表示の改善
  - [ ] レビュー統計サマリー表示
  - [ ] 5軸評価の視覚化（レーダーチャート）
  - [ ] おすすめプレイ人数の表示
  - [ ] 実際のプレイ時間表示

### Phase 4: 高度検索UI・UX
- [x] スライダーベース検索フォーム ✅
  - [x] 範囲指定スライダー（デュアルハンドル）✅
  - [x] リアルタイムフィルタリング対応 ✅
  - [x] フィルター適用数の表示 ✅
  - [x] ワンクリックリセット機能 ✅

- [x] ボタンベースフィルター ✅
  - [x] メカニクス・カテゴリーのトグルボタン群 - **React再レンダリング修正完了** ✅
  - [x] プレイ人数のマルチセレクトボタン ✅
  - [x] AND条件の明示的表示 ✅
  - [x] アクティブフィルターの強調表示 ✅

### Phase 5: パフォーマンス・体験向上
- [ ] レビュー統計データ最適化
  - [ ] `game_statistics` テーブルの効率的活用
  - [ ] 統計データの事前計算・キャッシュ
  - [ ] インデックス最適化（複合検索対応）

- [ ] 検索体験の向上
  - [ ] 検索条件の永続化（URLパラメータ）
  - [ ] 検索結果のページネーション
  - [ ] ローディング状態の適切な表示
  - [ ] 「該当なし」時の代替提案

## 🎨 UI/UX 要件

### レビューベース検索フォームレイアウト
```
┌─────────────────────────────────────────────────────────────────────┐
│ ゲーム名検索バー                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ 5軸評価スライダー群                                                   │
│ 総合得点: ●━━━━━━━━━● 4点～8点                                          │
│ ルール難度: ●━━━━━● 1点～3点 (シンプル⇔複雑)                           │  
│ 運要素: ●━━━━━● 2点～4点 (戦略⇔運)                                     │
│ 相互作用: ●━━━━━━━● 3点～5点 (ソロ感⇔インタラクティブ)                  │
│ ダウンタイム: ●━━━━━● 1点～3点 (テンポ良⇔待ち時間)                      │
├─────────────────────────────────────────────────────────────────────┤
│ プレイ人数・時間フィルター                                              │
│ [2人] [3人] [4人] [5人] [6人] [7人以上] ← トグルボタン                 │
│ プレイ時間: ●━━━━━━━━━● 30分～90分                                      │
├─────────────────────────────────────────────────────────────────────┤
│ メカニクス・カテゴリーボタン群（AND条件）                               │
│ [ワカプレ] [デッキビルド] [ドラフト] [エリア支配] ...                    │
│ [戦略] [パーティー] [協力] [推理] [カードゲーム] ...                      │
├─────────────────────────────────────────────────────────────────────┤
│ 検索結果: 42件 | ソート: 総合得点順 ↓ | [リセット]                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 検索結果カード（拡張版）
```
┌────────────────────────────────────────────┐
│ [画像] ゲーム名              ★★★★☆ 8.2点    │
│        プレイ人数: 2-4人    実プレイ時間: 45分 │
│        レーダーチャート表示                  │
│        [ワカプレ] [戦略] [3-4人推奨]          │
└────────────────────────────────────────────┘
```

### レスポンシブ対応
- **デスクトップ**: フィルター展開表示
- **タブレット**: フィルターアコーディオン形式
- **モバイル**: フィルタードロワー + クイックフィルター

## 🔧 技術仕様

### レビューベース検索API設計
```typescript
// GET /api/search/games
interface ReviewBasedSearchParams {
  // テキスト検索
  query?: string
  
  // 5軸評価フィルター（レビュー平均値ベース）
  overall_score_min?: number        // 1-10
  overall_score_max?: number
  rule_complexity_min?: number      // 1-5
  rule_complexity_max?: number
  luck_factor_min?: number          // 1-5
  luck_factor_max?: number
  interaction_min?: number          // 1-5
  interaction_max?: number  
  downtime_min?: number             // 1-5
  downtime_max?: number
  
  // プレイ特性フィルター
  recommended_players?: number[]     // [2,3,4] = 2人、3人、4人推奨
  play_time_min?: number            // 実際のプレイ時間（分）
  play_time_max?: number
  
  // メカニクス・カテゴリー（AND条件）
  mechanics?: string[]              // レビューで言及されたもの
  categories?: string[]             // レビューで言及されたもの
  mechanics_match_all?: boolean     // true=AND, false=OR
  categories_match_all?: boolean
  
  // ソート（レビュー統計ベース）
  sortBy?: 'overall_score' | 'rule_complexity' | 'luck_factor' | 
           'interaction' | 'downtime' | 'review_count' | 'name'
  sortOrder?: 'asc' | 'desc'
  
  // ページネーション
  page?: number
  limit?: number
}

interface ReviewBasedSearchResponse {
  games: EnhancedGameWithStats[]
  pagination: PaginationInfo
  filter_stats: {
    total_games: number
    avg_overall_score: number
    popular_mechanics: Array<{name: string, count: number}>
    popular_categories: Array<{name: string, count: number}>
  }
}

// 拡張ゲーム情報（レビュー統計付き）
interface EnhancedGameWithStats extends EnhancedGame {
  review_stats: {
    review_count: number
    avg_overall_score: number
    avg_rule_complexity: number
    avg_luck_factor: number
    avg_interaction: number
    avg_downtime: number
    popular_player_counts: number[]    // [3,4] = 3人・4人でよく遊ばれる
    avg_actual_play_time: number       // 実際のプレイ時間平均
    popular_mechanics: string[]        // レビューで言及の多いメカニクス
    popular_categories: string[]       // レビューで言及の多いカテゴリー
  }
}
```

### レビュー統計テーブル活用
```sql
-- レビュー統計テーブル（既存のgame_statisticsを活用）
-- 検索に最適化されたインデックス作成

-- レビュー平均値ベースの検索インデックス
CREATE INDEX idx_game_stats_scores ON game_statistics (
  avg_overall_score, avg_rule_complexity, avg_luck_factor, 
  avg_interaction, avg_downtime
);

-- プレイ人数推奨度インデックス
CREATE INDEX idx_game_stats_players ON game_statistics (
  recommended_2p_percent, recommended_3p_percent, recommended_4p_percent,
  recommended_5p_percent, recommended_6p_percent, recommended_7p_percent
);

-- レビュー関連検索用のインデックス
CREATE INDEX idx_reviews_gameplay ON enhanced_reviews USING gin(mechanics);
CREATE INDEX idx_reviews_categories ON enhanced_reviews USING gin(categories);
CREATE INDEX idx_reviews_players ON enhanced_reviews USING gin(recommended_players);
```

### フロントエンド状態管理（レビューベース検索用）
```typescript
// Zustand store for review-based search
interface ReviewBasedSearchStore {
  // 検索条件
  query: string
  
  // 5軸評価フィルター
  overallScore: [number, number]      // [min, max]
  ruleComplexity: [number, number]
  luckFactor: [number, number]
  interaction: [number, number]
  downtime: [number, number]
  
  // プレイ特性フィルター
  selectedPlayerCounts: number[]      // [2, 3, 4]
  playTimeRange: [number, number]     // [30, 90] 分
  
  // メカニクス・カテゴリー（トグル状態）
  selectedMechanics: string[]
  selectedCategories: string[]
  
  // 検索結果・状態
  results: EnhancedGameWithStats[]
  loading: boolean
  pagination: PaginationInfo
  filterStats: FilterStats
  
  // アクション
  setQuery: (query: string) => void
  setScoreRange: (type: ScoreType, range: [number, number]) => void
  togglePlayerCount: (count: number) => void
  setPlayTimeRange: (range: [number, number]) => void
  toggleMechanic: (mechanic: string) => void
  toggleCategory: (category: string) => void
  search: () => Promise<void>
  resetFilters: () => void
  loadMore: () => Promise<void>
}
## 🧪 テスト要件

### ユニットテスト（レビューベース検索）
- [x] レビュー統計ベース検索APIのテスト ✅
- [x] 5軸評価フィルタリングロジックのテスト ✅
- [x] プレイ人数・メカニクス・カテゴリーフィルターのテスト ✅
- [x] スライダーコンポーネントのテスト ✅
- [x] トグルボタン群のテスト - **重要なバグ修正完了** ✅

### E2Eテスト（Playwright）
- [x] **5軸評価スライダーでの絞り込みテスト** ✅
  - [x] 総合得点7-9点での検索 ✅
  - [x] ルール難度1-2点（シンプル）での検索 ✅
  - [x] 運要素3-5点（運ゲー寄り）での検索 ✅
- [x] **プレイ人数フィルターテスト** ✅
  - [x] 2人推奨ゲームの検索 ✅
  - [x] 3-4人推奨ゲームの検索（AND条件）✅
- [x] **メカニクス・カテゴリーフィルターテスト** ✅
  - [x] 協力・ダイスロール等での個別ボタンテスト ✅
  - [x] ボタンのオン・オフ切り替え機能完全修正 ✅
- [ ] **レスポンシブ検索UIテスト**
  - モバイルでのフィルタードロワー操作
  - タブレットでのアコーディオン展開

### パフォーマンステスト
- [ ] レビュー統計結合クエリのパフォーマンス（500ms以下）
- [ ] 複数フィルター適用時の応答速度（1秒以下）
- [ ] 大量ゲームデータでの検索速度検証

## 📱 アクセシビリティ要件（レビューベース検索特化）

- [ ] **スライダーのキーボード操作対応**
  - 矢印キーでの値変更
  - Page Up/Down での大幅変更
  - Home/End でのmin/max移動
- [ ] **トグルボタンのスクリーンリーダー対応**
  - 選択状態の音声読み上げ
  - フィルター適用数の音声案内
- [ ] **検索結果のレビュー統計読み上げ**
  - 「総合得点8.2点、ルール難度3点」の音声案内
  - レーダーチャートの代替テキスト

## 🚀 実装優先度・フェーズ

### 🥇 Phase 1（最優先 - 1週間）✅ **完了**
- [x] 5軸評価スライダー検索の実装 ✅
- [x] 基本的な検索結果表示（統計付き）✅
- [x] プレイ人数フィルター ✅
- [x] メカニクス・カテゴリーのトグルボタン - **重要なUIバグ修正完了** ✅

#### 📋 **Phase 1 完了報告**
**実装完了日**: 2025-08-31  
**主な成果**: 
- 完全な検索API実装（10/10テスト成功）
- UI トグルボタンの致命的バグ修正（React stale closure問題解決）
- 全フィルター機能の動作確認完了
- Playwright E2Eテスト完全実装

### 🥈 Phase 2（高優先 - 1週間）
- [ ] レビュー統計ベースソート機能
- [ ] 検索結果のレーダーチャート表示
- [ ] フィルター状態のURL永続化
- [ ] レスポンシブUI実装

### 🥉 Phase 3（通常優先 - 1週間）
- [ ] 高度なフィルター組み合わせ
- [ ] 検索パフォーマンス最適化
- [ ] アクセシビリティ完全対応
- [ ] E2Eテスト完備

## 🎯 完了条件

### 機能完了条件
- [ ] **レビュー項目（5軸）での完全検索が可能**
- [ ] **プレイ人数・メカニクス・カテゴリーでのAND条件検索**
- [ ] **レビュー統計データの視覚的表示（レーダーチャート等）**
- [ ] **全デバイスでのレスポンシブ動作**

### 品質保証条件
- [ ] **レビューベース検索の精度99%以上**
- [ ] **フィルター適用後の検索速度1秒以下**
- [ ] **E2Eテストで全検索パターンをカバー**

### ユーザビリティ条件
- [ ] **「運ゲー嫌い」ユーザーが運要素1-2点で検索できる**
- [ ] **「重ゲー好き」ユーザーがルール難度4-5点で検索できる**
- [ ] **「2人専用」ユーザーが2人推奨ゲームを効率検索できる**

---

**作成日**: 2025-08-30  
**想定工数**: 3週間（フェーズ分割実装）  
**優先度**: 最高（レビューシステムと連携の核心機能）  
**担当**: フロントエンド + バックエンドチーム