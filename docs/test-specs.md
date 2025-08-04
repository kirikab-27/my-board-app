# テスト仕様書

## 1. テスト戦略

### 1.1 テストピラミッド

```
    /\
   /  \    E2E Tests (少数)
  /____\   
 /      \   Integration Tests (中程度)
/__________\ Unit Tests (多数)
```

| テスト種別 | 割合 | 目的 | ツール |
|-----------|------|------|-------|
| Unit Tests | 70% | 個別コンポーネント・関数の動作確認 | Jest + React Testing Library |
| Integration Tests | 20% | API・DB連携の動作確認 | Jest + Supertest |
| E2E Tests | 10% | ユーザー視点での全体動作確認 | Playwright |

### 1.2 テスト環境

| 環境 | 用途 | データベース | 設定 |
|------|------|-------------|------|
| Unit Test | 単体テスト | Mock | NODE_ENV=test |
| Integration Test | 統合テスト | Test DB | MONGODB_URI=test_db |
| E2E Test | E2Eテスト | Test DB | 本番環境模擬 |

## 2. 単体テスト（Unit Tests）

### 2.1 テスト対象と方針

#### コンポーネントテスト
- **対象**: Reactコンポーネント
- **方針**: ユーザーの操作と画面表示に着目
- **ツール**: React Testing Library

#### 関数テスト
- **対象**: ユーティリティ関数、バリデーション関数
- **方針**: 入力と出力の関係を検証
- **ツール**: Jest

### 2.2 テストファイル構造

```
src/
├── components/
│   ├── PostForm.tsx
│   ├── PostForm.test.tsx         # コンポーネントテスト
│   ├── PostList.tsx
│   └── PostList.test.tsx
├── lib/
│   ├── validation.ts
│   └── validation.test.ts        # 関数テスト
├── utils/
│   ├── dateFormat.ts
│   └── dateFormat.test.ts
└── __tests__/                    # 全体テスト
    ├── setup.ts
    └── mocks/
        └── mongodb.ts
```

### 2.3 PostFormコンポーネントテスト

```typescript
// src/components/PostForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import PostForm from './PostForm';

// テスト用のWrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('PostForm', () => {
  const mockOnPostCreated = jest.fn();
  const mockOnEditCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // fetchのモック
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('新規投稿モード', () => {
    test('初期状態で正しく表示される', () => {
      render(
        <TestWrapper>
          <PostForm onPostCreated={mockOnPostCreated} />
        </TestWrapper>
      );

      expect(screen.getByText('新しい投稿')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue('');
      expect(screen.getByText('0/200文字')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '投稿' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'キャンセル' })).not.toBeInTheDocument();
    });

    test('文字入力で文字数カウンターが更新される', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <PostForm onPostCreated={mockOnPostCreated} />
        </TestWrapper>
      );

      const textbox = screen.getByRole('textbox');
      await user.type(textbox, 'テスト投稿');

      expect(screen.getByText('5/200文字')).toBeInTheDocument();
    });

    test('200文字超過時にエラー表示される', async () => {
      const user = userEvent.setup();
      const longText = 'あ'.repeat(201);

      render(
        <TestWrapper>
          <PostForm onPostCreated={mockOnPostCreated} />
        </TestWrapper>
      );

      const textbox = screen.getByRole('textbox');
      await user.type(textbox, longText);

      expect(screen.getByText('201/200文字')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '投稿' })).toBeDisabled();
    });

    test('空投稿時にバリデーションエラーが表示される', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostForm onPostCreated={mockOnPostCreated} />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);

      expect(screen.getByText('投稿内容を入力してください')).toBeInTheDocument();
    });

    test('正常な投稿ができる', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          _id: '123',
          content: 'テスト投稿',
          createdAt: '2025-01-20T10:30:00.000Z',
          updatedAt: '2025-01-20T10:30:00.000Z'
        })
      });

      render(
        <TestWrapper>
          <PostForm onPostCreated={mockOnPostCreated} />
        </TestWrapper>
      );

      const textbox = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: '投稿' });

      await user.type(textbox, 'テスト投稿');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnPostCreated).toHaveBeenCalledTimes(1);
      });

      expect(textbox).toHaveValue('');
    });
  });

  describe('編集モード', () => {
    const editingPost = {
      _id: '123',
      content: '既存の投稿内容',
      createdAt: '2025-01-20T10:30:00.000Z',
      updatedAt: '2025-01-20T10:30:00.000Z'
    };

    test('編集モードで正しく表示される', () => {
      render(
        <TestWrapper>
          <PostForm 
            onPostCreated={mockOnPostCreated}
            editingPost={editingPost}
            onEditCancel={mockOnEditCancel}
          />
        </TestWrapper>
      );

      expect(screen.getByText('投稿を編集')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveValue('既存の投稿内容');
      expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    test('キャンセルボタンで編集をキャンセルできる', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PostForm 
            onPostCreated={mockOnPostCreated}
            editingPost={editingPost}
            onEditCancel={mockOnEditCancel}
          />
        </TestWrapper>
      );

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await user.click(cancelButton);

      expect(mockOnEditCancel).toHaveBeenCalledTimes(1);
    });
  });
});
```

