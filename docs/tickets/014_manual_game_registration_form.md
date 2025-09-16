# チケット014: 手動ゲーム登録フォーム実装

## 概要
BGGに登録されていないゲーム（主に日本語ゲームや同人ゲーム）を手動で登録するためのフォームを実装する。レビューシステムと統一されたブーリアン型のカテゴリー・メカニクス選択システムを採用する。

## 実装内容

### ✅ 完了済み項目

1. **3ステップウィザード形式のUI**
   - Step 1: 基本情報入力
   - Step 2: カテゴリー・メカニクス選択
   - Step 3: 確認・登録

2. **基本情報入力フォーム**
   - 英語名・日本語名（どちらか必須）
   - 画像URL（必須）
   - ゲーム説明
   - 発売年
   - 最小・最大プレイ人数（必須）
   - 最小・最大プレイ時間（必須）
   - デザイナー・パブリッシャー

3. **ブーリアン型カテゴリー・メカニクス選択**
   - カテゴリー18種類のトグルボタン
   - メカニクス16種類のトグルボタン
   - Circle/CheckCircle2アイコンでの視覚的フィードバック
   - 複数選択対応

4. **データ構造**
   ```typescript
   interface ManualGameData {
     // 基本情報
     nameEnglish: string
     nameJapanese: string
     description: string
     yearPublished: string
     minPlayers: string
     maxPlayers: string
     minPlayingTime: string
     maxPlayingTime: string
     imageUrl: string
     designers: string
     publishers: string
     
     // ブーリアン型カテゴリー
     cat_acting: boolean
     cat_animals: boolean
     cat_bluffing: boolean
     cat_cardgame: boolean
     // ... 全18種類
     
     // ブーリアン型メカニクス
     mech_area_control: boolean
     mech_auction: boolean
     mech_betting: boolean
     mech_cooperative: boolean
     // ... 全16種類
   }
   ```

5. **バリデーション機能**
   - 必須項目チェック
   - 人数・時間の論理チェック
   - 発売年の範囲チェック

6. **確認画面**
   - 入力内容のサマリー表示
   - 選択されたカテゴリー・メカニクスのバッジ表示
   - 画像プレビュー機能

## 技術仕様

### ファイル構成
- `/src/app/games/register/page.tsx` - メインページ
- `/src/components/games/GameRegistrationForm.tsx` - 統合フォーム
- `/src/components/games/ManualRegistrationForm.tsx` - 手動登録フォーム
- `/src/components/games/BGGRegistrationForm.tsx` - BGG連携フォーム

### 使用技術
- Next.js 14 App Router
- React Hook Form (将来的な改善時)
- TypeScript
- Tailwind CSS
- shadcn/ui コンポーネント
- Lucide React アイコン

### 認証・認可
- 管理者権限またはレビュー投稿経験者のみアクセス可能
- モックユーザーでのテスト実装済み

## テスト結果

### ✅ 動作確認済み項目
1. **フォーム表示**: 全ステップが正常に表示される
2. **入力機能**: テキスト・数値入力が正常動作
3. **ボタントグル**: カテゴリー・メカニクスボタンの選択/解除
4. **ステップ遷移**: バリデーション付きで次ステップへ進行
5. **確認画面**: 入力内容が正確に反映される
6. **レスポンシブ**: モバイル・デスクトップ対応

### テスト環境
- ブラウザ: Chrome/Edge (Playwright MCP)
- デバイス: デスクトップ・モバイル
- Next.js開発サーバー: http://localhost:3001

## 今後の改善点

### 優先度: 高
1. **実際のデータベース連携**
   - Supabase gamesテーブルへの登録機能
   - Boolean フィールドの追加が必要

2. **画像アップロード機能**
   - ファイルアップロード対応
   - Supabase Storage連携

### 優先度: 中
1. **フォームライブラリ導入**
   - React Hook Form + Zod バリデーション
   - より堅牢なフォーム管理

2. **プレビュー機能強化**
   - 実際の画像プレビュー表示
   - next.config.js でのremotePatterns設定

### 優先度: 低
1. **オートコンプリート機能**
   - デザイナー・パブリッシャー候補表示
   - 過去データからの提案機能

## 関連チケット
- チケット002: Supabase データベース設定
- チケット003: 認証システム実装  
- チケット005: ゲーム管理機能
- 今後のチケット015: レビューページカテゴリー・メカニクス拡充

## 完了日
2025-08-31

## 実装者
Claude Code