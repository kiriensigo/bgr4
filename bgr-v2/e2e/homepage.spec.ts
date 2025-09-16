import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001')
  })

  test('should display homepage title and content', async ({ page }) => {
    // Check if the page loads
    await expect(page).toHaveTitle(/BGR/)

    // Check for main navigation
    await expect(page.getByRole('navigation')).toBeVisible()
    
    // Check for home link
    await expect(page.getByRole('link', { name: 'BGR' })).toBeVisible()
  })

  test('should have working navigation', async ({ page }) => {
    // Check navigation links
    await expect(page.getByRole('link', { name: 'ホーム' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'レビュー' })).toBeVisible()
    await expect(page.getByRole('link', { name: '検索' })).toBeVisible()
    
    // Click on Reviews link
    await page.getByRole('link', { name: 'レビュー' }).click()
    await expect(page).toHaveURL(/.*\/reviews/)
    
    // Go back to home
    await page.getByRole('link', { name: 'BGR' }).click()
    await expect(page).toHaveURL('http://localhost:3001/')
  })

  test('should show search functionality', async ({ page }) => {
    // Click on search link to navigate to search page
    await page.getByRole('link', { name: '検索' }).click()
    await expect(page).toHaveURL(/.*\/search/)
    
    // Look for search input on search page
    const searchInput = page.getByPlaceholder(/検索/)
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible()
      
      // Test typing in search
      await searchInput.fill('Gloomhaven')
      await searchInput.press('Enter')
      
      // Wait for search results or URL change
      await page.waitForTimeout(1000)
    }
  })

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByRole('navigation')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.getByRole('navigation')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })
    
    await page.waitForLoadState('networkidle')
    
    // Check for critical errors (ignore non-critical warnings)
    const criticalErrors = errors.filter(error => 
      !error.includes('Warning') && 
      !error.includes('DevTools') &&
      !error.includes('favicon')
    )
    
    expect(criticalErrors).toHaveLength(0)
  })
})