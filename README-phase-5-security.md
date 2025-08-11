# Phase 5: セキュリティ強化実装ガイド ✅ **実装完了**

本ドキュメントはPhase 5で実装されたエンタープライズ級セキュリティ機能の詳細な実装内容と利用方法を説明します。

## 🎯 Phase 5実装概要

Phase 5では、会員制掲示板システムにエンタープライズ級のセキュリティ基盤を構築しました。OWASP Top 10に対応した多層防御システムが完成しています。

### ✅ 実装完了機能

1. **XSS完全対策** - DOMPurify統合・SafeContentコンポーネント・リアルタイム検出
2. **CSRF対策強化** - トークンベース検証・Origin/Refererヘッダー検証・自動管理
3. **レート制限調整** - 1分5回制限（要件準拠）・API別制限・違反自動ログ
4. **監査ログシステム** - MongoDB永続化・12種類イベント・4段階重要度・自動アラート
5. **NoSQLインジェクション対策** - MongoDB演算子検出・ObjectID検証・プロトタイプ汚染防止
6. **CSP設定** - Content Security Policy本番環境対応・違反レポート収集
7. **セキュリティテスト** - Jest単体テスト・侵入テストスクリプト・自動化

## 🛡️ セキュリティ機能詳細

### 1. XSS対策（Cross-Site Scripting）

#### 実装コンポーネント
- **DOMPurify統合**: `npm install dompurify @types/dompurify`
- **SafeContentコンポーネント**: `src/components/SafeContent.tsx`
- **サニタイザーユーティリティ**: `src/utils/security/sanitizer.ts`
- **XSS検出システム**: リアルタイム検出・監査ログ記録

#### 使用方法
```tsx
import { SafeContent } from '@/components/SafeContent';

// XSS対策済みコンテンツ表示
<SafeContent 
  content={userInput} 
  type="post" 
  showWarning={true} 
/>
```

#### 対策範囲
- Script注入攻撃（`<script>alert(1)</script>`）
- イベントハンドラー攻撃（`<img onerror="alert(1)">`）
- JavaScript:スキーム攻撃
- Data:スキーム攻撃
- エンコードされた攻撃パターン

### 2. CSRF対策（Cross-Site Request Forgery）

#### 実装システム
- **トークン生成**: `src/lib/security/csrf.ts`
- **自動検証**: Origin/Refererヘッダーチェック
- **API統合**: `/api/security/csrf`でトークン提供
- **セッション連携**: NextAuth.jsセッションIDとの紐付け

#### トークン管理
```typescript
// CSRF トークン生成
const token = generateCSRFToken(sessionId);

// トークン検証
const isValid = validateCSRFToken(token);

// 期限切れトークン自動クリーンアップ（15分）
cleanupExpiredTokens();
```

### 3. レート制限（要件準拠: 1分5回）

#### 制限設定
```typescript
// 要件準拠の制限設定
const SECURITY_CONFIG = {
  API_LIMIT: {
    maxAttempts: 5,        // 1分間に5回まで（要件準拠）
    windowMs: 60 * 1000,   // 1分間
    lockoutMs: 5 * 60 * 1000, // 5分ロック
  }
};
```

#### 制限レベル
- **API制限**: 1分5回（要件準拠）
- **認証制限**: 1分5回（厳格）
- **一般制限**: 1分5回（統一）
- **違反ログ**: 自動記録・監査システム連携

### 4. セキュリティ監査ログシステム

#### ログデータベース構造
```typescript
// 監査ログモデル（MongoDB）
interface AuditLog {
  type: SecurityEventType;     // 12種類のイベント
  severity: SecuritySeverity;  // 4段階の重要度
  userId?: string;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  details: any;
  timestamp: Date;
  resolved: boolean;
}
```

#### セキュリティイベント種類（12種類）
1. `AUTH_FAILURE` - 認証失敗
2. `PERMISSION_DENIED` - 権限拒否
3. `XSS_ATTEMPT` - XSS攻撃試行
4. `CSRF_VIOLATION` - CSRF違反
5. `RATE_LIMIT` - レート制限違反
6. `SUSPICIOUS_ACTIVITY` - 疑わしい活動
7. `SQL_INJECTION` - SQLインジェクション（NoSQL含む）
8. `FILE_ACCESS_VIOLATION` - ファイルアクセス違反
9. `BRUTE_FORCE` - ブルートフォース攻撃
10. `ACCOUNT_LOCKOUT` - アカウントロック
11. `UNUSUAL_ACCESS_PATTERN` - 異常なアクセスパターン
12. `CSP_VIOLATION` - CSP違反

#### 重要度レベル（4段階）
- **LOW**: 軽微なセキュリティイベント
- **MEDIUM**: 注意が必要なイベント
- **HIGH**: 重要なセキュリティ違反
- **CRITICAL**: 即座の対応が必要な重大な脅威

### 5. NoSQLインジェクション対策

#### 入力検証・サニタイゼーション
```typescript
// MongoDB演算子検出・除去
export function sanitizeMongoQuery(input: any): any {
  if (typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      // $で始まるキーを除去（MongoDB演算子）
      if (key.startsWith('$')) {
        console.warn('🚨 NoSQLインジェクション検出:', { key, value });
        continue;
      }
      // プロトタイプ汚染防止
      if (key === '__proto__' || key === 'constructor') {
        continue;
      }
      sanitized[key] = sanitizeMongoQuery(value);
    }
    return sanitized;
  }
  return input;
}
```

