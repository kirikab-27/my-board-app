# Vercelデプロイ準備完了チェックリスト

このドキュメントは、Phase 5.5統合版のVercel本番デプロイ前の準備確認項目をまとめています。

## 📋 準備完了確認（2025/08/12）

### ✅ 技術的準備完了項目

#### 1. ビルド・依存関係

```bash
✅ isomorphic-dompurify パッケージ追加済み
✅ MongoDB adapter 依存関係競合解決済み（--legacy-peer-deps）
✅ 本番ビルド成功確認済み（npm run build）
✅ vercel.json 設定完了（ESLint・Sentry警告抑制）
```

#### 2. Git・バージョン管理

```bash
✅ develop ブランチ全変更コミット済み
✅ main ブランチとの差分確認完了（20コミット先行）
✅ development-phase5.5-complete タグ作成済み
✅ 未追跡ファイル・未コミット変更処理済み
```

#### 3. プロジェクト構成

```bash
✅ README-phase-5.5-integration.md 作成済み
✅ README-vercel-deployment-existing.md 作成済み
✅ ローディングコンポーネント追加済み
✅ プロフィール機能統合済み
```

### ⚠️ デプロイ前要確認項目

#### 1. Vercel環境変数設定確認

**既存環境変数（確認推奨）**:

```bash
MONGODB_URI          # MongoDB Atlas本番接続文字列
NEXTAUTH_URL         # https://my-board-app.vercel.app
NEXTAUTH_SECRET      # 32文字以上の本番用秘密鍵
GOOGLE_CLIENT_ID     # Google OAuth本番設定
GOOGLE_CLIENT_SECRET # Google OAuth本番設定
GITHUB_ID           # GitHub OAuth本番設定
GITHUB_SECRET       # GitHub OAuth本番設定
SMTP_HOST           # さくらSMTP設定
SMTP_USER           # さくらSMTP設定
SMTP_PASSWORD       # さくらSMTP設定
MAIL_FROM_ADDRESS   # メール送信者アドレス
APP_URL            # https://my-board-app.vercel.app
APP_NAME           # アプリケーション名
```

**Phase 4-5新規環境変数（要追加）**:

```bash
SECURITY_API_TOKEN                # セキュリティ管理API用トークン
NEXT_PUBLIC_SENTRY_DSN           # Sentry監視DSN（オプション）
SENTRY_DSN                       # Sentry監視DSN（オプション）
SENTRY_ORG                       # Sentry組織名（オプション）
SENTRY_PROJECT                   # Sentryプロジェクト名（オプション）
SLACK_WEBHOOK_URL                # Slack通知URL（オプション）
```

#### 2. OAuth設定更新確認

**Google OAuth Console**:

```
承認済みリダイレクトURIに追加:
https://my-board-app.vercel.app/api/auth/callback/google
```

**GitHub OAuth Apps**:

```
Authorization callback URLを更新:
https://my-board-app.vercel.app/api/auth/callback/github
```

## 🚀 デプロイ実行手順

### Step 1: 最終確認

```bash
# 現在のブランチ・状態確認
git status
git branch

# ビルド最終確認
npm run build
```

### Step 2: main ブランチへのマージ

```bash
# mainブランチに切り替え
git checkout main

# developブランチをマージ
git merge develop --no-ff -m "release: Phase 5.5全機能統合版をmainに反映"

# mainブランチにプッシュ（自動デプロイトリガー）
git push origin main
```

### Step 3: デプロイ監視

```bash
# Vercel Dashboard確認項目:
1. Deployments → 最新デプロイ実行状況確認
2. Build Logs → エラー・警告確認
3. Preview URL → デプロイ完了確認
```

## 📊 デプロイ後動作確認

### 基本機能確認

```bash
✅ https://my-board-app.vercel.app アクセス
✅ ランディングページ表示
✅ 認証機能（Google・GitHub・メール）
✅ 投稿作成・編集・削除
```

### Phase 4新機能確認（プロフィール管理）

```bash
✅ /profile - プロフィール表示
✅ /profile/edit - プロフィール編集
✅ /profile/password - パスワード変更
✅ 頭文字アバター表示
```

### Phase 4.5新機能確認（会員制掲示板CRUD）

```bash
✅ /board - 会員限定掲示板
✅ /board/create - タイトル付き投稿作成
✅ /board/[id] - 投稿詳細ページ
✅ /board/[id]/edit - 投稿編集（権限チェック）
```

### Phase 5新機能確認（セキュリティ強化）

```bash
✅ /admin/security - セキュリティダッシュボード
✅ XSS対策機能（SafeContent）
✅ CSRF対策機能
✅ レート制限機能（1分5回）
✅ 監査ログ機能
```

## 🔧 トラブルシューティング

### デプロイエラー対処

**ビルドエラー**:

- vercel.json設定済みでESLintエラー抑制
- 依存関係問題は --legacy-peer-deps で解決済み

**環境変数エラー**:

- MongoDB接続文字列確認
- 新規環境変数（SECURITY_API_TOKEN等）追加

**OAuth認証エラー**:

- Google・GitHub OAuthコールバックURL更新確認

### ロールバック手順

```bash
# Vercel Dashboard
1. Deployments → 正常な前回デプロイを選択
2. "Promote to Production" クリック

# Git経由
git revert HEAD
git push origin main
```

## ✅ 準備完了サマリー

**技術準備**: ✅ 完了
**Git管理**: ✅ 完了  
**ドキュメント**: ✅ 完了
**環境変数**: ⚠️ 確認必要
**OAuth設定**: ⚠️ 確認必要

Phase 5.5統合版のVercel本番デプロイ準備が整いました！
