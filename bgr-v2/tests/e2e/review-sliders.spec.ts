import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3001'

test.describe('Review sliders', () => {
  test('overall and axes sliders move continuously via keyboard', async ({ page }) => {
    await page.goto(`${BASE}/dev/slider-test`)
    await page.waitForLoadState('networkidle')

    const sliders = page.locator('input[type="range"]')
    expect(await sliders.count()).toBeGreaterThan(0)

    // helper to read numeric value of a range input
    const valueOf = async (idx: number) => {
      const el = sliders.nth(idx)
      return Number(await el.evaluate((n: any) => (n as HTMLInputElement).value))
    }

    // Test the first slider (overall score)
    const before = await valueOf(0)
    // Press ArrowRight multiple times to ensure continuous movement
    await sliders.nth(0).focus()
    await sliders.nth(0).press('ArrowRight')
    await sliders.nth(0).press('ArrowRight')
    await sliders.nth(0).press('ArrowRight')
    const after = await valueOf(0)
    expect(after).toBeGreaterThan(before)

    // Test dragging via mouse (hold and move)
    const box = await sliders.nth(0).boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2, { steps: 5 })
      await page.mouse.up()
      const afterDrag = await valueOf(0)
      expect(afterDrag).toBeGreaterThan(after)
    }

    // Test dragging by programmatic stepUp
    const before2 = await valueOf(1)
    await sliders.nth(1).evaluate((n: any) => {
      const el = n as HTMLInputElement
      el.stepUp(2)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    })
    const after2 = await valueOf(1)
    expect(after2).toBeGreaterThan(before2)
  })
})
