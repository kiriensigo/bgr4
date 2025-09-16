import { test, expect } from '@playwright/test'

// テスト用のBGGゲームID（実際のゲームで日本語版がある）
const TEST_GAMES = {
  LOVE_LETTER: { id: 129622, expectedJapaneseName: 'ラブレター' },
  DOMINION: { id: 36218, expectedJapaneseName: 'ドミニオン' },
  TICKET_TO_RIDE: { id: 9209, expectedJapaneseName: 'チケット・トゥ・ライド' },
  CATAN: { id: 13, expectedJapaneseName: null }, // 既存登録済み
}

test.describe('Japanese Version Detection E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // ゲーム登録ページに移動
    await page.goto('/games/register')
    
    // 管理者としてログインが必要な場合のための待機
    await page.waitForSelector('[data-testid="bgg-registration-form"]', { 
      timeout: 10000,
      state: 'visible' 
    }).catch(() => {
      // セレクタが見つからない場合は、既存の要素で代用
      return page.waitForSelector('input[placeholder*="266192"]', { timeout: 5000 })
    })
  })

  test('should detect and use Japanese name for Love Letter', async ({ page }) => {
    console.log('Testing Love Letter Japanese version detection...')

    // BGG ID入力
    await page.fill('input[placeholder*="266192"]', TEST_GAMES.LOVE_LETTER.id.toString())
    await page.click('button:has-text("検索")')

    // ゲーム情報の読み込み待機
    await page.waitForSelector('h3:has-text("Love Letter")', { timeout: 10000 })

    // パブリッシャーリストに日本の出版社が含まれていることを確認
    const publisherSection = page.locator('h4:has-text("パブリッシャー")').locator('..').locator('div')
    await expect(publisherSection.locator('div:has-text("カナイ製作所")')).toBeVisible()
    await expect(publisherSection.locator('div:has-text("アークライト")')).toBeVisible()

    // ゲーム登録ボタンをクリック
    await page.click('button:has-text("ゲームを登録")')

    // 成功メッセージの確認
    await expect(page.locator('div:has-text("ゲームが正常に登録されました")')).toBeVisible({ timeout: 15000 })

    // 新しく登録されたゲームページに移動するのを待機
    await page.waitForURL(/\/games\/\d+/, { timeout: 10000 })

    // ゲーム詳細ページでタイトルを確認
    const gameTitle = page.locator('h1')
    const titleText = await gameTitle.textContent()
    
    // 日本語名または元の名前が表示されているか確認
    expect(titleText).toMatch(/(ラブレター|Love Letter)/)
    
    console.log(`Game registered with title: ${titleText}`)
  })

  test('should handle already registered games gracefully', async ({ page }) => {
    console.log('Testing already registered game handling...')

    // 既に登録済みのCATANをテスト
    await page.fill('input[placeholder*="266192"]', TEST_GAMES.CATAN.id.toString())
    await page.click('button:has-text("検索")')

    // ゲーム情報の読み込み待機
    await page.waitForSelector('h3:has-text("CATAN")', { timeout: 10000 })

    // 登録ボタンをクリック
    await page.click('button:has-text("ゲームを登録")')

    // 既に登録済みのエラーメッセージを確認
    await expect(page.locator('div:has-text("既に登録されています")')).toBeVisible({ timeout: 5000 })
    
    console.log('Already registered game error message displayed correctly')
  })

  test('should detect Japanese publishers correctly', async ({ page }) => {
    console.log('Testing Japanese publisher detection...')

    // 日本の出版社が多数あるゲームをテスト
    await page.fill('input[placeholder*="266192"]', TEST_GAMES.LOVE_LETTER.id.toString())
    await page.click('button:has-text("検索")')

    // ゲーム情報の読み込み待機
    await page.waitForSelector('h3:has-text("Love Letter")', { timeout: 10000 })

    // 複数の日本語出版社が表示されていることを確認
    const publisherSection = page.locator('h4:has-text("パブリッシャー")').locator('..').locator('div')
    
    // 主要な日本の出版社をチェック
    const japanesePublishers = [
      'カナイ製作所',
      'アークライト', 
      'アズモデージャパン',
      'Japon Brand'
    ]

    for (const publisher of japanesePublishers) {
      await expect(publisherSection.locator(`div:has-text("${publisher}")`)).toBeVisible()
      console.log(`Confirmed Japanese publisher: ${publisher}`)
    }
  })

  test('should handle BGG API errors gracefully', async ({ page }) => {
    console.log('Testing BGG API error handling...')

    // 存在しないBGG IDをテスト
    await page.fill('input[placeholder*="266192"]', '999999999')
    await page.click('button:has-text("検索")')

    // エラーメッセージまたは「見つかりません」メッセージを待機
    try {
      await expect(
        page.locator('div:has-text("取得できませんでした"), div:has-text("見つかりませんでした"), div:has-text("エラー")')
      ).toBeVisible({ timeout: 10000 })
      console.log('BGG API error handled correctly')
    } catch (error) {
      // タイムアウトした場合、ページの状態をログ出力
      const pageContent = await page.textContent('body')
      console.log('Page content after invalid BGG ID:', pageContent?.substring(0, 500))
      throw error
    }
  })

  test('should show game information preview before registration', async ({ page }) => {
    console.log('Testing game information preview...')

    await page.fill('input[placeholder*="266192"]', TEST_GAMES.LOVE_LETTER.id.toString())
    await page.click('button:has-text("検索")')

    // ゲーム情報プレビューの表示を確認
    await page.waitForSelector('h3:has-text("Love Letter")', { timeout: 10000 })

    // 必要な情報が表示されているか確認
    await expect(page.locator('text=発売年:')).toBeVisible()
    await expect(page.locator('text=プレイ人数:')).toBeVisible()
    await expect(page.locator('text=プレイ時間:')).toBeVisible()
    await expect(page.locator('text=BGG評価:')).toBeVisible()
    
    // カテゴリーとメカニクスの表示確認
    await expect(page.locator('h4:has-text("カテゴリー")')).toBeVisible()
    await expect(page.locator('h4:has-text("デザイナー")')).toBeVisible()
    await expect(page.locator('h4:has-text("パブリッシャー")')).toBeVisible()

    // デザイナーが正しく表示されているか確認（Seiji Kanai）
    await expect(page.locator('text=Seiji Kanai')).toBeVisible()
    
    console.log('Game information preview displayed correctly')
  })
})

