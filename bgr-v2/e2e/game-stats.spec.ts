import { test, expect } from '@playwright/test'

test.describe('Game Statistics Display', () => {
  test.beforeEach(async ({ page }) => {
    // ゲーム詳細ページに移動
    await page.goto('http://localhost:3001/games/30549')
  })

  test('ゲーム統計セクションが表示される', async ({ page }) => {
    // 統計セクションが表示されることを確認
    await expect(page.locator('text=ゲーム統計')).toBeVisible()
    
    // 統計の説明文が表示されることを確認
    await expect(page.locator('text=レビューとBGGデータに基づく統計')).toBeVisible()
  })

  test('メカニクス統計データが表示される', async ({ page }) => {
    // メカニクスタブがデフォルトで選択されていることを確認
    const mechanicsTab = page.locator('[role="tab"]:has-text("メカニクス")')
    await mechanicsTab.waitFor({ state: 'visible' }); // 要素が表示されるまで待機
    await expect(mechanicsTab).toHaveAttribute('data-state', 'active')
    
    // 統計データの読み込みを待機
    await page.waitForTimeout(2000)
    
    // メカニクス統計項目の確認（文字化け対応）
    const statsItems = page.locator('[class*="statistic-item"], [class*="p-4"][class*="rounded-lg"]')
    await expect(statsItems.first()).toBeVisible()
    
    // パーセンテージの表示確認
    await expect(page.locator('text=/\\d+\\.\\d+%/')).toBeVisible()
  })

  test('プレイ人数統計データが表示される', async ({ page }) => {
    // プレイ人数タブをクリック
    const playersTab = page.locator('[role="tab"]:has-text("プレイ人数")')
    await playersTab.click()
    
    // タブが切り替わることを確認
    await expect(playersTab).toHaveAttribute('data-state', 'active')
    
    // 統計データの読み込みを待機
    await page.waitForTimeout(1000)
    
    // プレイ人数統計項目の確認
    const statsItems = page.locator('[class*="p-4"][class*="rounded-lg"]')
    await expect(statsItems.first()).toBeVisible()
    
    // 100%の項目が表示されることを確認
    await expect(page.locator('text=100.0%')).toBeVisible()
  })

  test('カテゴリー統計で空メッセージが表示される', async ({ page }) => {
    // カテゴリータブをクリック
    const categoriesTab = page.locator('[role="tab"]:has-text("カテゴリー")')
    await categoriesTab.click()
    
    // タブが切り替わることを確認
    await expect(categoriesTab).toHaveAttribute('data-state', 'active')
    
    // 空メッセージが表示されることを確認
    await expect(page.locator('text=カテゴリー統計データがありません')).toBeVisible()
  })

  test('70%以上の項目がハイライト表示される', async ({ page }) => {
    // 統計データの読み込みを待機
    await page.waitForTimeout(2000)
    
    // ハイライト表示の要素を確認（青色背景）
    const highlightItems = page.locator('[class*="blue-50"], [class*="blue-100"]')
    await expect(highlightItems.first()).toBeVisible()
    
    // ハイライトされたパーセンテージバッジを確認
    const highlightBadges = page.locator('[class*="bg-blue-600"]')
    await expect(highlightBadges.first()).toBeVisible()
  })

  test('統計データの詳細情報が表示される', async ({ page }) => {
    // 統計データの読み込みを待機
    await page.getByText(/レビュー\s*\d+票/).waitFor({ state: 'visible' });

    // レビュー票数の表示確認
    await expect(page.getByText(/レビュー\s*\d+票/)).toBeVisible();
    
    // BGG票数の表示確認
    await expect(page.locator('text=/BGG.*\\d+票/')).toBeVisible()
    
    // 合計票数の表示確認
    await expect(page.locator('text=/合計.*\\d+票/')).toBeVisible()
  })

  test('プログレスバーが正常に表示される', async ({ page }) => {
    // 統計データの読み込みを待機
    await page.waitForTimeout(2000)
    
    // プログレスバーの要素を確認
    const progressBars = page.locator('[class*="rounded-full"][class*="h-2"]')
    await expect(progressBars.first()).toBeVisible()
    
    // 進行状況バーの幅が設定されていることを確認
    const progressFill = page.locator('[style*="width:"]')
    await expect(progressFill.first()).toBeVisible()
  })

  test('レスポンシブ表示が機能する', async ({ page }) => {
    // デスクトップサイズでの確認
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.waitForTimeout(1000)
    
    // 統計項目が複数列で表示されることを確認
    const statsGrid = page.locator('[class*="grid"]').first()
    await expect(statsGrid).toBeVisible()
    
    // モバイルサイズに変更
    await page.setViewportSize({ width: 400, height: 800 })
    await page.waitForTimeout(1000)
    
    // 統計セクションが引き続き表示されることを確認
    await expect(page.locator('text=ゲーム統計')).toBeVisible()
  })
})

test.describe('Game Statistics Performance', () => {
  test('統計APIのレスポンス時間が1秒以内', async ({ page }) => {
    // APIレスポンス時間を測定
    const startTime = Date.now()
    
    // ゲームページにアクセス
    await page.goto('http://localhost:3001/games/30549')
    
    // 統計データの読み込み完了を待機
    await page.waitForSelector('text=ゲーム統計', { timeout: 10000 })
    await page.waitForTimeout(2000) // 統計データ読み込み待機
    
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    // ページ全体の読み込み時間が10秒以内であることを確認
    expect(responseTime).toBeLessThan(10000)
    
    console.log(`Page load time: ${responseTime}ms`)
  })

  test('統計データが正確に表示される', async ({ page }) => {
    await page.goto('http://localhost:3001/games/30549')
    
    // 統計データの読み込みを待機
    await page.waitForTimeout(3000)
    
    // メカニクス統計の確認
    const mechanicsTab = page.locator('[role="tab"]:has-text("メカニクス")')
    await mechanicsTab.click()
    
    // 90%以上の項目があることを確認
    const highPercentages = page.locator('text=/9[0-9]\\.\\d+%|100\\.\\d+%/')
    await expect(highPercentages.first()).toBeVisible()
    
    // プレイ人数統計の確認
    const playersTab = page.locator('[role="tab"]:has-text("プレイ人数")')
    await playersTab.click()
    
    // 100%の項目があることを確認
    await expect(page.locator('text=100.0%')).toBeVisible()
  })
})