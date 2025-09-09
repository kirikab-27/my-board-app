# Vercel Build Error - Issue #59

**日時**: 2025-09-09 22:08
**Issue**: #59 投稿管理システム（AI自動モデレーション）

## エラー概要

Vercelビルド時にNext.js 15.4.5のApp Router動的ルートパラメータ型エラーが発生

## エラーメッセージ

```
src/app/api/admin/posts/[id]/route.ts
Type error: Route "src/app/api/admin/posts/[id]/route.ts" has an invalid "DELETE" export:
  Type "{ params: { id: string; }; }" is not a valid type for the function's second argument.
```

## 原因

Next.js 15.4.5のApp Routerでは、動的ルートのparamsがPromiseとして扱われるように変更された。
古い同期的なparams取得方法が使用されているため、型エラーが発生。

## 修正内容

### 修正前

```typescript
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  // ...
}
```

### 修正後

```typescript
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const { id } = params;
  // ...
}
```

## 影響範囲

- `/api/admin/posts/[id]/route.ts` - PATCH関数とDELETE関数の両方

## 対応策

1. 両方の関数でparamsをPromiseとして扱うように修正
2. awaitを使用して非同期的にparamsを取得
3. Next.js 15.4.5の新しいAPI仕様に準拠

## 関連ドキュメント

- [Next.js 15 App Router Migration Guide](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- Issue #59: 投稿管理システム実装
