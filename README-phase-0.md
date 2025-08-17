# Phase 0: テスト基盤・開発環境整備 実装手順

> 堅牢な品質保証基盤の構築により、以降の全Phaseでの安全な開発を実現

## 🎯 Phase概要

**期間**: 2-3日間  
**ブランチ**: `feature/test-infrastructure`  
**前提条件**: `feature/email-service`完了  
**目標**: 80%以上のテストカバレッジと完全自動化CI/CD

## 📋 実装チェックリスト

### Day 1: テストフレームワーク設定
- [ ] パッケージインストール
- [ ] Jest設定とサンプルテスト作成
- [ ] Testing Library設定
- [ ] Playwright E2Eテスト設定
- [ ] テストスクリプトの動作確認

### Day 2: 開発環境統一化
- [ ] ESLint/Prettier設定
- [ ] Husky/lint-staged設定
- [ ] TypeScript strict設定
- [ ] Docker開発環境構築
- [ ] 開発者ガイドライン作成

### Day 3: CI/CD構築
- [ ] GitHub Actions設定
- [ ] 自動テスト実行確認
- [ ] カバレッジレポート設定
- [ ] 品質ゲート設定
- [ ] Phase完了確認

## 🚀 実装手順

### Step 1: ブランチ準備

```bash
# 最新のemail-serviceから開始
git checkout feature/email-service
git pull origin feature/email-service

# Phase 0ブランチ作成
git checkout -b feature/test-infrastructure

# 開始タグ
git tag phase-0-start
```

### Step 2: 必要パッケージインストール

```bash
# テストフレームワーク
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D ts-jest @types/jest
npm install -D supertest @types/supertest
npm install -D mongodb-memory-server

# E2Eテスト
npm install -D playwright @playwright/test
npx playwright install

# コード品質
npm install -D eslint prettier eslint-config-prettier
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D husky lint-staged

# 追加ユーティリティ
npm install -D cross-env rimraf
```

### Step 3: Jest設定

**jest.config.js**
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/*.config.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.{ts,tsx}',
    '<rootDir>/tests/integration/**/*.test.{ts,tsx}',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

**tests/setup.ts**
```typescript
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Node.js環境でのポリフィル
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock implementations
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Suppress console.error for tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
```

### Step 4: サンプルテスト作成

**tests/unit/utils/sample.test.ts**
```typescript
describe('Sample Test', () => {
  it('should pass basic test', () => {
    const result = 2 + 2
    expect(result).toBe(4)
  })

  it('should test string operations', () => {
    const text = 'Hello World'
    expect(text).toContain('World')
  })
})
```

**tests/integration/api/posts.test.ts**
```typescript
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/posts/route'

describe('/api/posts', () => {
  it('should return posts list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    // テスト実装（実際のAPIが完成後に詳細化）
    expect(true).toBe(true) // 暫定テスト
  })
})
```

### Step 5: Playwright E2Eテスト設定

**playwright.config.ts**
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3010',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3010',
    reuseExistingServer: !process.env.CI,
  },
})
```

**tests/e2e/basic-navigation.spec.ts**
```typescript
import { test, expect } from '@playwright/test'

test('basic navigation test', async ({ page }) => {
  await page.goto('/')
  
  // ページタイトル確認
  await expect(page).toHaveTitle(/掲示板アプリ/)
  
  // メイン要素の存在確認
  await expect(page.locator('h1')).toBeVisible()
  
  // 投稿フォームの存在確認
  await expect(page.locator('[data-testid="post-form"]')).toBeVisible()
})
```

### Step 6: ESLint/Prettier設定

**.eslintrc.json**
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off"
  },
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  }
}
```

**.prettierrc**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### Step 7: Husky/lint-staged設定

```bash
# Huskyセットアップ
npx husky install
npm set-script prepare "husky install"

# Pre-commitフック作成
npx husky add .husky/pre-commit "npx lint-staged"
```

**package.json**（lint-staged設定追加）
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{js,jsx,json,md}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

### Step 8: TypeScript strict設定

