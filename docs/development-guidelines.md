# BGR開発ガイドライン

## 📂 ファイル整理ルール

### テストファイルの配置

#### 🧪 **単体テスト・統合テスト**
```
src/
├── __tests__/              ← Jest用テストファイル
├── components/
│   └── __tests__/          ← コンポーネントテスト
├── hooks/
│   └── __tests__/          ← フックテスト
└── lib/
    └── __tests__/          ← ライブラリテスト
```

#### 🎭 **E2Eテスト**
```
e2e/                        ← Playwrightテスト
├── auth.spec.ts
├── games.spec.ts
└── homepage.spec.ts
```

#### 🔧 **開発・デバッグ用スクリプト**
```
scripts/
├── test/                   ← テスト・デバッグスクリプト
│   ├── test-bgg-api.js     ← BGG API テスト
│   ├── test-mapping.js     ← データマッピングテスト
│   └── test-endpoints.js   ← エンドポイントテスト
└── seed/                   ← データベースシード
    └── seed-database.js
```

### ディレクトリ構成ルール

#### ✅ **含めるべきもの**
- ソースコード (`src/`)
- ドキュメント (`docs/`)
- 設定ファイル (`package.json`, `next.config.ts` 等)
- 必要なスクリプト (`scripts/`)

#### ❌ **含めないもの (.gitignore)**
- ビルド結果 (`coverage/`, `test-results/`, `playwright-report/`)
- ローカル開発環境 (`local_db/`)
- 外部ツール (`serena/`)
- 一時ファイル (`*.tsbuildinfo`, `.cleanup-plan.md`)

## 📋 **新しいテストファイルの追加ルール**

### 1. **機能テスト**
```typescript
// src/components/__tests__/NewComponent.test.tsx
import { render, screen } from '@testing-library/react';
import NewComponent from '../NewComponent';

describe('NewComponent', () => {
  it('should render correctly', () => {
    render(<NewComponent />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```

### 2. **API・統合テスト**
```typescript
// src/lib/__tests__/new-api.test.ts
import { newApiFunction } from '../new-api';

describe('newApiFunction', () => {
  it('should return expected data', async () => {
    const result = await newApiFunction();
    expect(result).toBeDefined();
  });
});
```

### 3. **E2Eテスト**
```typescript
// e2e/new-feature.spec.ts
import { test, expect } from '@playwright/test';

test('new feature works correctly', async ({ page }) => {
  await page.goto('/new-feature');
  await expect(page.locator('h1')).toContainText('New Feature');
});
```

### 4. **デバッグ・実験スクリプト**
```javascript
// scripts/test/test-new-feature.js
const { testNewFeature } = require('../src/lib/new-feature');

async function main() {
  console.log('Testing new feature...');
  const result = await testNewFeature();
  console.log('Result:', result);
}

main().catch(console.error);
```

## 🔧 **開発コマンド**

### テスト実行
```bash
# 単体テスト
npm test

# E2Eテスト  
npm run test:e2e

# カバレッジ
npm run test:coverage

# 開発スクリプト実行
node scripts/test/test-*.js
```

### ファイル整理
```bash
# テスト結果削除
npm run clean:test

# ビルド結果削除
npm run clean:build

# 全削除
npm run clean:all
```

## 📝 **命名規則**

### テストファイル
- **単体テスト**: `*.test.ts/tsx`
- **E2Eテスト**: `*.spec.ts`
- **デバッグスクリプト**: `test-*.js`

### ディレクトリ
- **テスト**: `__tests__/` (Jestの慣例)
- **E2E**: `e2e/` (Playwrightの慣例)
- **スクリプト**: `scripts/test/`

## 🚨 **禁止事項**

### ❌ **やってはいけないこと**
- ルートディレクトリにテストファイル直置き
- `test-*.js` をプロジェクトルートに散乱
- ビルド結果をGitにコミット
- 外部ツールをプロジェクトに含める

### ✅ **推奨事項**
- テストファイルは適切なディレクトリに配置
- .gitignoreで不要ファイルを除外
- README.mdでスクリプトの使い方を説明
- 定期的なファイル整理

---

**最終更新**: 2025-08-22  
**適用対象**: BGR v2プロジェクト全体