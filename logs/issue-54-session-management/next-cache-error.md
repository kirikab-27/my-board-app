# .nextディレクトリ破損エラー - Issue #54実装後

## エラー発生日時
2025/09/07

## エラー症状
```
GET http://localhost:3010/ 500 (Internal Server Error)
Cannot find module './6975.js'
ENOENT: no such file or directory, open '.next\server\vendor-chunks\@mui.js'
ENOENT: no such file or directory, open '.next\routes-manifest.json'
```

## 原因
- 複数の開発サーバープロセスが競合
- .nextディレクトリのキャッシュファイル破損
- webpack-runtime.js のモジュール参照エラー

## 解決手順

### 1. すべてのNode.jsプロセスを確認
```bash
tasklist | findstr node
```

### 2. すべてのNode.jsプロセスを終了
```bash
taskkill /F /IM node.exe
```

### 3. .nextディレクトリを完全削除
```bash
powershell -Command "Remove-Item -Path .next -Recurse -Force"
```

### 4. node_modulesのキャッシュクリア（必要に応じて）
```bash
npm cache clean --force
```

### 5. 開発サーバー再起動
```bash
npm run dev
```

## 再発防止策
1. 開発サーバー起動前にプロセス確認
2. 複数のターミナルで同時に開発サーバーを起動しない
3. ファイル変更時のホットリロードエラーに注意

## 関連Issue
- Issue #54: セキュアセッション管理システム実装