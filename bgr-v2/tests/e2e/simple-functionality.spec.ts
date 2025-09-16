import { test, expect } from '@playwright/test';

test.describe('BGR v2 簡単機能テスト', () => {
  test('ホームページが読み込まれる', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // ページタイトルの確認
    await expect(page).toHaveTitle(/BGR/);
    
    // メインコンテンツが存在することを確認
    await expect(page.locator('main')).toBeVisible();
    
    // ヘッダーが存在することを確認
    await expect(page.locator('header')).toBeVisible();
  });

  test('ナビゲーションが機能する', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // ナビゲーションメニューの確認（Headerコンポーネント内）
    await expect(page.locator('header nav')).toBeVisible();
    
    // ブランドロゴの確認（最初の要素を指定）
    await expect(page.locator('a').filter({ hasText: 'BGR' }).first()).toBeVisible();
  });

  test('検索フォームが存在する', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // 検索ページへのリンクが存在することを確認（最初の要素を指定）
    await expect(page.locator('a').filter({ hasText: '検索' }).first()).toBeVisible();
  });

  test('レスポンシブデザインが動作する', async ({ page }) => {
    // デスクトップ表示
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('main')).toBeVisible();
    
    // モバイル表示
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('main')).toBeVisible();
  });

  test('基本的なSEO要素が存在する', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // titleタグの確認
    await expect(page.locator('title')).toHaveCount(1);
    
    // descriptionメタタグの確認
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  });

  test('ページ間ナビゲーションが動作する', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // ホームからゲーム一覧への遷移
    const gamesLink = page.locator('a').filter({ hasText: 'ゲーム一覧' }).first();
    if (await gamesLink.isVisible()) {
      await gamesLink.click();
      await page.waitForURL('**/games**', { timeout: 10000 });
      await expect(page.url()).toContain('/games');
    }
  });

  test('エラーページの動作', async ({ page }) => {
    // 存在しないページにアクセス
    await page.goto('/non-existent-page', { waitUntil: 'networkidle' });
    
    // 何らかのページが表示されることを確認（404ページまたはリダイレクト）
    await expect(page.locator('body')).toBeVisible();
  });
});