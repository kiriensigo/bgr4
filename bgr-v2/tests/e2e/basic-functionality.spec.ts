import { test, expect } from '@playwright/test';

test.describe('BGR v2 基本機能テスト', () => {
  test('ホームページが正常に表示される', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // ページタイトルの確認
    await expect(page).toHaveTitle(/BGR/);
    
    // メインコンテンツの確認
    await expect(page.locator('main')).toBeVisible();
    
    // データロードの完了を待つ（読み込み中表示が消えるまで待機）
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('*');
      for (let i = 0; i < loadingElements.length; i++) {
        if (loadingElements[i].textContent && loadingElements[i].textContent.includes('読み込み中')) {
          return false;
        }
      }
      return true;
    }, { timeout: 15000 });
    
    // ヒーローセクションの確認（より具体的なテキストで検索）
    await expect(page.locator('h1').filter({ hasText: /ボードゲームの世界/ })).toBeVisible({ timeout: 5000 });
  });

  test('ゲーム検索機能が動作する', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // データロードの完了を待つ
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('*');
      for (let i = 0; i < loadingElements.length; i++) {
        if (loadingElements[i].textContent && loadingElements[i].textContent.includes('読み込み中')) {
          return false;
        }
      }
      return true;
    }, { timeout: 15000 });
    
    // 検索フォームの確認
    const searchForm = page.locator('form');
    await expect(searchForm).toBeVisible({ timeout: 10000 });
    
    // 検索入力の確認（正しいプレースホルダーテキスト）
    const searchInput = page.locator('input[placeholder*="ゲーム名、デザイナー、メカニクス"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    
    // 検索実行
    await searchInput.fill('テストゲーム');
    
    // フォームの送信ボタンをクリック
    const searchButton = page.locator('button[type="submit"]').filter({ hasText: /検索/ });
    await searchButton.click();
    
    // ページ遷移を待機
    await page.waitForURL('**/*search*', { timeout: 15000 });
    
    // 検索結果ページに遷移することを確認
    await expect(page.url()).toContain('search');
  });

  test('認証関連ページが正常に表示される', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    // ログインページのより具体的な要素の確認
    await expect(page.locator('h1, h2').filter({ hasText: /ログイン|サインイン|認証|アカウント/ })).toBeVisible({ timeout: 10000 });
    
    // OAuth ボタンの確認（少なくとも1つ存在することを確認） 
    const oauthButtons = page.locator('button, a').filter({ hasText: /Google|Twitter/ });
    const count = await oauthButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('ナビゲーションメニューが正常に動作する', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // ナビゲーションメニューの確認（表示されている nav を取得）
    const nav = page.locator('nav').filter({ hasText: /ホーム|ゲーム/ });
    await expect(nav.first()).toBeVisible();
    
    // 主要リンクの確認
    await expect(page.locator('a').filter({ hasText: 'ホーム' }).first()).toBeVisible();
    await expect(page.locator('a').filter({ hasText: 'ゲーム一覧' }).first()).toBeVisible();
    
    // レスポンシブメニューの確認（モバイル）
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileMenuButton = page.locator('button').getByRole('button', { name: 'メニュー' });
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
    }
  });

  test('ゲーム一覧ページが正常に表示される', async ({ page }) => {
    await page.goto('/games', { waitUntil: 'networkidle' });
    
    // ページが読み込まれることを確認
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
    
    // ページタイトルまたはヘッダーの確認
    await expect(page.locator('h1, h2').filter({ hasText: /ゲーム|Games|ボードゲーム/ })).toBeVisible({ timeout: 10000 });
    
    // 基本的なページコンテンツの確認
    await expect(page.locator('body')).toBeVisible();
  });

  test('管理画面へのアクセス制限が機能する', async ({ page }) => {
    // 非ログイン状態で管理画面にアクセス
    await page.goto('/admin');
    
    // ログインページまたはアクセス拒否ページに遷移することを確認
    await expect(async () => {
      const url = page.url();
      const isLoginPage = url.includes('/login') || url.includes('/auth');
      const isAccessDenied = await page.locator('text=/ログインが必要|アクセスが拒否|権限がありません/').isVisible();
      expect(isLoginPage || isAccessDenied).toBeTruthy();
    }).toPass();
  });

  test('エラーページが正常に表示される', async ({ page }) => {
    // 存在しないページにアクセス
    await page.goto('/non-existent-page', { waitUntil: 'networkidle' });
    
    // 404エラーページまたはホームページリダイレクトの確認
    const url = page.url();
    const is404Page = await page.locator('text=/404|見つかりません|Not Found/').first().isVisible();
    const isHomePage = url.endsWith('/') || url.includes('/games');
    
    // どちらかが true であることを確認
    expect(is404Page || isHomePage).toBeTruthy();
  });

  test('レスポンシブデザインが正常に動作する', async ({ page }) => {
    await page.goto('/');
    
    // デスクトップ表示
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('main')).toBeVisible();
    
    // タブレット表示
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('main')).toBeVisible();
    
    // モバイル表示
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('main')).toBeVisible();
  });

  test('パフォーマンス基準を満たしている', async ({ page }) => {
    await page.goto('/');
    
    // ページロード時間の確認（5秒以内）
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
    
    // 基本的なSEO要素の確認
    await expect(page.locator('title')).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  });
});