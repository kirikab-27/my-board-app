# SNS管理画面セキュリティ設計書

## 🛡️ セキュリティ基本方針

**原則**: Defense in Depth（多層防御）・Zero Trust・最小権限・完全監査

---

## 🔐 認証・認可設計

### **管理者認証システム**

#### **認証要素**
1. **何かを知っている**: パスワード（最小12文字・複雑性要求）
2. **何かを持っている**: 2FAデバイス・TOTPアプリ
3. **何かである**: 将来拡張（生体認証・証明書認証）

#### **セキュア認証フロー**
```typescript
// 段階的認証実装
export async function secureAdminLogin(credentials: AdminCredentials) {
  // Phase 1: 基本認証
  const user = await validateCredentials(credentials);
  if (!user) throw new AuthenticationError('Invalid credentials');
  
  // Phase 2: 管理者権限確認
  if (!isAdminUser(user)) throw new AuthorizationError('Admin access required');
  
  // Phase 3: IP制限確認
  const clientIP = getClientIP();
  if (!isAllowedIP(clientIP)) {
    await logSecurityEvent('ip_violation', { userId: user.id, ip: clientIP });
    throw new SecurityError('IP not whitelisted');
  }
  
  // Phase 4: 2FA確認（有効時）
  if (user.twoFactorEnabled) {
    return await initiate2FAChallenge(user);
  }
  
  // Phase 5: セッション作成
  const session = await createSecureSession(user);
  await logAdminLogin(user, session);
  
  return session;
}
```

### **セッション管理**

#### **セキュアセッション設定**
- **有効期限**: 30分（アイドルタイムアウト）
- **更新**: 操作時自動延長（最大4時間）
- **無効化**: ログアウト・権限変更・異常検知時
- **保護**: HttpOnly・Secure・SameSite=Strict

#### **セッション監視**
```typescript
interface AdminSession {
  sessionId: string;
  userId: ObjectId;
  adminLevel: AdminLevel;
  
  // セキュリティ
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  
  // 制約
  maxInactiveTime: number;     // 最大非活動時間
  allowedIPs: string[];        // 許可IP
  deviceFingerprint: string;   // デバイス識別
  
  // 状態
  isActive: boolean;
  revokedAt?: Date;
  revokedReason?: string;
}
```

---

## 🔍 脅威分析・対策

### **OWASP Top 10対策**

#### **A1: Injection**
- **対策**: パラメータ化クエリ・入力検証・ORM使用
- **実装**: Mongoose・Zod validation・サニタイゼーション
```typescript
// 安全なクエリ実装例
export async function getUsers(filters: UserFilters) {
  const query = User.find();
  
  // 安全なフィルタ適用
  if (filters.name) {
    query.where('name').regex(escapeRegex(filters.name), 'i');
  }
  
  if (filters.role) {
    query.where('role').in(validateRoles(filters.role));
  }
  
  return await query.exec();
}
```

#### **A2: Broken Authentication**
- **対策**: 強固認証・セッション管理・レート制限
- **実装**: NextAuth拡張・2FA・セッション監視
- **監視**: ログイン失敗・異常パターン・アラート

#### **A3: Sensitive Data Exposure**
- **対策**: 暗号化・最小開示・アクセス制御
- **実装**: 
```typescript
// 機密データ暗号化
export const encryptSensitiveData = (data: string): string => {
  const key = process.env.ENCRYPTION_KEY;
  return encrypt(data, key);
};

// レスポンス時の機密データフィルタ
export const sanitizeAdminResponse = (data: AdminUser): PublicAdminUser => {
  const { twoFactorSecret, emergencyCode, ...safe } = data;
  return safe;
};
```

### **管理者機能固有の脅威**

#### **T1: 権限昇格攻撃**
- **脅威**: 一般ユーザーが管理者権限取得
- **対策**: 
  - 権限変更の多段階承認
  - 権限変更ログの完全記録
  - 異常な権限変更の即座検知
```typescript
export async function changeUserRole(
  adminId: string,
  targetUserId: string, 
  newRole: AdminLevel
) {
  // 権限チェック
  const admin = await getAdminUser(adminId);
  if (!canChangeRole(admin.adminLevel, newRole)) {
    throw new AuthorizationError('Insufficient permissions');
  }
  
  // 監査ログ
  await logCriticalAction('role_change', {
    adminId,
    targetUserId,
    oldRole: target.role,
    newRole,
    timestamp: new Date()
  });
  
  // 変更実行
  return await updateUserRole(targetUserId, newRole);
}
```

#### **T2: 内部情報漏洩**
- **脅威**: 管理者による機密情報の不正取得
- **対策**:
  - アクセス最小化・必要最小限の情報表示
  - 全アクセスログ記録・監視
  - 定期的な権限レビュー

