# ミドルウェア保護システム - 完全実装ガイド

## 📋 概要

Next.js 15 + NextAuth.js v4環境で動作する高度なミドルウェア保護システムです。`/board`の保護追加、ロールベースアクセス制御、レート制限、CSRF保護、セキュリティヘッダーを統合した多層防御を実現します。

## ✅ 実装完了機能

### 🔐 **ルート保護機能**
- **包括的保護設定**: 設定可能なルート管理・権限レベル制御
- **ロール階層管理**: user < moderator < admin の3段階制御
- **メール認証制御**: 必要ページでの認証状態チェック
- **自動リダイレクト**: 適切な認証・エラーページへの誘導

### 🛡️ **セキュリティ機能**
- **レート制限**: IP別・ルート別の制限設定（メモリベース）
- **CSRF保護**: Origin/Refererヘッダー検証・SameSiteチェック
- **ボット検出**: User-Agent分析・疑わしいパターン検出
- **セキュリティヘッダー**: HSTS・XSS保護・フレーム防止

### 🔍 **監視・診断機能**
- **リアルタイムログ**: アクセス許可・拒否の詳細記録
- **IP追跡**: Cloudflare・Vercel対応のクライアントIP検出
- **リクエストID**: ユニークID生成・デバッグ支援

## 🏗️ アーキテクチャ構成

### **ファイル構成**
```
src/
├── middleware.ts                      # メインミドルウェア
├── lib/middleware/
│   ├── auth-config.ts                # ルート保護設定
│   ├── security.ts                   # セキュリティ機能
│   └── __tests__/auth-config.test.ts # テストスイート
└── components/examples/
    └── MiddlewareDemo.tsx            # デモコンポーネント
```

### **処理フロー**
```
1. セキュリティチェック (レート制限・CSRF・ボット検出)
   ↓
2. セキュリティヘッダー設定
   ↓  
3. ルート分析 (protected・guestOnly・adminOnly・public)
   ↓
4. 認証状態チェック
   ↓
5. 権限レベル確認 (ロール・メール認証)
   ↓
6. アクセス許可 / リダイレクト / 拒否
```

## 🔧 ルート保護設定

### **保護ルート設定例**
```typescript
// lib/middleware/auth-config.ts
export const routeConfig = {
  protected: {
    '/board': {
      requiredRole: 'user',
      requireEmailVerified: false,
      redirectTo: '/login',
      description: '会員限定掲示板'
    },
    '/profile': {
      requiredRole: 'user',
      requireEmailVerified: true,  // メール認証必須
      redirectTo: '/login'
    }
  },
  guestOnly: {
    '/login': {
      redirectTo: '/board',  // 認証済みユーザーのリダイレクト先
    }
  },
  adminOnly: {
    '/admin': {
      redirectTo: '/unauthorized'
    }
  }
};
```

### **実際の動作例**

#### **1. 未認証ユーザーが `/board` にアクセス**
```
🚫 未認証アクセス: /board -> ログインページ
➡️ リダイレクト: /login?callbackUrl=/board
```

#### **2. 一般ユーザーが `/admin` にアクセス**
```
🚫 権限不足: /admin (要求: admin, 現在: user)
➡️ リダイレクト: /unauthorized
```

#### **3. 認証済みユーザーが `/login` にアクセス**
```
🔄 認証済みユーザーを /login から /board にリダイレクト
➡️ リダイレクト: /board
```

## 🛡️ セキュリティ機能詳細

### **レート制限設定**
```typescript
// 一般リクエスト: 15分間に200回
const globalRateLimit = new SimpleRateLimit(200, 15 * 60 * 1000);

// 認証関連: 5分間に10回  
const authRateLimit = new SimpleRateLimit(10, 5 * 60 * 1000);

// 制限達成時のレスポンス
HTTP 429 Too Many Requests
Retry-After: 900
```

### **CSRF保護**
```typescript
// POSTリクエストのOrigin/Refererチェック
const checkCSRF = (req: NextRequest) => {
  if (req.method === 'POST') {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    
    if (origin && new URL(origin).host !== host) {
      return { allowed: false, reason: 'Origin header mismatch' };
    }
  }
  return { allowed: true };
};
```

### **セキュリティヘッダー**
```typescript
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin'
};
```

### **ボット検出**
```typescript
// 疑わしいUser-Agentパターン
const botPatterns = [/crawler/i, /bot/i, /spider/i, /scraper/i];

// 保護ルートへのボットアクセス制限
if (isSuspiciousBot && isProtectedPath) {
  return { allowed: false, reason: 'Bot access denied' };
}
```

## 🔍 IP検出機能

