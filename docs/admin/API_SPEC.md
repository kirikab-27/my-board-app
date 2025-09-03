# 管理者機能API仕様書

## 📋 概要

my-board-app管理者機能のREST API仕様定義

**Base URL**: `https://kab137lab.com/api/admin`  
**認証**: NextAuth.js Session + Admin Role Check  
**形式**: JSON  
**エラーコード**: HTTP Status + Custom Error Codes

---

## 🔐 認証API

### **POST /api/admin/auth/login**
管理者ログイン

#### Request
```typescript
{
  email: string;           // 管理者メールアドレス
  password: string;        // パスワード
  remember?: boolean;      // ログイン保持
}
```

#### Response (Success: 200)
```typescript
{
  success: true;
  session: {
    adminId: string;
    adminLevel: AdminLevel;
    expiresAt: string;
    require2FA: boolean;   // 2FA必要の場合
  };
  redirectUrl?: string;    // リダイレクト先
}
```

#### Response (Error: 401)
```typescript
{
  success: false;
  error: 'INVALID_CREDENTIALS' | 'ACCOUNT_SUSPENDED' | 'IP_RESTRICTED';
  message: string;
  remainingAttempts?: number;
}
```

### **POST /api/admin/auth/verify-2fa**
2段階認証確認

#### Request
```typescript
{
  sessionToken: string;    // 仮セッショントークン
  code: string;           // 6桁認証コード
}
```

---

## 👥 ユーザー管理API

### **GET /api/admin/users**
ユーザー一覧取得

#### Query Parameters
```typescript
{
  page?: number;          // ページ番号（デフォルト: 1）
  limit?: number;         // 件数（デフォルト: 20、最大: 100）
  search?: string;        // 検索キーワード
  role?: UserRole;        // 権限フィルタ
  status?: UserStatus;    // 状態フィルタ
  sortBy?: 'createdAt' | 'lastSeen' | 'postsCount';
  sortOrder?: 'asc' | 'desc';
}
```

#### Response (Success: 200)
```typescript
{
  success: true;
  data: {
    users: AdminUserView[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    aggregations: {
      totalUsers: number;
      activeUsers: number;
      suspendedUsers: number;
      byRole: Record<UserRole, number>;
    };
  };
}
```

### **GET /api/admin/users/[id]**
ユーザー詳細取得

#### Response (Success: 200)
```typescript
{
  success: true;
  data: {
    user: AdminUserView;
    statistics: {
      posts: { total: number; thisMonth: number; };
      engagement: { likesReceived: number; commentsReceived: number; };
      activity: { lastLogin: Date; sessionCount: number; };
    };
    moderationHistory: ModerationRecord[];
    activityLog: UserActivityLog[];
  };
}
```

### **PUT /api/admin/users/[id]**
ユーザー情報更新

#### Request
```typescript
{
  action: 'update_profile' | 'change_role' | 'suspend' | 'restore';
  data: {
    name?: string;
    email?: string;
    role?: UserRole;
    suspensionReason?: string;
    suspensionDuration?: number; // 日数
  };
  reason: string;           // 操作理由（必須）
}
```

### **POST /api/admin/users/bulk-action**
一括ユーザー操作

#### Request
```typescript
{
  userIds: string[];       // 対象ユーザーID配列
  action: 'suspend' | 'restore' | 'delete' | 'change_role';
  parameters: {
    role?: UserRole;       // 権限変更時
    reason: string;        // 操作理由
    duration?: number;     // 停止期間（日数）
  };
  confirmationCode: string; // 安全確認コード
}
```

---

## 📝 投稿管理API

### **GET /api/admin/posts**
投稿一覧取得

#### Query Parameters
```typescript
{
  page?: number;
  limit?: number;
  search?: string;         // タイトル・内容検索
  status?: 'public' | 'hidden' | 'deleted' | 'reported';
  authorId?: string;       // 投稿者ID
  hasMedia?: boolean;      // メディア有無
  startDate?: string;      // 作成日開始
  endDate?: string;        // 作成日終了
  sortBy?: 'createdAt' | 'likes' | 'reportCount';
}
```

### **PUT /api/admin/posts/[id]**
投稿操作

#### Request
```typescript
{
  action: 'hide' | 'restore' | 'delete' | 'edit';
  data?: {
    title?: string;        // 編集時
    content?: string;      // 編集時
    moderationNote?: string; // モデレーションメモ
  };
  reason: string;          // 操作理由
  notifyAuthor: boolean;   // 作者通知
}
```

### **POST /api/admin/posts/bulk-moderation**
一括投稿モデレーション

