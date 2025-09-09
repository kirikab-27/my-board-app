# Vercel Build Error - Issue #60

**Date**: 2025-01-10  
**Time**: 07:09:10 JST  
**Issue**: #60 - レポート・通報システム  
**Commit**: 9745c9e

## エラー概要

TypeScriptコンパイルエラー - MongooseのソートオプションでSortOrder型エラー

## エラーメッセージ

```
./src/app/api/reports/route.ts:128:31
Type error: Argument of type '{ priority: number; createdAt: number; }' is not assignable to parameter of type 'string | { [key: string]: SortOrder | { $meta: any; }; } | [string, SortOrder][] | null | undefined'.
  Type '{ priority: number; createdAt: number; }' is not assignable to type '{ [key: string]: SortOrder | { $meta: any; }'.
    Property 'priority' is incompatible with index signature.
      Type 'number' is not assignable to type 'SortOrder | { $meta: any; }'.
```

## 問題箇所

```typescript
// src/app/api/reports/route.ts:128
const sortOptions = { priority: -1, createdAt: -1 };
Report.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
```

## 原因分析

MongooseのTypeScript型定義が厳格になり、`sort()`メソッドの引数に`SortOrder`型を要求している。
`number`型（-1や1）を直接使用できない。

## 解決方法

1. `SortOrder`型を使用して明示的な型指定
2. または文字列形式での指定（'desc', 'asc'）
3. as constアサーションの使用

## 実装した修正

```typescript
import { SortOrder } from 'mongoose';

// 修正前
const sortOptions = { priority: -1, createdAt: -1 };

// 修正後
const sortOptions: { [key: string]: SortOrder } = {
  priority: -1 as SortOrder,
  createdAt: -1 as SortOrder,
};
```

## 修正ファイル

- src/app/api/reports/route.ts

## テスト結果

- ローカルビルド: ✅ 成功
- TypeScriptチェック: ✅ パス
- Vercelデプロイ: 🔄 確認中

## 教訓

- Mongoose型定義の更新に注意
- ビルドエラー時は型定義を確認
- 数値リテラルよりSortOrder型を使用
