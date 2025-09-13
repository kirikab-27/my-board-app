# デプロイメントシステム環境変数設定ガイド

## 📋 概要

Issue #62で実装したBlue-Green・カナリアデプロイメントシステムの環境変数設定手順です。

## 🔧 必要な環境変数

### 1. Vercel環境変数

Vercelダッシュボード（Settings → Environment Variables）で以下を設定：

```env
# デプロイメント識別
DEPLOYMENT_ID=auto               # Vercelが自動設定
DEPLOYMENT_ENV=blue              # blue/green/canary
ACTIVE_ENV=blue                  # 現在のアクティブ環境

# カナリアデプロイメント用
CANARY_VERSION=v1.0.0            # カナリアバージョン
CANARY_TRAFFIC_PERCENTAGE=10    # トラフィック割合（%）

# モニタリング（既存）
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

### 2. GitHub Secrets

GitHub（Settings → Secrets and variables → Actions）で以下を設定：

```env
# Vercel連携
VERCEL_TOKEN=your_vercel_token_here        # Vercelトークン
VERCEL_ORG_ID=your_vercel_org_id          # 組織ID
VERCEL_PROJECT_ID=your_project_id         # プロジェクトID

# デプロイメント承認用（オプション）
GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }}   # 自動設定
DEPLOYMENT_APPROVERS=kirikab-27            # 承認者のGitHubユーザー名
```

### 3. ローカル開発環境（.env.local）

```env
# デプロイメント設定（開発用）
NODE_ENV=development
DEPLOYMENT_ENV=development
ACTIVE_ENV=development

# ヘルスチェック
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000     # 30秒

# メトリクス収集
METRICS_ENABLED=true
METRICS_INTERVAL=60000          # 60秒
```

## 📝 設定手順

### Step 1: Vercelトークンの取得

1. [Vercel Dashboard](https://vercel.com/account/tokens) にアクセス
2. "Create Token" をクリック
3. トークン名を入力（例：`github-actions-deployment`）
4. スコープを選択（Full Access推奨）
5. 生成されたトークンをコピー

### Step 2: GitHub Secretsの設定

```bash
# GitHub CLIを使用する場合
gh secret set VERCEL_TOKEN --body "your_vercel_token_here"
gh secret set VERCEL_ORG_ID --body "your_org_id"
gh secret set VERCEL_PROJECT_ID --body "your_project_id"
```

または、GitHubのWeb UIから：

1. リポジトリの Settings → Secrets and variables → Actions
2. "New repository secret" をクリック
3. Name と Secret を入力して保存

### Step 3: Vercel環境変数の設定

```bash
# Vercel CLIを使用する場合
vercel env add DEPLOYMENT_ENV production
vercel env add ACTIVE_ENV blue production
vercel env add CANARY_VERSION v1.0.0 production
```

または、Vercel Dashboard から：

1. プロジェクトの Settings → Environment Variables
2. 変数名、値、環境（Production/Preview/Development）を設定
3. Save をクリック

### Step 4: デプロイメント設定のカスタマイズ

`deployment/deployment.config.ts` を必要に応じて編集：

```typescript
export const defaultDeploymentConfig: DeploymentConfig = {
  projectName: 'my-board-app',
  environments: [
    {
      name: 'production',
      url: 'https://kab137lab.com', // 本番URL
      type: 'production',
      provider: 'vercel',
    },
    // ... 他の環境
  ],
  blueGreen: {
    enabled: true, // Blue-Green有効化
    autoSwitch: false, // 自動切り替え
    healthCheckInterval: 30, // ヘルスチェック間隔（秒）
    rollbackOnFailure: true, // 失敗時自動ロールバック
  },
  canary: {
    enabled: true, // カナリア有効化
    initialTrafficPercentage: 10, // 初期トラフィック割合
    incrementPercentage: 20, // 増分割合
    incrementInterval: 10, // 増分間隔（分）
    maxErrorRate: 5, // 最大エラー率（%）
    autoRollback: true, // 自動ロールバック
  },
};
```

## 🚀 デプロイメント実行

### GitHub Actions経由（推奨）

1. GitHub Actions タブを開く
2. "Blue-Green Deployment" または "Canary Deployment" を選択
3. "Run workflow" をクリック
4. パラメータを設定：
   - environment: `staging` or `production`
   - strategy: `blue-green` or `canary`
   - auto_switch: `true` or `false`
5. "Run workflow" で実行

### CLIコマンド経由

```bash
# Blue-Greenデプロイメント
npm run deploy:blue-green

# カナリアデプロイメント
npm run deploy:canary

# ロールバック
npm run deploy:rollback
```

## 🔍 動作確認

### ヘルスチェック確認

```bash
curl https://kab137lab.com/api/health
```

期待されるレスポンス：

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production",
  "deploymentId": "dpl_xxxxx",
  "checks": {
    "database": true,
    "api": true,
    "auth": true,
    "storage": true
  }
}
```

### メトリクス確認

```bash
curl https://kab137lab.com/api/metrics
```

### 環境変数確認

```bash
# Vercel CLIで確認
vercel env ls

# 特定の環境変数を確認
vercel env pull .env.production
```

## ⚠️ 注意事項

1. **VERCEL_TOKEN** は絶対に公開しないこと
2. Production環境への自動切り替えは慎重に設定
3. ロールバック設定は必ず有効にしておく
4. カナリアデプロイメントのエラー率閾値は適切に設定
5. Slack通知を設定してデプロイメント状況を監視

## 🆘 トラブルシューティング

### Vercel APIエラー

- トークンの有効期限を確認
- プロジェクトIDが正しいか確認
- API制限に達していないか確認

### ヘルスチェック失敗

- `/api/health` エンドポイントが正常動作しているか確認
- データベース接続を確認
- 環境変数が正しく設定されているか確認

### GitHub Actions失敗

- Secretsが正しく設定されているか確認
- ワークフローの権限設定を確認
- ログを確認して詳細なエラーを特定

## 📚 関連ドキュメント

- [Vercel環境変数ドキュメント](https://vercel.com/docs/environment-variables)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Issue #62: デプロイメントシステム実装](https://github.com/kirikab-27/my-board-app/issues/62)
