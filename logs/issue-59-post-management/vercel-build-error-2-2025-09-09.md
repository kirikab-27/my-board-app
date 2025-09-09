# Vercel Build Error 2 - Issue #59

**日時**: 2025-09-09 22:20
**Issue**: #59 投稿管理システム（AI自動モデレーション）

## エラー概要

`/api/admin/posts/route.ts`のuserRole型チェックでTypeScriptエラーが発生

## エラーメッセージ

```
./src/app/api/admin/posts/route.ts:18:60
Type error: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.

> 18 |     if (!session?.user || !['admin', 'moderator'].includes(userRole)) {
      |                                                            ^
```

## 原因

`userRole`が`string | undefined`型だが、`includes()`メソッドは`string`型を要求するため。
前回の修正が`[id]/route.ts`のみに適用され、`route.ts`には適用されていなかった。

## 修正内容

### 修正前

```typescript
const userRole = (session?.user as { role?: string })?.role;
if (!session?.user || !['admin', 'moderator'].includes(userRole)) {
```

### 修正後

```typescript
const userRole = (session?.user as { role?: string })?.role;
if (!session?.user || !userRole || !['admin', 'moderator'].includes(userRole)) {
```

## 影響範囲

- `/api/admin/posts/route.ts` - GET関数とPUT関数の両方

## 対応策

1. userRoleのnullチェックを追加
2. undefinedの場合は権限なしと判定
3. TypeScript strict modeに対応

## 関連ファイル

- `src/app/api/admin/posts/route.ts`
- Issue #59: 投稿管理システム実装
