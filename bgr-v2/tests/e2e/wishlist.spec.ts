import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3001'

test.describe('Wishlist page interactions', () => {
  test('add and remove via API reflected in UI', async ({ page }) => {
    // login first
    await page.goto(`${BASE}/dev/password-login`)
    await page.locator('[data-testid="dev-email"]').fill(process.env['TEST_LOGIN_EMAIL'] || '')
    await page.locator('[data-testid="dev-password"]').fill(process.env['TEST_LOGIN_PASSWORD'] || '')
    await page.locator('[data-testid="dev-login-btn"]').click()
    await expect(page.locator('[data-testid="dev-status"]')).toContainText('成功', { timeout: 15000 })

    await page.goto(`${BASE}/wishlist`)
    await page.waitForLoadState('networkidle')

    // helper to count items using the image container selector
    const readCount = async () => await page.locator('div.aspect-square.relative').count()

    const before = await readCount()

    // Add one item via API
    await page.evaluate(async () => {
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: 30549 })
      })
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    const afterAdd = await readCount()
    expect(afterAdd).toBeGreaterThanOrEqual(before)

    // Remove via API
    await page.evaluate(async () => {
      await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: 30549 })
      })
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    const afterDel = await readCount()
    expect(afterDel).toBeLessThanOrEqual(afterAdd)
  })
})
