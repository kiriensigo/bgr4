# テスト・デバッグスクリプト

## 📂 このディレクトリについて

開発・テスト・デバッグ用のスクリプトを整理しています。

## 📋 ファイル一覧

### BGG API関連
- `test-bgg-api.js` - BGG API基本テスト
- `test-bgg-conversion.js` - データ変換テスト  
- `test-bgg-mapping-suite.js` - マッピング機能テスト
- `test-bgg-raw-data.js` - 生データ取得テスト
- `test-pandemic-mapping.js` - 特定ゲーム(パンデミック)テスト

### データ処理・マッピング
- `test-display-conversion.js` - 表示用データ変換
- `test-single-game-mapping.js` - 単一ゲームマッピング
- `test-playwright-mapping.js` - Playwrightでのマッピングテスト

### ゲーム管理
- `test-game-registration.js` - ゲーム登録テスト
- `test-new-data-flow.js` - 新データフロー検証

### UI・表示
- `test-description-display.js` - 説明文表示テスト
- `test-playtime-display.js` - プレイ時間表示テスト
- `test-playtime-range.js` - プレイ時間範囲テスト

### API・エンドポイント
- `test-endpoints.js` - APIエンドポイントテスト
- `test-features.js` - 機能テスト

### ボタン・UI要素
- `test-bgg-button.js` - BGGボタンテスト

## 🚀 実行方法

```bash
# 個別実行
node scripts/test/test-bgg-api.js

# 特定機能のテスト
node scripts/test/test-mapping-suite.js

# BGG関連のテスト
node scripts/test/test-bgg-*.js
```

## 📝 スクリプト追加ルール

### 命名規則
- `test-{機能名}.js` 形式
- 分かりやすい機能名を使用

### ファイル内容
- 目的をコメントで明記
- 実行結果をコンソール出力
- エラーハンドリングを適切に実装

### 例
```javascript
/**
 * BGG API基本テスト
 * BGG APIからゲーム情報を取得してレスポンスを確認
 */

const { getBGGGame } = require('../../src/lib/bgg-api');

async function testBGGAPI() {
  try {
    console.log('BGG API テスト開始...');
    const result = await getBGGGame('174430'); // Gloomhaven
    console.log('成功:', result.name);
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

testBGGAPI();
```

---

**用途**: 開発・デバッグ専用  
**本番使用**: 禁止  
**Git管理**: 含める（開発チーム共有のため）