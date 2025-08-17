# MongoDB セットアップガイド

このアプリケーションは MongoDB を使用します。以下の3つの方法から選択できます。

## 方法1: メモリデータベース（推奨 - 最も簡単）

MongoDBのインストール不要で、アプリケーション起動時に自動的にメモリ内にデータベースが作成されます。

### セットアップ手順：
1. `.env.local` ファイルを編集:
```
USE_MEMORY_DB=true
```

2. アプリケーションを再起動:
```bash
npm run dev
```

**注意**: アプリケーションを停止するとデータは失われます。

## 方法2: ローカル MongoDB

### Windows での MongoDB インストール:

1. MongoDB Community Server をダウンロード:
   - https://www.mongodb.com/try/download/community
   - Windows用のMSIインストーラーを選択

2. インストーラーを実行:
   - "Complete" インストールを選択
   - MongoDB Compass（GUI）もインストール（推奨）

3. MongoDB サービスを開始:
   - Windows サービスとして自動的に開始されます
   - または、コマンドプロンプトで:
   ```cmd
   mongod --dbpath C:\data\db
   ```

4. `.env.local` ファイルを編集:
```
USE_MEMORY_DB=false
MONGODB_URI=mongodb://localhost:27017/board-app
```

### macOS での MongoDB インストール:

1. Homebrew を使用:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

2. `.env.local` ファイルを編集（上記と同じ）

## 方法3: MongoDB Atlas（クラウド）

1. MongoDB Atlas アカウントを作成:
   - https://www.mongodb.com/cloud/atlas

2. 無料クラスターを作成

3. データベースユーザーを作成

4. ネットワークアクセスで IP アドレスを許可（0.0.0.0/0 for development）

5. 接続文字列を取得

6. `.env.local` ファイルを編集:
```
USE_MEMORY_DB=false
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/board-app?retryWrites=true&w=majority
```

## トラブルシューティング

### エラー: "Failed to load resource: the server responded with a status of 500"

**原因**: MongoDB に接続できていません。

**解決方法**:
1. `.env.local` ファイルの設定を確認
2. MongoDB サービスが起動しているか確認
3. ネットワーク接続を確認（Atlas使用時）
4. メモリデータベースに切り替えてテスト

### Windows での MongoDB 起動確認:

```cmd
# サービスの状態を確認
sc query MongoDB

# または、タスクマネージャーで mongod.exe プロセスを確認
```

### ポート 27017 が使用されているか確認:

```cmd
netstat -an | findstr :27017
```

## 開発時の推奨設定

開発中は **メモリデータベース** の使用を推奨します：
- インストール不要
- 設定が簡単
- テストに適している

本番環境では MongoDB Atlas または専用の MongoDB サーバーを使用してください。