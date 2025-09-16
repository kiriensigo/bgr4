import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3001'

async function basicSeoChecks(pageUrl: string, page) {
  await page.goto(pageUrl)
  await page.waitForLoadState('networkidle')
  const title = await page.title()
  expect(title?.length || 0).toBeGreaterThan(0)
  const hasDesc = await page.locator('meta[name="description"]').count()
  expect(hasDesc).toBeGreaterThan(0)
  // canonical is optional, but if present it should be a link
  const canonCount = await page.locator('link[rel="canonical"]').count()
  if (canonCount > 0) {
    const href = await page.locator('link[rel="canonical"]').first().getAttribute('href')
    expect(href && href.length > 0).toBeTruthy()
  }
  // images should mostly have alt
  const imgs = page.locator('img')
  const imgCount = await imgs.count()
  if (imgCount > 0) {
    const withAlt = await page.evaluate(() => Array.from(document.images).filter(i => i.getAttribute('alt') !== null).length)
    expect(withAlt / imgCount).toBeGreaterThan(0.6)
  }
}

test('Home, Reviews and one Game have basic SEO/A11y markers', async ({ page }) => {
  await basicSeoChecks(`${BASE}/`, page)
  await basicSeoChecks(`${BASE}/reviews`, page)
  await basicSeoChecks(`${BASE}/games/30549`, page)
})

