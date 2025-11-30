import { defineConfig, devices } from '@playwright/test'

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  // すべてのテストを並列実行
  fullyParallel: true,
  // CI環境での失敗時は再試行しない
  forbidOnly: !!process.env['CI'],
  // CI環境では再試行回数を制限
  retries: process.env['CI'] ? 2 : 0,
  // 並列ワーカー数の設定
  workers: process.env['CI'] ? 1 : 2,
  // レポーター設定
  reporter: 'html',
  
  // 共通設定
  use: {
    // すべてのテストで使用するベースURL
    baseURL: 'http://localhost:3001',
    
    // テストタイムアウト（15秒）
    actionTimeout: 15000,
    navigationTimeout: 20000,
    
    // 失敗時にトレースを収集
    trace: 'on-first-retry',
    
    // スクリーンショット設定
    screenshot: 'only-on-failure',
    
    // ビデオ録画設定
    video: 'retain-on-failure',
  },

  // プロジェクト設定（複数ブラウザでのテスト）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // モバイルテスト
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 開発サーバー設定（既存サーバー使用のため無効化）
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env['CI'],
    timeout: 120 * 1000,
  },
})