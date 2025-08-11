# Phase 5: セキュリティ強化実装ガイド

## 📋 概要

Phase 5では、Webアプリケーションの主要なセキュリティ脆弱性に対する包括的な対策を実装し、OWASP Top 10に準拠したセキュアなシステムを構築します。

## 🎯 実装目標

- XSS（クロスサイトスクリプティング）完全対策
- CSRF（クロスサイトリクエストフォージェリ）強化
- レート制限の最適化
- セキュリティ監査ログシステム
- NoSQLインジェクション対策

## 📊 実装スケジュール（2週間）

### Week 1: XSS・CSRF対策実装
- **Day 1-2**: DOMPurify導入・設定
- **Day 3-4**: 入力サニタイゼーション実装
- **Day 5-6**: Content Security Policy (CSP) 設定
- **Day 7**: CSRFトークン実装・SameSite Cookie設定

### Week 2: 監査・テスト・高度な対策
- **Day 8-9**: セキュリティ監査ログシステム構築
- **Day 10-11**: NoSQLインジェクション対策強化
- **Day 12-13**: セキュリティテスト作成
- **Day 14**: ペネトレーションテスト・文書化

## 🛡️ 実装内容詳細

### 1. XSS対策実装

#### 1.1 必要パッケージのインストール
```bash
npm install dompurify @types/dompurify isomorphic-dompurify
```

#### 1.2 サニタイゼーションユーティリティ作成
```typescript
// src/utils/security/sanitizer.ts
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
};

export const sanitizeMarkdown = (text: string): string => {
  return DOMPurify.sanitize(text, {
    USE_PROFILES: { html: false },
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'code', 'pre'],
  });
};
```

