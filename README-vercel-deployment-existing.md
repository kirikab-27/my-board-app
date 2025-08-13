# 既存Vercelプロジェクト更新ガイド

このドキュメントは、既にVercelにデプロイされている`my-board-app`プロジェクトに、Phase 5.5で統合された全機能を本番反映する手順を記載しています。

## 📊 現在の状況

**既存設定**:
- ✅ Vercelプロジェクト名: `my-board-app`
- ✅ mainブランチが既にデプロイ済み
- ✅ 自動デプロイが有効
- ✅ 基本的な環境変数設定済み

**新規統合内容**:
- Phase 0-5: 全フィーチャーブランチ統合完了
- MongoDB adapter依存関係解決済み
- セキュリティ強化・認証・プロフィール・掲示板CRUD統合

## 🚀 更新手順

### Step 1: developからmainへのマージ

```bash
# mainブランチに切り替え
git checkout main

# developブランチの最新内容を確認
git log develop --oneline -5

# developブランチをmainにマージ
git merge develop --no-ff -m "release: Phase 5.5全機能統合版をmainに反映

✅ 統合内容:
- Phase 0-5: 全フィーチャーブランチ統合完了  
- MongoDB adapter依存関係解決済み
- セキュリティ強化・認証・プロフィール・掲示板CRUD統合
- Vercel本番デプロイ準備完了

🚀 自動デプロイによる本番反映"

# mainブランチにプッシュ（自動デプロイトリガー）
git push origin main
```

### Step 2: Vercel環境変数の確認・追加

#### 既存環境変数の確認
```
1. https://vercel.com/dashboard にアクセス
2. my-board-app プロジェクトを選択  
3. Settings → Environment Variables
4. 以下の変数が設定されているか確認
```

#### 必須環境変数リスト
```bash
# データベース
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/board-app-prod

# NextAuth.js認証（Phase 1-2）
NEXTAUTH_URL=https://my-board-app.vercel.app
NEXTAUTH_SECRET=your-production-secret-32-chars-minimum

# OAuth設定
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
GITHUB_ID=your-production-github-id
GITHUB_SECRET=your-production-github-secret

# メール設定
SMTP_HOST=初期ドメイン名.sakura.ne.jp
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=username@初期ドメイン名.sakura.ne.jp
SMTP_PASSWORD="パスワード"
MAIL_FROM_ADDRESS=username@your-production-domain.com
MAIL_FROM_NAME=掲示板システム

# アプリケーション設定
APP_URL=https://my-board-app.vercel.app
APP_NAME=掲示板システム
```

#### Phase 4-5で追加された新しい環境変数
```bash
# セキュリティ機能（Phase 5）
SECURITY_API_TOKEN=your-production-security-token

# 監視・分析（Phase 0.5）
NEXT_PUBLIC_SENTRY_DSN=your-production-sentry-dsn
SENTRY_DSN=your-production-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SLACK_WEBHOOK_URL=your-production-slack-webhook
```

### Step 3: OAuth設定の更新

#### Google OAuth Console
```
1. https://console.cloud.google.com/ にアクセス
2. APIとサービス → 認証情報
3. 既存のOAuth 2.0クライアントを編集
4. 承認済みのリダイレクトURIに追加:
   https://my-board-app.vercel.app/api/auth/callback/google
```

#### GitHub OAuth Apps
```
1. GitHub → Settings → Developer settings → OAuth Apps
2. 既存のアプリケーションを編集
3. Authorization callback URLを更新:
   https://my-board-app.vercel.app/api/auth/callback/github
```

### Step 4: デプロイ確認

#### 自動デプロイ状況確認
```bash
# Vercel Dashboard確認ポイント
1. Deployments タブで最新デプロイ状況確認
2. mainブランチからのデプロイが成功していることを確認
3. Build Logsでエラーがないことを確認
```

#### 動作確認チェックリスト

**基本機能**:
- [ ] https://my-board-app.vercel.app でアクセス可能
- [ ] ランディングページ表示
- [ ] 認証（Google・GitHub・メール）動作確認

**Phase 4新機能**:
- [ ] プロフィール表示（/profile）
- [ ] プロフィール編集（/profile/edit）  
- [ ] パスワード変更（/profile/password）
- [ ] 頭文字アバター表示

**Phase 4.5新機能**:
- [ ] 会員限定掲示板（/board）
- [ ] タイトル付き投稿作成（/board/create）
- [ ] 投稿詳細ページ（/board/[id]）
- [ ] 投稿編集ページ（/board/[id]/edit）
- [ ] 権限ベース編集・削除メニュー

**Phase 5新機能**:
- [ ] セキュリティダッシュボード（/admin/security）
- [ ] XSS対策（SafeContentコンポーネント）
- [ ] CSRF対策機能
- [ ] レート制限機能（1分5回制限）
- [ ] 監査ログ機能

### Step 5: パフォーマンス・セキュリティ確認

#### セキュリティヘッダー確認
```bash
# セキュリティヘッダーの確認
curl -I https://my-board-app.vercel.app | grep -E "(X-Frame|X-Content|CSP|HSTS)"
```

#### パフォーマンス確認
```bash
# Lighthouse確認
# https://pagespeed.web.dev/analysis?url=https://my-board-app.vercel.app

# Core Web Vitals確認
# Vercel Analytics確認（Dashboard）
```

## 🔧 トラブルシューティング

### ビルドエラー対応

#### ESLintエラーでビルド失敗
```bash
# vercel.json作成（プロジェクトルートに）
{
  "build": {
    "env": {
      "DISABLE_ESLINT_PLUGIN": "true"
    }
  }
}
```

#### MongoDB接続エラー
```bash
# 接続文字列確認
1. MongoDB Atlas → Database → Connect
2. IPホワイトリスト確認（0.0.0.0/0設定）
3. ネットワーク制限確認
```

#### 環境変数が反映されない
```bash
# Vercel CLI確認
npm install -g vercel
vercel login
vercel env ls --scope=production
```

### ロールバック手順

問題が発生した場合の緊急ロールバック：

```bash
# 前の正常な状態に戻す
1. Vercel Dashboard → Deployments
2. 正常だった前のデプロイメントを選択
3. "Promote to Production"ボタンをクリック

# または Git経由でロールバック
git checkout main
git revert HEAD  # 最新コミットを取り消し
git push origin main  # 自動で再デプロイ
```

## 📊 デプロイ後の監視

### Vercel Analytics
```bash
# Vercel Dashboard → Analytics
- ページビュー数確認
- パフォーマンスメトリクス確認
- エラー率確認
```

### Sentry監視
```bash
# Sentry Dashboard確認
- エラー発生状況
- パフォーマンス監視
- ユーザーセッション確認
```

### カスタム監視
```bash
# 独自監視ダッシュボード
https://my-board-app.vercel.app/monitoring
```

## 🎯 本番反映完了

✅ **チェックポイント**:
- mainブランチにPhase 5.5統合内容がマージ済み
- Vercel自動デプロイが成功
- 新機能（Phase 4-5）が本番環境で動作
- セキュリティ・パフォーマンス確認完了

🎉 **Phase 5.5統合版の本番デプロイ完了！**

これでPhase 0-5.5で開発された全機能が本番環境で利用可能になりました。