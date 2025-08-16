# Resendメールサービス設定ガイド

## なぜResendか？

- Vercelとの相性が最高（同じ会社が推奨）
- 月間3,000通まで無料
- 5分で設定完了
- 日本への配信率が高い

## セットアップ手順

### 1. Resendアカウント作成

1. https://resend.com にアクセス
2. 「Sign up」をクリック
3. GitHubまたはメールで登録

### 2. APIキー取得

1. ダッシュボード → API Keys
2. 「Create API Key」
3. キーをコピー（例: `re_xxxxxxxxxxxxx`）

### 3. ドメイン設定（オプション）

独自ドメインを使う場合：

1. Domains → Add Domain
2. `kab137lab.com` を追加
3. DNSレコードを設定

簡単に始める場合：

- Resendのデフォルトドメイン `onboarding@resend.dev` を使用

### 4. 環境変数更新

Vercelダッシュボードで以下を設定：

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
MAIL_FROM_ADDRESS=onboarding@resend.dev
MAIL_FROM_NAME=KAB137Lab掲示板システム
```

### 5. コード更新

`src/lib/email/resend-sender.ts` を作成：

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Resendエラー:', error);
      return { success: false, error };
    }

    console.log('メール送信成功:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('メール送信エラー:', error);
    return { success: false, error };
  }
}
```

### 6. デプロイ

```bash
npm install resend
git add .
git commit -m "feat: Resendメールサービス統合"
git push
```

## 完了！

これで本番環境でもメール送信が動作します。
