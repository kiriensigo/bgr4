import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3001'

test.describe('Review CRUD (dev page)', () => {
  test('create -> edit -> delete', async ({ page }) => {
    // Login via dev password page
    await page.goto(`${BASE}/dev/password-login`)
    await page.waitForLoadState('networkidle')
    await page.locator('[data-testid="dev-email"]').fill(process.env['TEST_LOGIN_EMAIL'] || '')
    await page.locator('[data-testid="dev-password"]').fill(process.env['TEST_LOGIN_PASSWORD'] || '')
    await page.locator('[data-testid="dev-login-btn"]').click()
    await expect(page.locator('[data-testid="dev-status"]')).toContainText('成功', { timeout: 15000 })

    // Open CRUD page
    await page.goto(`${BASE}/dev/review-crud`)
    await page.waitForLoadState('networkidle')
    // Ensure sliders exist
    await page.waitForSelector('input[type="range"]')

    // Fill sliders and comment, submit (create)
    const sliders = page.locator('input[type="range"]')
    const setRange = async (idx: number, val: number) => {
      const el = sliders.nth(idx)
      await el.evaluate((n, value) => {
        const input = n as HTMLInputElement
        input.value = String(value)
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }, val)
    }
    await setRange(0, 8.5)
    for (let i = 1; i <= 4; i++) await setRange(i, 3)
    const stamp = Date.now()
    await page.locator('textarea').first().fill(`E2E create ${stamp}`)
    await page.locator('button[type="submit"]').click()
    // Redirect may be delayed; don't rely on it here
    await page.waitForTimeout(2500)

    // Go back to CRUD and load latest (edit)
    await page.goto(`${BASE}/dev/review-crud`)
    await page.getByRole('button', { name: 'Load my latest' }).click()
    await expect(page.locator('text=loaded')).toBeVisible({ timeout: 10000 })

    // Update comment and one slider, submit (edit)
    await setRange(0, 9.0)
    await page.locator('textarea').first().fill(`E2E edit ${stamp}`)
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(2500)

    // Load again and delete
    await page.goto(`${BASE}/dev/review-crud`)
    await page.getByRole('button', { name: 'Load my latest' }).click()
    await expect(page.locator('text=loaded')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Delete loaded' }).click()
    await expect(page.locator('text=deleted')).toBeVisible({ timeout: 10000 })
    // Optional reload check skipped because there may be older reviews
  })
})
