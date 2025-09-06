# 認証コードシステム仕様書

## 🔐 概要

my-board-app の認証コード生成・管理システムです。管理者登録、パスワードリセット、二要素認証、メール認証に対応した、エンタープライズグレードのセキュリティ機能を提供します。

## 🎯 設計目標

- **暗号学的安全性**: crypto.randomInt()による予測不可能なコード生成
- **ブルートフォース対策**: 試行制限・自動ロック・レート制限
- **タイミング攻撃対策**: 定数時間レスポンス・情報漏洩防止
- **可用性**: 高速レスポンス・自動クリーンアップ・スケーラビリティ
- **監査性**: 包括的ログ・統計・異常検知

## 📋 機能仕様

### 1. 認証コード生成

```typescript
interface CodeGenerationRequest {
  email: string;              // 対象メールアドレス
  type: VerificationType;     // 認証種別
  ipAddress: string;          // 要求元IP
  userAgent?: string;         // User-Agent
  sessionId?: string;         // セッション識別子
  metadata?: Record<string, any>; // 追加メタデータ
}
```

**生成仕様**:
- **形式**: 6桁数字 (100000-999999)
- **乱数**: `crypto.randomInt()` 使用（暗号学的に安全）
- **有効期限**: 10分
- **重複防止**: 同時存在チェック
- **レート制限**: IP・メールベース多層制限

### 2. 認証種別

| 種別 | 説明 | 用途 | 有効期限 |
|------|------|------|----------|
| `admin_registration` | 管理者登録 | 招待制管理者登録 | 10分 |
| `password_reset` | パスワードリセット | パスワード忘れ対応 | 10分 |
| `2fa` | 二要素認証 | ログイン時の追加認証 | 10分 |
| `email_verification` | メール認証 | 新規登録メール確認 | 10分 |

### 3. セキュリティ機能

#### レート制限（多層防御）

| 制限種別 | 時間窓 | 最大回数 | ブロック期間 |
|----------|--------|----------|-------------|
| IP生成制限 | 1時間 | 10回 | 30分 |
| メール生成制限 | 1時間 | 5回 | 1時間 |
| IP検証制限 | 10分 | 20回 | 15分 |
| メール検証制限 | 1時間 | 10回 | 30分 |
| 再送信制限 | 10分 | 2回 | 10分 |

#### ブルートフォース対策

```typescript
// 3回失敗で15分ロック
attempts >= 3 → lockedUntil = now + 15分

// 試行制限詳細
interface FailurePolicy {
  maxAttempts: 3;           // 最大試行回数
  lockDuration: 15 * 60;    // ロック期間（秒）
  unlockCondition: 'time';  // 時間経過でのみ解除
}
```

#### タイミング攻撃対策

```typescript
// 全レスポンス500ms以上の固定時間
const minResponseTime = 500;
await enforceMinResponseTime(startTime, minResponseTime);

// 定数時間文字列比較
function constantTimeCompare(a: string, b: string): boolean {
  // ビット演算による時間一定化
}
```

## 🗄️ データベース設計

### VerificationCode コレクション

```typescript
interface IVerificationCode {
  _id: ObjectId;
  email: string;              // インデックス
  code: string;               // 6桁（暗号化保存推奨）
  type: VerificationType;     // インデックス
  expiresAt: Date;           // TTLインデックス
  createdAt: Date;           // インデックス
  used: boolean;             // インデックス
  usedAt?: Date;
  attempts: number;          // 試行回数
  lastAttemptAt?: Date;
  lockedUntil?: Date;        // ロック解除時刻
  ipAddress: string;         // インデックス
  userAgent?: string;
  metadata?: Record<string, any>;
}
```

**インデックス設計**:
```javascript
// 複合インデックス（パフォーマンス最適化）
{ email: 1, type: 1, used: 1 }
{ email: 1, code: 1, used: 1 }
{ ipAddress: 1, createdAt: 1 }
{ expiresAt: 1 } // TTLインデックス（自動削除）
```

### VerificationAttempt コレクション

```typescript
interface IVerificationAttempt {
  _id: ObjectId;
  email: string;              // インデックス
  type: VerificationType;
  attemptedCode: string;      // 暗号化保存
  result: AttemptResult;      // インデックス
  ipAddress: string;          // インデックス
  userAgent?: string;
  timestamp: Date;            // TTLインデックス
  responseTime: number;       // ms
  sessionId?: string;
  riskScore: number;          // 0-100
  metadata?: Record<string, any>;
}
```

**結果種別**:
- `success`: 認証成功
- `invalid_code`: コード不正
- `expired`: 期限切れ
- `locked`: ロック中
- `rate_limited`: レート制限
- `used`: 使用済み

## 🚀 API仕様

### 1. コード生成API

```http
POST /api/admin/verification/generate
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "user@example.com",
  "type": "admin_registration",
  "metadata": {
    "invitedBy": "admin@example.com",
    "reason": "新規管理者招待"
  }
}
```

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "type": "admin_registration",
    "code": "123456",
    "expiresAt": "2024-01-15T10:30:00Z",
    "generatedBy": "admin@example.com",
    "generatedAt": "2024-01-15T10:20:00Z"
  },
  "rateLimit": {
    "remaining": 4,
    "resetAt": "2024-01-15T11:20:00Z"
  }
}
```

### 2. コード検証API

```http
POST /api/admin/verification/verify
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456",
  "type": "admin_registration"
}
```

**レスポンス例（成功）**:
```json
{
  "success": true,
  "message": "Verification successful",
  "data": {
    "email": "user@example.com",
    "type": "admin_registration",
    "verifiedAt": "2024-01-15T10:25:00Z",
    "attempts": 1
  }
}
```

**レスポンス例（失敗）**:
```json
{
  "success": false,
  "error": "Invalid code",
  "attempts": 2,
  "lockedUntil": null
}
```

### 3. コード再送信API

```http
POST /api/admin/verification/resend
Authorization: Bearer {user_or_admin_token}
Content-Type: application/json

