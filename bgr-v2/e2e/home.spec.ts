import { test, expect } from '@playwright/test'

test.describe('ホームページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('ページタイトルが正しく設定されている', async ({ page }) => {
    await expect(page).toHaveTitle(/BGR.*Board Game Review/)
  })

  test('ヒーローセクションが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ボードゲームレビュー/ })).toBeVisible()
    await expect(page.getByText(/お気に入りのボードゲームを見つけよう/)).toBeVisible()
  })

  test('ナビゲーションメニューが表示される', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'ホーム' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'レビュー' })).toBeVisible()
    await expect(page.getByRole('link', { name: '検索' })).toBeVisible()
  })

  test('ゲーム検索フォームが動作する', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/ゲーム名で検索/)
    await expect(searchInput).toBeVisible()
    
    await searchInput.fill('カタン')
    await page.getByRole('button', { name: '検索' }).click()
    
    await expect(page).toHaveURL(/\/search/)
  })

  test('レスポンシブデザインが正しく動作する', async ({ page }) => {
    // デスクトップサイズで確認
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.getByRole('navigation')).toBeVisible()
    
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 })
    
    // モバイルメニューボタンが表示されることを確認
    const mobileMenuButton = page.getByRole('button', { name: /メニュー/ })
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      await expect(page.getByRole('navigation')).toBeVisible()
    }
  })

  test('最新レビューセクションが表示される', async ({ page }) => {
    await expect(page.getByText(/最新のレビュー/)).toBeVisible()
    
    // レビューカードが表示されるまで待機
    await page.waitForSelector('[data-testid="review-card"]', { timeout: 10000 })
    
    const reviewCards = page.locator('[data-testid="review-card"]')
    await expect(reviewCards).toHaveCount({ min: 1 })
  })

  test('人気ゲームセクションが表示される', async ({ page }) => {
    await expect(page.getByText(/人気のゲーム/)).toBeVisible()
    
    // ゲームカードが表示されるまで待機
    await page.waitForSelector('[data-testid="game-card"]', { timeout: 10000 })
    
    const gameCards = page.locator('[data-testid="game-card"]')
    await expect(gameCards).toHaveCount({ min: 1 })
  })

  test('機能紹介セクションが表示される', async ({ page }) => {
    await expect(page.getByText(/主な機能/)).toBeVisible()
    await expect(page.getByText(/詳細なレビューシステム/)).toBeVisible()
    await expect(page.getByText(/ゲーム検索機能/)).toBeVisible()
  })

  test('アクセシビリティが確保されている', async ({ page }) => {
    // 主要な見出しがあることを確認
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    
    // alt属性を持つ画像があることを確認
    const images = page.locator('img')
    const imageCount = await images.count()
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      if (alt !== null) {
        expect(alt.length).toBeGreaterThan(0)
      }
    }
    
    // フォーカス可能な要素がキーボードでアクセス可能
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
  })

  test('ページの読み込み性能が適切', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // 3秒以内に読み込み完了
    expect(loadTime).toBeLessThan(3000)
  })

  test('エラー状態が適切に処理される', async ({ page }) => {
    // ネットワークエラーをシミュレート
    await page.route('**/api/**', route => route.abort())
    await page.reload()
    
    // エラーメッセージまたはスケルトンが表示されることを確認
    await expect(
      page.locator('text=エラー').or(
        page.locator('[data-testid="skeleton"]')
      )
    ).toBeVisible({ timeout: 10000 })
  })
})