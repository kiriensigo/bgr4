import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3001'

test.describe('Reviews list navigation', () => {
  test('open list and go to detail', async ({ page }) => {
    await page.goto(`${BASE}/reviews`)
    await page.waitForLoadState('networkidle')

    // wait some cards/links appear
    await page.waitForSelector('a[href^="/reviews/"]', { timeout: 15000 })
    const links = page.locator('a[href^="/reviews/"]')
    expect(await links.count()).toBeGreaterThan(0)

    const firstHref = await links.first().getAttribute('href')
    await links.first().click()
    await page.waitForURL(/\/reviews\//, { timeout: 15000 })
    expect(page.url()).toContain('/reviews/')

    // detail page should render some content area
    await expect(page.locator('main, [role="main"], h1, h2')).toBeVisible()

    // back to list works
    await page.goBack()
    await page.waitForURL('**/reviews', { timeout: 15000 })
  })
})

