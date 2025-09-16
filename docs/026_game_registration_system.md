# チケット 026: ゲーム登録システム実装

## 概要
BGG URL/ゲームIDを使用した自動登録と手動登録のハイブリッドシステムを実装し、ユーザーが簡単にゲームを追加できる機能を提供する。

## 背景・要件
- BGGにあるゲームはBGG APIを使って自動登録
- BGGにないゲーム（特に日本語ゲーム）は手動登録
- 既存のBGG API連携システム（`src/lib/bgg-api.ts`）を活用
- サイトのシンプルな構成への落とし込み

## 🎯 実装タスク

### Phase 1: 基盤・UI実装
#### ゲーム登録ページ
- [ ] `app/games/register/page.tsx` - メイン登録ページ作成
- [ ] `components/games/GameRegistrationForm.tsx` - 統合登録フォーム
- [ ] BGG/手動切り替えタブUI実装
- [ ] レスポンシブデザイン対応

#### BGG登録フォーム
- [ ] `components/games/BGGRegistrationForm.tsx` - BGG専用フォーム
- [ ] BGG ID入力フィールド
- [ ] BGG URL入力フィールド（URLからID抽出）
- [ ] BGGデータプレビュー表示
- [ ] 登録前の確認ダイアログ

#### 手動登録フォーム
- [ ] `components/games/ManualRegistrationForm.tsx` - 手動専用フォーム
- [ ] 必須フィールド（名前、プレイ人数、プレイ時間）
- [ ] オプションフィールド（説明、カテゴリー、メカニクス等）
- [ ] 画像アップロード機能
- [ ] 入力バリデーション

### Phase 2: API・データ処理
#### BGG登録API
- [ ] `app/api/games/register-bgg/route.ts` - BGG自動登録API
- [ ] BGG ID/URLからのデータ取得
- [ ] 重複チェック機能
- [ ] BGGデータ変換・正規化
- [ ] エラーハンドリング（BGG API障害等）

#### 手動登録API
- [ ] `app/api/games/register-manual/route.ts` - 手動登録API
- [ ] 入力データバリデーション
- [ ] 日本語ゲーム用ID生成（`jp-{Base64}`）
- [ ] 基準スコア設定（7.5点、重み10）
- [ ] 画像処理・保存

#### BGG URL解析
- [ ] BGG URLからゲームID抽出機能
- [ ] URL形式バリデーション
- [ ] 対応URL形式：`https://boardgamegeek.com/boardgame/{id}/`
- [ ] 不正URL時のエラー処理

### Phase 3: データベース・バックエンド
#### データベース拡張
- [ ] `registration_source` カラム追加（'bgg' | 'manual'）
- [ ] `baseline_score` カラム追加（BGG評価 or 7.5）
- [ ] `baseline_weight` カラム追加（常に10）
- [ ] `baseline_review_count` カラム追加（常に10）
- [ ] `is_japanese_game` カラム追加

#### 重複防止・検証
- [ ] BGG ID重複チェック実装
- [ ] ゲーム名重複チェック実装
- [ ] データ整合性検証
- [ ] 登録権限チェック（経験者・管理者のみ）

#### データ変換システム
- [ ] BGG → サイト分類マッピング適用
- [ ] 既存マッピング（`bgg-mapping.ts`）活用
- [ ] 日本語パブリッシャー正規化
- [ ] カテゴリー・メカニクス変換

### Phase 4: 状態管理・フック
#### カスタムフック
- [ ] `hooks/useGameRegistration.ts` - 登録状態管理
- [ ] `hooks/useBGGSearch.ts` - BGG検索機能（既存拡張）
- [ ] `hooks/useGameValidation.ts` - バリデーション
- [ ] エラー状態・ローディング状態管理

#### 状態管理（Zustand）
- [ ] 登録モード状態（'bgg' | 'manual'）
- [ ] BGG検索結果保持
- [ ] フォームデータ永続化
- [ ] 登録進行状況トラッキング

### Phase 5: 権限・セキュリティ
#### 権限管理システム
- [ ] 新規ユーザー：登録不可（閲覧のみ）
- [ ] 経験者（3件以上レビュー）：登録可能
- [ ] 管理者：無制限登録可能
- [ ] 権限チェックミドルウェア

#### セキュリティ対策
- [ ] BGG ID形式検証
- [ ] XSS対策（入力サニタイゼーション）
- [ ] レート制限（ユーザー毎）
- [ ] SQL インジェクション防止

