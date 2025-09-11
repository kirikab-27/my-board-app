# MUI Grid v7 Compatibility Error - Issue #47 RBAC

## エラー発生日時

2025-01-10 20:53:40 JST

## エラー内容

```typescript
Type error: No overload matches this call.
  Property 'item' does not exist on type 'IntrinsicAttributes & GridBaseProps...

  370 |                 <Grid item xs={12} md={6} key={category}>
      |                  ^
```

## 原因

Material-UI v7でGrid APIが変更された：

- Grid v1（旧）: `<Grid container>` + `<Grid item>`
- Grid v2（新）: `<Grid container>` + `<Grid size={n}>`（itemプロパティ廃止）

## 影響範囲

- `src/components/admin/RoleManagement.tsx`
- 権限一覧タブのレイアウト

## 解決策

1. Gridインポートを`Grid2`に変更
2. `<Grid item xs={12} md={6}>` → `<Grid size={{ xs: 12, md: 6 }}>`に変更
3. containerプロパティの追加

## 修正内容

```typescript
// 旧コード（MUI v7で非推奨）
import { Grid } from '@mui/material';
<Grid container spacing={2}>
  <Grid item xs={12} md={6}>

// 修正コード（Boxコンポーネント使用）
<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
  <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 8px)' } }}>
```

## ステータス

✅ 修正完了

## 修正結果

- Grid2が利用不可のため、Boxコンポーネントでflexboxレイアウトに変更
- レスポンシブ対応維持（xs: 100%, md: 50%）
- gap: 2 でスペーシング調整
