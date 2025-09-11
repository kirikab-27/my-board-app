# Vercel Build Error - Issue #47 RBAC

## エラー発生日時

2025-01-10 20:47:44 JST

## エラー内容

```
Type error: Property 'createDefaultPermissions' does not exist on type 'Model<any, {}, {}, {}, any, any>'.

  101 |       await Permission.createDefaultPermissions();
      |                        ^
```

## 原因

TypeScriptの型定義でスタティックメソッド`createDefaultPermissions`が認識されていない

## 影響範囲

- `/api/admin/rbac/permissions/route.ts`
- Vercelビルドプロセス

## 解決策

1. Permission モデルに適切な型定義を追加
2. スタティックメソッドのインターフェースを定義
3. モデルエクスポート時に型アサーションを使用

## 修正内容

`src/models/Permission.ts`:

- IPermissionModel インターフェースを追加
- createDefaultPermissions メソッドの型定義
- エクスポート時の型アサーション追加

## ステータス

🔄 修正中