### 2.4 バリデーション関数テスト

```typescript
// src/lib/validation.test.ts
import { validatePostContent, ValidationResult } from './validation';

describe('validatePostContent', () => {
  test('正常な投稿内容の場合、isValidがtrueになる', () => {
    const result = validatePostContent('正常な投稿内容');
    
    expect(result.isValid).toBe(true);
    expect(result.errorMessage).toBeUndefined();
  });

  test('空文字の場合、バリデーションエラーになる', () => {
    const result = validatePostContent('');
    
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('投稿内容を入力してください');
  });

  test('空白のみの場合、バリデーションエラーになる', () => {
    const result = validatePostContent('   ');
    
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('投稿内容を入力してください');
  });

  test('200文字ちょうどの場合、バリデーション成功', () => {
    const content = 'あ'.repeat(200);
    const result = validatePostContent(content);
    
    expect(result.isValid).toBe(true);
  });

  test('201文字の場合、バリデーションエラーになる', () => {
    const content = 'あ'.repeat(201);
    const result = validatePostContent(content);
    
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('投稿は200文字以内で入力してください');
  });

  test('改行文字を含む投稿の場合、正常に処理される', () => {
    const content = 'タイトル\n\n本文です';
    const result = validatePostContent(content);
    
    expect(result.isValid).toBe(true);
  });
});
```

### 2.5 カスタムフックテスト

```typescript
// src/hooks/usePosts.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { usePosts } from './usePosts';

// fetchのモック
global.fetch = jest.fn();

describe('usePosts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => usePosts());

    expect(result.current.posts).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe('');
  });

  test('投稿一覧の取得が成功する', async () => {
    const mockPosts = [
      {
        _id: '1',
        content: 'テスト投稿1',
        createdAt: '2025-01-20T10:30:00.000Z',
        updatedAt: '2025-01-20T10:30:00.000Z'
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPosts)
    });

    const { result } = renderHook(() => usePosts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.posts).toEqual(mockPosts);
    expect(result.current.error).toBe('');
  });
});
```

## 3. 統合テスト（Integration Tests）

### 3.1 API統合テスト

```typescript
// src/__tests__/api/posts.test.ts
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/posts/route';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';

// テスト用データベース接続
jest.mock('@/lib/mongodb');
jest.mock('@/models/Post');

describe('/api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/posts', () => {
    test('投稿一覧を正しく取得できる', async () => {
      const mockPosts = [
        {
          _id: '1',
          content: 'テスト投稿1',
          createdAt: new Date('2025-01-20T10:30:00.000Z'),
          updatedAt: new Date('2025-01-20T10:30:00.000Z')
        }
      ];

      (dbConnect as jest.Mock).mockResolvedValue(true);
      (Post.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockPosts)
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPosts);
      expect(Post.find).toHaveBeenCalledWith({});
    });

    test('データベースエラー時に500エラーを返す', async () => {
      (dbConnect as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('投稿の取得に失敗しました');
    });
  });

  describe('POST /api/posts', () => {
    test('正常な投稿を作成できる', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          content: 'テスト投稿'
        }
      });

      const mockPost = {
        _id: '1',
        content: 'テスト投稿',
        save: jest.fn().mockResolvedValue(true)
      };

      (dbConnect as jest.Mock).mockResolvedValue(true);
      (Post as unknown as jest.Mock).mockImplementation(() => mockPost);

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockPost.save).toHaveBeenCalled();
    });

    test('空の投稿で400エラーを返す', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          content: ''
        }
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('投稿内容を入力してください');
    });
  });
});
```

### 3.2 データベース統合テスト

```typescript
// src/__tests__/integration/database.test.ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Post from '@/models/Post';

describe('Database Integration', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Post.deleteMany({});
  });

  test('投稿の作成・取得・更新・削除ができる', async () => {
    // 作成
    const postData = { content: 'テスト投稿' };
    const createdPost = new Post(postData);
    await createdPost.save();

    expect(createdPost._id).toBeDefined();
    expect(createdPost.content).toBe('テスト投稿');

    // 取得
    const foundPost = await Post.findById(createdPost._id);
    expect(foundPost?.content).toBe('テスト投稿');

    // 更新
    const updatedPost = await Post.findByIdAndUpdate(
      createdPost._id,
      { content: '更新された投稿' },
      { new: true }
    );
    expect(updatedPost?.content).toBe('更新された投稿');

    // 削除
    await Post.findByIdAndDelete(createdPost._id);
    const deletedPost = await Post.findById(createdPost._id);
    expect(deletedPost).toBeNull();
  });

  test('バリデーションエラーのテスト', async () => {
    const invalidPost = new Post({ content: '' });

    await expect(invalidPost.save()).rejects.toThrow();
  });
});
```

