# Sentry & Slack 監視設定ガイド

## 🔍 Sentry DSN の取得方法

### Step 1: Sentryアカウント作成

1. [Sentry.io](https://sentry.io/signup/) にアクセス
2. 無料アカウントを作成（GitHubアカウントでサインアップ可能）
3. メール認証を完了

### Step 2: プロジェクト作成

1. ダッシュボードから「Create Project」をクリック
2. プラットフォームを選択：
   - **Next.js** を選択（または JavaScript → Next.js）
3. プロジェクト名を入力：`my-board-app`
4. チームを選択または作成
5. 「Create Project」をクリック

### Step 3: DSN取得

1. プロジェクト作成後、自動的に設定画面が表示
2. 「Client Keys (DSN)」セクションを探す
3. または：Settings → Projects → [プロジェクト名] → Client Keys (DSN)
4. DSNをコピー（形式：`https://[KEY]@[ORGANIZATION].ingest.sentry.io/[PROJECT_ID]`）

### Step 4: 環境変数に設定

```env
# .env.local
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxxxxxxxx@o123456.ingest.sentry.io/1234567
```

### Step 5: Vercelに設定

1. Vercel Dashboard → Settings → Environment Variables
2. 変数名：`NEXT_PUBLIC_SENTRY_DSN`
3. 値：コピーしたDSN
4. 環境：Production, Preview, Development すべてにチェック
5. Save

## 📢 Slack Webhook URL の取得方法

### Step 1: Slack App作成

1. [Slack API](https://api.slack.com/apps) にアクセス
2. 「Create New App」をクリック
3. 「From scratch」を選択
4. App名：`My Board App Notifications`
5. ワークスペースを選択
6. 「Create App」をクリック

### Step 2: Incoming Webhooks有効化

1. 左サイドバーから「Incoming Webhooks」を選択
2. 「Activate Incoming Webhooks」をONにする
3. 「Add New Webhook to Workspace」をクリック
4. 通知を送信したいチャンネルを選択（例：#deployments, #alerts）
5. 「Allow」をクリック

### Step 3: Webhook URL取得

1. Webhook URLが生成される
2. URLをコピー（形式：`https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`）
3. 「Copy」ボタンでコピー

### Step 4: 環境変数に設定

```env
# .env.local
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

### Step 5: Vercelに設定

1. Vercel Dashboard → Settings → Environment Variables
2. 変数名：`SLACK_WEBHOOK_URL`
3. 値：コピーしたWebhook URL
4. 環境：Production（本番環境のみ推奨）
5. Save

## 🧪 動作テスト

### Sentryテスト

```typescript
// pages/api/test-sentry.ts (テスト用)
import * as Sentry from '@sentry/nextjs';

export default function handler(req, res) {
  // テストエラーを送信
  Sentry.captureException(new Error('Test error from my-board-app'));
  res.status(200).json({ message: 'Error sent to Sentry' });
}
```

アクセス：`http://localhost:3010/api/test-sentry`
→ Sentryダッシュボードでエラーを確認

### Slackテスト

```typescript
// pages/api/test-slack.ts (テスト用)
export default async function handler(req, res) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  const message = {
    text: '🚀 デプロイメント通知テスト',
    attachments: [
      {
        color: 'good',
        title: 'My Board App',
        text: 'Slackへの通知が正常に動作しています',
        footer: 'Deployment System',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });

  res.status(200).json({ success: response.ok });
}
```

アクセス：`http://localhost:3010/api/test-slack`
→ Slackチャンネルで通知を確認

## 📊 Sentry設定オプション（推奨）

### sentry.client.config.ts

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // パフォーマンス監視
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // セッション追跡
  autoSessionTracking: true,

  // 環境設定
  environment: process.env.NODE_ENV,

  // リリースバージョン
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // エラーフィルタリング
  ignoreErrors: [
    // ブラウザ拡張機能によるエラーを無視
    'top.GLOBALS',
    // ネットワークエラーを無視（必要に応じて）
    'Network request failed',
  ],

  // ユーザー情報の追加（オプション）
  beforeSend(event, hint) {
    // センシティブ情報を削除
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  },
});
```

## 🔔 Slack通知カスタマイズ

### デプロイメント成功通知

```typescript
const notifyDeploymentSuccess = async (version: string, environment: string) => {
  const message = {
    text: `✅ デプロイメント成功`,
    attachments: [
      {
        color: 'good',
        title: 'Deployment Successful',
        fields: [
          { title: 'Version', value: version, short: true },
          { title: 'Environment', value: environment, short: true },
          { title: 'URL', value: `https://${environment}.kab137lab.com` },
          { title: 'Time', value: new Date().toISOString() },
        ],
        footer: 'My Board App Deployment System',
      },
    ],
  };

  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
};
```

### エラー通知

```typescript
const notifyError = async (error: Error, context: string) => {
  const message = {
    text: `🚨 エラーが発生しました`,
    attachments: [
      {
        color: 'danger',
        title: error.message,
        fields: [
          { title: 'Context', value: context, short: true },
          { title: 'Environment', value: process.env.NODE_ENV, short: true },
          { title: 'Stack', value: `\`\`\`${error.stack}\`\`\`` },
        ],
        footer: 'Error Monitoring',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
};
```

## 💡 ベストプラクティス

### Sentry

1. **本番環境のみ有効化**：開発環境ではノイズを避ける
2. **サンプリングレート調整**：コスト管理のため0.1-0.2推奨
3. **センシティブ情報除外**：パスワード、トークンをフィルタリング
4. **リリースバージョン追跡**：デプロイごとにバージョン設定
5. **ソースマップアップロード**：エラーの詳細な追跡

### Slack

1. **チャンネル分離**：重要度別にチャンネルを分ける
   - #deploys - デプロイメント通知
   - #alerts - エラー・警告
   - #monitoring - メトリクス・統計
2. **レート制限**：1秒に1メッセージまで
3. **リッチフォーマット**：attachmentsで見やすく
4. **時間帯考慮**：深夜の通知は避ける
5. **メンション制御**：@channel, @hereは慎重に

## 🚫 セキュリティ注意事項

### やってはいけないこと

- ❌ DSNやWebhook URLをGitHubにコミット
- ❌ クライアントサイドでSlack Webhook URLを使用
- ❌ ログにセンシティブ情報を含める
- ❌ 公開リポジトリに環境変数を記載

### やるべきこと

- ✅ 環境変数は必ずVercelやGitHub Secretsで管理
- ✅ `.env.local`は`.gitignore`に追加
- ✅ Sentryのセンシティブデータスクラビング有効化
- ✅ Slackアプリの権限は最小限に
- ✅ 定期的にWebhook URLをローテーション

## 📚 参考リンク

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Next.js Error Handling](https://nextjs.org/docs/advanced-features/error-handling)
