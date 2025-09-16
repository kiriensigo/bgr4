import { test, expect } from '@playwright/test'

test.describe('Review Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 開発サーバーにアクセス
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
  })

  test('ゲーム詳細ページからレビュー作成ページへのナビゲーション', async ({ page }) => {
    // ホームページからゲーム一覧へ
    await page.click('text=ゲーム一覧')
    await page.waitForLoadState('networkidle')
    
    // ゲーム一覧ページでゲームカードを探す
    await page.waitForSelector('[data-testid="game-card"]', { timeout: 10000 })
    
    // 最初のゲームカードをクリック
    await page.click('[data-testid="game-card"]')
    await page.waitForLoadState('networkidle')
    
    // ゲーム詳細ページが表示されることを確認
    await expect(page).toHaveURL(/\/games\/\d+$/)
    
    // レビューを書くボタンが存在することを確認
    await expect(page.locator('text=レビューを書く')).toBeVisible()
    
    // レビューを書くボタンをクリック
    await page.click('text=レビューを書く')
    
    // レビュー作成ページへのリダイレクトまたは認証ページへのリダイレクトを確認
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    console.log('Current URL after clicking review button:', currentUrl)
    
    // 認証が必要な場合はログインページにリダイレクトされる
    // 認証済みの場合はレビュー作成ページにリダイレクトされる
    expect(
      currentUrl.includes('/review') || currentUrl.includes('/login') || currentUrl.includes('/auth')
    ).toBeTruthy()
  })

  test('特定のゲームでレビュー作成ページの直接アクセス', async ({ page }) => {
    // 既知のゲームIDでレビュー作成ページに直接アクセス
    await page.goto('http://localhost:3001/games/68448/review')
    await page.waitForLoadState('networkidle')
    
    const currentUrl = page.url()
    const statusCode = page.response?.status || 0
    
    console.log('Review creation page URL:', currentUrl)
    console.log('Status code:', statusCode)
    
    // 404でない場合は正常（認証ページまたはレビューページ）
    if (statusCode !== 404) {
      expect(
        currentUrl.includes('/review') || currentUrl.includes('/login') || currentUrl.includes('/auth')
      ).toBeTruthy()
    }
    
    // ページタイトルを確認
    const title = await page.title()
    console.log('Page title:', title)
  })

  test('レビュー作成ページの認証リダイレクト確認', async ({ page }) => {
    const gameIds = [68448, 167791, 30549, 174430]
    
    for (const gameId of gameIds) {
      console.log(`Testing review page for game ID: ${gameId}`)
      
      await page.goto(`http://localhost:3001/games/${gameId}/review`)
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      
      const currentUrl = page.url()
      console.log(`Game ${gameId} - Final URL: ${currentUrl}`)
      
      // 認証が必要な場合はログインページにリダイレクト、認証済みならレビューページ
      expect(
        currentUrl.includes('/login') || 
        currentUrl.includes('/auth') || 
        currentUrl.includes('/review')
      ).toBeTruthy()
      
      // 404エラーでないことを確認
      const title = await page.title()
      expect(title).not.toContain('404')
      expect(title).not.toContain('Not Found')
    }
  })
})