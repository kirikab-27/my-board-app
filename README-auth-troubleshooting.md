# NextAuth.js 認証トラブルシューティング

認証関連の問題解決方法を詳しく解説します。

## 🚨 認証済みユーザーがunauthorizedページにリダイレクトされる問題

### 症状

- ログイン状態が確認できている（`現在の認証状態: ログイン済み`）
- ホーム（`/`）にアクセスすると`/unauthorized`にリダイレクトされる
- 「ホームに戻る」ボタンが機能しない

### 原因分析

この問題は以下の**複数要因が重なった複合的エラー**です：

#### 1. Userモデルにroleフィールド不足
```typescript
// 問題: roleフィールドが定義されていない
interface IUser {
  name: string;
  email: string;
  // role: 'user' | 'moderator' | 'admin'; ← これが不足
}
```

#### 2. NextAuth.js JWT/Session CallbackでRole情報欠如
```typescript
// 問題: JWTトークンにrole情報が含まれない
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id; // roleが設定されない
    }
    return token;
  }
}
```

#### 3. 既存JWTトークンの無効な状態
- 古いJWTトークンに`role`情報が含まれていない
- ミドルウェアで`role: undefined`判定 → 権限不足

#### 4. ミドルウェアでの権限チェック失敗
```typescript
// ミドルウェアログ
🚫 権限不足: /board (要求: user, 現在: undefined)
```

### 🔧 解決手順

#### Step 1: Userモデルの修正

**src/models/User.ts**にroleフィールド追加：

```typescript
export interface IUser extends mongoose.Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  emailVerified: Date | null;
  image?: string;
  role: 'user' | 'moderator' | 'admin'; // ← 追加
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
  // ... 既存フィールド
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user', // ← デフォルト値設定
  },
});
```

#### Step 2: 既存ユーザーのrole設定

```bash
# スクリプト実行で既存ユーザーにrole='user'追加
node scripts/update-user-roles.js
```

**scripts/update-user-roles.js**:
```javascript
// 既存ユーザーにroleフィールドを追加
const result = await mongoose.connection.db.collection('users').updateMany(
  { role: { $exists: false } },
  { $set: { role: 'user' } }
);
```

#### Step 3: NextAuth.js Callback修正

**src/lib/auth/nextauth.ts**:
```typescript
callbacks: {
  async jwt({ token, user, account }) {
    if (user) {
      token.id = user.id;
      
      // DBからユーザー情報を取得してroleを設定
      try {
        await connectDB();
        const dbUser = await User.findById(user.id);
        if (dbUser) {
          token.role = dbUser.role || 'user'; // ← 追加
          token.emailVerified = dbUser.emailVerified;
        } else {
          token.role = 'user';
          token.emailVerified = null;
        }
      } catch (error) {
        console.error('JWT callback error:', error);
        token.role = 'user'; // エラー時はデフォルト
        token.emailVerified = null;
      }
    }
    return token;
  },
  async session({ session, token }) {
    if (token && session.user) {
      session.user.id = token.id as string;
      session.user.role = token.role as string; // ← 追加
      session.user.emailVerified = token.emailVerified as Date | null;
    }
    return session;
  },
}
```

#### Step 4: TypeScript型定義の拡張

**src/types/auth.ts**:
```typescript
import 'next-auth';
import 'next-auth/jwt';

// NextAuth.jsの型拡張
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole; // ← 追加
      emailVerified?: Date | null;
    };
  }

  interface User {
    role?: UserRole; // ← 追加
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole; // ← 追加
    emailVerified?: Date | null;
  }
}
```

#### Step 5: 既存JWTトークンの無効化

```bash
# .env.localのNEXTAUTH_SECRETを変更
NEXTAUTH_SECRET=your-super-secret-nextauth-key-updated-2025

# サーバー再起動
npm run dev
```

#### Step 6: 動作確認

1. **ブラウザのCookie確認**
   - 開発者ツール → Application → Cookies
   - `next-auth.session-token`が存在する場合は削除

2. **セッション状態確認**
   - `/api/auth/session`で認証状態確認
   - role情報が含まれているか確認

3. **ログインフロー確認**
   - 必要に応じて再ログイン
   - ログイン後、`/`から`/board`への自動リダイレクト確認

### 🔍 デバッグ方法

#### サーバーログ確認
```bash
# 開発サーバー実行時のログ確認
npm run dev

# 期待するログ
✅ JWT callback - token updated: { role: 'user', emailVerified: true }
✅ アクセス許可: /board (ユーザー: user@example.com)
```

#### JWTトークン内容確認
```javascript
// ブラウザのコンソールでセッション確認
fetch('/api/auth/session')
  .then(r => r.json())
  .then(session => console.log(session));

// 期待する結果
{
  user: {
    id: "...",
    email: "user@example.com",
    role: "user", // ← これが重要
    emailVerified: "2025-08-10T09:37:10.575Z"
  }
}
```

### ⚠️ よくあるミス

1. **サーバー再起動忘れ**
   - NextAuth.js設定変更後は必ず再起動

2. **古いセッションの残存**
   - `NEXTAUTH_SECRET`変更後も古いCookieが残る場合がある

3. **TypeScript型定義の不備**
   - モジュール拡張を忘れると型エラー

4. **DBスクリプトの実行忘れ**
   - 既存ユーザーのrole設定を忘れる

### 🎯 予防策

1. **初期セットアップ時にrole実装**
   - Userモデル設計時にroleフィールドを含める

2. **認証テストの自動化**
   - ログイン→権限チェック→ルーティングのE2Eテスト

3. **セッションデバッグの組み込み**
   - 開発環境でセッション内容をログ出力

4. **マイグレーションスクリプトの整備**
   - DB構造変更時の更新手順を文書化

### 📋 関連ドキュメント

- [useRequireAuth認証フック](./README-useRequireAuth-hook.md)
- [ミドルウェア保護システム](./README-middleware-protection.md)
- [学習用Phase 0-2実装ガイド](./docs/learning-guide-phase-0-to-2.md)