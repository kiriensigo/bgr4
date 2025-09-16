import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3001'
const TEST_EMAIL = process.env['TEST_LOGIN_EMAIL'] || 'sutesute815@gmail.com'

test.describe('Post a real review (logged in)', () => {
  test('login via dev password page then submit review', async ({ page }) => {
    // 1) Open dev login page and sign in with email/password
    await page.goto(`${BASE}/dev/password-login`)
    await page.waitForLoadState('networkidle')
    await page.locator('[data-testid="dev-email"]').fill(TEST_EMAIL)
    await page.locator('[data-testid="dev-password"]').fill(process.env['TEST_LOGIN_PASSWORD'] || 'psotrial')
    await page.locator('[data-testid="dev-login-btn"]').click()
    await expect(page.locator('[data-testid="dev-status"]')).toContainText('ログイン成功', { timeout: 15000 })

    // 2) Open dev form (no middleware) to create review
    await page.goto(`${BASE}/dev/slider-test`)
    await page.waitForLoadState('networkidle')

    // 3) Set slider values via native range inputs
    await page.waitForSelector('input[type="range"]')
    const sliders = page.locator('input[type="range"]')
    expect(await sliders.count()).toBeGreaterThan(0)

    // overall ~ 8.0, others = 3
    const setRange = async (idx: number, val: number) => {
      const el = sliders.nth(idx)
      await el.evaluate((n, value) => {
        const input = n as HTMLInputElement
        input.value = String(value)
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }, val)
    }
    await setRange(0, 8.0)
    for (let i = 1; i <= 4; i++) await setRange(i, 3)

    // 4) Fill comment
    await page.locator('textarea').first().fill('E2E: 自動テストによる投稿です。')

    // 5) Submit
    await page.locator('button[type="submit"]').click()

    // 6) Expect redirect to game page
    await page.waitForURL(/\/games\/[0-9]+/, { timeout: 15000 })
    await expect(page).toHaveURL(/\/games\/[0-9]+/)
  })
})
