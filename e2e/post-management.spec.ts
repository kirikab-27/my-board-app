import { test, expect } from '@playwright/test';

test.describe('投稿管理機能', () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前にページをロード
    await page.goto('/');
    
    // ページが完全に読み込まれるまで待機
    await expect(page.getByRole('heading', { name: '掲示板' })).toBeVisible();
  });

  test.describe('投稿作成フロー', () => {
    test('正常な投稿が作成できる', async ({ page }) => {
      const testContent = 'E2Eテスト投稿';

      // 投稿フォームに入力
      await page.fill('[role="textbox"]', testContent);
      
      // 文字数カウンターが更新されることを確認
      await expect(page.locator('text=12/200文字')).toBeVisible();
      
      // 投稿ボタンをクリック
      await page.click('button:has-text("投稿")');
      
      // 投稿が一覧に表示されることを確認
      await expect(page.locator(`text=${testContent}`)).toBeVisible();
      
      // フォームがクリアされることを確認
      await expect(page.locator('[role="textbox"]')).toHaveValue('');
      
      // 文字数カウンターがリセットされることを確認
      await expect(page.locator('text=0/200文字')).toBeVisible();
    });

    test('改行を含む投稿が正しく表示される', async ({ page }) => {
      const multilineContent = 'タイトル: E2Eテスト\n\n本文: 改行テストです\n最終行';

      // 改行を含む投稿を作成
      await page.fill('[role="textbox"]', multilineContent);
      await page.click('button:has-text("投稿")');
      
      // 改行が正しく表示されることを確認
      await expect(page.locator('text=タイトル: E2Eテスト')).toBeVisible();
      await expect(page.locator('text=本文: 改行テストです')).toBeVisible();
      await expect(page.locator('text=最終行')).toBeVisible();
    });

    test('空の投稿でエラーが表示される', async ({ page }) => {
      // 空のまま投稿ボタンをクリック
      await page.click('button:has-text("投稿")');
      
      // エラーメッセージが表示されることを確認
      await expect(page.locator('text=投稿内容を入力してください')).toBeVisible();
      
      // 投稿が一覧に追加されないことを確認
      await expect(page.locator('[role="textbox"]')).toHaveValue('');
    });

    test('文字数制限のテスト', async ({ page }) => {
      // 201文字の投稿を入力
      const longText = 'あ'.repeat(201);
      await page.fill('[role="textbox"]', longText);
      
      // 文字数カウンターを確認
      await expect(page.locator('text=201/200文字')).toBeVisible();
      
      // 投稿ボタンが無効になることを確認
      await expect(page.locator('button:has-text("投稿")')).toBeDisabled();
      
      // 200文字に減らすとボタンが有効になることを確認
      await page.fill('[role="textbox"]', 'あ'.repeat(200));
      await expect(page.locator('text=200/200文字')).toBeVisible();
      await expect(page.locator('button:has-text("投稿")')).toBeEnabled();
    });

    test('投稿中のローディング状態', async ({ page }) => {
      // ネットワークをスローに設定（投稿中状態を確認するため）
      await page.route('/api/posts', async route => {
        // 500ms遅延させる
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.continue();
      });

      await page.fill('[role="textbox"]', 'ローディングテスト');
      await page.click('button:has-text("投稿")');
      
      // 投稿中状態の確認
      await expect(page.locator('button:has-text("投稿中...")')).toBeVisible();
      await expect(page.locator('button:has-text("投稿中...")')).toBeDisabled();
      
      // 投稿完了後の確認
      await expect(page.locator('text=ローディングテスト')).toBeVisible();
      await expect(page.locator('button:has-text("投稿")')).toBeEnabled();
    });
  });

  test.describe('投稿編集フロー', () => {
    test.beforeEach(async ({ page }) => {
      // テスト用の投稿を作成
      await page.fill('[role="textbox"]', '編集テスト用投稿');
      await page.click('button:has-text("投稿")');
      await expect(page.locator('text=編集テスト用投稿')).toBeVisible();
    });

    test('投稿の編集ができる', async ({ page }) => {
      // メニューボタンをクリック（最初の投稿）
      await page.locator('[data-testid="MoreVertIcon"]').first().click();
      
      // 編集メニューをクリック
      await page.click('text=編集');
      
      // 編集モードになることを確認
      await expect(page.locator('text=投稿を編集')).toBeVisible();
      await expect(page.locator('[role="textbox"]')).toHaveValue('編集テスト用投稿');
      await expect(page.locator('button:has-text("更新")')).toBeVisible();
      await expect(page.locator('button:has-text("キャンセル")')).toBeVisible();
      
      // 内容を変更
      await page.fill('[role="textbox"]', '編集後の投稿内容');
      
      // 更新ボタンをクリック
      await page.click('button:has-text("更新")');
      
      // 更新された内容が表示されることを確認
      await expect(page.locator('text=編集後の投稿内容')).toBeVisible();
      await expect(page.locator('text=編集テスト用投稿')).not.toBeVisible();
      
      // 新規投稿モードに戻ることを確認
      await expect(page.locator('text=新しい投稿')).toBeVisible();
      await expect(page.locator('[role="textbox"]')).toHaveValue('');
    });

    test('編集のキャンセルができる', async ({ page }) => {
      // 編集モードに入る
      await page.locator('[data-testid="MoreVertIcon"]').first().click();
      await page.click('text=編集');
      
      // 内容を変更
      await page.fill('[role="textbox"]', '変更された内容');
      
      // キャンセルボタンをクリック
      await page.click('button:has-text("キャンセル")');
      
      // 元の投稿が変更されていないことを確認
      await expect(page.locator('text=編集テスト用投稿')).toBeVisible();
      await expect(page.locator('text=変更された内容')).not.toBeVisible();
      
      // 新規投稿モードに戻ることを確認
      await expect(page.locator('text=新しい投稿')).toBeVisible();
      await expect(page.locator('[role="textbox"]')).toHaveValue('');
    });

    test('編集中のバリデーション', async ({ page }) => {
      // 編集モードに入る
      await page.locator('[data-testid="MoreVertIcon"]').first().click();
      await page.click('text=編集');
      
      // 空の内容に変更
      await page.fill('[role="textbox"]', '');
      await page.click('button:has-text("更新")');
      
      // エラーメッセージが表示されることを確認
      await expect(page.locator('text=投稿内容を入力してください')).toBeVisible();
      
      // 元の投稿が変更されていないことを確認
      await expect(page.locator('text=編集テスト用投稿')).toBeVisible();
    });
  });

  test.describe('投稿削除フロー', () => {
    test.beforeEach(async ({ page }) => {
      // テスト用の投稿を作成
      await page.fill('[role="textbox"]', '削除テスト用投稿');
      await page.click('button:has-text("投稿")');
      await expect(page.locator('text=削除テスト用投稿')).toBeVisible();
    });

    test('投稿の削除ができる', async ({ page }) => {
      // メニューボタンをクリック
      await page.locator('[data-testid="MoreVertIcon"]').first().click();
      
      // 削除メニューをクリック
      await page.click('text=削除');
      
      // 確認ダイアログが表示されることを確認
      await expect(page.locator('text=投稿を削除')).toBeVisible();
      await expect(page.locator('text=この投稿を削除してもよろしいですか？')).toBeVisible();
      await expect(page.locator('text=削除テスト用投稿')).toBeVisible();
      
      // 削除を確認
      await page.click('button:has-text("削除")');
      
      // 投稿が一覧から消えることを確認
      await expect(page.locator('text=削除テスト用投稿')).not.toBeVisible();
      
      // 投稿がない場合のメッセージが表示されることを確認（他に投稿がない場合）
      const postCount = await page.locator('[role="textbox"]').count();
      if (postCount === 0) {
        await expect(page.locator('text=まだ投稿がありません')).toBeVisible();
      }
    });

    test('削除のキャンセルができる', async ({ page }) => {
      // 削除確認ダイアログを開く
      await page.locator('[data-testid="MoreVertIcon"]').first().click();
      await page.click('text=削除');
      
      // キャンセルボタンをクリック
      await page.click('button:has-text("キャンセル")');
      
      // ダイアログが閉じることを確認
      await expect(page.locator('text=投稿を削除')).not.toBeVisible();
      
      // 投稿が削除されていないことを確認
      await expect(page.locator('text=削除テスト用投稿')).toBeVisible();
    });

    test('削除中のローディング状態', async ({ page }) => {
      // ネットワークをスローに設定
      await page.route('/api/posts/*', async route => {
        if (route.request().method() === 'DELETE') {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        await route.continue();
      });

      // 削除を実行
      await page.locator('[data-testid="MoreVertIcon"]').first().click();
      await page.click('text=削除');
      await page.click('button:has-text("削除")');
      
      // 削除中状態の確認
      await expect(page.locator('button:has-text("削除中...")')).toBeVisible();
      await expect(page.locator('button:has-text("削除中...")')).toBeDisabled();
      
      // 削除完了後の確認
      await expect(page.locator('text=削除テスト用投稿')).not.toBeVisible();
    });
  });

  test.describe('レスポンシブデザイン', () => {
    test('モバイル表示でも正常に動作する', async ({ page }) => {
      // モバイルサイズに設定
      await page.setViewportSize({ width: 375, height: 667 });
      
      // フォームが表示されることを確認
      await expect(page.locator('[role="textbox"]')).toBeVisible();
      await expect(page.getByRole('heading', { name: '掲示板' })).toBeVisible();
      
      // 投稿機能が動作することを確認
      await page.fill('[role="textbox"]', 'モバイルテスト投稿');
      await page.click('button:has-text("投稿")');
      
      await expect(page.locator('text=モバイルテスト投稿')).toBeVisible();
      
      // メニュー操作も確認
      await page.locator('[data-testid="MoreVertIcon"]').first().click();
      await expect(page.locator('text=編集')).toBeVisible();
      await expect(page.locator('text=削除')).toBeVisible();
    });

    test('タブレット表示でも正常に動作する', async ({ page }) => {
      // タブレットサイズに設定
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // レイアウトが適切に表示されることを確認
      await expect(page.locator('[role="textbox"]')).toBeVisible();
      await expect(page.getByRole('heading', { name: '掲示板' })).toBeVisible();
      
      // 基本機能の動作確認
      await page.fill('[role="textbox"]', 'タブレットテスト投稿');
      await page.click('button:has-text("投稿")');
      
      await expect(page.locator('text=タブレットテスト投稿')).toBeVisible();
    });
  });

  test.describe('エラーハンドリング', () => {
    test('API エラー時の表示', async ({ page }) => {
      // API エラーをシミュレート
      await page.route('/api/posts', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'サーバーエラーが発生しました' })
        });
      });

      await page.fill('[role="textbox"]', 'エラーテスト投稿');
      await page.click('button:has-text("投稿")');
      
      // エラーメッセージが表示されることを確認
      await expect(page.locator('text=サーバーエラーが発生しました')).toBeVisible();
    });

    test('ネットワークエラー時の表示', async ({ page }) => {
      // ネットワークエラーをシミュレート
      await page.route('/api/posts', route => {
        route.abort('failed');
      });

      await page.fill('[role="textbox"]', 'ネットワークエラーテスト');
      await page.click('button:has-text("投稿")');
      
      // エラーが適切に処理されることを確認
      // （具体的なエラーメッセージはアプリケーションの実装による）
      await expect(page.locator('[role="textbox"]')).toHaveValue('ネットワークエラーテスト');
    });
  });
});