# API INTERNAL_SERVER_ERROR記録

## 発生日時
2025-09-08 21:20 JST

## エラー概要
管理者ユーザー管理画面でのAPI呼び出し時にINTERNAL_SERVER_ERRORが発生

## エラー詳細

### エラーメッセージ
```
Error: INTERNAL_SERVER_ERROR
    at UserManagementGrid.useCallback[fetchUsers] (webpack-internal:///(app-pages-browser)/./src/app/admin/users/UserManagementGrid.tsx:94:27)
```

### 発生箇所
- **ファイル**: `src/app/admin/users/UserManagementGrid.tsx`
- **関数**: `fetchUsers`
- **行番号**: 94-108

### 問題のコード
```typescript
const response = await fetch(`/api/admin/users?${params}`);
const result = await response.json();

if (result.success) {
  setUsers(result.data.users);
  setTotalRows(result.data.pagination.totalCount);
} else {
  throw new Error(result.error); // ← ここでエラー
}
```

## 原因分析

### 直接原因
`/api/admin/users` エンドポイントがエラーレスポンスを返している

### 根本原因候補
1. **MongoDB接続エラー**: データベース接続が確立できていない
2. **認証エラー**: セッション検証が失敗
3. **権限エラー**: 管理者権限チェックが失敗
4. **データベースクエリエラー**: User.find()実行時のエラー

### エラー発生フロー
1. UserManagementGridコンポーネントマウント
2. useEffect内でfetchUsers実行
3. `/api/admin/users` APIコール
4. APIがエラーレスポンス返却
5. `result.success === false`のため例外throw

## 修正内容

### 修正1: APIエラーハンドリング改善
```typescript
// src/app/api/admin/users/route.ts
export async function GET(request: NextRequest) {
  try {
    // セッション検証
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized: Please login'
      }, { status: 401 });
    }

    // 権限チェック
    if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Admin access required'
      }, { status: 403 });
    }

    // MongoDB接続
    await connectDB();
    
    // データ取得処理
    // ...
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}
```

### 修正2: フロントエンドエラー表示改善
```typescript
// UserManagementGrid.tsx
const fetchUsers = useCallback(async () => {
  setLoading(true);
  try {
    const response = await fetch(`/api/admin/users?${params}`);
    
    if (!response.ok) {
      // HTTPステータスコードで判断
      if (response.status === 401) {
        throw new Error('認証が必要です。ログインしてください。');
      } else if (response.status === 403) {
        throw new Error('管理者権限が必要です。');
      } else {
        throw new Error(`サーバーエラー: ${response.status}`);
      }
    }
    
    const result = await response.json();
    // ...
  } catch (error) {
    console.error('Failed to fetch users:', error);
    setSnackbar({
      open: true,
      message: error instanceof Error ? error.message : 'ユーザーデータの取得に失敗しました',
      severity: 'error',
    });
  } finally {
    setLoading(false);
  }
}, [paginationModel, sortModel, filterModel]);
```

### 修正3: 開発環境用デバッグ情報追加
```typescript
// APIルートにデバッグログ追加
console.log('[Admin Users API] Session:', {
  exists: !!session,
  user: session?.user?.email,
  role: session?.user?.role
});

console.log('[Admin Users API] Query params:', {
  page: searchParams.get('page'),
  limit: searchParams.get('limit'),
  sortBy: searchParams.get('sortBy'),
  sortOrder: searchParams.get('sortOrder')
});
```

## 影響評価
- **機能影響**: ユーザー管理画面が使用不可
- **ユーザー影響**: 管理者がユーザー管理機能を利用できない
- **データ影響**: なし（読み取り専用操作）

## テスト手順
1. 管理者アカウントでログイン
2. `/admin/users` にアクセス
3. データが正常に表示されることを確認
4. ページネーション、ソート、フィルター機能を確認
5. エラーメッセージが適切に表示されることを確認

## 今後の対応
1. エラーログ収集システムの実装（Sentry統合済み）
2. APIエラーレスポンスの標準化
3. リトライ機能の実装
4. オフライン対応の検討

## 関連Issue
- Issue #58: ユーザー管理システム実装
- Issue #49: NextAuth認証システムの修復

## 参考リンク
- [Next.js API Routes Error Handling](https://nextjs.org/docs/api-routes/introduction)
- [NextAuth.js Session Management](https://next-auth.js.org/getting-started/session)