### Phase 6: テスト・検証
#### ユニットテスト
- [ ] BGG データ変換ロジックテスト
- [ ] URL解析機能テスト
- [ ] バリデーション機能テスト
- [ ] 権限チェックテスト

#### 統合テスト
- [ ] BGG API連携テスト（モック含む）
- [ ] データベース操作テスト
- [ ] 重複防止テスト
- [ ] エラーハンドリングテスト

#### E2Eテスト
- [ ] BGG登録フローテスト
- [ ] 手動登録フローテスト
- [ ] 権限制御テスト
- [ ] エラーケーステスト

## 📋 詳細仕様

### BGG登録フロー
```typescript
interface BGGRegistrationFlow {
  step1: "BGG ID/URL入力"
  step2: "BGG APIからデータ取得・プレビュー"
  step3: "データ変換・正規化"
  step4: "重複チェック"
  step5: "データベース保存"
  step6: "登録完了・ゲーム詳細ページへ"
}
```

### 手動登録フロー
```typescript
interface ManualRegistrationFlow {
  step1: "基本情報入力（名前、プレイ人数、時間）"
  step2: "詳細情報入力（説明、分類、画像）"
  step3: "入力バリデーション"
  step4: "重複チェック"
  step5: "基準スコア設定（7.5点）"
  step6: "データベース保存"
  step7: "登録完了・ゲーム詳細ページへ"
}
```

### データ構造
```typescript
interface GameRegistrationData {
  // BGG登録用
  bggId?: number
  bggUrl?: string
  
  // 手動登録用
  name: string
  nameJapanese?: string
  description?: string
  minPlayers: number
  maxPlayers: number
  playingTime: number
  yearPublished?: number
  imageUrl?: string
  
  // 分類
  categories?: string[]
  mechanics?: string[]
  designers?: string[]
  publishers?: string[]
  
  // メタデータ
  registrationSource: 'bgg' | 'manual'
  baselineScore: number // BGG評価 or 7.5
  baselineWeight: number // 常に10
  baselineReviewCount: number // 常に10
  isJapaneseGame: boolean
}
```

### URL解析パターン
```typescript
const bggUrlPatterns = [
  // 標準形式
  'https://boardgamegeek.com/boardgame/{id}/',
  'https://boardgamegeek.com/boardgame/{id}/game-name',
  
  // 短縮形式
  'https://bgg.cc/{id}',
  
  // 数値ID直接入力
  '{id}' // 6桁数字のみ
]
```

### 権限チェック
```typescript
interface RegistrationPermissions {
  guest: false
  newUser: false
  experiencedUser: true // 3件以上レビュー投稿
  admin: true
}

function checkRegistrationPermission(user: User): boolean {
  if (!user) return false
  if (user.isAdmin) return true
  return user.reviewCount >= 3
}
```

## 🔧 技術実装詳細

### BGG URLからID抽出
```typescript
function extractBGGId(input: string): number | null {
  // 直接数値入力
  if (/^\d{1,8}$/.test(input)) {
    return parseInt(input)
  }
  
  // BGG URL解析
  const patterns = [
    /boardgamegeek\.com\/boardgame\/(\d+)/,
    /bgg\.cc\/(\d+)/
  ]
  
  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) return parseInt(match[1])
  }
  
  return null
}
```

### 手動登録ID生成
```typescript
function generateManualGameId(name: string): string {
  const encoded = Buffer.from(name, 'utf8').toString('base64')
  return `jp-${encoded}`
}
```

### 基準スコア設定
```typescript
function setBaselineScoring(
  registrationSource: 'bgg' | 'manual',
  bggRating?: number
): BaselineScoring {
  if (registrationSource === 'bgg' && bggRating) {
    return {
      baselineScore: bggRating,
      baselineWeight: 10,
      baselineReviewCount: 10
    }
  }
  
  return {
    baselineScore: 7.5, // 手動登録の基準値
    baselineWeight: 10,
    baselineReviewCount: 10
  }
}
```

## 🧪 テストシナリオ

### BGG登録テスト
- [ ] 有効なBGG IDでの登録
- [ ] 有効なBGG URLでの登録
- [ ] 無効なID/URLでのエラー処理
- [ ] 既存ゲーム重複時の処理
- [ ] BGG API障害時のフォールバック

### 手動登録テスト
- [ ] 必須フィールドのみでの登録
- [ ] 全フィールド入力での登録
- [ ] バリデーションエラーの処理
- [ ] 日本語ゲーム名での登録
- [ ] 画像アップロードテスト