{
  "email": "user@example.com",
  "type": "admin_registration",
  "reason": "コードが届かない"
}
```

## 🛠️ 使用方法

### 基本的な使用例

```typescript
import { VerificationCodeService } from '@/services/verificationCodeService';

// コード生成
const generateResult = await VerificationCodeService.generateCode({
  email: 'newadmin@example.com',
  type: 'admin_registration',
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
});

if (generateResult.success) {
  console.log('生成されたコード:', generateResult.code);
  // メール送信処理...
}

// コード検証
const verifyResult = await VerificationCodeService.verifyCode({
  email: 'newadmin@example.com',
  code: '123456',
  type: 'admin_registration',
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
});

if (verifyResult.success) {
  console.log('認証成功');
  // 管理者登録完了処理...
}
```

### 管理者向け統計取得

```typescript
// 過去24時間の統計
const stats = await VerificationCodeService.getStatistics(24);

console.log('統計情報:', {
  totalGenerated: stats.totalGenerated,
  totalVerified: stats.totalVerified,
  successRate: `${(stats.successRate * 100).toFixed(1)}%`,
  averageAttempts: stats.averageAttempts.toFixed(1),
  topFailures: stats.topFailureReasons,
});
```

## 🧪 テスト

### テスト実行

```bash
# 全テスト実行
npm run test-verification
npx tsx src/scripts/test-verification.ts

# 特定テストのみ
npm test -- --grep "verification"
```

### テスト項目

1. **乱数品質テスト**: 10,000サンプルで99%以上の一意性確認
2. **コード生成テスト**: 正常な6桁コード生成確認
3. **コード検証テスト**: 正解・不正解の判定確認
4. **レート制限テスト**: 制限値超過時の拒否確認
5. **ブルートフォース対策テスト**: 3回失敗でのロック確認
6. **タイミング攻撃対策テスト**: レスポンス時間の一定性確認
7. **入力バリデーションテスト**: 不正入力の適切な拒否確認
8. **同時実行テスト**: 競合状態での一意性確認
9. **データベースクリーンアップテスト**: 期限切れコードの自動削除確認

### 品質基準

- **テスト合格率**: 100%必須
- **乱数一意性**: 99%以上
- **レスポンス時間**: 500ms±100ms（タイミング攻撃対策）
- **メモリリーク**: なし
- **データベース整合性**: 100%

## 🚨 セキュリティ注意事項

### ⚠️ 絶対に避けるべき実装

```typescript
// ❌ 危険: Math.random() は予測可能
const unsafeCode = Math.floor(Math.random() * 900000) + 100000;

// ❌ 危険: エラーメッセージで情報漏洩
if (user_not_found) return "ユーザーが見つかりません";
if (code_wrong) return "コードが間違っています";

// ❌ 危険: タイミング攻撃脆弱性
if (code !== expectedCode) {
  return immediate_error(); // 即座にエラー
}
```

### ✅ 推奨セキュリティ実装

```typescript
// ✅ 安全: 暗号学的に安全な乱数
const safeCode = crypto.randomInt(100000, 1000000);

// ✅ 安全: 統一エラーメッセージ
return "Verification failed"; // 理由を特定させない

// ✅ 安全: 定数時間レスポンス
await enforceMinResponseTime(startTime, 500);
return unified_error_response();
```

## 📊 監視・メトリクス

### 監視対象

1. **成功率**: 90%以上維持
2. **レスポンス時間**: P99 < 1000ms
3. **レート制限発動**: 異常な増加を検知
4. **ブルートフォース**: 1時間に10回以上で警告
5. **高リスクスコア**: 70以上で警告
6. **データベースサイズ**: 期限切れコードの蓄積監視

### アラート設定

```typescript
// 高リスクパターン検知例
if (attempt.riskScore > 80) {
  alert('HIGH_RISK_VERIFICATION_ATTEMPT', {
    email: attempt.email,
    ipAddress: attempt.ipAddress,
    riskScore: attempt.riskScore,
  });
}
```

## 🔧 運用・保守

### 定期メンテナンス

```bash
# 期限切れコード削除（crontabで日次実行推奨）
0 2 * * * npx tsx src/scripts/cleanup-expired-codes.ts

# 統計レポート生成（週次）
0 9 * * 1 npx tsx src/scripts/generate-verification-report.ts
```

### パフォーマンス最適化

1. **インデックス**: MongoDB クエリ最適化
2. **接続プール**: データベース接続効率化  
3. **キャッシュ**: Redis導入でレート制限高速化
4. **分散**: 複数インスタンスでの負荷分散

### スケーラビリティ

- **水平スケーリング**: ステートレス設計
- **データベース分散**: シャーディング対応
- **キャッシュ層**: Redis Cluster対応
- **監視**: Prometheus/Grafana統合

## 📚 参考資料

- [OWASP Authentication Cheat Sheet](https://owasp.org/www-project-cheat-sheets/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST SP 800-63B Authentication Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

---

**文書バージョン**: 1.0  
**最終更新**: 2024-01-15  
**作成者**: Claude Code  
**承認者**: プロジェクト管理者