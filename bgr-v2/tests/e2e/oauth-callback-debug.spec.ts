import { test, expect } from '@playwright/test'

test.describe('OAuth Callback Debug', () => {
  test('認証コールバックの詳細検証', async ({ page }) => {
    const networkRequests = []
    const networkResponses = []
    
    // ネットワーク監視
    page.on('request', request => {
      const url = request.url()
      if (url.includes('/auth/') || url.includes('supabase') || url.includes('google') || url.includes('callback')) {
        networkRequests.push({
          url,
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        })
      }
    })
    
    page.on('response', response => {
      const url = response.url()
      if (url.includes('/auth/') || url.includes('supabase') || url.includes('google') || url.includes('callback')) {
        networkResponses.push({
          url,
          status: response.status(),
          headers: response.headers()
        })
      }
    })

    // コンソールメッセージ監視
    const consoleMessages = []
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      })
    })

    console.log('=== 1. ログインページアクセス ===')
    await page.goto('http://localhost:3001/login')
    await page.waitForLoadState('networkidle')

    // 初期状態のネットワークリクエスト確認
    console.log('初期リクエスト数:', networkRequests.length)

    console.log('=== 2. Googleログインボタンクリック ===')
    await page.click('text=Googleでログイン')
    
    // リダイレクト待機
    await page.waitForTimeout(3000)
    
    console.log('リダイレクト後URL:', page.url())

    // Google認証画面が表示された場合の処理
    if (page.url().includes('accounts.google.com')) {
      console.log('=== 3. Google認証画面でのコールバック分析 ===')
      
      const currentUrl = new URL(page.url())
      const state = currentUrl.searchParams.get('state')
      const redirectUri = currentUrl.searchParams.get('redirect_uri')
      const clientId = currentUrl.searchParams.get('client_id')
      
      console.log('OAuth State:', state)
      console.log('Redirect URI:', redirectUri)
      console.log('Client ID:', clientId)
      
      // stateパラメータのデコード試行
      if (state) {
        try {
          const decodedState = JSON.parse(Buffer.from(state.split('.')[1], 'base64').toString())
          console.log('Decoded State:', decodedState)
        } catch (e) {
          console.log('State decode failed:', e.message)
        }
      }
      
      // コールバック先の確認
      console.log('=== 4. 模擬認証コードでコールバックテスト ===')
      
      // 模擬認証コードでコールバック先に直接アクセス
      const mockCode = 'mock_auth_code_12345'
      const mockState = state || 'mock_state'
      
      const callbackUrl = `http://localhost:3001/auth/callback?code=${mockCode}&state=${mockState}`
      console.log('コールバックURL:', callbackUrl)
      
      await page.goto(callbackUrl)
      await page.waitForLoadState('networkidle')
      
      console.log('コールバック後URL:', page.url())
      console.log('コールバック後ページタイトル:', await page.title())
    }

    // ネットワークリクエストの詳細ログ
    console.log('=== ネットワークリクエスト詳細 ===')
    networkRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.method} ${req.url}`)
      if (req.postData) {
        console.log(`   POST Data: ${req.postData.substring(0, 200)}...`)
      }
    })

    console.log('=== ネットワークレスポンス詳細 ===')
    networkResponses.forEach((res, index) => {
      console.log(`${index + 1}. ${res.status} ${res.url}`)
    })

    // 認証関連のコンソールメッセージ
    console.log('=== 認証関連コンソールメッセージ ===')
    consoleMessages.forEach(msg => {
      if (msg.text.includes('auth') || msg.text.includes('Auth') || msg.text.includes('🔐') || 
          msg.text.includes('supabase') || msg.text.includes('oauth') || msg.text.includes('callback')) {
        console.log(`${msg.type}: ${msg.text}`)
        if (msg.location) {
          console.log(`  Location: ${msg.location.url}:${msg.location.lineNumber}`)
        }
      }
    })
  })

  test('auth/callbackルートの直接テスト', async ({ page }) => {
    console.log('=== auth/callback ルート直接テスト ===')
    
    const consoleMessages = []
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      })
    })

    // 1. コードなしでアクセス
    console.log('1. コードなしでアクセス')
    await page.goto('http://localhost:3001/auth/callback')
    await page.waitForLoadState('networkidle')
    console.log('結果URL:', page.url())

    // 2. 無効なコードでアクセス
    console.log('2. 無効なコードでアクセス')
    await page.goto('http://localhost:3001/auth/callback?code=invalid_code_123')
    await page.waitForLoadState('networkidle')
    console.log('結果URL:', page.url())

    // 3. エラー付きでアクセス
    console.log('3. エラー付きでアクセス')
    await page.goto('http://localhost:3001/auth/callback?error=access_denied')
    await page.waitForLoadState('networkidle')
    console.log('結果URL:', page.url())

    // コンソールメッセージ確認
    console.log('=== コンソールメッセージ ===')
    consoleMessages.forEach(msg => {
      if (msg.text.includes('Auth') || msg.text.includes('callback') || msg.text.includes('🔐')) {
        console.log(`${msg.type}: ${msg.text}`)
      }
    })
  })
})