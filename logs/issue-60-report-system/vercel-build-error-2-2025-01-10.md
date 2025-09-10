# Vercel Build Error #2 - Issue #60

**Date**: 2025-01-10  
**Time**: 07:15:22 JST  
**Issue**: #60 - レポート・通報システム  
**Commit**: f4631f9

## エラー概要

TypeScriptコンパイルエラー - GridRowSelectionModel型からGridRowId[]への変換エラー

## エラーメッセージ

```
./src/components/admin/reports/ReportManagementGrid.tsx:311:70
Type error: Conversion of type 'GridRowSelectionModel' to type 'GridRowId[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'GridRowSelectionModel' is missing the following properties from type 'GridRowId[]': length, pop, push, concat, and 35 more.
```

## 問題箇所

```typescript
// src/components/admin/reports/ReportManagementGrid.tsx:311
onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection as GridRowId[])}
```

## 原因分析

MUI DataGridのバージョンアップにより、`GridRowSelectionModel`は配列型ではなく、別の型になっている可能性がある。
直接のキャストが型の互換性がないため失敗している。

## 解決方法

1. `unknown`を経由した二段階キャスト
2. Array.from()を使用した配列への変換
3. GridRowSelectionModel型に合わせた state の型変更

## 実装した修正

```typescript
// 修正前
const [selectedRows, setSelectedRows] = useState<GridRowId[]>([]);
onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection as GridRowId[])}

// 修正後（GridRowSelectionModel型を使用 + 初期値修正）
const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}

// 追加修正: GridRowSelectionModelの初期値型エラー
// エラー: Argument of type 'never[]' is not assignable to parameter of type 'GridRowSelectionModel'
// 解決: GridRowSelectionModelは配列または Set のため、型を明示
const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
```

## 修正ファイル

- src/components/admin/reports/ReportManagementGrid.tsx

## テスト結果

- ローカルビルド: ✅ 成功
- TypeScriptチェック: ✅ パス
- Vercelデプロイ: 🔄 確認中

## 教訓

- MUI DataGrid型定義の変更に注意
- 直接キャストできない場合はunknown経由
- ライブラリのバージョンアップ時は型定義を確認