## 4. E2Eテスト（End-to-End Tests）

### 4.1 Playwright設定

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4.2 E2Eテストケース

```typescript
// e2e/post-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('投稿管理機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('投稿の作成ができる', async ({ page }) => {
    // 投稿フォームに入力
    await page.fill('[role="textbox"]', 'E2Eテスト投稿');
    
    // 投稿ボタンをクリック
    await page.click('button:has-text("投稿")');
    
    // 投稿が一覧に表示されることを確認
    await expect(page.locator('text=E2Eテスト投稿')).toBeVisible();
    
    // フォームがクリアされることを確認
    await expect(page.locator('[role="textbox"]')).toHaveValue('');
  });

  test('空の投稿でエラーが表示される', async ({ page }) => {
    // 空のまま投稿ボタンをクリック
    await page.click('button:has-text("投稿")');
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=投稿内容を入力してください')).toBeVisible();
  });

  test('文字数制限のテスト', async ({ page }) => {
    // 201文字の投稿を入力
    const longText = 'あ'.repeat(201);
    await page.fill('[role="textbox"]', longText);
    
    // 文字数カウンターを確認
    await expect(page.locator('text=201/200文字')).toBeVisible();
    
    // 投稿ボタンが無効になることを確認
    await expect(page.locator('button:has-text("投稿")')).toBeDisabled();
  });

  test('投稿の編集ができる', async ({ page }) => {
    // まず投稿を作成
    await page.fill('[role="textbox"]', '編集前の投稿');
    await page.click('button:has-text("投稿")');
    
    // 投稿が表示されるまで待機
    await expect(page.locator('text=編集前の投稿')).toBeVisible();
    
    // メニューボタンをクリック
    await page.click('[aria-label="more"]');
    
    // 編集メニューをクリック
    await page.click('text=編集');
    
    // フォームに既存の内容が表示されることを確認
    await expect(page.locator('[role="textbox"]')).toHaveValue('編集前の投稿');
    
    // 内容を変更
    await page.fill('[role="textbox"]', '編集後の投稿');
    
    // 更新ボタンをクリック
    await page.click('button:has-text("更新")');
    
    // 更新された内容が表示されることを確認
    await expect(page.locator('text=編集後の投稿')).toBeVisible();
    await expect(page.locator('text=編集前の投稿')).not.toBeVisible();
  });

  test('投稿の削除ができる', async ({ page }) => {
    // まず投稿を作成
    await page.fill('[role="textbox"]', '削除対象の投稿');
    await page.click('button:has-text("投稿")');
    
    // 投稿が表示されるまで待機
    await expect(page.locator('text=削除対象の投稿')).toBeVisible();
    
    // メニューボタンをクリック
    await page.click('[aria-label="more"]');
    
    // 削除メニューをクリック
    await page.click('text=削除');
    
    // 確認ダイアログが表示されることを確認
    await expect(page.locator('text=この投稿を削除してもよろしいですか？')).toBeVisible();
    
    // 削除を確認
    await page.click('button:has-text("削除")');
    
    // 投稿が一覧から消えることを確認
    await expect(page.locator('text=削除対象の投稿')).not.toBeVisible();
  });

  test('改行を含む投稿の表示テスト', async ({ page }) => {
    const multilineText = 'タイトル\n\n本文です\n改行テスト';
    
    // 改行を含む投稿を作成
    await page.fill('[role="textbox"]', multilineText);
    await page.click('button:has-text("投稿")');
    
    // 改行が正しく表示されることを確認
    await expect(page.locator('text=タイトル')).toBeVisible();
    await expect(page.locator('text=本文です')).toBeVisible();
    await expect(page.locator('text=改行テスト')).toBeVisible();
  });
});
```

### 4.3 レスポンシブテスト

```typescript
// e2e/responsive.spec.ts
import { test, expect } from '@playwright/test';

test.describe('レスポンシブデザイン', () => {
  test('モバイル表示でも正常に動作する', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // フォームが表示されることを確認
    await expect(page.locator('[role="textbox"]')).toBeVisible();
    
    // 投稿機能が動作することを確認
    await page.fill('[role="textbox"]', 'モバイルテスト投稿');
    await page.click('button:has-text("投稿")');
    
    await expect(page.locator('text=モバイルテスト投稿')).toBeVisible();
  });

  test('タブレット表示でも正常に動作する', async ({ page }) => {
    // タブレットサイズに設定
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // レイアウトが適切に表示されることを確認
    await expect(page.locator('[role="textbox"]')).toBeVisible();
    await expect(page.locator('text=掲示板アプリ')).toBeVisible();
  });
});
```