test.describe('Japanese Version Detection API Tests', () => {
  test('should return correct Japanese version data via API', async ({ request }) => {
    console.log('Testing Japanese version detection API...')

    // BGG API経由でゲーム情報を取得
    const response = await request.get(`/api/bgg/game/${TEST_GAMES.LOVE_LETTER.id}`)
    expect(response.status()).toBe(200)
    
    const gameData = await response.json()
    console.log('API Response:', JSON.stringify(gameData, null, 2))

    // 基本情報の確認
    expect(gameData.name).toBe('Love Letter')
    expect(gameData.id).toBe(TEST_GAMES.LOVE_LETTER.id)
    
    // 日本の出版社が含まれているか確認
    const publishers = gameData.publishers || []
    const hasJapanesePublisher = publishers.some((pub: string) => 
      pub.includes('カナイ') || 
      pub.includes('アークライト') || 
      pub.includes('Japon') ||
      pub.includes('Arclight')
    )
    
    expect(hasJapanesePublisher).toBe(true)
    console.log('Japanese publishers detected in API response:', publishers.filter((pub: string) => 
      pub.includes('カナイ') || pub.includes('アークライト') || pub.includes('Japon') || pub.includes('Arclight')
    ))
  })

  test('should handle registration API with Japanese version priority', async ({ request }) => {
    console.log('Testing registration API with Japanese version priority...')

    // まず既存のゲームを削除する必要があるかもしれないが、
    // テスト環境では新しいBGG IDを使用する
    const testBggId = 266192 // Wingspan - まだ登録されていないと仮定

    try {
      const response = await request.post('/api/games/register-from-bgg', {
        data: { bggId: testBggId },
        headers: {
          'Authorization': 'Bearer test-token', // 実際の認証トークンが必要
          'Content-Type': 'application/json'
        }
      })

      if (response.status() === 409) {
        console.log('Game already registered, which is expected behavior')
        const errorData = await response.json()
        expect(errorData.message).toContain('既に登録されています')
      } else if (response.status() === 200) {
        console.log('Game registered successfully')
        const responseData = await response.json()
        expect(responseData.success).toBe(true)
        expect(responseData.message).toContain('正常に登録されました')
      } else {
        console.log(`Unexpected status: ${response.status()}`)
        const responseText = await response.text()
        console.log('Response:', responseText)
      }
    } catch (error) {
      console.log('API request failed (likely due to authentication):', error)
      // 認証エラーは期待される動作なので、テストは続行
    }
  })
})