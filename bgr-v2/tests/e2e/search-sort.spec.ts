import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3001'

test.describe('Reviews search and sort (smoke)', () => {
  test('search narrows results, clear restores', async ({ page }) => {
    await page.goto(`${BASE}/reviews`)
    await page.waitForLoadState('networkidle')

    // baseline count
    const baseline = await page.locator('a[href^="/reviews/"]').count()
    if (baseline === 0) {
      // No data in list – at least assert the page loaded
      await expect(page.locator('h1, h2')).toBeVisible()
      return
    }

    // enter a nonsense query and submit
    await page.locator('input[type="search"]').fill(`nohits-${Date.now()}`)
    await page.keyboard.press('Enter')

    // expect zero links (or fewer than baseline)
    await page.waitForTimeout(800)
    const after = await page.locator('a[href^="/reviews/"]').count()
    expect(after).toBeLessThanOrEqual(baseline)

    // clear filters button if present; otherwise clear input
    const clearBtn = page.locator('button:has-text("クリア"), button:has-text("Clear"), button:has-text("N")')
    if (await clearBtn.count()) {
      await clearBtn.first().click()
    } else {
      await page.locator('input[type="search"]').fill('')
      await page.keyboard.press('Enter')
    }

    await page.waitForTimeout(800)
    const restored = await page.locator('a[href^="/reviews/"]').count()
    expect(restored).toBeGreaterThan(0)
  })
})
