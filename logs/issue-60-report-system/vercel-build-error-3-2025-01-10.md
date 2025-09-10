# Vercel Build Error - GridRowSelectionModel残存エラー

## 発生日時

2025-01-10 07:15:22 UTC

## エラー内容

```
Type error: Conversion of type 'GridRowSelectionModel' to type 'GridRowId[]' may be a mistake
```

## エラー詳細

```typescript
./src/components/admin/reports/ReportManagementGrid.tsx:311:70
Type error: Conversion of type 'GridRowSelectionModel' to type 'GridRowId[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'GridRowSelectionModel' is missing the following properties from type 'GridRowId[]': length, pop, push, concat, and 35 more.

  309 |         checkboxSelection
  310 |         disableRowSelectionOnClick
> 311 |         onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection as GridRowId[])}
      |                                                                      ^
  312 |         rowSelectionModel={selectedRows}
```

## 原因分析

前回のコミット(e9f3320)の修正が不完全だった。311行目にまだ古いコードが残存している。

## 解決策

311行目の `as GridRowId[]` キャストを削除する必要がある。

## 修正内容

```typescript
// 誤ったコード（311行目）
onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection as GridRowId[])}

// 正しいコード
onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}
```

## 関連ファイル

- src/components/admin/reports/ReportManagementGrid.tsx
