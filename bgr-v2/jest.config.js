const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // next.config.jsとテスト環境用の.envファイルが配置されているディレクトリを指定
  dir: './',
})

// Jestのカスタム設定
const customJestConfig = {
  setupFiles: ['<rootDir>/jest.polyfills.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // テストファイルの場所を指定
  testMatch: [
    '<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  
  // 特定のファイルをテストから除外
  testPathIgnorePatterns: [
    '<rootDir>/__tests__/mocks/',
    '<rootDir>/src/__tests__/mocks/',
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/e2e/',
    '<rootDir>/tests/',
    '<rootDir>/src/__tests__/e2e/'
  ],
  
  // カバレッジ収集対象
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/types/**/*',
    '!src/**/*.config.{js,ts}',
    '!src/app/layout.tsx', // レイアウトファイルは除外
    '!src/app/globals.css', // CSSファイルは除外
  ],
  
  // カバレッジ閾値
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // モジュールエイリアス設定の修正
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^lucide-react$': '<rootDir>/__mocks__/lucide-react.js',
    '^lucide-react/dist/esm/icons/(.*)$': '<rootDir>/__mocks__/lucide-icon.js',
    '^lucide-react/dist/esm/(.*)$': '<rootDir>/__mocks__/lucide-icon.js',
  },
  
  // ESMモジュール変換設定
  transformIgnorePatterns: [
    'node_modules/(?!(lucide-react)/)',
  ],
  
  // 環境変数の設定
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  
  // テストタイムアウト設定
  testTimeout: 10000,
  
  // カバレッジレポーターの設定
  coverageReporters: ['text', 'lcov', 'html'],
  
  // 並列実行の設定（エラー回避のため1に設定）
  maxWorkers: 1,
  
  // ワーカープロセスを無効化してエラーを回避
  
}

module.exports = createJestConfig(customJestConfig)
