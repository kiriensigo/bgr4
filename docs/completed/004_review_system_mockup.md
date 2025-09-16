# チケット004: レビューシステム・モックアップ作成

## 🎯 チケット概要

**タイトル**: レビューシステム UI/UX モックアップ設計・作成  
**担当者**: Claude Code  
**優先度**: 高  
**期限**: 2025-08-22  
**前提条件**: チケット003完了（要件定義v2作成済み）

## 📋 作業内容

### Phase 1: ワイヤーフレーム設計

#### WF-001: レビュー投稿ページ
- [ ] 1ページ完結型レイアウト設計
- [ ] 5つの評価スライダー配置設計
- [ ] ボタン選択UI設計（プレイ人数・タグ・カテゴリー）
- [ ] コメント入力エリア設計
- [ ] 投稿ボタン・プレビューエリア配置

#### WF-002: レスポンシブ対応
- [ ] スマートフォン向けレイアウト（縦画面）
- [ ] タブレット向けレイアウト
- [ ] デスクトップ向けレイアウト
- [ ] タッチ操作最適化設計

### Phase 2: 詳細モックアップ作成

#### MU-001: 評価スライダーUI
- [ ] 総合得点スライダー（5-10、デフォルト7.5）
- [ ] ルール複雑さスライダー（1-5）
- [ ] 運要素スライダー（1-5）
- [ ] インタラクションスライダー（1-5）
- [ ] ダウンタイムスライダー（1-5）

#### MU-002: 選択型UI要素
- [ ] おすすめプレイ人数ボタン群
- [ ] タグ選択ボタン群
- [ ] カテゴリー選択ボタン群
- [ ] 複数選択対応UI

#### MU-003: 入力・送信エリア
- [ ] 150字制限コメント入力
- [ ] リアルタイム文字カウンター
- [ ] 投稿ボタンデザイン
- [ ] バリデーションエラー表示

#### MU-004: Twitter連携UI
- [ ] レビュー投稿完了後の表示
- [ ] Twitterシェアボタン
- [ ] プレビューツイート表示

### Phase 3: インタラクションデザイン

#### ID-001: アニメーション設計
- [ ] スライダー操作時のフィードバック
- [ ] ボタン選択状態の視覚的変化
- [ ] 投稿完了時のアニメーション
- [ ] エラー時の注意表示

#### ID-002: ユーザビリティ
- [ ] 直感的な操作フロー設計
- [ ] 誤操作防止設計
- [ ] アクセシビリティ対応
- [ ] キーボード操作対応

## 🎨 デザイン要件

### カラーパレット
```
Primary: #2563eb (ブルー系)
Secondary: #10b981 (グリーン系)
Accent: #f59e0b (オレンジ系)
Background: #f8fafc (ライトグレー)
Text: #1e293b (ダークグレー)
Border: #e2e8f0 (ボーダーグレー)
```

### タイポグラフィ
```
Heading: font-bold text-xl/2xl
Body: font-normal text-base
Caption: font-medium text-sm
Label: font-semibold text-sm
```

### スペーシング
```
Container: px-4 py-6 (mobile), px-8 py-8 (desktop)
Section Gap: space-y-6
Element Gap: space-y-4
Button Padding: px-6 py-3
```

## 📱 レスポンシブ仕様

### モバイル（320px-767px）
- 縦向き1カラムレイアウト
- タッチフレンドリーなボタンサイズ（44px以上）
- スライダー操作最適化
- コンパクトな情報表示

### タブレット（768px-1023px）
- 2カラムレイアウト（評価部分と選択部分）
- 適度な余白確保
- 横向き対応

### デスクトップ（1024px以上）
- 3カラムレイアウト可能
- 豊富な情報表示
- マウスホバー効果

## 🔄 ユーザーフロー

### 標準フロー
1. ゲーム詳細ページから「レビューを書く」クリック
2. レビューフォームページ表示
3. 5つの評価スライダーで点数入力
4. プレイ人数・タグ・カテゴリーをボタン選択
5. 任意でコメント入力（150字以内）
6. 「投稿する」ボタンクリック
7. 投稿完了とTwitterシェア画面表示

### エラーフロー
- 必須項目未入力時の警告表示
- 通信エラー時のリトライ機能
- セッション切れ時のログイン誘導

## 📋 技術仕様

### 使用コンポーネント
```typescript
// Slider Component (Custom)
<RatingSlider 
  label="総合得点"
  min={5} 
  max={10} 
  step={0.5}
  defaultValue={7.5}
  onChange={handleRatingChange}
/>

// Button Group Component
<ButtonGroup
  options={playerCountOptions}
  multiple={true}
  onChange={handlePlayerCountChange}
/>

// Comment Input
<CommentInput
  maxLength={150}
  placeholder="このゲームについてのコメント（任意）"
  onChange={handleCommentChange}
/>
```

### 状態管理
```typescript
interface ReviewFormState {
  overallScore: number;
  complexity: number;
  luckFactor: number;
  interaction: number;
  downtime: number;
  recommendedPlayers: number[];
  tags: string[];
  categories: string[];
  comment: string;
  isSubmitting: boolean;
  errors: Record<string, string>;
}
```

## 🧪 テストケース

### UT-001: フォーム入力テスト
- [ ] 各スライダーの値変更テスト
- [ ] ボタン選択・選択解除テスト
- [ ] コメント入力・文字数制限テスト
- [ ] バリデーションエラー表示テスト

### UT-002: レスポンシブテスト
- [ ] 各ブレークポイントでの表示テスト
- [ ] タッチ操作テスト（モバイル）
- [ ] キーボード操作テスト

### UT-003: 統合テスト
- [ ] 投稿フローエンドツーエンドテスト
- [ ] Twitter連携テスト
- [ ] エラーハンドリングテスト

## 📈 成功指標

### ユーザビリティ
- レビュー投稿完了率: 85%以上
- 平均投稿時間: 2分以内
- エラー発生率: 5%以下

### デザイン品質
- レスポンシブ対応: 全デバイス
- アクセシビリティスコア: 90以上
- ページロード時間: 2秒以内

## 🚀 実装フェーズ

### Phase 1 (本チケット)
- ワイヤーフレーム設計完了
- 詳細モックアップ完成
- インタラクションデザイン完了

### Phase 2 (後続チケット)
- React コンポーネント実装
- API 統合
- テスト実装

### Phase 3 (後続チケット)
- パフォーマンス最適化
- A/B テスト実施
- 本番デプロイ

---

**作成日**: 2025-08-22  
**最終更新**: 2025-08-22  
**関連ドキュメント**: review-requirements.md  
**前提チケット**: 003_review_requirements_v2  
**後続チケット**: 005_review_system_implementation