# DataGrid rowSelectionエラー記録

## 発生日時
2025-09-08 20:30 JST

## エラー概要
管理者ユーザー管理画面（/admin/users）アクセス時にMUI DataGrid rowSelectionエラーが発生

## エラー詳細

### エラーメッセージ
```
Unhandled Runtime Error
TypeError: Cannot read properties of undefined (reading 'size')

Source
node_modules\@mui\x-data-grid\node_modules\@mui\x-data-grid\internals\utils\gridRowSelectionSelector.js (10:16)
```

### スタックトレース
```
gridRowSelectionSelector
node_modules\@mui\x-data-grid\node_modules\@mui\x-data-grid\internals\utils\gridRowSelectionSelector.js (10:16)

get lookup [as lookup]
node_modules\reselect\dist\reselect.mjs (102:31)

runWithRetry
node_modules\@mui\x-data-grid\node_modules\@mui\x-data-grid\internals\utils\store.js (16:16)
```

## 原因分析

### 根本原因
MUI DataGridのrowSelectionModel初期化の問題。GridRowSelectionModel型の初期値設定が不適切。

### 問題のコード
```typescript
// UserManagementGrid.tsx
const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>(() => []);

// DataGrid設定
<DataGrid
  rowSelectionModel={selectionModel}
  onRowSelectionModelChange={(newSelectionModel) => {
    setSelectionModel(newSelectionModel);
  }}
  checkboxSelection
  // ...
/>
```

### 問題点
1. **初期値の関数形式**: `useState(() => [])`の関数形式が不要
2. **rowSelectionModel props**: MUI v7では非推奨の可能性
3. **型の不一致**: GridRowSelectionModelの期待する型と実際の値の不整合

## 修正内容

### 修正1: 初期値の修正
```typescript
// 修正前
const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>(() => []);

// 修正後
const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);
```

### 修正2: DataGrid props の修正
```typescript
// 修正前
<DataGrid
  rowSelectionModel={selectionModel}
  onRowSelectionModelChange={(newSelectionModel) => {
    setSelectionModel(newSelectionModel);
  }}
  checkboxSelection
  // ...
/>

// 修正後
<DataGrid
  checkboxSelection
  onRowSelectionModelChange={(newSelectionModel) => {
    setSelectionModel(newSelectionModel);
  }}
  // rowSelectionModel を削除（内部状態管理に任せる）
  // ...
/>
```

### 修正3: 完全な修正版実装
```typescript
export default function UserManagementGrid() {
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);
  
  // DataGrid設定
  return (
    <DataGrid
      rows={users}
      columns={columns}
      checkboxSelection
      disableRowSelectionOnClick
      onRowSelectionModelChange={(newModel) => {
        setSelectionModel(newModel);
      }}
      // その他のprops
    />
  );
}
```

## 影響評価
- **機能影響**: ユーザー管理画面が正常に表示されない
- **ユーザー影響**: 管理者がユーザー管理機能を使用できない
- **データ影響**: なし（表示のみの問題）

## テスト結果
- **修正前**: TypeError発生、画面表示不可
- **修正後**: 正常動作確認、DataGrid表示成功、選択機能動作

## 今後の対応
1. MUI DataGrid v7のドキュメント確認
2. rowSelectionModel の使用方法最新化
3. TypeScript型定義の厳密化
4. エラーバウンダリの追加検討

## 関連Issue
- Issue #58: ユーザー管理システム実装
- MUI DataGrid v7移行に伴う互換性問題

## 参考リンク
- [MUI DataGrid Row Selection](https://mui.com/x/react-data-grid/row-selection/)
- [MUI DataGrid v7 Migration Guide](https://mui.com/x/migration/migration-data-grid-v6/)