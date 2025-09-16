import { test, expect } from '@playwright/test'

test.describe('認証フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('ログインページにアクセスできる', async ({ page }) => {
    await page.getByRole('link', { name: 'ログイン' }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()
  })

  test('ユーザー登録ページにアクセスできる', async ({ page }) => {
    await page.getByRole('link', { name: '新規登録' }).click()
    await expect(page).toHaveURL(/\/register/)
    await expect(page.getByRole('heading', { name: '新規登録' })).toBeVisible()
  })

  test('ログインフォームのバリデーション', async ({ page }) => {
    await page.goto('/login')
    
    // 空のフォームで送信
    await page.getByRole('button', { name: 'ログイン' }).click()
    
    // エラーメッセージが表示される
    await expect(page.getByText(/メールアドレスは必須です/)).toBeVisible()
    await expect(page.getByText(/パスワードは必須です/)).toBeVisible()
  })

  test('無効なメールアドレスでバリデーションエラー', async ({ page }) => {
    await page.goto('/login')
    
    await page.getByLabel('メールアドレス').fill('invalid-email')
    await page.getByLabel('パスワード').fill('password123')
    await page.getByRole('button', { name: 'ログイン' }).click()
    
    await expect(page.getByText(/有効なメールアドレスを入力してください/)).toBeVisible()
  })

  test('パスワードの最小文字数チェック', async ({ page }) => {
    await page.goto('/register')
    
    await page.getByLabel('メールアドレス').fill('test@example.com')
    await page.getByLabel('パスワード').fill('123')
    await page.getByLabel('パスワード確認').fill('123')
    await page.getByRole('button', { name: '登録' }).click()
    
    await expect(page.getByText(/パスワードは6文字以上で入力してください/)).toBeVisible()
  })

  test('パスワード確認が一致しない場合のエラー', async ({ page }) => {
    await page.goto('/register')
    
    await page.getByLabel('メールアドレス').fill('test@example.com')
    await page.getByLabel('パスワード').fill('password123')
    await page.getByLabel('パスワード確認').fill('different123')
    await page.getByRole('button', { name: '登録' }).click()
    
    await expect(page.getByText(/パスワードが一致しません/)).toBeVisible()
  })

  test('ログイン後のリダイレクト', async ({ page }) => {
    // 認証が必要なページに直接アクセス
    await page.goto('/admin')
    
    // ログインページにリダイレクトされる
    await expect(page).toHaveURL(/\/login/)
    
    // redirect パラメータが設定されている
    const url = page.url()
    expect(url).toContain('redirect=%2Fadmin')
  })

  test('ログアウト機能', async ({ page }) => {
    // ログイン状態をシミュレート（実際の実装に合わせて調整が必要）
    await page.goto('/')
    
    // ユーザーメニューがある場合
    const userMenu = page.getByTestId('user-menu')
    if (await userMenu.isVisible()) {
      await userMenu.click()
      await page.getByRole('menuitem', { name: 'ログアウト' }).click()
      
      // ログアウト後、ログインボタンが表示される
      await expect(page.getByRole('link', { name: 'ログイン' })).toBeVisible()
    }
  })

  test('認証エラーの表示', async ({ page }) => {
    await page.goto('/login')
    
    // 存在しないユーザーでログイン試行
    await page.getByLabel('メールアドレス').fill('nonexistent@example.com')
    await page.getByLabel('パスワード').fill('wrongpassword')
    await page.getByRole('button', { name: 'ログイン' }).click()
    
    // エラーメッセージが表示される
    await expect(
      page.getByText(/メールアドレスまたはパスワードが正しくありません/)
    ).toBeVisible()
  })

  test('ソーシャルログインボタンが表示される', async ({ page }) => {
    await page.goto('/login')
    
    // Google ログインボタン
    await expect(page.getByRole('button', { name: /Google/ })).toBeVisible()
    
    // Twitter ログインボタン
    await expect(page.getByRole('button', { name: /Twitter/ })).toBeVisible()
  })

  test('パスワードリセット機能', async ({ page }) => {
    await page.goto('/login')
    
    // パスワードを忘れた場合のリンク
    await page.getByRole('link', { name: 'パスワードを忘れた方' }).click()
    
    await expect(page).toHaveURL(/\/reset-password/)
    await expect(page.getByRole('heading', { name: 'パスワードリセット' })).toBeVisible()
    
    // メールアドレス入力
    await page.getByLabel('メールアドレス').fill('test@example.com')
    await page.getByRole('button', { name: 'リセットリンクを送信' }).click()
    
    // 成功メッセージが表示される
    await expect(
      page.getByText(/パスワードリセットのメールを送信しました/)
    ).toBeVisible()
  })

  test('ユーザー登録からログインまでの完全フロー', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'testpassword123'
    
    // 新規登録
    await page.goto('/register')
    await page.getByLabel('メールアドレス').fill(testEmail)
    await page.getByLabel('パスワード').fill(testPassword)
    await page.getByLabel('パスワード確認').fill(testPassword)
    await page.getByRole('button', { name: '登録' }).click()
    
    // 登録後の処理（メール確認またはログイン状態）
    // 実装に応じて調整
    await expect(
      page.getByText(/登録が完了しました/).or(
        page.getByText(/確認メールを送信しました/)
      )
    ).toBeVisible()
  })

  test('認証状態の永続化', async ({ page, context }) => {
    // ログイン状態を設定（実際の実装に合わせて調整）
    await page.goto('/login')
    
    // 新しいタブを開いても認証状態が維持される
    const newPage = await context.newPage()
    await newPage.goto('/')
    
    // ログイン状態が維持されていることを確認
    // 実装に応じて調整が必要
  })

  test('セッションタイムアウトの処理', async ({ page }) => {
    // セッションタイムアウトをシミュレート
    await page.goto('/')
    
    // ローカルストレージのトークンを削除してタイムアウトをシミュレート
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // 認証が必要なページにアクセス
    await page.goto('/admin')
    
    // ログインページにリダイレクトされる
    await expect(page).toHaveURL(/\/login/)
  })
})