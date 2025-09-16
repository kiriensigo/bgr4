// Record a logged-in storage state by letting you complete Google login manually.
// Usage:
//   cd bgr-v2
//   node tests/utils/record-auth.js

const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE = process.env.BASE_URL || 'http://localhost:3001'
const STORAGE_PATH = path.join(__dirname, '../.auth/storage.json')

;(async () => {
  const browser = await chromium.launch({ headless: false, channel: 'chrome' })
  const context = await browser.newContext()
  const page = await context.newPage()

  console.log('[Auth] Opening login page...')
  await page.goto(`${BASE}/login`)
  console.log('[Auth] Please log in with Google in the opened browser window.')
  console.log('[Auth] After login completes and the app shows you as signed in, press Ctrl+C here to abort or wait...')

  // Heuristic: wait until header shows something like profile or logout
  try {
    await page.waitForTimeout(1000)
    await page.waitForLoadState('networkidle')
    // Give up to 2 minutes to finish login manually
    await page.waitForTimeout(120000)
  } catch (e) {}

  // Save storage
  const dir = path.dirname(STORAGE_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  await context.storageState({ path: STORAGE_PATH })
  console.log(`[Auth] Saved storage state to: ${STORAGE_PATH}`)

  await browser.close()
})().catch(err => {
  console.error(err)
  process.exit(1)
})
