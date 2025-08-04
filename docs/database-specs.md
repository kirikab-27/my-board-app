# データベース仕様書

## 1. データベース概要

### 1.1 基本情報
| 項目 | 内容 |
|------|------|
| データベース種別 | NoSQL (ドキュメント型) |
| DBMS | MongoDB |
| バージョン | 6.x以上推奨 |
| ホスティング | MongoDB Atlas（クラウド）またはローカル |
| ODM | Mongoose 8.17.0 |
| データベース名 | board-app |

### 1.2 接続情報
| 項目 | 説明 |
|------|------|
| 接続URI | 環境変数 `MONGODB_URI` で設定 |
| デフォルト値 | `mongodb://localhost:27017/board-app` |
| 接続プール | Mongoose標準プーリング |
| 接続キャッシュ | グローバル変数による接続再利用 |

## 2. コレクション仕様

### 2.1 posts コレクション

#### 概要
掲示板の投稿データを格納するコレクション

#### スキーマ定義

```javascript
{
  content: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

#### フィールド詳細

| フィールド名 | データ型 | 必須 | デフォルト値 | 説明 | 制約 |
|------------|---------|------|------------|------|------|
| _id | ObjectId | ○ | 自動生成 | ドキュメントの一意識別子 | MongoDB自動生成 |
| content | String | ○ | - | 投稿内容 | 最大200文字、前後空白自動削除 |
| createdAt | Date | ○ | 現在時刻 | 作成日時 | Mongooseのtimestamps機能で自動設定 |
| updatedAt | Date | ○ | 現在時刻 | 更新日時 | Mongooseのtimestamps機能で自動更新 |
| __v | Number | ○ | 0 | バージョンキー | Mongooseが自動管理 |

#### インデックス

| インデックス名 | フィールド | タイプ | 説明 |
|--------------|-----------|--------|------|
| _id_ | _id | 昇順 | プライマリキー（自動作成） |
| createdAt_-1 | createdAt | 降順 | 投稿日時でのソート用（推奨） |

※createdAtインデックスは現在未実装。パフォーマンス改善時に追加推奨

#### サンプルドキュメント

```json
{
  "_id": {
    "$oid": "65abc123def4567890123456"
  },
  "content": "これは投稿のサンプルです。\n改行も含めることができます。",
  "createdAt": {
    "$date": "2025-01-20T10:30:00.000Z"
  },
  "updatedAt": {
    "$date": "2025-01-20T11:45:00.000Z"
  },
  "__v": 0
}
```

## 3. Mongooseモデル定義

### 3.1 Postモデル（src/models/Post.ts）

#### TypeScript インターフェース

```typescript
interface IPost extends Document {
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### スキーマオプション

```typescript
{
  timestamps: true  // createdAt, updatedAtを自動管理
}
```

#### バリデーション

| バリデーション | 対象フィールド | エラーメッセージ |
|--------------|--------------|----------------|
| required | content | 投稿内容は必須です |
| maxlength | content | 投稿は200文字以内で入力してください |

## 4. データベース接続管理

### 4.1 接続設定（src/lib/mongodb.ts）

#### 接続オプション

```javascript
{
  bufferCommands: false  // コマンドバッファリングを無効化
}
```

#### 接続キャッシング

```typescript
global.mongoose = {
  conn: null,    // 接続オブジェクト
  promise: null  // 接続プロミス
}
```

### 4.2 接続フロー

```mermaid
graph TD
    A[dbConnect呼び出し] --> B{キャッシュ確認}
    B -->|接続済み| C[既存接続を返却]
    B -->|未接続| D{プロミス確認}
    D -->|プロミスあり| E[プロミスを待機]
    D -->|プロミスなし| F[新規接続開始]
    F --> G[mongoose.connect実行]
    G --> H[接続をキャッシュ]
    H --> I[接続を返却]
    E --> H
```

## 5. クエリパターン

### 5.1 基本的なCRUD操作

| 操作 | Mongooseメソッド | 説明 |
|------|----------------|------|
| Create | `new Post().save()` | 新規投稿作成 |
| Read All | `Post.find({}).sort({ createdAt: -1 })` | 全投稿取得（新しい順） |
| Update | `Post.findByIdAndUpdate(id, data, options)` | 投稿更新 |
| Delete | `Post.findByIdAndDelete(id)` | 投稿削除 |

### 5.2 クエリオプション

#### findByIdAndUpdate オプション
```javascript
{
  new: true,           // 更新後のドキュメントを返却
  runValidators: true  // バリデーション実行
}
```

## 6. データ整合性

### 6.1 トランザクション
- 現在の実装では単一ドキュメント操作のみ
- MongoDBの単一ドキュメント操作はACID特性を保証

### 6.2 並行性制御
- Optimistic Concurrency Control（楽観的並行性制御）
- `__v`フィールドによるバージョン管理

## 7. バックアップ・リストア

### 7.1 MongoDB Atlas使用時
- 自動バックアップ機能を利用
- ポイントインタイムリカバリ対応
- クラスターレベルでのバックアップ

### 7.2 ローカル環境
- `mongodump`コマンドでバックアップ
- `mongorestore`コマンドでリストア

#### バックアップコマンド例
```bash
mongodump --uri="mongodb://localhost:27017/board-app" --out="./backup"
```

#### リストアコマンド例
```bash
mongorestore --uri="mongodb://localhost:27017/board-app" "./backup/board-app"
```

## 8. パフォーマンス最適化

### 8.1 推奨インデックス

```javascript
// 投稿日時でのソート最適化
db.posts.createIndex({ createdAt: -1 })

// 将来的な検索機能のためのテキストインデックス
db.posts.createIndex({ content: "text" })
```

### 8.2 接続プーリング
- Mongoose標準の接続プール使用
- サーバーレス環境での接続キャッシング実装済み

### 8.3 クエリ最適化
- 必要なフィールドのみ取得（現在は全フィールド取得）
- ページネーション実装（将来的な拡張）

## 9. セキュリティ

### 9.1 接続セキュリティ
- MongoDB Atlas使用時はTLS/SSL暗号化
- IPホワイトリスト設定推奨
- 認証情報は環境変数で管理

### 9.2 インジェクション対策
- Mongooseのスキーマバリデーション
- パラメータ化クエリの使用
- ObjectId形式の検証

## 10. 監視項目

### 10.1 パフォーマンス指標
| 指標 | 説明 | 推奨値 |
|------|------|--------|
| 接続数 | アクティブな接続数 | < 100 |
| クエリ実行時間 | 平均クエリ実行時間 | < 100ms |
| ドキュメント数 | postsコレクションのドキュメント数 | - |
| ストレージサイズ | データベースの使用容量 | - |

### 10.2 エラー監視
- 接続エラー
- バリデーションエラー
- タイムアウトエラー

## 11. マイグレーション

### 11.1 スキーマ変更手順
1. 新フィールドは任意フィールドとして追加
2. 既存データの移行スクリプト実行
3. 必要に応じて必須フィールドに変更

### 11.2 バージョン管理
- Mongooseの`__v`フィールドでドキュメントバージョン管理
- スキーマバージョンは別途管理が必要

## 12. 開発環境セットアップ

### 12.1 ローカルMongoDB
```bash
# MongoDBインストール（例：macOS）
brew install mongodb-community

# MongoDBサービス起動
brew services start mongodb-community

# データベース作成
mongosh
> use board-app
```

### 12.2 MongoDB Atlas
1. MongoDB Atlasアカウント作成
2. クラスター作成（M0 Free Tierで可）
3. データベースユーザー作成
4. IPホワイトリスト設定
5. 接続文字列取得
6. `.env.local`に`MONGODB_URI`設定

### 12.3 環境変数設定例
```env
# .env.local
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/board-app?retryWrites=true&w=majority
```

## 13. トラブルシューティング

### 13.1 よくある問題と解決方法

| 問題 | 原因 | 解決方法 |
|------|------|----------|
| 接続エラー | MongoDB未起動 | MongoDBサービスを起動 |
| 認証エラー | 認証情報誤り | 環境変数を確認 |
| タイムアウト | ネットワーク問題 | ファイアウォール設定確認 |
| バリデーションエラー | スキーマ不一致 | モデル定義を確認 |

### 13.2 デバッグ方法
```javascript
// Mongoose デバッグモード有効化
mongoose.set('debug', true);
```