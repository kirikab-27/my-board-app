import { test, expect } from '@playwright/test';

/**
 * Issue #42: パスワード表示・非表示切り替え機能のE2Eテスト
 * テスト重視方針：ユーザーフローの完全検証
 */

test.describe('パスワード表示切り替え機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('初期状態：パスワードは非表示', async ({ page }) => {
    const passwordField = page.locator('input[name="password"]');
    
    // 初期状態はtype="password"
    await expect(passwordField).toHaveAttribute('type', 'password');
    
    // 非表示アイコンが表示されている
    const visibilityIcon = page.locator('[aria-label="パスワードを表示する"]');
    await expect(visibilityIcon).toBeVisible();
  });

  test('アイコンクリック：非表示→表示切り替え', async ({ page }) => {
    const passwordField = page.locator('input[name="password"]');
    const visibilityButton = page.locator('[aria-label="パスワードを表示する"]');
    
    // パスワード入力
    await passwordField.fill('testPassword123');
    
    // 初期状態：非表示（●●●●）
    await expect(passwordField).toHaveAttribute('type', 'password');
    
    // 表示切り替えクリック
    await visibilityButton.click();
    
    // 表示状態：text type（文字が見える）
    await expect(passwordField).toHaveAttribute('type', 'text');
    
    // アイコンが「非表示」に変更
    const hideButton = page.locator('[aria-label="パスワードを非表示にする"]');
    await expect(hideButton).toBeVisible();
    
    // 入力値が見える状態で表示
    await expect(passwordField).toHaveValue('testPassword123');
  });

  test('アイコンクリック：表示→非表示切り替え', async ({ page }) => {
    const passwordField = page.locator('input[name="password"]');
    const visibilityButton = page.locator('[aria-label="パスワードを表示する"]');
    
    await passwordField.fill('testPassword123');
    
    // 表示状態にする
    await visibilityButton.click();
    await expect(passwordField).toHaveAttribute('type', 'text');
    
    // 非表示に戻す
    const hideButton = page.locator('[aria-label="パスワードを非表示にする"]');
    await hideButton.click();
    
    // 非表示状態に戻る
    await expect(passwordField).toHaveAttribute('type', 'password');
    
    // アイコンが「表示」に戻る
    await expect(visibilityButton).toBeVisible();
  });

  test('キーボード操作：Tabナビゲーション', async ({ page }) => {
    // フォーカス順序の確認
    await page.keyboard.press('Tab'); // メールフィールド
    await page.keyboard.press('Tab'); // パスワードフィールド
    await page.keyboard.press('Tab'); // 表示切り替えボタン
    
    const visibilityButton = page.locator('[aria-label="パスワードを表示する"]');
    await expect(visibilityButton).toBeFocused();
    
    // Enterキーで切り替え
    await page.keyboard.press('Enter');
    
    const passwordField = page.locator('input[name="password"]');
    await expect(passwordField).toHaveAttribute('type', 'text');
  });

  test('ローディング時：ボタン無効化', async ({ page }) => {
    // フォーム送信でローディング状態にする
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // ログインボタンクリック
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();
    
    // ローディング中は表示切り替えボタンが無効
    const visibilityButton = page.locator('[aria-label="パスワードを表示する"]');
    await expect(visibilityButton).toBeDisabled();
  });

  test('レスポンシブ対応：モバイル表示', async ({ page }) => {
    // モバイルビューポート設定
    await page.setViewportSize({ width: 375, height: 667 });
    
    const visibilityButton = page.locator('[aria-label="パスワードを表示する"]');
    
    // モバイルでもボタンがクリック可能
    await expect(visibilityButton).toBeVisible();
    
    // タッチ操作シミュレーション
    await visibilityButton.tap();
    
    const passwordField = page.locator('input[name="password"]');
    await expect(passwordField).toHaveAttribute('type', 'text');
  });

  test('アクセシビリティ：スクリーンリーダー対応', async ({ page }) => {
    const visibilityButton = page.locator('[aria-label="パスワードを表示する"]');
    
    // aria-label属性の確認
    await expect(visibilityButton).toHaveAttribute('aria-label', 'パスワードを表示する');
    
    // 切り替え後のaria-label変更確認
    await visibilityButton.click();
    
    const hideButton = page.locator('[aria-label="パスワードを非表示にする"]');
    await expect(hideButton).toHaveAttribute('aria-label', 'パスワードを非表示にする');
  });
});