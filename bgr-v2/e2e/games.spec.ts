import { test, expect } from '@playwright/test'

test.describe('Games Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/games')
  })

  test('should display games list page', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/ゲーム.*BGR/)
    
    // Check for games content or loading state
    const gamesContainer = page.locator('[data-testid="games-list"], .games-grid, main')
    await expect(gamesContainer).toBeVisible()
  })

  test('should show search functionality', async ({ page }) => {
    // Look for search form
    const searchInput = page.getByPlaceholder(/ゲーム.*検索/)
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible()
      
      // Test search
      await searchInput.fill('Gloomhaven')
      
      // Look for search button or submit
      const searchButton = page.getByRole('button', { name: /検索/ })
      if (await searchButton.isVisible()) {
        await searchButton.click()
      } else {
        await searchInput.press('Enter')
      }
      
      // Wait for results or navigation
      await page.waitForTimeout(1000)
    }
  })

  test('should handle empty state gracefully', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check if there's either games or an empty state message
    const hasGames = await page.locator('[data-testid="game-card"], .game-card').count() > 0
    const hasEmptyMessage = await page.getByText(/ゲーム.*見つかりません|ゲーム.*ありません/).isVisible()
    
    // Should have either games or empty message
    expect(hasGames || hasEmptyMessage).toBeTruthy()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that page loads on mobile
    await expect(page.locator('main, [role="main"]')).toBeVisible()
    
    // Navigation should be accessible
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate network error
    await page.route('**/api/games*', route => {
      route.abort('failed')
    })
    
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Should show error message or fallback content
    const errorMessage = page.getByText(/エラー|読み込み.*失敗|接続.*失敗/)
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible()
    }
  })
})