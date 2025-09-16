import { test, expect } from '@playwright/test'

test.describe('OAuth Fixed Test', () => {
  test('修正されたOAuth認証フローのテスト', async ({ page }) => {
    const consoleMessages = []
    
    // コンソールメッセージ監視
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      })
    })

    console.log('=== 1. ログインページアクセス ===')
    await page.goto('http://localhost:3001/login')
    await page.waitForLoadState('networkidle')

    // 認証コードを模擬してフラグメントURLでアクセス
    console.log('=== 2. 模擬認証コードでログインページアクセス ===')
    const mockCode = 'mock_auth_code_test_12345'
    const mockNext = encodeURIComponent('/')
    
    await page.goto(`http://localhost:3001/login#code=${mockCode}&next=${mockNext}`)
    await page.waitForLoadState('networkidle')
    
    // 少し待機してクライアントサイド処理を確認
    await page.waitForTimeout(2000)
    
    console.log('Current URL after mock code:', page.url())
    
    // 認証関連のコンソールメッセージを確認
    console.log('=== 認証処理コンソールメッセージ ===')
    consoleMessages.forEach(msg => {
      if (msg.text.includes('🔐') || msg.text.includes('auth') || msg.text.includes('Processing') || 
          msg.text.includes('Client-side') || msg.text.includes('successful') || msg.text.includes('error')) {
        console.log(`${msg.type}: ${msg.text}`)
      }
    })
    
    // エラーメッセージがあるかチェック
    const errorElements = await page.locator('[role="alert"]').all()
    for (const errorElement of errorElements) {
      const errorText = await errorElement.textContent()
      if (errorText && errorText.trim()) {
        console.log('エラーメッセージ表示:', errorText)
      }
    }
  })

  test('auth/callbackからログインページへのリダイレクトテスト', async ({ page }) => {
    console.log('=== auth/callback リダイレクトテスト ===')
    
    const mockCode = 'test_redirect_code_123'
    const mockNext = encodeURIComponent('/dashboard')
    
    // コールバックURLに直接アクセス
    await page.goto(`http://localhost:3001/auth/callback?code=${mockCode}&next=/dashboard`)
    await page.waitForLoadState('networkidle')
    
    const finalUrl = page.url()
    console.log('最終リダイレクトURL:', finalUrl)
    
    // ログインページにリダイレクトされ、フラグメントにcodeが含まれることを確認
    expect(finalUrl).toContain('/login')
    expect(finalUrl).toContain(`code=${mockCode}`)
    expect(finalUrl).toContain(`next=${encodeURIComponent('/dashboard')}`)
    
    console.log('✅ Callback redirect working correctly')
  })
})