#### **T3: システム破壊**
- **脅威**: 管理者権限による意図的・非意図的なシステム損害
- **対策**:
  - 重要操作の確認ダイアログ・多段階承認
  - バックアップ・復旧機能・ロールバック
  - 操作制限・危険操作の段階的実行

---

## 🔒 データ保護・プライバシー

### **個人情報保護**
#### **データ分類**
- **高機密**: パスワード・2FA秘密鍵・個人識別情報
- **機密**: ユーザー行動・投稿内容・統計情報
- **内部**: システム設定・ログ・メタデータ

#### **保護措置**
```typescript
// 個人情報マスキング
export const maskPersonalInfo = (data: UserData): MaskedUserData => {
  return {
    ...data,
    email: maskEmail(data.email),           // example@domain.com → ex***@do***.com
    phone: maskPhone(data.phone),           // 090-1234-5678 → 090-****-5678  
    ipAddress: maskIP(data.ipAddress),      // 192.168.1.100 → 192.168.*.*
  };
};

// 自動データ匿名化
export const anonymizeOldData = async (retentionDays: number) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  await AuditLog.updateMany(
    { timestamp: { $lt: cutoffDate } },
    { 
      $unset: { 
        ipAddress: 1, 
        userAgent: 1, 
        requestData: 1 
      }
    }
  );
};
```

### **データ保存・廃棄**
- **保存期間**: 監査ログ1年・統計データ3年・個人情報最小化
- **自動廃棄**: 期限切れデータの自動削除・匿名化
- **復旧**: 誤操作対応・バックアップからの復元・期限付き復旧

---

## 🚨 インシデント対応

### **セキュリティインシデント分類**

#### **Level 1: Critical**
- **不正アクセス成功**: 管理者権限奪取・システム侵害
- **データ漏洩**: 大量個人情報流出・機密情報露出
- **システム破壊**: 意図的破壊・重要データ削除

#### **Level 2: High**  
- **認証失敗多発**: ブルートフォース攻撃・辞書攻撃
- **権限昇格試行**: 一般ユーザーの管理者権限取得試行
- **異常操作**: 大量データ操作・異常パターン

#### **Level 3: Medium**
- **IP制限違反**: 許可外IPからのアクセス試行
- **操作異常**: 通常外時間・頻度・パターンの操作

### **対応プロセス**
```typescript
// インシデント検知・対応
export class SecurityIncidentHandler {
  async handleIncident(
    level: 'critical' | 'high' | 'medium',
    type: IncidentType,
    details: IncidentDetails
  ) {
    // 1. 即座対応
    if (level === 'critical') {
      await this.emergencyLockdown(details.targetId);
    }
    
    // 2. ログ記録
    await this.logSecurityIncident(level, type, details);
    
    // 3. 通知
    await this.notifySecurityTeam(level, type, details);
    
    // 4. 自動対策
    await this.executeCountermeasures(type, details);
    
    // 5. 報告書生成
    await this.generateIncidentReport(level, type, details);
  }
}
```

---

## 🔧 実装セキュリティガイドライン

### **コーディング規約**

#### **入力検証**
```typescript
// 全入力の検証・サニタイゼーション
export const adminInputValidation = z.object({
  userId: z.string().uuid(),
  action: z.enum(['suspend', 'restore', 'delete']),
  reason: z.string().min(10).max(500),
  // XSS対策・SQLインジェクション対策
}).transform(data => ({
  ...data,
  reason: sanitizeHTML(data.reason)
}));
```

#### **エラーハンドリング**
```typescript
// セキュリティを考慮したエラー処理
export function handleAdminError(error: Error, context: AdminContext) {
  // 1. 機密情報を含まないエラーメッセージ
  const safeMessage = sanitizeErrorMessage(error.message);
  
  // 2. 詳細ログ（内部のみ）
  logger.error('Admin operation failed', {
    adminId: context.adminId,
    operation: context.operation,
    error: error.stack,
    timestamp: new Date()
  });
  
  // 3. ユーザーには安全なメッセージ
  return {
    success: false,
    message: safeMessage,
    timestamp: new Date()
  };
}
```

### **監査・コンプライアンス**
- **操作記録**: 全管理者操作の完全記録・改ざん防止
- **アクセスログ**: 詳細ログ・パターン分析・異常検知
- **レビュープロセス**: コード・設定・権限の定期レビュー
- **コンプライアンス**: GDPR・個人情報保護法・業界標準準拠

---

**注意**: このセキュリティ設計は**enterprise級の要求**を満たすように設計されており、**段階的実装**により確実にセキュリティを確保します。