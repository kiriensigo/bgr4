import { test, expect } from '@playwright/test'

test.describe('Simple Tests', () => {
  test('homepage loads and shows basic content', async ({ page }) => {
    // Set longer timeout for slow loading
    test.setTimeout(60000)
    
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' })
    
    // Check basic page loading
    await expect(page).toHaveTitle(/BGR/)
    
    // Check for navigation
    await expect(page.getByRole('navigation')).toBeVisible()
    
    // Check for main content area
    await expect(page.locator('main')).toBeVisible()
    
    // Check for BGR logo/link
    await expect(page.getByRole('link', { name: 'BGR' })).toBeVisible()
  })

  test('navigation links are present', async ({ page }) => {
    test.setTimeout(60000)
    
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' })
    
    // Wait for navigation to be loaded
    await page.waitForSelector('nav', { timeout: 30000 })
    
    // Check navigation links exist
    const homeLink = page.getByRole('link', { name: 'ホーム' })
    const reviewsLink = page.getByRole('link', { name: 'レビュー' })
    const searchLink = page.getByRole('link', { name: '検索' })
    
    await expect(homeLink).toBeVisible()
    await expect(reviewsLink).toBeVisible()
    await expect(searchLink).toBeVisible()
  })

  test('can navigate to search page', async ({ page }) => {
    test.setTimeout(60000)
    
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' })
    
    // Wait for page to load
    await page.waitForSelector('nav', { timeout: 30000 })
    
    // Click search link
    await page.getByRole('link', { name: '検索' }).click()
    
    // Check URL changed
    await expect(page).toHaveURL(/.*\/search/)
  })
})