## 5. テストデータの準備方法

### 5.1 テストフィクスチャ

```typescript
// src/__tests__/fixtures/posts.ts
export const mockPosts = [
  {
    _id: '507f1f77bcf86cd799439011',
    content: 'テスト投稿1\n改行を含む内容です',
    createdAt: '2025-01-20T10:30:00.000Z',
    updatedAt: '2025-01-20T10:30:00.000Z',
    __v: 0
  },
  {
    _id: '507f1f77bcf86cd799439012',
    content: 'テスト投稿2',
    createdAt: '2025-01-20T09:15:00.000Z',
    updatedAt: '2025-01-20T09:15:00.000Z',
    __v: 0
  }
];

export const mockPostFormData = {
  valid: {
    content: '正常な投稿内容'
  },
  empty: {
    content: ''
  },
  tooLong: {
    content: 'あ'.repeat(201)
  },
  maxLength: {
    content: 'あ'.repeat(200)
  }
};
```

### 5.2 テスト用データベースシーダー

```typescript
// src/__tests__/utils/seed.ts
import Post from '@/models/Post';
import { mockPosts } from '../fixtures/posts';

export async function seedDatabase() {
  await Post.deleteMany({});
  await Post.insertMany(mockPosts);
}

export async function clearDatabase() {
  await Post.deleteMany({});
}
```

### 5.3 Mock Service Worker (MSW)

```typescript
// src/__tests__/mocks/handlers.ts
import { rest } from 'msw';
import { mockPosts } from '../fixtures/posts';

export const handlers = [
  // 投稿一覧取得
  rest.get('/api/posts', (req, res, ctx) => {
    return res(ctx.json(mockPosts));
  }),

  // 投稿作成
  rest.post('/api/posts', async (req, res, ctx) => {
    const { content } = await req.json();
    
    if (!content || content.trim().length === 0) {
      return res(
        ctx.status(400),
        ctx.json({ error: '投稿内容を入力してください' })
      );
    }

    const newPost = {
      _id: 'new-post-id',
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      __v: 0
    };

    return res(ctx.status(201), ctx.json(newPost));
  }),

  // 投稿更新
  rest.put('/api/posts/:id', async (req, res, ctx) => {
    const { id } = req.params;
    const { content } = await req.json();

    const existingPost = mockPosts.find(post => post._id === id);
    if (!existingPost) {
      return res(
        ctx.status(404),
        ctx.json({ error: '投稿が見つかりません' })
      );
    }

    const updatedPost = {
      ...existingPost,
      content,
      updatedAt: new Date().toISOString()
    };

    return res(ctx.json(updatedPost));
  }),

  // 投稿削除
  rest.delete('/api/posts/:id', (req, res, ctx) => {
    const { id } = req.params;

    const existingPost = mockPosts.find(post => post._id === id);
    if (!existingPost) {
      return res(
        ctx.status(404),
        ctx.json({ error: '投稿が見つかりません' })
      );
    }

    return res(ctx.json({ message: '投稿を削除しました' }));
  }),
];
```

## 6. テスト実行・CI/CD設定

### 6.1 package.json scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:integration": "jest --testPathPattern=integration",
    "test:unit": "jest --testPathPattern=components|lib|utils",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

### 6.2 Jest設定

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
};
```

### 6.3 GitHub Actions CI/CD

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run unit tests
      run: npm run test:unit

    - name: Run integration tests
      run: npm run test:integration
      env:
        MONGODB_URI: mongodb://localhost:27017/test-db

    - name: Install Playwright
      run: npx playwright install --with-deps

    - name: Run E2E tests
      run: npm run test:e2e
      env:
        MONGODB_URI: mongodb://localhost:27017/test-db

    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: test-results
        path: |
          coverage/
          playwright-report/
```

## 7. テストカバレッジとレポート

### 7.1 カバレッジ目標

| テスト種別 | カバレッジ目標 |
|-----------|--------------|
| Line Coverage | 85%以上 |
| Branch Coverage | 80%以上 |
| Function Coverage | 90%以上 |
| Statement Coverage | 85%以上 |

### 7.2 カバレッジレポート

```bash
# カバレッジ付きテスト実行
npm run test:coverage

# HTMLレポート生成
npx jest --coverage --coverageReporters=html

# カバレッジ結果確認
open coverage/lcov-report/index.html
```

このテスト仕様書に従って、品質の高いテストスイートを構築し、継続的に保守していくことが重要です。