### 権限テスト
- [ ] ゲストユーザーのアクセス拒否
- [ ] 新規ユーザーのアクセス拒否
- [ ] 経験者ユーザーのアクセス許可
- [ ] 管理者ユーザーの無制限アクセス

## 🎨 UI/UX 設計

### 登録ページレイアウト
```
┌─────────────────────────────────────┐
│ ゲーム登録                          │
├─────────────────────────────────────┤
│ [BGG登録] [手動登録]               │
├─────────────────────────────────────┤
│                                     │
│ BGG登録時:                          │
│ ┌─────────────────────────────────┐ │
│ │ BGG ID/URL: [____________]      │ │
│ │ [検索] [プレビュー]              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 手動登録時:                         │
│ ┌─────────────────────────────────┐ │
│ │ ゲーム名: [________________]    │ │
│ │ プレイ人数: [__] ～ [__] 人     │ │
│ │ プレイ時間: [____] 分           │ │
│ │ [詳細入力へ]                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [登録] [キャンセル]                 │
└─────────────────────────────────────┘
```

### エラー表示
- 入力バリデーションエラー：フィールド下に赤文字表示
- BGG API エラー：モーダルダイアログで詳細表示
- 権限エラー：アクセス時にリダイレクト+メッセージ
- 重複エラー：既存ゲームへのリンク付きメッセージ

## 📊 成功指標

### 機能要件
- [ ] BGG URLから正常にゲーム登録できる
- [ ] BGG IDから正常にゲーム登録できる
- [ ] 手動でゲーム登録できる
- [ ] 重複防止が正常に動作する
- [ ] 権限制御が正常に動作する

### 非機能要件
- [ ] BGG登録：5秒以内で完了
- [ ] 手動登録：3秒以内で完了
- [ ] エラー発生時の適切なフィードバック
- [ ] モバイル端末での操作性

### セキュリティ要件
- [ ] 入力データの適切なサニタイゼーション
- [ ] SQL インジェクション耐性
- [ ] レート制限の適切な実装
- [ ] 権限チェックの完全性

## 🔗 依存関係

### 前提条件
- [x] BGG API連携機能（チケット004完了）
- [x] 認証システム（チケット003完了）
- [x] ゲーム管理機能（チケット005完了）
- [x] データベース基盤（チケット002完了）

### 関連ファイル
```
bgr-v2/
├── src/
│   ├── app/
│   │   ├── games/register/         # 新規作成
│   │   └── api/games/
│   │       ├── register-bgg/       # 新規作成
│   │       └── register-manual/    # 新規作成
│   ├── components/games/
│   │   ├── GameRegistrationForm.tsx  # 新規作成
│   │   ├── BGGRegistrationForm.tsx   # 新規作成
│   │   └── ManualRegistrationForm.tsx # 新規作成
│   ├── hooks/
│   │   ├── useGameRegistration.ts    # 新規作成
│   │   └── useGameValidation.ts      # 新規作成
│   ├── lib/
│   │   ├── bgg-api.ts               # 既存（拡張）
│   │   └── bgg-mapping.ts           # 既存（活用）
│   └── types/
│       └── game-registration.ts      # 新規作成
```

## ⏰ 想定スケジュール

- **Week 1**: Phase 1 (UI基盤・フォーム作成)
- **Week 2**: Phase 2 (API・データ処理)
- **Week 3**: Phase 3 (DB拡張・バックエンド)
- **Week 4**: Phase 4 (状態管理・フック)
- **Week 5**: Phase 5 (権限・セキュリティ)
- **Week 6**: Phase 6 (テスト・検証・修正)

**総工数**: 6週間

## 🚀 リリース基準

### 必須機能
- [x] 既存システムとの統合確認
- [ ] BGG登録機能の動作確認
- [ ] 手動登録機能の動作確認
- [ ] 権限制御の動作確認
- [ ] エラーハンドリングの動作確認

### 品質基準
- [ ] 全テストケースの通過
- [ ] セキュリティ検査の完了
- [ ] パフォーマンス要件の達成
- [ ] アクセシビリティ対応の完了

### デプロイ前チェック
- [ ] 本番環境でのBGG API動作確認
- [ ] データベースマイグレーション実行
- [ ] 環境変数設定確認
- [ ] バックアップ・復旧手順確認

---

**作成日**: 2025-08-31  
**担当**: Claude Code  
**優先度**: 高  
**状態**: 計画中