#### Request
```typescript
{
  postIds: string[];
  action: 'hide' | 'delete' | 'approve';
  category: 'spam' | 'inappropriate' | 'copyright' | 'other';
  reason: string;
  notifyAuthors: boolean;
}
```

---

## 📊 統計・分析API

### **GET /api/admin/stats/dashboard**
ダッシュボード統計

#### Response (Success: 200)
```typescript
{
  success: true;
  data: AdminDashboardStats;
  generatedAt: Date;
  cacheUntil: Date;
}

interface AdminDashboardStats {
  users: {
    total: number;
    active24h: number;
    newToday: number;
    suspended: number;
    byRole: Record<UserRole, number>;
  };
  posts: {
    total: number;
    todayCount: number;
    hiddenCount: number;
    deletedCount: number;
    reportedCount: number;
  };
  engagement: {
    totalLikes: number;
    totalComments: number;
    avgEngagementRate: number;
  };
  moderation: {
    pendingReports: number;
    resolvedToday: number;
    autoModerated: number;
  };
}
```

### **POST /api/admin/stats/custom-report**
カスタムレポート生成

#### Request
```typescript
{
  reportType: 'user_activity' | 'content_analysis' | 'moderation_summary';
  parameters: {
    dateRange: { start: Date; end: Date; };
    filters?: object;
    aggregations?: string[];
    format: 'json' | 'csv' | 'excel';
  };
  schedule?: {             // 定期レポート
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
}
```

---

## 🔍 監査ログAPI

### **GET /api/admin/logs**
監査ログ一覧

#### Query Parameters
```typescript
{
  page?: number;
  limit?: number;
  adminId?: string;        // 実行者ID
  action?: AdminAction;    // 操作タイプ
  targetType?: TargetType; // 対象タイプ
  result?: 'success' | 'failure';
  startDate?: string;
  endDate?: string;
  ipAddress?: string;      // IP検索
  searchTerm?: string;     // フリーワード検索
}
```

### **POST /api/admin/logs/search**
高度ログ検索

#### Request
```typescript
{
  conditions: {
    adminIds?: string[];
    actions?: AdminAction[];
    dateRange: { start: Date; end: Date; };
    ipRanges?: string[];     // CIDR記法対応
    targetIds?: string[];
    customFilters?: object;
  };
  aggregations?: {
    byAdmin: boolean;        // 実行者別集計
    byAction: boolean;       // 操作別集計
    byHour: boolean;         // 時間別集計
  };
}
```

---

## 🔧 エラー処理・状態管理

### **標準エラーレスポンス**
```typescript
interface AdminErrorResponse {
  success: false;
  error: AdminErrorCode;
  message: string;
  details?: object;
  timestamp: Date;
  requestId: string;       // トレース用
}

type AdminErrorCode = 
  | 'AUTHENTICATION_REQUIRED'   // 401
  | 'INSUFFICIENT_PERMISSIONS'  // 403  
  | 'RESOURCE_NOT_FOUND'       // 404
  | 'VALIDATION_ERROR'         // 400
  | 'RATE_LIMIT_EXCEEDED'      // 429
  | 'INTERNAL_SERVER_ERROR'    // 500
  | 'SERVICE_UNAVAILABLE';     // 503
```

### **レート制限**
```typescript
// API別レート制限設定
const RATE_LIMITS = {
  '/api/admin/auth/*': { limit: 5, window: '1m' },      // 認証
  '/api/admin/users/bulk-*': { limit: 3, window: '5m' }, // 一括操作
  '/api/admin/posts/bulk-*': { limit: 5, window: '5m' }, // 一括モデレーション
  '/api/admin/logs/export': { limit: 2, window: '10m' }, // エクスポート
  '/api/admin/stats/*': { limit: 30, window: '1m' },     // 統計
  'default': { limit: 100, window: '1m' }                // デフォルト
};
```

---

## 🧪 テスト要件

### **セキュリティテスト**
- **認証テスト**: 不正ログイン・セッション攻撃・権限昇格
- **認可テスト**: 権限制御・アクセス制御・データアクセス
- **入力検証**: SQLインジェクション・XSS・CSRF

### **パフォーマンステスト**
- **負荷テスト**: 大量データ処理・同時アクセス・レスポンス時間
- **ストレステスト**: 限界値・エラー処理・復旧能力
- **セキュリティ負荷**: ブルートフォース・DDoS・リソース枯渇

---

**重要**: この API 仕様は**セキュリティファースト設計**で、**my-board-app の既存 API との一貫性**を保ちながら、**enterprise級のセキュリティ要件**を満たしています。