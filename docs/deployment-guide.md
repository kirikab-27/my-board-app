# デプロイメントガイド

## 1. デプロイメント概要

### 1.1 推奨デプロイ先

| プラットフォーム | 難易度 | コスト | 特徴 |
|----------------|--------|--------|------|
| **Vercel** ⭐ | 簡単 | 無料〜 | Next.js専用、自動デプロイ |
| **Netlify** | 簡単 | 無料〜 | 静的サイト特化、Serverless Functions |
| **Railway** | 中程度 | 5$/月〜 | フルスタック対応、データベース統合 |
| **Render** | 中程度 | 無料〜 | フルスタック対応、自動スケーリング |
| **AWS** | 難しい | 従量課金 | 高度な設定可能、エンタープライズ |

### 1.2 デプロイメント戦略

```mermaid
graph LR
    A[ローカル開発] --> B[Git Push]
    B --> C[CI/CD Pipeline]
    C --> D[自動テスト]
    D --> E{テスト通過?}
    E -->|Yes| F[自動デプロイ]
    E -->|No| G[デプロイ停止]
    F --> H[本番環境]
    G --> I[修正後再実行]
```

## 2. Vercelへのデプロイ（推奨）

### 2.1 事前準備

#### GitHubリポジトリの準備
```bash
# 既存プロジェクトをGitHubにプッシュ
git init
git add .
git commit -m "feat: initial commit"
git branch -M main
git remote add origin https://github.com/your-username/my-board-app.git
git push -u origin main
```

#### 必要なファイルの確認
```
my-board-app/
├── package.json           # ✅ 依存関係定義
├── next.config.js         # ✅ Next.js設定
├── .env.local             # ❌ Gitにコミットしない
├── .env.example           # ✅ 環境変数テンプレート
└── .gitignore             # ✅ 除外ファイル設定
```

#### .env.example作成
```bash
# .env.example
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/board-app?retryWrites=true&w=majority
```

### 2.2 Vercelアカウント設定