**tsconfig.json**（strict設定強化）
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true
  }
}
```

### Step 9: Docker開発環境

**docker-compose.dev.yml**
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3010:3000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo:27017/board-app-test
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - mongo

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=admin123

  mongo-express:
    image: mongo-express
    ports:
      - "8081:8081"
    environment:
      - ME_CONFIG_MONGODB_ADMINUSERNAME=admin
      - ME_CONFIG_MONGODB_ADMINPASSWORD=admin123
      - ME_CONFIG_MONGODB_SERVER=mongo
    depends_on:
      - mongo

volumes:
  mongo-data:
```

**Dockerfile.dev**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# 依存関係のキャッシュを活用
COPY package*.json ./
RUN npm ci

# アプリケーションコード
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### Step 10: GitHub Actions CI/CD

**.github/workflows/ci.yml**
```yaml
name: CI Pipeline

on:
  push:
    branches: [develop, main, 'feature/*']
  pull_request:
    branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:6.0
        ports:
          - 27017:27017
        options: >-
          --health-cmd "mongosh --eval 'db.runCommand({ping: 1})'"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Lint check
        run: npm run lint

      - name: Unit tests
        run: npm run test:unit -- --coverage --watchAll=false

      - name: Integration tests
        run: npm run test:integration -- --watchAll=false
        env:
          MONGODB_URI: mongodb://localhost:27017/board-app-test

      - name: Build application
        run: npm run build

      - name: E2E tests
        run: npx playwright test
        env:
          CI: true

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          fail_ci_if_error: true

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-results
          path: |
            playwright-report/
            test-results/
```

### Step 11: package.json script更新

```json
{
  "scripts": {
    "dev": "next dev -p 3010",
    "build": "next build",
    "start": "next start -p 3010",
    "lint": "eslint . --ext .ts,.tsx --max-warnings 0",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:e2e": "playwright test",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "docker:dev": "docker-compose -f docker-compose.dev.yml up",
    "docker:down": "docker-compose -f docker-compose.dev.yml down"
  }
}
```

## ✅ 完了確認

### テスト実行
```bash
# 全テスト実行
npm run test:all

# カバレッジ確認（80%以上必須）
npm run test:coverage

# E2Eテスト確認
npm run test:e2e

# Lint確認
npm run lint

# 型チェック
npm run type-check

# ビルド確認
npm run build
```

### Docker環境確認
```bash
# Docker環境起動
npm run docker:dev

# localhost:3010でアプリ動作確認
# localhost:8081でMongo Express動作確認
```

## 🎯 Phase 0完了条件

- [ ] **テストフレームワーク**: Jest/Testing Library/Playwright全て動作
- [ ] **コード品質**: ESLint/Prettier適用、警告0件
- [ ] **CI/CD**: GitHub Actions正常動作、全テスト合格
- [ ] **カバレッジ**: 80%以上達成
- [ ] **Docker環境**: 開発環境正常起動
- [ ] **ビルド**: プロダクションビルド成功

## 🔄 次のPhaseへ

```bash
# 変更をコミット
git add .
git commit -m "feat: Phase 0 - テスト基盤・開発環境整備完了

- Jest/Testing Library/Playwright設定完了
- ESLint/Prettier/Husky設定完了
- GitHub Actions CI/CD構築完了
- Docker開発環境構築完了
- テストカバレッジ80%以上達成

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# developにマージ
git checkout develop
git merge feature/test-infrastructure

# 完了タグ
git tag phase-0-complete

# Phase 0.5準備
git checkout feature/test-infrastructure
git checkout -b feature/monitoring
```

## 🆘 トラブルシューティング

### よくある問題

#### テスト実行エラー
```bash
# Node.jsバージョン確認
node --version  # 20.x.x推奨

# キャッシュクリア
npm run test -- --clearCache

# 依存関係再インストール
rm -rf node_modules package-lock.json
npm install
```

#### Docker起動エラー
```bash
# Dockerサービス確認
docker --version
docker-compose --version

# ポート競合確認
lsof -i :3010
lsof -i :27017
```

#### ESLintエラー多発
```bash
# 自動修正実行
npm run lint:fix

# 設定確認
npx eslint --print-config src/app/page.tsx
```

**Phase 0完了により、以降の全Phaseで安全・高品質な開発が可能になります！**