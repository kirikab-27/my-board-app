# useRequireAuth フック - 認証必須システム完全ガイド

## 📋 概要

`useRequireAuth`は、Next.js 15 + NextAuth.js環境での会員限定ページ保護を簡単にするカスタムフックです。権限制御・自動リダイレクト・エラーハンドリングを統合し、堅牢な認証システムを提供します。

## ✅ 実装完了機能

### 🔑 **コア機能**
- **認証状態管理**: NextAuth.js統合・リアルタイム状態監視
- **権限レベル制御**: user・moderator・admin階層管理
- **自動リダイレクト**: 認証失敗時の適切な画面遷移
- **エラーハンドリング**: 詳細なエラー分類・ユーザーフレンドリーな表示

### 🎯 **高度機能**
- **メール認証必須**: 未認証ユーザーの自動リダイレクト
- **カスタムチェック**: 独自の認証条件設定
- **ローディング管理**: 美しいスケルトン・スピナー表示
- **TypeScript完全対応**: 型安全性・インテリセンス・エラー予防

## 🚀 基本的な使用方法

### **1. シンプルな認証チェック**
```tsx
import { useRequireAuth } from '@/hooks/useRequireAuth';

const ProtectedComponent = () => {
  const { user, isLoading, error } = useRequireAuth();

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">認証が必要です</Alert>;

  return <div>ようこそ、{user?.name}さん！</div>;
};
```

### **2. 管理者権限必須**
```tsx
import { useRequireAdmin } from '@/hooks/useRequireAuth';

const AdminPanel = () => {
  const { user, hasRequiredPermission } = useRequireAdmin();

  if (!hasRequiredPermission) {
    return <Alert severity="warning">管理者権限が必要です</Alert>;
  }

  return <div>管理者画面: {user?.name}</div>;
};
```

### **3. カスタム権限チェック**
```tsx
const PremiumFeature = () => {
  const { user, hasRequiredPermission } = useRequireAuth({
    customCheck: (user) => {
      // 例: プレミアム会員チェック
      return user.role === 'premium' || user.role === 'admin';
    },
    onUnauthorized: () => {
      // カスタムエラーハンドリング
      alert('プレミアム会員限定機能です');
    }
  });

  if (!hasRequiredPermission) return <UpgradePrompt />;
  return <PremiumContent />;
};
```

## 🎨 Material-UI統合例

### **ローディング表示**
```tsx
const LoadingComponent = () => {
  const { isLoading } = useRequireAuth({
    onLoading: () => console.log('認証確認中...')
  });

  if (isLoading) {
    return (
      <Container>
        <Skeleton variant="rectangular" height={200} />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>認証確認中...</Typography>
        </Box>
      </Container>
    );
  }

  return <AuthenticatedContent />;
};
```

### **エラー表示**
```tsx
const ErrorHandlingComponent = () => {
  const { error, recheckAuth, refreshSession } = useRequireAuth();

  if (error) {
    const getErrorMessage = (error: AuthFailureReason) => {
      switch (error) {
        case 'not_authenticated':
          return 'ログインが必要です';
        case 'insufficient_permissions':
          return '権限が不足しています';
        case 'email_not_verified':
          return 'メール認証が完了していません';
        default:
          return '認証エラーが発生しました';
      }
    };

    return (
      <Alert 
        severity="error" 
        action={
          <Box>
            <Button size="small" onClick={recheckAuth}>
              再確認
            </Button>
            <Button size="small" onClick={refreshSession}>
              セッション更新
            </Button>
          </Box>
        }
      >
        {getErrorMessage(error)}
      </Alert>
    );
  }

  return <ProtectedContent />;
};
```

## 📊 権限レベル階層

```typescript
const roleHierarchy = {
  'user': 1,        // 一般ユーザー
  'moderator': 2,   // モデレーター
  'admin': 3        // 管理者
};

// 使用例: モデレーター権限必須（管理者も可）
useRequireAuth({ requiredRole: 'moderator' });
```

## 🔄 自動リダイレクト設定

### **認証失敗時のリダイレクト先**
```typescript
const redirectConfig = {
  'not_authenticated': '/login?callbackUrl={currentPath}',
  'email_not_verified': '/auth/verify-email',
  'insufficient_permissions': '/unauthorized',
  'custom_check_failed': '/access-denied'
};
```

### **カスタムリダイレクト**
```tsx
useRequireAuth({
  redirectTo: '/custom-login',
  onUnauthorized: (reason) => {
    // カスタムロジック
    if (reason === 'not_authenticated') {
      router.push('/special-login-page');
    }
  }
});
```

## 🧪 テスト

### **Jestテスト例**
```typescript
// __tests__/useRequireAuth.test.ts
describe('useRequireAuth', () => {
  test('認証済みユーザーの正常動作', () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated'
    });

    const { result } = renderHook(() => useRequireAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.hasRequiredPermission).toBe(true);
  });

  test('未認証時のリダイレクト', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated'
    });

    renderHook(() => useRequireAuth());

    expect(mockRouter.push).toHaveBeenCalledWith(
      '/login?callbackUrl=%2Fcurrent-path'
    );
  });
});
```

## 🚀 パフォーマンス最適化

### **メモ化とコールバック**
```tsx
const OptimizedComponent = () => {
  const { user, isLoading } = useRequireAuth({
    customCheck: useCallback((user) => {
      return user.createdAt > thirtyDaysAgo;
    }, []),
    onUnauthorized: useCallback((reason) => {
      console.log('Access denied:', reason);
    }, [])
  });

  const memoizedContent = useMemo(() => {
    if (isLoading) return <LoadingSkeleton />;
    return <ExpensiveContent user={user} />;
  }, [user, isLoading]);

  return memoizedContent;
};
```

## 📈 実装効果

### **開発効率**
- **🎯 統一API**: 一貫したインターフェース
- **🔧 型安全性**: TypeScript完全対応
- **⚡ 再利用性**: すべてのページで共通利用

### **UX改善**
- **🔄 自動リダイレクト**: ユーザーの迷いを排除
- **💫 ローディング**: 美しい待機状態
- **🚨 エラーハンドリング**: 分かりやすいメッセージ

### **セキュリティ**
- **🛡️ 多層防御**: ミドルウェア + コンポーネント
- **🔒 権限制御**: ロール階層管理
- **✅ 認証確認**: リアルタイム状態監視

## 🔧 トラブルシューティング

### **よくある問題**

**1. セッションが取得できない**
```typescript
// NextAuthプロバイダーの確認
export default function App({ Component, pageProps }) {
  return (
    <SessionProvider session={pageProps.session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
```

**2. リダイレクトが無限ループ**
```typescript
// hasRedirectedフラグで制御
const [hasRedirected, setHasRedirected] = useState(false);

useEffect(() => {
  if (hasRedirected) return; // 重要
  // リダイレクト処理
}, [hasRedirected]);
```

**3. 権限チェックが正しく動作しない**
```typescript
// ユーザーモデルにroleフィールドを追加
interface User {
  role: 'user' | 'admin' | 'moderator'; // 必須
}
```

## 🎯 今後の拡張予定

### **Phase 3以降での機能追加**
- **リアルタイム権限更新**: WebSocket統合
- **詳細監査ログ**: アクセス履歴記録
- **A/Bテスト統合**: 権限別機能表示
- **外部認証**: SAML・LDAP統合

この認証フックシステムにより、堅牢で使いやすい会員制システムの基盤が完成しました！