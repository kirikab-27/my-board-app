# 会員制システム実装手順

> NextAuth.js + MongoDB + 既存メール基盤を活用した会員制掲示板システムの実装ガイド

## 🎯 実装概要

**目標**: 既存の掲示板システムに会員制認証機能を追加し、セキュアな会員専用掲示板を構築する

**技術構成**: 
- NextAuth.js v5 + MongoDB Adapter
- 既存メール基盤（DKIM/SPF/DMARC完全対応済み）
- Material-UI v7 + レスポンシブ対応

**実装期間**: 約6日間（段階的実装）

## 📋 前提条件

### ✅ 完了済み基盤
- メール送信基盤（`src/lib/email/`）
- DKIM/SPF/DMARC認証設定
- MongoDB接続設定
- Material-UI基本設定
- 基本投稿機能（CRUD・ページネーション）

### 📦 必要な追加パッケージ

```bash
# NextAuth + 認証関連
npm install next-auth @next-auth/mongodb-adapter bcryptjs jsonwebtoken

# 型定義
npm install -D @types/bcryptjs @types/jsonwebtoken

# バリデーション・ユーティリティ
npm install zod uuid crypto-js
npm install -D @types/uuid @types/crypto-js

# CSRF保護
npm install @next/csp
```

## 🏗️ 実装手順

### Phase 1: 認証基盤構築 (1-2日)

#### 1.1 NextAuth設定

**ファイル**: `src/lib/auth/config.ts`
```typescript
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import { MongoClient } from "mongodb"

const client = new MongoClient(process.env.MONGODB_URI!)
const clientPromise = Promise.resolve(client)

export default NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      // 実装内容はauth-system-design.mdを参照
    })
  ],
  // 詳細設定は設計書参照
})
```

#### 1.2 ユーザーモデル作成

**ファイル**: `src/models/User.ts`
```typescript
import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  emailVerified: { type: Date, default: null },
}, { timestamps: true })

export default mongoose.models.User || mongoose.model('User', UserSchema)
```

#### 1.3 認証API設定

**ファイル**: `src/app/api/auth/[...nextauth]/route.ts`
```typescript
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth/config"

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### Phase 2: メール認証統合 (1-2日)

#### 2.1 既存メール基盤活用

**ファイル**: `src/lib/email/auth-templates.ts`
```typescript
import { sendEmail } from './sender'

export const sendVerificationEmail = async (email: string, token: string) => {
  // 既存のsender.tsを活用した認証メール送信
  // DKIM署名付きでセキュアに送信
}

export const sendPasswordResetEmail = async (email: string, token: string) => {
  // パスワードリセットメール送信
}
```

#### 2.2 メール認証フロー

**ファイル**: `src/app/api/auth/verify-email/route.ts`
```typescript
export async function GET(request: NextRequest) {
  // メール認証トークンの検証・ユーザー認証状態更新
}
```

### Phase 3: 投稿機能統合 (1日)

#### 3.1 認証ミドルウェア

**ファイル**: `src/middleware.ts`
```typescript
import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // 認証が必要なページの制御
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // 認証ロジック
      }
    }
  }
)
```

#### 3.2 投稿API修正

**既存の投稿APIに認証チェック追加**
- `src/app/api/posts/route.ts` - 認証ユーザーのみ投稿可能
- `src/app/api/posts/[id]/route.ts` - 投稿者のみ編集・削除可能

### Phase 4-5: UI・セキュリティ強化 (1-2日)

#### 4.1 認証UI作成

**ファイル**: `src/components/auth/AuthButton.tsx`
```typescript
'use client'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function AuthButton() {
  const { data: session, status } = useSession()
  // 認証状態に応じたUI表示
}
```

#### 4.2 セキュリティ強化

**レート制限・CSRF・バリデーション等の実装**

## 🔧 開発コマンド

### 基本開発コマンド
```bash
# 開発サーバー起動
npm run dev

