# routes-manifest.jsonエラー修正記録

## 発生日時

2025-01-10 22:50 JST

## 報告されたエラー

```
Error: ENOENT: no such file or directory, open 'C:\Users\masas\Documents\Projects\my-board-app\.next\routes-manifest.json'
```

## 原因分析

複数のNext.js開発サーバー起動試行により、`.next`ディレクトリが削除されたが、既存のプロセスがまだ古いビルドファイルを参照しようとしていた。

## 現在の状況

### 起動中のサーバー

- **ポート3010** (PID: 20360): routes-manifest.json欠損エラー
- **ポート3012** (PID: 12652): 起動済み（ただしAdminLayoutEnhancedエクスポートエラーあり）
- **ポート3013** (PID: 19984): 起動済み

### 背景プロセス

複数の`npm run dev`コマンドが背景で実行中：

- 892865, dc4131, 52b4f2, 35f649, a0deb3, d8eed5, 9f24fd, 5b10ab, ade66e, a014b3, 4d8103

## 推奨解決策

### 1. すべてのNode.jsプロセスを終了

```bash
# Windowsの場合（ユーザー側で実行）
taskkill /F /IM node.exe

# Git Bashの場合
kill -9 20360 12652 19984
```

### 2. キャッシュクリア

```bash
rm -rf .next
rm -rf node_modules/.cache
rm -rf .swc
```

### 3. 単一サーバーの起動

```bash
npm run dev  # ポート3010で起動
```

## 実施した修正

### 1. Hydrationエラー修正（完了）

`AdminLayoutEnhanced.tsx`のlocalStorage初期化をuseEffectに移動

### 2. RBAC 403エラー対策（完了）

開発環境バイパスの実装確認

### 3. ポート管理

複数のサーバー起動試行により混乱が生じているが、ポート3010での統一が必要

## ベストプラクティス

### プロセス管理

1. **単一サーバー原則**: 開発環境では1つのNext.jsサーバーのみ起動
2. **ポート3010統一**: CLAUDE.md規定のポート使用
3. **プロセス確認**: 起動前に`netstat -ano | grep :3010`で確認
4. **クリーンアップ**: エラー時は`.next`削除後に再起動

### Next.jsビルドエラー対策

1. **routes-manifest.json欠損**: `.next`ディレクトリ削除→再起動
2. **webpack cache corruption**: `node_modules/.cache`も削除
3. **SWC cache**: `.swc`ディレクトリも削除

## ステータス

- ✅ Hydrationエラー修正完了
- ✅ RBAC 403エラー対策完了
- ⚠️ ポート3010でのサーバー再起動必要

## 次のステップ

1. ユーザー側でNode.jsプロセスを手動終了
2. Claude Codeで単一サーバーを起動
3. ブラウザでアクセスして動作確認

---

_記録者: Claude Code_
_Issue #47 関連エラー対応_
