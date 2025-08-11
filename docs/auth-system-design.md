# 認証システム設計書

## 概要

NextAuth.jsを基盤とした会員制掲示板システムの認証設計書です。

## 技術スタック

### 認証フレームワーク
- **NextAuth.js v5** - Next.js 15 App Router対応
- **MongoDB Adapter** - セッション・ユーザー管理
- **JWT** - セッション管理
- **bcryptjs** - パスワードハッシュ化

### メール送信
- **既存基盤活用**: `src/lib/email/` の活用
- **DKIM/SPF/DMARC**: 完全設定済み
- **テンプレート**: 認証メール用テンプレート追加

## データベース設計

### ユーザーテーブル
```typescript
interface User {
  _id: ObjectId;
  name: string;              // 表示名
  email: string;             // メールアドレス（ユニーク）
  password: string;          // bcryptハッシュ
  emailVerified: Date | null; // メール認証日時
  image?: string;            // プロフィール画像（将来用）
  createdAt: Date;
  updatedAt: Date;
}
```

### セッションテーブル
```typescript
interface Session {
  _id: ObjectId;
  sessionToken: string;      // セッショントークン
  userId: ObjectId;          // ユーザーID参照
  expires: Date;             // 有効期限
}
```

### アカウントテーブル
```typescript
interface Account {
  _id: ObjectId;
  userId: ObjectId;          // ユーザーID参照
  type: string;              // "credentials"
  provider: string;          // "credentials"
  providerAccountId: string;
}
```

### メール認証トークン
```typescript
interface VerificationToken {
  identifier: string;        // メールアドレス
  token: string;             // 認証トークン
  expires: Date;             // 有効期限（24時間）
}
```

## APIエンドポイント設計

### NextAuth.js標準エンドポイント
- `GET/POST /api/auth/signin` - ログイン画面・処理
- `GET/POST /api/auth/signout` - ログアウト処理
- `GET /api/auth/session` - セッション取得
- `GET /api/auth/csrf` - CSRFトークン取得

### カスタムエンドポイント
- `POST /api/auth/register` - ユーザー登録
- `GET /api/auth/verify-email` - メール認証確認
- `POST /api/auth/resend-verification` - 認証メール再送信
- `POST /api/auth/forgot-password` - パスワードリセット要求
- `POST /api/auth/reset-password` - パスワードリセット実行

## セキュリティ仕様

### パスワードポリシー
- **最小長**: 8文字以上
- **複雑性**: 英数字混在推奨
- **ハッシュ化**: bcryptjs（saltRounds: 12）

### セッション管理
- **有効期限**: 30日間
- **JWT署名**: NextAuth.js標準（NEXTAUTH_SECRET）
- **セッション更新**: アクティブ時自動更新

### CSRF保護
- NextAuth.js標準のCSRF保護
- フォームトークン検証
- SameSite Cookie設定

### レート制限
- ログイン試行: 5回/15分
- パスワードリセット: 3回/時間
- メール再送信: 3回/時間

## メール認証フロー

### 登録時メール認証
1. ユーザー登録（未認証状態で保存）
2. 認証メール送信（24時間有効トークン）
3. メール内リンククリック
4. トークン検証・メール認証完了
5. ログイン可能状態に

### パスワードリセットフロー
1. パスワードリセット要求
2. リセットメール送信（1時間有効トークン）
3. メール内リンククリック
4. 新パスワード設定画面
5. パスワード更新完了

## 画面設計

### 認証関連画面
- `/auth/signin` - ログイン画面
- `/auth/signup` - 新規登録画面
- `/auth/verify-email` - メール認証完了画面
- `/auth/forgot-password` - パスワード忘れ画面
- `/auth/reset-password` - パスワードリセット画面

### 保護された画面
- `/dashboard` - 会員ダッシュボード
- `/profile` - プロフィール管理
- `/posts/create` - 投稿作成（要認証）

## 実装段階

### Phase 1: 基盤構築（3日）
- NextAuth.js設定
- MongoDB Adapter設定
- ユーザーモデル作成
- 基本認証フロー実装

### Phase 2: メール認証（2日）
- 既存メール基盤統合
- 認証メールテンプレート作成
- メール認証フロー実装
- パスワードリセット機能

### Phase 3: セキュリティ強化（1日）
- CSRF保護設定
- レート制限実装
- バリデーション強化
- エラーハンドリング改善

## エラーハンドリング

### 認証エラー
- 不正なログイン情報
- アカウント未認証
- セッション期限切れ
- アクセス権限不足

### システムエラー
- データベース接続エラー
- メール送信失敗
- トークン生成/検証エラー
- レート制限超過

## テスト戦略

### 機能テスト
- ユーザー登録フロー
- ログイン/ログアウト
- メール認証
- パスワードリセット

### セキュリティテスト
- CSRF攻撃テスト
- セッション管理テスト
- 権限チェックテスト
- レート制限テスト

## パフォーマンス考慮

### データベース最適化
- メールアドレスにユニークインデックス
- セッショントークンにインデックス
- 期限切れセッション自動削除

### キャッシュ戦略
- セッション情報のメモリキャッシュ
- JWT検証結果のキャッシュ
- レート制限情報のRedis（将来）

## 監視・ログ

### 認証ログ
- ログイン成功/失敗
- パスワードリセット要求
- 不正アクセス試行
- セッション作成/削除

### メトリクス
- 認証成功率
- メール認証完了率
- パスワードリセット利用率
- セキュリティイベント発生率