# 型チェック
npx tsc --noEmit

# Lint実行  
npm run lint

# メール送信テスト（既存基盤）
node scripts/test-email.js
```

### 認証機能テストコマンド
```bash
# 認証システムテスト（実装後）
npm run test:auth

# セキュリティテスト
npm run test:security

# メール認証テスト
npm run test:email-auth
```

## 🌿 ブランチ戦略

### 推奨作業フロー

```bash
# 1. 現在のemail-serviceブランチから開始
git checkout feature/email-service
git pull origin feature/email-service

# 2. 認証システム開発ブランチ作成
git checkout -b feature/auth-system

# 3. Phase 1-2完了後、会員投稿ブランチ作成
git checkout -b feature/member-posts

# 4. Phase 3完了後、UI強化ブランチ作成  
git checkout -b feature/member-ui

# 5. 各Phase完了時にdevelopにマージ
git checkout develop
git merge feature/auth-system
```

詳細は[会員制ブランチ戦略](./docs/member-branch-strategy.md)を参照

## 🔍 テスト・確認項目

### Phase 1完了時チェック
- [ ] ユーザー登録・ログイン動作確認
- [ ] パスワードハッシュ化確認
- [ ] セッション管理動作確認
- [ ] データベース保存確認

### Phase 2完了時チェック
- [ ] メール認証フロー完全動作
- [ ] DKIM署名付きメール送信確認
- [ ] パスワードリセット動作確認
- [ ] 既存メール基盤との統合確認

### Phase 3完了時チェック
- [ ] 未認証ユーザーの投稿制限確認
- [ ] 投稿者のみ編集・削除可能確認
- [ ] API認証チェック動作確認

### 最終テスト
- [ ] 全認証フローのエンドツーエンドテスト
- [ ] セキュリティテスト（CSRF・レート制限）
- [ ] パフォーマンステスト
- [ ] レスポンシブUI確認

## 📚 参考ドキュメント

### 設計・仕様書
- **[認証システム設計書](./docs/auth-system-design.md)** - 詳細な技術仕様
- **[会員制ブランチ戦略](./docs/member-branch-strategy.md)** - 段階的実装戦略

### 既存基盤ドキュメント
- **[メール送信トラブルシューティング](./docs/email-troubleshooting-guide.md)** 
- **[メール認証チートシート](./docs/email-auth-cheatsheet.md)**
- **[基本メールテスト手順](./README-email-test.md)**

### 外部ドキュメント
- [NextAuth.js公式ドキュメント](https://next-auth.js.org/)
- [MongoDB Adapter](https://next-auth.js.org/adapters/mongodb)
- [Material-UI認証例](https://mui.com/material-ui/getting-started/templates/)

## ❓ トラブルシューティング

### よくある問題

#### NextAuth設定エラー
```bash
# NEXTAUTH_SECRET未設定
export NEXTAUTH_SECRET="your-secret-key"

# URL設定確認
export NEXTAUTH_URL="http://localhost:3010"
```

#### MongoDB接続エラー
```bash
# 接続文字列確認
echo $MONGODB_URI

# 接続テスト
node -e "require('./src/lib/mongodb.ts')"
```

#### メール送信エラー
```bash
# 既存メール基盤テスト
node scripts/test-email.js

# DKIM署名確認
node scripts/test-dkim-email.js
```

### サポート情報
- 実装中に問題が発生した場合は`docs/`フォルダの各種ガイドを参照
- メール関連は既存の充実したドキュメント基盤を活用
- データベース・認証問題は設計書の仕様に従って解決

## 🚀 実装開始

準備ができたら以下のコマンドで実装を開始：

```bash
# ブランチ作成・パッケージインストール
git checkout -b feature/auth-system
npm install next-auth @next-auth/mongodb-adapter bcryptjs jsonwebtoken zod

# 開発開始
npm run dev
```

成功を祈ります！ 🎉