# システム設定管理機能

## 概要

システム設定管理機能は、アプリケーションの設定を動的に管理し、環境別に設定を分離し、ホットリロードによる即座の反映を可能にする機能です。

## 主な機能

### 1. 環境別設定管理

- Development / Staging / Production の3環境を分離管理
- 環境ごとに異なる設定値を保持
- 環境間の設定差分比較機能

### 2. 暗号化保存

- 秘密情報（APIキー、パスワード等）はAES-256-GCMで暗号化
- 暗号化された値は管理画面でもマスク表示
- 復号は権限のあるシステムプロセスのみ可能

### 3. ホットリロード

- 設定変更時にアプリケーション再起動不要
- EventEmitterベースのリアルタイム反映
- 特定の設定のみホットリロード対応を選択可能

### 4. バージョン管理

- すべての設定変更を履歴として記録
- 任意のバージョンへのロールバック機能
- 変更理由と変更者の記録

### 5. インポート/エクスポート

- JSON形式での設定のエクスポート
- バックアップとリストア
- 環境間での設定移行

## 使用方法

### 管理画面へのアクセス

```
http://localhost:3010/admin/config
```

管理者権限を持つユーザーのみアクセス可能です。

### 設定の追加

1. 「設定編集」タブを選択
2. 必要な情報を入力:
   - **キー**: 設定の識別子（例: `email.smtpHost`）
   - **値**: JSON形式で入力
   - **カテゴリー**: 設定の分類
   - **データ型**: string / number / boolean / json
   - **説明**: 設定の用途説明

3. オプション設定:
   - **秘密情報**: チェックすると暗号化保存
   - **ホットリロード対応**: チェックすると即座に反映

### アプリケーションコードでの使用

```typescript
import { config } from '@/lib/config/configLoader';

// 設定の取得
const smtpHost = config.get<string>('email.smtpHost');
const maxUploadSize = config.get<number>('upload.maxFileSize');
const features = config.get('features');

// 全設定の取得
const allConfig = config.get();

// 設定のリロード（手動）
await config.reload();
```

### 環境変数との連携

デフォルト値として環境変数を使用:

```typescript
// .env.local
SMTP_HOST = smtp.example.com;
SMTP_PORT = 587;
```

データベース設定が存在しない場合は環境変数の値が使用されます。

## 設定カテゴリー

### email

メール送信に関する設定

- `email.smtpHost`: SMTPサーバーホスト
- `email.smtpPort`: SMTPポート番号
- `email.smtpUser`: SMTP認証ユーザー
- `email.smtpPassword`: SMTP認証パスワード（暗号化）
- `email.fromAddress`: 送信元メールアドレス

### security

セキュリティに関する設定

- `security.sessionTimeout`: セッションタイムアウト（ミリ秒）
- `security.maxLoginAttempts`: 最大ログイン試行回数
- `security.lockoutDuration`: アカウントロック期間（ミリ秒）
- `security.jwtSecret`: JWT署名用秘密鍵（暗号化）

### features

機能フラグ

- `features.enableSignup`: 新規登録の有効/無効
- `features.enableSocialLogin`: ソーシャルログインの有効/無効
- `features.enable2FA`: 2要素認証の有効/無効
- `features.maintenanceMode`: メンテナンスモード

### performance

パフォーマンス設定

- `performance.cacheEnabled`: キャッシュの有効/無効
- `performance.cacheTTL`: キャッシュ有効期限（ミリ秒）
- `performance.rateLimit`: レート制限（リクエスト数）
- `performance.rateLimitWindow`: レート制限ウィンドウ（ミリ秒）

### upload

アップロード設定

- `upload.maxFileSize`: 最大ファイルサイズ（バイト）
- `upload.allowedTypes`: 許可するMIMEタイプ配列

## API エンドポイント

### GET /api/admin/config

設定の取得

**パラメータ:**

- `key`: 特定の設定キー（オプション）
- `category`: カテゴリーでフィルタ（オプション）
- `environment`: 環境（デフォルト: development）

### POST /api/admin/config

設定の作成/更新

**リクエストボディ:**

```json
{
  "key": "email.smtpHost",
  "value": "smtp.example.com",
  "description": "SMTPサーバーホスト",
  "category": "email",
  "dataType": "string",
  "isSecret": false,
  "isHotReloadable": true,
  "changeReason": "SMTPサーバー変更"
}
```

### DELETE /api/admin/config

設定の削除（論理削除）

**パラメータ:**

- `key`: 削除する設定キー
- `environment`: 環境

### GET /api/admin/config/diff

環境間の差分取得

**パラメータ:**

- `env1`: 比較元環境
- `env2`: 比較先環境

### GET /api/admin/config/export

設定のエクスポート

### POST /api/admin/config/export

設定のインポート

### GET /api/admin/config/rollback

変更履歴の取得

### POST /api/admin/config/rollback

設定のロールバック

## セキュリティ考慮事項

1. **アクセス制御**: 管理者権限のみアクセス可能
2. **暗号化**: 秘密情報はAES-256-GCMで暗号化
3. **監査ログ**: すべての変更操作を記録
4. **入力検証**: データ型と許可値の検証
5. **CSRF保護**: Next.jsの組み込みCSRF保護

## トラブルシューティング

### 設定が反映されない

- ホットリロード対応フラグを確認
- キャッシュをクリア: `await config.reload()`
- ブラウザのキャッシュをクリア

### 暗号化エラー

- `CONFIG_ENCRYPTION_KEY`環境変数を確認
- 暗号化キーが変更されていないか確認

### データベース接続エラー

- MongoDB接続を確認
- デフォルト設定にフォールバック

## 今後の拡張予定

- [ ] 設定のグループ化とテンプレート
- [ ] A/Bテスト用の設定分岐
- [ ] 設定変更の承認ワークフロー
- [ ] WebSocket経由のリアルタイム同期
- [ ] 設定の依存関係グラフ表示