#### ステップ1: Vercelアカウント作成
1. [Vercel公式サイト](https://vercel.com)にアクセス
2. GitHubアカウントでサインアップ
3. チーム設定（個人利用の場合はスキップ）

#### ステップ2: プロジェクトインポート
```bash
# Vercel CLIインストール（オプション）
npm install -g vercel

# またはWebダッシュボードから操作
```

### 2.3 Webダッシュボードでのデプロイ

#### プロジェクトのインポート
1. Vercelダッシュボードで「New Project」をクリック
2. GitHubリポジトリを選択
3. プロジェクト設定を確認

#### ビルド設定
```javascript
// 自動検出される設定
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

#### 環境変数設定
```
Name: MONGODB_URI
Value: mongodb+srv://username:password@cluster.mongodb.net/board-app?retryWrites=true&w=majority
Environment: Production
```

### 2.4 CLIを使用したデプロイ

```bash
# Vercel CLIでログイン
vercel login

# 初回セットアップ
vercel

# 設定内容の確認
? Set up and deploy "~/my-board-app"? [Y/n] y
? Which scope do you want to deploy to? Your Name
? Link to existing project? [y/N] n
? What's your project's name? my-board-app
? In which directory is your code located? ./

# 環境変数設定
vercel env add MONGODB_URI production
# 値を入力: mongodb+srv://...

# 本番デプロイ
vercel --prod
```

### 2.5 自動デプロイ設定

#### GitHub Integration設定
1. Vercelダッシュボード → Settings → Git
2. 「Production Branch」を`main`に設定
3. 「Preview Deployments」を有効化

#### 自動デプロイフロー
```
Git Push → Vercel自動ビルド → 自動テスト → 自動デプロイ
```

## 3. カスタムドメインの設定

### 3.1 ドメイン追加

#### Vercelでのドメイン設定
1. プロジェクトダッシュボード → Settings → Domains
2. 「Add Domain」をクリック
3. ドメイン名を入力（例：`my-board-app.com`）

#### DNS設定例（Cloudflare）
```
Type: CNAME
Name: @
Target: cname.vercel-dns.com

Type: CNAME  
Name: www
Target: cname.vercel-dns.com
```

### 3.2 SSL証明書

Vercelは自動的にLet's Encrypt SSL証明書を発行・更新します。
```
✅ 自動SSL証明書発行
✅ 自動更新
✅ HTTP/2 対応
✅ HTTPS強制リダイレクト
```

## 4. 環境変数の本番設定

### 4.1 MongoDB Atlas本番設定

#### クラスター設定
```javascript
// 本番環境用クラスター推奨設定
Tier: M2 (Shared) 以上
Region: Asia Pacific (ap-northeast-1) // 東京
Backup: 有効化
```

#### ネットワークアクセス
```javascript
// IPホワイトリスト設定
0.0.0.0/0  // 全IP許可（Vercelの場合）

// または特定IP範囲
76.223.126.88/29  // Vercel IP範囲例
```

#### データベースユーザー
```javascript
// 本番用ユーザー作成
Username: production-user
Password: [強力なパスワード]
Role: readWrite
Database: board-app
```

### 4.2 環境変数設定

#### Vercelでの設定方法

**Method 1: Webダッシュボード**
```
1. Project Settings → Environment Variables
2. Name: MONGODB_URI
3. Value: mongodb+srv://production-user:password@cluster.mongodb.net/board-app
4. Environment: Production, Preview, Development
```

**Method 2: CLI**
```bash
# 本番環境
vercel env add MONGODB_URI production

# プレビュー環境
vercel env add MONGODB_URI preview

# 開発環境（オプション）
vercel env add MONGODB_URI development
```

**Method 3: vercel.json**
```json
{
  "env": {
    "MONGODB_URI": "@mongodb-uri"
  },
  "build": {
    "env": {
      "MONGODB_URI": "@mongodb-uri"
    }
  }
}
```

### 4.3 環境変数のベストプラクティス

#### セキュリティ
```bash
# ✅ 良い例
MONGODB_URI=mongodb+srv://user:complex-password@cluster.mongodb.net/board-app
NEXTAUTH_SECRET=super-secret-32-character-string

# ❌ 悪い例
MONGODB_URI=mongodb://admin:123456@localhost:27017/board-app
API_KEY=test-key
```

#### 環境分離
```javascript
// 環境別データベース
Production:  board-app-prod
Staging:     board-app-staging  
Development: board-app-dev
```

## 5. CI/CDパイプラインの構築

### 5.1 GitHub Actions設定

#### .github/workflows/deploy.yml
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm run test
      env:
        MONGODB_URI: ${{ secrets.MONGODB_URI_TEST }}

    - name: Run linting
      run: npm run lint

    - name: Type check
      run: npm run type-check

  deploy-preview:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Install Vercel CLI
      run: npm install --global vercel@latest

    - name: Pull Vercel Environment Information
      run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}

    - name: Build Project Artifacts
      run: vercel build --token=${{ secrets.VERCEL_TOKEN }}

    - name: Deploy Project Artifacts to Vercel
      run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Install Vercel CLI
      run: npm install --global vercel@latest

    - name: Pull Vercel Environment Information
      run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

    - name: Build Project Artifacts
      run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

    - name: Deploy Project Artifacts to Vercel
      run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### 5.2 GitHub Secrets設定

#### 必要なSecrets
```
VERCEL_TOKEN          # Vercel API Token
VERCEL_ORG_ID         # Organization ID
VERCEL_PROJECT_ID     # Project ID
MONGODB_URI_TEST      # テスト用MongoDB URI
```

#### Secrets設定手順
1. GitHub リポジトリ → Settings → Secrets and variables → Actions
2. 「New repository secret」をクリック
3. 各secretを追加

#### Vercel Token取得
```bash
# Vercel CLI でトークン取得
vercel tokens create

# または Vercel Dashboard → Settings → Tokens
```

### 5.3 品質ゲートの設定

#### package.json scripts拡張
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "prettier": "prettier --write .",
    "prettier:check": "prettier --check .",
    "pre-commit": "npm run lint && npm run type-check && npm run test",
    "build:analyze": "ANALYZE=true npm run build"
  }
}
```

## 6. その他のデプロイ先

### 6.1 Netlify

#### デプロイ手順
```bash
# Netlify CLI インストール
npm install -g netlify-cli

# ログイン
netlify login

# 初期設定
netlify init

# デプロイ設定
```

#### netlify.toml設定
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[functions]
  directory = ".netlify/functions"
```

### 6.2 Railway

#### デプロイ手順
```bash
# Railway CLI インストール
npm install -g @railway/cli

# ログイン
railway login

# プロジェクト初期化
railway init

# 環境変数設定
railway variables set MONGODB_URI="mongodb+srv://..."

# デプロイ
railway up
```

#### railway.json設定
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

### 6.3 Docker化（任意のプラットフォーム）

#### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# セキュリティ：非rootユーザー作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### .dockerignore
```
node_modules
.next
.git
.env.local
README.md
.vercel
```

#### docker-compose.yml（開発環境）
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/board-app
    depends_on:
      - mongodb

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

## 7. デプロイ後の確認事項

### 7.1 動作確認チェックリスト

#### 基本機能
- [ ] ページが正常に表示される
- [ ] 投稿作成が動作する
- [ ] 投稿一覧が表示される
- [ ] 投稿編集が動作する
- [ ] 投稿削除が動作する
- [ ] エラーハンドリングが正常

#### パフォーマンス
- [ ] ページロード時間 < 3秒
- [ ] Lighthouse スコア > 90
- [ ] Core Web Vitals合格
- [ ] モバイル表示確認

#### セキュリティ
- [ ] HTTPS強制リダイレクト
- [ ] セキュリティヘッダー設定
- [ ] 環境変数の適切な設定
- [ ] データベース接続の暗号化

### 7.2 監視・モニタリング設定

#### Vercel Analytics
```javascript
// Vercel Analytics有効化
// vercel.json
{
  "analytics": {
    "id": "your-analytics-id"
  }
}
```

#### エラー監視（Sentry）
```bash
# Sentry導入
npm install @sentry/nextjs

# sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### 7.3 パフォーマンス最適化

#### next.config.js 本番設定
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 本番最適化
  compress: true,
  
  // 画像最適化
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

## 8. トラブルシューティング

### 8.1 よくあるデプロイエラー

#### ビルドエラー
```bash
# エラー例
Error: Module not found: Can't resolve '@/components/PostForm'

# 解決法
# tsconfig.json のpaths設定を確認
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### 環境変数エラー
```bash
# エラー例
MongooseServerSelectionError: connect ECONNREFUSED

# 解決法
# 1. 環境変数の設定確認
vercel env ls

# 2. MongoDB Atlas IPホワイトリスト確認
# 3. 接続文字列の確認
```

#### メモリ制限エラー
```bash
# エラー例
JavaScript heap out of memory

# 解決法
# package.json に設定追加
{
  "scripts": {
    "build": "NODE_OPTIONS='--max_old_space_size=4096' next build"
  }
}
```

### 8.2 デバッグ方法

#### ローカルでの本番ビルドテスト
```bash
# 本番ビルドのローカルテスト
npm run build
npm start

# 環境変数を本番設定でテスト
MONGODB_URI="production-uri" npm start
```

#### Vercelログ確認
```bash
# Vercel CLI でログ確認
vercel logs

# 特定のデプロイのログ
vercel logs [deployment-url]
```

このガイドに従って、安全で効率的なデプロイメントパイプラインを構築し、継続的に改善していきましょう。