#### 1.3 安全なコンテンツ表示コンポーネント
```typescript
// src/components/SafeContent.tsx
interface SafeContentProps {
  content: string;
  allowMarkdown?: boolean;
}

export function SafeContent({ content, allowMarkdown }: SafeContentProps) {
  const sanitized = allowMarkdown 
    ? sanitizeMarkdown(content)
    : sanitizeHtml(content);
    
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### 2. Content Security Policy (CSP) 実装

```typescript
// src/middleware/security-headers.ts
export const cspHeaders = {
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https: blob:;
    connect-src 'self' https://api.github.com https://accounts.google.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\n/g, ' ').trim(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

### 3. CSRF対策強化

#### 3.1 CSRFトークン生成・検証
```typescript
// src/lib/security/csrf.ts
import crypto from 'crypto';
import { cookies } from 'next/headers';

export async function generateCSRFToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const cookieStore = await cookies();
  
  cookieStore.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24時間
  });
  
  return token;
}

export async function verifyCSRFToken(token: string): Promise<boolean> {
  const cookieStore = await cookies();
  const storedToken = cookieStore.get('csrf-token')?.value;
  
  if (!storedToken || !token) return false;
  
  return crypto.timingSafeEqual(
    Buffer.from(storedToken),
    Buffer.from(token)
  );
}
```

#### 3.2 APIでのCSRF検証
```typescript
// src/app/api/posts/route.ts
export async function POST(request: NextRequest) {
  const csrfToken = request.headers.get('X-CSRF-Token');
  
  if (!await verifyCSRFToken(csrfToken || '')) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }
  
  // 通常の処理...
}
```

### 4. レート制限の調整

```typescript
// src/lib/security/rateLimit.ts の修正
const SECURITY_CONFIG = {
  // 要件: 1分間に5回まで
  API_LIMIT: {
    maxAttempts: 5,        // 5回まで
    windowMs: 60 * 1000,   // 1分間
    lockoutMs: 5 * 60 * 1000, // 5分ロック
  },
  // 既存設定も維持
  IP_LIMIT: {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
    lockoutMs: 60 * 60 * 1000,
  },
  USER_LIMIT: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    lockoutMs: 30 * 60 * 1000,
  }
}
```

### 5. セキュリティ監査ログ

```typescript
// src/lib/security/audit-logger.ts
import { AuditLog } from '@/models/AuditLog';

interface SecurityEvent {
  type: 'AUTH_FAILURE' | 'PERMISSION_DENIED' | 'XSS_ATTEMPT' | 
        'CSRF_VIOLATION' | 'RATE_LIMIT' | 'SUSPICIOUS_ACTIVITY';
  userId?: string;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  details?: any;
  timestamp: Date;
}

export class SecurityAuditLogger {
  async log(event: SecurityEvent): Promise<void> {
    // MongoDBに記録
    await AuditLog.create({
      ...event,
      severity: this.calculateSeverity(event.type),
    });
    
    // 重大なイベントはアラート送信
    if (this.isCritical(event.type)) {
      await this.sendSecurityAlert(event);
    }
  }
  
  private calculateSeverity(type: SecurityEvent['type']): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const severityMap = {
      'AUTH_FAILURE': 'LOW',
      'PERMISSION_DENIED': 'MEDIUM',
      'XSS_ATTEMPT': 'HIGH',
      'CSRF_VIOLATION': 'HIGH',
      'RATE_LIMIT': 'MEDIUM',
      'SUSPICIOUS_ACTIVITY': 'CRITICAL',
    };
    return severityMap[type];
  }
  
  private isCritical(type: SecurityEvent['type']): boolean {
    return ['XSS_ATTEMPT', 'CSRF_VIOLATION', 'SUSPICIOUS_ACTIVITY'].includes(type);
  }
  
  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    // Slack/メール通知実装
    console.error('[SECURITY ALERT]', event);
  }
}
```

### 6. NoSQLインジェクション対策

```typescript
// src/lib/security/input-validation.ts
import { z } from 'zod';
import mongoose from 'mongoose';

// MongoDBクエリのバリデーション
export const validateMongoId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// 入力値のエスケープ
export const escapeRegex = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// 安全な検索クエリ構築
export const buildSafeSearchQuery = (search: string) => {
  const safeSearch = escapeRegex(search);
  return {
    $or: [
      { title: { $regex: safeSearch, $options: 'i' } },
      { content: { $regex: safeSearch, $options: 'i' } }
    ]
  };
};
```

## 🧪 セキュリティテスト

### XSS保護テスト
```typescript
// tests/security/xss.test.ts
describe('XSS Protection', () => {
  it('should sanitize script tags', () => {
    const malicious = '<script>alert("XSS")</script>';
    const sanitized = sanitizeHtml(malicious);
    expect(sanitized).not.toContain('<script>');
  });
  
  it('should prevent event handlers', () => {
    const malicious = '<img src=x onerror="alert(1)">';
    const sanitized = sanitizeHtml(malicious);
    expect(sanitized).not.toContain('onerror');
  });
  
  it('should allow safe HTML tags', () => {
    const safe = '<strong>Bold</strong> <em>Italic</em>';
    const sanitized = sanitizeHtml(safe);
    expect(sanitized).toContain('<strong>');
    expect(sanitized).toContain('<em>');
  });
});
```

### CSRF保護テスト
```typescript
// tests/security/csrf.test.ts
describe('CSRF Protection', () => {
  it('should reject requests without CSRF token', async () => {
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ content: 'test' }),
    });
    expect(response.status).toBe(403);
  });
  
  it('should accept requests with valid CSRF token', async () => {
    const token = await generateCSRFToken();
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'X-CSRF-Token': token },
      body: JSON.stringify({ content: 'test' }),
    });
    expect(response.status).not.toBe(403);
  });
});
```

### レート制限テスト
```typescript
// tests/security/rate-limit.test.ts
describe('Rate Limiting', () => {
  it('should block after 5 requests in 1 minute', async () => {
    for (let i = 0; i < 5; i++) {
      const response = await fetch('/api/posts');
      expect(response.status).toBe(200);
    }
    
    const blockedResponse = await fetch('/api/posts');
    expect(blockedResponse.status).toBe(429);
  });
});
```

## 📦 必要なパッケージ

```json
{
  "dependencies": {
    "dompurify": "^3.0.0",
    "isomorphic-dompurify": "^2.0.0",
    "helmet": "^7.0.0",
    "express-mongo-sanitize": "^2.2.0"
  },
  "devDependencies": {
    "@types/dompurify": "^3.0.0",
    "owasp-dependency-check": "^8.0.0",
    "snyk": "^1.1000.0"
  }
}
```

## 📊 実装優先順位

| 優先度 | 項目 | 現状 | 実装内容 | 工数 |
|--------|------|------|----------|------|
| **P0** | XSS対策 | React JSXのみ | DOMPurify統合 | 3日 |
| **P0** | CSP実装 | 基本ヘッダーのみ | 詳細設定 | 2日 |
| **P1** | CSRF強化 | 簡易チェック | トークン検証 | 2日 |
| **P1** | レート制限調整 | 5分10回 | 1分5回に変更 | 0.5日 |
| **P1** | 監査ログ | なし | ログシステム構築 | 3日 |
| **P2** | NoSQLi対策 | 基本検証 | 包括的対策 | 2日 |
| **P2** | テスト | なし | セキュリティテスト | 2日 |

## ✅ 実装前チェックリスト

- [ ] Phase 4.5が完全に完了していることを確認
- [ ] 現在のセキュリティ状況の把握
- [ ] 必要なパッケージのライセンス確認
- [ ] テスト環境の準備
- [ ] データベースのバックアップ作成
- [ ] ステージング環境での検証計画

## 🎯 Phase 5完了時の成果

1. **XSS完全対策**: ユーザー入力の安全な処理
2. **CSRF保護強化**: トークンベースの検証
3. **最適化されたレート制限**: 1分5回制限
4. **監査ログシステム**: 全セキュリティイベント記録
5. **包括的なセキュリティテスト**: 自動化されたテストスイート

## 📚 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

## 🔧 トラブルシューティング

### DOMPurifyがSSRで動作しない
```typescript
// isomorphic-dompurifyを使用
import DOMPurify from 'isomorphic-dompurify';
```

### CSPでインラインスタイルがブロックされる
```typescript
// nonceまたはhashベースの許可を実装
'style-src': "'self' 'unsafe-inline'", // 開発時のみ
```

### レート制限でテストが失敗する
```typescript
// テスト環境では制限を緩和
if (process.env.NODE_ENV === 'test') {
  SECURITY_CONFIG.API_LIMIT.maxAttempts = 1000;
}
```

## 🚀 実装開始

1. このドキュメントを参照しながら実装を進める
2. 各機能実装後は必ずテストを作成
3. ステージング環境で動作確認
4. 本番環境へのデプロイは段階的に実施

---

*Phase 5完了により、OWASP Top 10に対応した堅牢なセキュリティ基盤が完成します。*