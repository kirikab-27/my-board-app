# API詳細仕様

このファイルはCLAUDE.mdから分離されたAPI仕様の詳細です。

## 投稿関連API詳細

### `GET /api/posts`
- 全投稿の取得（管理者投稿フィルタリング・NoSQL対策・入力検証）✅ **Phase 6.1管理者フィルタ統合**
- クエリパラメータ: `page`, `limit`, `sortBy`, `search`
- 権限: 公開投稿は全ユーザー、会員限定投稿は認証必須

### `POST /api/posts`
- 新しい投稿の作成（XSS検出・監査ログ記録）✅ **Phase 5強化完了**
- リクエストボディ: `title`, `content`, `isPublic`, `hashtags`, `media`
- 権限: 認証必須

### `GET /api/posts/[id]`
- 投稿詳細取得（ObjectID検証強化）✅ **Phase 5強化完了**
- パラメータ: ObjectID形式のpost ID
- 権限: 投稿の公開設定に基づく

### `PUT /api/posts/[id]`
- 投稿の更新（XSS検出・監査ログ・権限チェック）✅ **Phase 5強化完了**
- リクエストボディ: `title`, `content`, `isPublic`
- 権限: 投稿者本人または管理者

### `DELETE /api/posts/[id]`
- 投稿の削除（権限チェック・監査ログ）✅ **Phase 5強化完了**
- 権限: 投稿者本人または管理者

### いいね機能API
- `POST /api/posts/[id]/like` - いいね追加
- `DELETE /api/posts/[id]/like` - いいね削除
- `GET /api/posts/[id]/like` - いいね状況確認

### 検索API
- `GET /api/posts/search` - 投稿検索（管理者投稿フィルタリング・入力サニタイゼーション・NoSQL対策）
- クエリパラメータ: `q`, `hashtags`, `dateFrom`, `dateTo`, `sortBy`

## 認証関連API詳細

### NextAuth.js統合API
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js v4統合認証（JWT・MongoDB Adapter・メール認証対応）
- ソーシャルログイン: Google OAuth, GitHub OAuth対応

### カスタム認証API
- `POST /api/auth/register` - ユーザー登録・メール認証送信・React Email対応
- `GET /api/auth/verify-email` - メール認証確認・ウェルカムメール送信
- `POST /api/auth/reset-password/request` - パスワードリセット要求
- `POST /api/auth/reset-password/confirm` - パスワードリセット確定

### セキュリティAPI
- `GET /api/auth/rate-limit` - ログイン試行回数・制限状況確認API

## SNS関連API詳細

### フォロー機能
- `GET /api/follow` - フォロー状況確認・フォロワー統計取得
- `POST /api/follow` - フォロー実行・相互フォロー対応
- `DELETE /api/follow` - アンフォロー実行・統計更新

### タイムライン
- `GET /api/timeline` - タイムライン投稿取得・無限スクロール対応
- クエリパラメータ: `cursor`, `limit`, `includeReplies`

### 通知システム
- `GET /api/notifications` - 通知一覧取得・フィルタリング・ページネーション
- `POST /api/notifications` - 通知作成・バッチ処理・優先度設定
- `PATCH /api/notifications` - 通知状態更新・既読・非表示・削除

## データ形式詳細

### Post Interface
```typescript
interface Post {
  _id: string;
  title?: string;
  content: string;
  likes: number;
  likedBy: string[];
  userId?: string;
  authorName?: string;
  isPublic: boolean;
  hashtags: string[];
  media: {
    url: string;
    type: 'image' | 'video';
    metadata?: any;
  }[];
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### User Interface
```typescript
interface User {
  _id: string;
  email: string;
  name: string;
  username?: string;
  displayName?: string;
  bio?: string;
  location?: string;
  avatar?: string;
  role: 'user' | 'moderator' | 'admin';
  emailVerified: Date | null;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## エラーハンドリング

### 標準エラーレスポンス
```typescript
interface ApiError {
  error: string;
  message: string;
  code?: number;
  details?: any;
}
```

### 一般的なHTTPステータス
- `200` - 成功
- `201` - 作成成功
- `400` - リクエストエラー
- `401` - 認証エラー
- `403` - 権限エラー
- `404` - リソース未発見
- `429` - レート制限超過
- `500` - サーバーエラー