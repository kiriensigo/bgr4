import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
  })

  test('ログインページが正常に表示される', async ({ page }) => {
    await page.goto('http://localhost:3001/login')
    await page.waitForLoadState('networkidle')
    
    // ページタイトル確認
    await expect(page).toHaveTitle(/BGR/)
    
    // ヘッダー要素確認
    await expect(page.locator('text=おかえりなさい')).toBeVisible()
    await expect(page.locator('text=BGR へログインして続きを楽しもう')).toBeVisible()
    
    // OAuth ボタンの存在確認
    await expect(page.locator('text=Googleでログイン')).toBeVisible()
    await expect(page.locator('text=𝕏 (Twitter) でログイン')).toBeVisible()
    
    console.log('✅ Login page loaded successfully')
  })

  test('レビュー作成からのリダイレクトフロー', async ({ page }) => {
    // ゲーム一覧ページに移動
    await page.goto('http://localhost:3001/games')
    await page.waitForLoadState('networkidle')
    
    // ゲーム詳細ページに移動（存在するゲーム）
    await page.goto('http://localhost:3001/games/30549')
    await page.waitForLoadState('networkidle')
    
    // ゲーム詳細ページの確認
    await expect(page.locator('text=レビューを書く')).toBeVisible()
    
    // レビューを書くボタンをクリック
    await page.click('text=レビューを書く')
    await page.waitForLoadState('networkidle')
    
    // ログインページにリダイレクトされることを確認
    expect(page.url()).toContain('/login')
    
    // ログインページが正常に表示されることを確認
    await expect(page.locator('text=おかえりなさい')).toBeVisible()
    await expect(page.locator('text=Googleでログイン')).toBeVisible()
    
    console.log('✅ Review creation redirect flow working')
  })

  test('完全なOAuth認証フロー検証', async ({ page }) => {
    // リクエスト/レスポンス監視
    const networkRequests = []
    const networkResponses = []
    
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      })
    })
    
    page.on('response', response => {
      networkResponses.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers()
      })
    })
    
    // コンソールメッセージ監視
    const consoleMessages = []
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      })
    })
    
    // ログインページアクセス
    await page.goto('http://localhost:3001/login')
    await page.waitForLoadState('networkidle')
    
    console.log('=== 初期ログインページ ===')
    console.log('URL:', page.url())
    console.log('Page title:', await page.title())
    
    // Googleログインボタン確認
    const googleButton = page.locator('text=Googleでログイン')
    await expect(googleButton).toBeVisible()
    
    // ボタンをクリック
    console.log('=== Googleログインボタンクリック ===')
    await googleButton.click()
    
    // リダイレクト待機
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    const currentUrl = page.url()
    console.log('リダイレクト後URL:', currentUrl)
    
    // Google認証ページかチェック
    if (currentUrl.includes('accounts.google.com')) {
      console.log('✅ Google認証ページに正常リダイレクト')
      
      // 認証ページの要素確認
      const pageContent = await page.content()
      console.log('Google認証ページの内容が存在:', pageContent.includes('Sign in'))
      
    } else if (currentUrl.includes('/auth/callback')) {
      console.log('⚠️ 直接コールバックページにリダイレクト')
      
      // URLパラメータ確認
      const url = new URL(currentUrl)
      const searchParams = Object.fromEntries(url.searchParams)
      console.log('コールバックURLパラメータ:', searchParams)
      
    } else if (currentUrl.includes('/login')) {
      console.log('❌ ログインページに戻された')
      
      // エラーメッセージ確認
      const errorElements = await page.locator('[role="alert"]').all()
      for (const errorElement of errorElements) {
        const errorText = await errorElement.textContent()
        console.log('エラーメッセージ:', errorText)
      }
    }
    
    // ネットワークリクエストのログ
    console.log('=== 関連ネットワークリクエスト ===')
    const authRelatedRequests = networkRequests.filter(req => 
      req.url.includes('/auth/') || 
      req.url.includes('supabase') || 
      req.url.includes('google')
    )
    authRelatedRequests.forEach(req => {
      console.log(`${req.method} ${req.url}`)
    })
    
    // コンソールメッセージのログ
    console.log('=== コンソールメッセージ ===')
    consoleMessages.forEach(msg => {
      if (msg.type === 'error') {
        console.log(`❌ ${msg.type}: ${msg.text}`)
      } else if (msg.text.includes('auth') || msg.text.includes('Auth')) {
        console.log(`🔐 ${msg.type}: ${msg.text}`)
      }
    })
  })
  
  test('ユーザーステータス表示の確認', async ({ page }) => {
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
    
    // ヘッダーのユーザーステータス部分を確認
    const header = page.locator('header')
    await expect(header).toBeVisible()
    
    // 未ログイン状態では「ログイン」ボタンが表示されることを確認
    const loginButton = page.locator('text=ログイン')
    await expect(loginButton).toBeVisible()
    
    console.log('✅ User status display working for unauthenticated users')
  })

  test('認証コールバックページの直接テスト', async ({ page }) => {
    // コンソールメッセージ監視
    const consoleMessages = []
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      })
    })

    console.log('=== 認証コールバックページ直接アクセス ===')
    
    // コールバックページに直接アクセス（認証コードなし）
    await page.goto('http://localhost:3001/auth/callback')
    await page.waitForLoadState('networkidle')
    
    console.log('最終URL:', page.url())
    console.log('ページタイトル:', await page.title())
    
    // ログインページにリダイレクトされるはず
    expect(page.url()).toContain('/login')
    
    // エラーメッセージの確認
    const errorElements = await page.locator('[role="alert"]').all()
    for (const errorElement of errorElements) {
      const errorText = await errorElement.textContent()
      console.log('エラーメッセージ:', errorText)
    }
    
    // 認証関連のコンソールメッセージ
    console.log('=== 認証関連コンソールメッセージ ===')
    consoleMessages.forEach(msg => {
      if (msg.text.includes('auth') || msg.text.includes('Auth') || msg.text.includes('🔐')) {
        console.log(`${msg.type}: ${msg.text}`)
      }
    })
  })

  test('Supabase OAuth設定検証', async ({ page }) => {
    console.log('=== Supabase OAuth設定検証 ===')
    
    // ログインページアクセス
    await page.goto('http://localhost:3001/login')
    await page.waitForLoadState('networkidle')
    
    // ブラウザコンソールでSupabase設定確認
    const supabaseConfig = await page.evaluate(() => {
      // @ts-ignore
      if (window.supabase) {
        return {
          // @ts-ignore
          hasSupabase: true,
          // @ts-ignore  
          url: window.supabase.supabaseUrl,
          // @ts-ignore
          key: window.supabase.supabaseKey?.substring(0, 20) + '...'
        }
      }
      return { hasSupabase: false }
    })
    
    console.log('Supabase設定:', supabaseConfig)
    
    // 環境変数の確認（可能な範囲で）
    const envCheck = await page.evaluate(() => {
      return {
        // @ts-ignore
        hasProcessEnv: typeof process !== 'undefined',
        // @ts-ignore
        nodeEnv: typeof process !== 'undefined' ? process.env?.NODE_ENV : 'undefined'
      }
    })
    
    console.log('環境変数チェック:', envCheck)
  })
})