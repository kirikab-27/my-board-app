# テスト・品質保証戦略

## Phase 0: テスト基盤・開発環境整備

### 概要
会員制システム実装の前に、堅牢なテスト基盤と統一された開発環境を構築します。これにより、各フェーズでの品質保証と開発効率の最大化を実現します。

## 実装内容

### 1. テストフレームワーク設定

#### 単体テスト基盤
```bash
# パッケージインストール
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D ts-jest @types/jest
```

**jest.config.js**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

#### 統合テスト基盤
```bash
npm install -D supertest @types/supertest
npm install -D mongodb-memory-server
```

#### E2Eテスト基盤
```bash
npm install -D playwright @playwright/test
npx playwright install
```

### 2. 開発環境統一化

#### Linting & Formatting
```bash
npm install -D eslint prettier eslint-config-prettier
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

**.eslintrc.json**
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

#### Pre-commit Hooks
```bash
npm install -D husky lint-staged
npx husky install
```

**.husky/pre-commit**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"
npx lint-staged
```

### 3. CI/CDパイプライン

**.github/workflows/ci.yml**
```yaml
name: CI Pipeline
on:
  push:
    branches: [develop, main]
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
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Type check
        run: npm run type-check
        
      - name: Lint
        run: npm run lint
        
      - name: Unit tests
        run: npm run test:unit -- --coverage
        
      - name: Integration tests
        run: npm run test:integration
        
      - name: Build
        run: npm run build
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### 4. Docker開発環境

**docker-compose.dev.yml**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3010:3000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo:27017/board-app
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - mongo
      
  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
      
  mongo-express:
    image: mongo-express
    ports:
      - "8081:8081"
    environment:
      - ME_CONFIG_MONGODB_SERVER=mongo
    depends_on:
      - mongo

volumes:
  mongo-data:
```

## フェーズ別テスト計画

### Phase 1: 認証基盤テスト
```typescript
// tests/unit/auth/password.test.ts
describe('Password Hashing', () => {
  it('should hash password correctly', async () => {
    const password = 'Test123!';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
  });
});

// tests/integration/auth/login.test.ts
describe('Login Flow', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'test@example.com', password: 'Test123!' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

### Phase 2: メール認証テスト
```typescript
// tests/e2e/email-verification.spec.ts
import { test, expect } from '@playwright/test';

test('complete email verification flow', async ({ page }) => {
  // 1. 登録
  await page.goto('/auth/signup');
  await page.fill('#email', 'test@example.com');
  await page.fill('#password', 'Test123!');
  await page.click('button[type="submit"]');
  
  // 2. メール確認（モック）
  const verificationUrl = await getVerificationUrl('test@example.com');
  await page.goto(verificationUrl);
  
  // 3. 認証完了確認
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('.welcome-message')).toBeVisible();
});
```

### Phase 3-5: セキュリティテスト
```typescript
// tests/security/owasp.test.ts
describe('OWASP Top 10 Security Tests', () => {
  // A01: Broken Access Control
  it('should prevent unauthorized access', async () => {
    const response = await request(app)
      .delete('/api/posts/123')
      .set('Authorization', 'Bearer invalid-token');
    expect(response.status).toBe(401);
  });
  
  // A02: Cryptographic Failures
  it('should not expose sensitive data', async () => {
    const response = await request(app).get('/api/users/123');
    expect(response.body).not.toHaveProperty('password');
  });
  
  // A03: Injection
  it('should prevent SQL injection', async () => {
    const response = await request(app)
      .get('/api/posts?search=\'; DROP TABLE posts; --');
    expect(response.status).toBe(200);
    // Verify posts table still exists
  });
});
```

## 負荷テスト

### Artillery設定
```yaml
# tests/load/auth-load.yml
config:
  target: "http://localhost:3010"
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100
      
scenarios:
  - name: "Login Load Test"
    flow:
      - post:
          url: "/api/auth/signin"
          json:
            email: "{{ $randomEmail() }}"
            password: "Test123!"
          response:
            - statusCode: [200, 201]
            - responseTime:
                max: 500
                
  - name: "Email Send Load Test"
    flow:
      - post:
          url: "/api/auth/forgot-password"
          json:
            email: "{{ $randomEmail() }}"
          response:
            - responseTime:
                max: 2000
```

## テストカバレッジ目標

| コンポーネント | カバレッジ目標 | 重要度 |
|---------------|--------------|--------|
| 認証ロジック | 95%以上 | 🔴 最重要 |
| APIエンドポイント | 90%以上 | 🔴 最重要 |
| UIコンポーネント | 80%以上 | 🟡 重要 |
| ユーティリティ | 85%以上 | 🟡 重要 |
| 全体 | 80%以上 | 🟢 標準 |

## Mock戦略

### 外部依存のMock化
```typescript
// tests/__mocks__/nodemailer.ts
export const createTransport = jest.fn().mockReturnValue({
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
});

// tests/__mocks__/next-auth.ts
export const useSession = jest.fn().mockReturnValue({
  data: { user: { id: '1', email: 'test@example.com' } },
  status: 'authenticated'
});
```

## 品質メトリクス

### 自動収集メトリクス
- テストカバレッジ率
- ビルド成功率
- テスト実行時間
- 不具合検出率
- コード複雑度（Cyclomatic Complexity）

### 品質ゲート
```javascript
// quality-gate.js
const qualityGates = {
  coverage: 80,           // 最小カバレッジ
  buildTime: 300,         // 最大ビルド時間（秒）
  testTime: 600,          // 最大テスト時間（秒）
  complexityThreshold: 10 // 最大循環的複雑度
};
```

## 開発者ガイドライン

### テスト作成ルール
1. **AAA原則**: Arrange, Act, Assert
2. **1テスト1アサーション**: 明確な失敗理由
3. **独立性**: テスト間の依存なし
4. **再現性**: 環境に依存しない
5. **速度**: 単体テストは100ms以内

### コードレビューチェックリスト
- [ ] テストが追加されているか
- [ ] カバレッジが低下していないか
- [ ] TypeScript型が適切か
- [ ] エラーハンドリングが適切か
- [ ] セキュリティ考慮がされているか

## 実装スケジュール

### Day 1: 基盤設定
- Jest/Testing Library設定
- ESLint/Prettier設定
- Husky/lint-staged設定

### Day 2: CI/CD構築
- GitHub Actions設定
- Docker環境構築
- カバレッジレポート設定

### Day 3: テストサンプル作成
- 単体テストサンプル
- 統合テストサンプル
- E2Eテストサンプル
- ドキュメント作成

## 成果物

```
tests/
├── __mocks__/              # Mock定義
├── fixtures/               # テストデータ
├── unit/                   # 単体テスト
│   ├── auth/
│   ├── components/
│   └── utils/
├── integration/            # 統合テスト
│   ├── api/
│   └── db/
├── e2e/                    # E2Eテスト
│   ├── auth/
│   └── posts/
├── load/                   # 負荷テスト
│   └── scenarios/
├── security/               # セキュリティテスト
│   └── owasp/
└── setup.ts               # テスト設定
```

## まとめ

Phase 0の完了により、以下が実現されます：
- **品質の可視化**: カバレッジとメトリクスで品質を定量化
- **早期問題発見**: CI/CDで即座にフィードバック
- **開発効率向上**: 統一環境とツールで生産性向上
- **信頼性向上**: 自動テストで回帰バグ防止

これにより、Phase 1以降の実装が安全かつ効率的に進められます。