#### ObjectID検証
```typescript
// MongoDB ObjectID の厳格な検証
export function validateObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  if (!/^[0-9a-fA-F]{24}$/.test(id)) return false;
  return mongoose.Types.ObjectId.isValid(id);
}
```

### 6. CSP（Content Security Policy）設定

#### 本番環境CSP
```typescript
const productionCSP = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  form-action 'self';
  upgrade-insecure-requests;
`.replace(/\n/g, ' ').trim();
```

#### CSP違反レポート
- **レポート受信**: `/api/security/csp-report`
- **ログ記録**: 監査システム統合
- **アラート**: 重要な違反の自動通知

## 🧪 セキュリティテスト

### Jest単体テスト
```bash
# XSS対策テスト
npm run test src/utils/security/__tests__/sanitizer.test.ts

# CSRF対策テスト
npm run test src/lib/security/__tests__/csrf.test.ts

# NoSQL対策テスト
npm run test src/lib/security/__tests__/input-validation.test.ts
```

### 侵入テストスクリプト
```bash
# 包括的セキュリティテスト実行
node scripts/test-security-phase5.js

# テスト項目：
# - XSSペイロード攻撃テスト
# - CSRFリクエスト偽装テスト
# - NoSQLインジェクション試行
# - レート制限テスト（1分5回）
# - 監査ログ機能確認
```

### テスト結果例
```
📊 Phase 5 セキュリティテスト結果サマリー
========================================

XSS: 成功: 6/6 (100%)
CSRF: 成功: 3/3 (100%)
NOSQL: 成功: 4/4 (100%)
RATE_LIMIT: 成功: 1/1 (100%)
AUDIT: 成功: 1/1 (100%)

全体結果: 15/15 (100%)
🎉 Phase 5 セキュリティ強化: 合格基準達成！
```

## 🔧 API管理・統計

### セキュリティ管理API

#### 監査ログ管理
```typescript
// 統計取得
GET /api/security/audit?action=statistics&days=7

// 脅威評価
GET /api/security/audit?action=threat-assessment&ip=192.168.1.1

// 最近のイベント
GET /api/security/audit?action=recent-events&limit=50

// イベント解決マーク
PATCH /api/security/audit
{
  "eventId": "event_id",
  "notes": "解決済み"
}
```

#### CSRF管理
```typescript
// トークン生成
GET /api/security/csrf

// トークン統計
GET /api/security/csrf?action=stats
```

### ダッシュボード統合

#### 管理者ダッシュボード
- **攻撃統計**: リアルタイム脅威監視
- **IP管理**: ブロック解除・制限状況
- **イベント管理**: 解決済みマーク・詳細分析
- **アラート設定**: 重要度別通知設定

## 📈 パフォーマンス・最適化

### キャッシュ戦略
- **LRUキャッシュ**: レート制限・CSRF情報の高速アクセス
- **MongoDB TTL**: 監査ログの自動期限管理（90日）
- **メモリ最適化**: 定期的なキャッシュクリーンアップ

### セキュリティメトリクス
```typescript
// セキュリティパフォーマンス目標
const PERFORMANCE_TARGETS = {
  XSS_DETECTION: '<10ms',      // XSS検出応答時間
  CSRF_VALIDATION: '<5ms',     // CSRF検証時間
  RATE_LIMIT_CHECK: '<2ms',    // レート制限チェック
  AUDIT_LOG_WRITE: '<50ms',    // 監査ログ記録
  NOSQL_SANITIZATION: '<3ms'   // NoSQL入力サニタイゼーション
};
```

## 🚀 本番環境デプロイ

### 環境変数追加
```bash
# セキュリティ設定（Phase 5追加）
CSP_REPORT_URL=https://your-domain.com/api/security/csp-report
SECURITY_AUDIT_RETENTION_DAYS=90
RATE_LIMIT_REDIS_URL=redis://localhost:6379  # オプション: Redis使用時
```

### セキュリティヘッダー
```typescript
// Next.js設定（next.config.js）
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

## 💡 ベストプラクティス

### 1. セキュリティ運用
- **定期監視**: 監査ログの日次確認
- **脅威分析**: 週次セキュリティレポート確認
- **アップデート**: セキュリティライブラリの定期更新
- **テスト**: 月次侵入テスト実行

### 2. 開発時の注意事項
- **入力検証**: 全てのユーザー入力をサニタイズ
- **権限チェック**: API実行前の認証・認可確認
- **ログ記録**: セキュリティイベントの確実な記録
- **エラーハンドリング**: セキュリティ情報の漏洩防止

### 3. 継続的改善
- **メトリクス監視**: セキュリティパフォーマンスの追跡
- **脆弱性スキャン**: 定期的なセキュリティ診断
- **教育・訓練**: チーム全体のセキュリティ意識向上

## 🔗 関連ドキュメント

- **[CLAUDE.md](./CLAUDE.md)** - プロジェクト概要・実装状況
- **[会員制掲示板CRUD機能](./README-board-crud.md)** - Phase 4.5実装内容
- **[プロフィール機能](./README-profile.md)** - Phase 4実装内容
- **[認証トラブルシューティング](./README-auth-troubleshooting.md)** - 認証問題解決

Phase 5のセキュリティ強化により、本格的なエンタープライズ級の会員制掲示板システムが完成しました。OWASP Top 10に対応した多層防御システムにより、安全で信頼性の高いWebアプリケーションとして運用可能です。