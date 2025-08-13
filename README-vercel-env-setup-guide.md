# Vercel環境変数設定ガイド

**my-board-app.vercel.app** デプロイ用の環境変数設定手順書（2025/08/13作成）

## 📋 設定必須項目チェックリスト

### ✅ 基本設定（必須）

**Vercel Dashboard → my-board-app → Settings → Environment Variables**

```bash
# MongoDB接続（既存）
MONGODB_URI=mongodb+srv://boardUser:ZGtl9Q3vJUbl5u5d@cluster0.oikid53.mongodb.net/board-app?retryWrites=true&w=majority&appName=Cluster0

# NextAuth.js設定（本番用URL更新）
NEXTAUTH_URL=https://my-board-app.vercel.app
NEXTAUTH_SECRET=your-super-secret-nextauth-key-for-phase1-auth-system-updated-2025

# アプリケーション設定（本番用URL更新）
APP_URL=https://my-board-app.vercel.app
APP_NAME=掲示板システム
```

### ✅ メール設定（必須）

```bash
# さくらインターネットSMTP
SMTP_HOST=kab137lab.sakura.ne.jp
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@kab137lab.sakura.ne.jp
SMTP_PASSWORD=Noreply#2025Kab!

# メール送信設定
MAIL_FROM_ADDRESS=noreply@kab137lab.com
MAIL_FROM_NAME=KAB137Lab掲示板システム
MAIL_REPLY_TO=noreply@kab137lab.com

# 管理者メール
ADMIN_EMAIL=noreply@kab137lab.com
SUPPORT_EMAIL=noreply@kab137lab.com
```

### 🆕 Phase 4-5 新規環境変数（必須）

```bash
# セキュリティAPI管理用トークン（新規生成済み）
SECURITY_API_TOKEN=28fdc5fcf4e62f48753a0e7e445b294681984258c87d87abba65e56b77ddc296

# その他設定（デフォルト値・オプション）
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
```

### ⚠️ OAuth設定（現在は開発中・無効化済み）

**現在の状況**: Phase 5.5統合で OAuth は「開発中」として無効化済み
**本番で有効化する場合**: 以下の設定が必要

```bash
# Google OAuth（実際の値に置き換え）
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here

# GitHub OAuth（実際の値に置き換え）
GITHUB_ID=your_github_oauth_app_id
GITHUB_SECRET=your_github_oauth_app_secret
```

## 🔗 OAuth設定手順（将来実装時）

### Google OAuth Console設定

1. **Google Cloud Console** アクセス: https://console.cloud.google.com/
2. **APIとサービス** → **認証情報**
3. **OAuth 2.0 クライアントID** を選択
4. **承認済みリダイレクトURI** に追加:
   ```
   https://my-board-app.vercel.app/api/auth/callback/google
   ```
5. **クライアントID** と **クライアントシークレット** をVercelに設定

### GitHub OAuth Apps設定

1. **GitHub Settings** アクセス: https://github.com/settings/developers
2. **OAuth Apps** → 該当アプリ選択
3. **Authorization callback URL** を更新:
   ```
   https://my-board-app.vercel.app/api/auth/callback/github
   ```
4. **Client ID** と **Client Secret** をVercelに設定

## 🎯 Vercel環境変数設定手順

### 1. Vercel Dashboard アクセス

```bash
1. https://vercel.com/dashboard にアクセス
2. my-board-app プロジェクトを選択
3. Settings → Environment Variables
```

### 2. 環境変数一括追加

**Production Environment** を選択して以下を追加:

| Variable Name        | Value                                                              | 必須 |
| -------------------- | ------------------------------------------------------------------ | ---- |
| `MONGODB_URI`        | `mongodb+srv://boardUser:...`                                      | ✅   |
| `NEXTAUTH_URL`       | `https://my-board-app.vercel.app`                                  | ✅   |
| `NEXTAUTH_SECRET`    | `your-super-secret-nextauth-key-...`                               | ✅   |
| `APP_URL`            | `https://my-board-app.vercel.app`                                  | ✅   |
| `APP_NAME`           | `掲示板システム`                                                   | ✅   |
| `SMTP_HOST`          | `kab137lab.sakura.ne.jp`                                           | ✅   |
| `SMTP_PORT`          | `587`                                                              | ✅   |
| `SMTP_SECURE`        | `false`                                                            | ✅   |
| `SMTP_USER`          | `noreply@kab137lab.sakura.ne.jp`                                   | ✅   |
| `SMTP_PASSWORD`      | `Noreply#2025Kab!`                                                 | ✅   |
| `MAIL_FROM_ADDRESS`  | `noreply@kab137lab.com`                                            | ✅   |
| `MAIL_FROM_NAME`     | `KAB137Lab掲示板システム`                                          | ✅   |
| `MAIL_REPLY_TO`      | `noreply@kab137lab.com`                                            | ✅   |
| `ADMIN_EMAIL`        | `noreply@kab137lab.com`                                            | ✅   |
| `SUPPORT_EMAIL`      | `noreply@kab137lab.com`                                            | ✅   |
| `SECURITY_API_TOKEN` | `28fdc5fcf4e62f48753a0e7e445b294681984258c87d87abba65e56b77ddc296` | 🆕   |
| `SENTRY_ORG`         | `your-org`                                                         | ⚠️   |
| `SENTRY_PROJECT`     | `your-project`                                                     | ⚠️   |
| `SLACK_WEBHOOK_URL`  | `https://hooks.slack.com/services/...`                             | ⚠️   |

## ✅ 設定完了確認

### 1. 環境変数確認

```bash
# Vercel Dashboard → Settings → Environment Variables
# 15個の環境変数が設定済みであることを確認
```

### 2. デプロイ後動作確認

```bash
# 基本機能確認
✅ https://my-board-app.vercel.app アクセス
✅ ユーザー登録・ログイン
✅ メール送信（登録確認・パスワードリセット）
✅ セキュリティ管理画面（/admin/security）
```

## 🚀 デプロイ実行準備完了

**全ての環境変数設定が完了したら:**

1. **main ブランチにマージ**:

   ```bash
   git checkout main
   git merge develop --no-ff
   git push origin main
   ```

2. **Vercel自動デプロイ監視**:
   - Vercel Dashboard → Deployments で進行状況確認
   - ビルドログでエラーがないことを確認

3. **本番動作確認**:
   - https://my-board-app.vercel.app での機能確認

## 📊 現在の実装状況

- ✅ **基本機能**: 完全実装・動作確認済み
- ✅ **認証システム**: NextAuth.js v4・メール認証・パスワードリセット
- ✅ **セキュリティ**: XSS・CSRF・レート制限・監査ログ・NoSQL対策
- ✅ **会員制掲示板**: CRUD・権限管理・UI/UX最適化
- ⚠️ **OAuth**: 開発中表示（無効化済み）・将来実装予定
- ✅ **管理画面**: セキュリティダッシュボード・攻撃統計・ブロック解除

**Phase 5.5統合版の本番デプロイ準備完了！**
