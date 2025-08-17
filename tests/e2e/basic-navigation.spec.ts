import { test, expect } from '@playwright/test';

test('basic navigation test', async ({ page }) => {
  await page.goto('/');

  // ページタイトル確認
  await expect(page).toHaveTitle(/掲示板アプリ/);

  // メイン要素の存在確認
  await expect(page.locator('h1')).toBeVisible();

  // 投稿フォームの存在確認（data-testidがある場合）
  const postForm = page.locator('[data-testid="post-form"]');
  if ((await postForm.count()) > 0) {
    await expect(postForm).toBeVisible();
  }

  // ページの基本構造確認
  await expect(page.locator('main, [role="main"]')).toBeVisible();
});

test('responsive design test', async ({ page }) => {
  // デスクトップ表示
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();

  // モバイル表示
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator('body')).toBeVisible();

  // タブレット表示
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page.locator('body')).toBeVisible();
});

test('basic accessibility test', async ({ page }) => {
  await page.goto('/');

  // キーボードナビゲーション確認
  await page.keyboard.press('Tab');

  // フォーカス可能な要素の存在確認
  const focusableElements = await page.locator('button, input, textarea, a[href]').count();
  expect(focusableElements).toBeGreaterThan(0);
});
