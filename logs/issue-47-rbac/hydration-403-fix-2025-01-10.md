# Hydrationエラー・403エラー修正記録

## 発生日時

2025-01-10 22:45 JST

## 報告されたエラー

### 1. Hydrationエラー

```
Error: Hydration failed because the server rendered HTML didn't match the client. See more info here: https://nextjs.org/docs/messages/react-hydration-error
Attempted to synchronously unmount a root while React was already rendering. React cannot finish unmounting the root until the current render has completed.
```

### 2. RBAC API 403 Forbidden

```
GET http://localhost:3010/api/admin/rbac/roles 403 (Forbidden)
GET http://localhost:3010/api/admin/rbac/permissions 403 (Forbidden)
```

## 原因分析

### Hydrationエラーの原因

**問題箇所**: `src/components/admin/AdminLayoutEnhanced.tsx` lines 126-128

```typescript
// 問題のあるコード（修正前）
const [basicMenuOpen, setBasicMenuOpen] = useState(() => getInitialMenuState('basic'));
const [systemMenuOpen, setSystemMenuOpen] = useState(() => getInitialMenuState('system'));
const [securityMenuOpen, setSecurityMenuOpen] = useState(() => getInitialMenuState('security'));
```

`getInitialMenuState`関数内で`localStorage`にアクセスしていたため、サーバーサイドレンダリング（SSR）時とクライアントサイドレンダリング（CSR）時でHTMLが異なっていた。

### 403エラーの原因

RBACミドルウェアでAdminUserレコードが存在しないユーザーに対して権限チェックが失敗していた。
開発環境用のバイパスが既に実装済みだが、権限の割り当てが不足していた可能性。

## 実施した修正

### 1. Hydrationエラーの修正

**修正内容**: localStorage初期化をuseEffectに移動

```typescript
// 修正後のコード
// アコーディオンの開閉状態（初期値はサーバー・クライアント共通）
const [basicMenuOpen, setBasicMenuOpen] = useState(activeGroup === 'basic');
const [systemMenuOpen, setSystemMenuOpen] = useState(activeGroup === 'system');
const [securityMenuOpen, setSecurityMenuOpen] = useState(activeGroup === 'security');

// クライアントサイドでlocalStorageから状態を復元
useEffect(() => {
  if (typeof window !== 'undefined') {
    const savedBasic = localStorage.getItem('admin-menu-basic');
    const savedSystem = localStorage.getItem('admin-menu-system');
    const savedSecurity = localStorage.getItem('admin-menu-security');

    if (savedBasic !== null) setBasicMenuOpen(savedBasic === 'true');
    if (savedSystem !== null) setSystemMenuOpen(savedSystem === 'true');
    if (savedSecurity !== null) setSecurityMenuOpen(savedSecurity === 'true');
  }
}, []);
```

また、不要になった`getInitialMenuState`関数を削除。

### 2. 403エラーの対策

既存の開発環境バイパス（`src/middleware/rbac.ts` lines 48-65）が実装済み：

```typescript
if (!adminUser && process.env.NODE_ENV === 'development') {
  const userRole = (session.user as any).role;
  if (userRole === 'admin' || userRole === 'moderator') {
    console.warn('⚠️ Development mode: Bypassing AdminUser check for', session.user.email);
    return {
      allowed: true,
      user: {
        userId: session.user.id,
        adminRole: userRole,
        email: session.user.email,
        permissions: ['admins.read', 'admins.update', 'users.read', 'posts.read'],
      },
    };
  }
}
```

NextAuth設定（`src/lib/auth/nextauth.ts`）でセッションにroleが正しく設定されていることを確認：

```typescript
session.user.role = (token.role as UserRole) || 'user';
```

## ポート3010の状況

現在、プロセスID 20360がポート3010を使用中。
Next.jsサーバーが正常に稼働していると思われるが、複数の開発サーバー起動試行により混乱が生じている。

## 残課題

1. **ポート3010のプロセス確認**
   - プロセスID 20360が正しいNext.jsサーバーか確認が必要
   - 必要に応じて再起動

2. **403エラーの完全解決**
   - 開発環境バイパスが正しく動作しているか確認
   - AdminUserレコードの作成スクリプト実行を検討

3. **背景プロセスのクリーンアップ**
   - 複数の背景プロセスが起動中
   - 不要なプロセスの終了が必要

## ベストプラクティス

### Hydrationエラー防止

1. **localStorage/sessionStorage**: 必ずuseEffect内でアクセス
2. **window/document**: typeof window !== 'undefined'でチェック
3. **初期状態**: SSR/CSRで同じ値になるよう設計
4. **動的インポート**: クライアント専用コンポーネントはdynamic importを使用

### RBAC実装

1. **開発環境**: 適切なバイパス実装で開発効率向上
2. **本番環境**: バイパスコードの削除を忘れずに
3. **AdminUser移行**: 既存ユーザーのAdminUserレコード作成スクリプトが必要

## ステータス

- ✅ Hydrationエラー修正完了
- ⚠️ 403エラー部分対応（開発環境バイパス実装済み）
- ⚠️ ポート3010の状況確認必要

---

_記録者: Claude Code_
_Issue #47 関連エラー対応_