### **マルチプロバイダー対応**
```typescript
export const getClientIP = (req: NextRequest): string => {
  // 1. Cloudflare
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;

  // 2. 一般的なプロキシ
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();

  // 3. Vercel
  const xVercelForwardedFor = req.headers.get('x-vercel-forwarded-for');
  if (xVercelForwardedFor) return xVercelForwardedFor;

  return req.ip || 'unknown';
};
```

## 🧪 テスト・デバッグ

### **デモページ活用**
`/components/examples/MiddlewareDemo.tsx` で以下をテスト可能：

- **ルート保護状況**: 現在の権限でのアクセス可否
- **リダイレクト動作**: 認証状態による自動遷移
- **セキュリティ機能**: レート制限・CSRF・ボット検出
- **権限管理**: ロール別アクセス制御

### **ログ出力例**
```bash
# 正常アクセス
✅ アクセス許可: /board (ユーザー: user@example.com)

# 権限不足
🚫 権限不足: /admin (要求: admin, 現在: user)

# セキュリティ違反
🛡️ セキュリティチェック失敗: /board (IP: 192.168.1.1, 理由: Rate limit exceeded)

# 未設定ルート
⚠️ 未設定ルート: /unknown-page - デフォルトで認証必須
```

### **Jest テストスイート**
```typescript
// __tests__/auth-config.test.ts
describe('getRouteConfig', () => {
  test('保護ルートの設定取得', () => {
    const config = getRouteConfig('/board');
    expect(config?.type).toBe('protected');
    expect(config?.config.requiredRole).toBe('user');
  });
});
```

## 🚀 パフォーマンス最適化

### **メモリ管理**
```typescript
// 定期的なレート制限データクリーンアップ
setInterval(() => {
  globalRateLimit.cleanup();
  authRateLimit.cleanup();
}, 10 * 60 * 1000); // 10分毎
```

### **リクエスト除外設定**
```typescript
// matcher設定で静的ファイルを除外
export const config = {
  matcher: [
    '/((?!api/(?!auth)|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)',
  ],
};
```

## 🔧 カスタマイズガイド

### **新しい保護ルート追加**
```typescript
// auth-config.ts
protected: {
  '/new-protected-page': {
    requiredRole: 'moderator',
    requireEmailVerified: true,
    description: '新しい保護ページ'
  }
}
```

### **カスタムセキュリティチェック**
```typescript
// security.ts
export const customSecurityCheck = (req: NextRequest) => {
  // カスタムロジック実装
  return { allowed: true };
};

// middleware.ts で統合
const customResult = customSecurityCheck(req);
if (!customResult.allowed) {
  return new Response('Custom security violation', { status: 403 });
}
```

### **レート制限調整**
```typescript
// より厳しい制限
const strictRateLimit = new SimpleRateLimit(50, 10 * 60 * 1000); // 10分間50回

// より緩い制限  
const relaxedRateLimit = new SimpleRateLimit(500, 60 * 60 * 1000); // 1時間500回
```

## 🚨 本格運用時の推奨事項

### **1. 外部レート制限システム**
```typescript
// Redis使用例
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

const checkRedisRateLimit = async (key: string) => {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, 900); // 15分
  }
  return current <= 200; // 制限値
};
```

### **2. 監視・アラート統合**
```typescript
// Sentry統合
import * as Sentry from '@sentry/nextjs';

if (!securityResult.allowed) {
  Sentry.captureMessage(`Security violation: ${securityResult.reason}`, {
    level: 'warning',
    extra: { ip: clientIP, path: pathname }
  });
}
```

### **3. データベースログ記録**
```typescript
// 重要なセキュリティイベントをDB記録
const logSecurityEvent = async (event: SecurityEvent) => {
  await SecurityLog.create({
    ip: event.ip,
    path: event.path,
    reason: event.reason,
    timestamp: new Date()
  });
};
```

## 📊 実装効果

### **セキュリティ向上**
- **🛡️ 多層防御**: ミドルウェア + コンポーネント + API保護
- **🔒 アクセス制御**: 細かい権限管理・ロール階層
- **⚡ 高速処理**: サーバーサイドでの即座判定

### **開発効率**
- **📝 設定型管理**: TypeScript型安全性・IntelliSense
- **🧪 テスト完備**: Jest・統合テスト・デモページ
- **🔧 拡張性**: 新ルート・機能の簡単追加

### **運用性**
- **📊 包括的ログ**: アクセス状況・セキュリティ違反の記録
- **🚨 エラー処理**: 適切なHTTPステータス・リトライ情報
- **⚙️ メンテナンス性**: モジュール化・設定分離

この強化されたミドルウェアシステムにより、企業レベルのセキュリティ要件を満たす堅牢な認証・認可基盤が完成しました！