# メール認証設定ガイド

## 現在の構成と制約

### インフラ構成
- **ドメイン管理**: Cloudflare（kab137lab.com）
- **メールサーバー**: さくらインターネット（共用サーバー）
- **制約**: さくらレンタルサーバーはDKIM非対応

## 実装済み認証機能

### SPFレコード ✅
```
タイプ: TXT
ドメイン: kab137lab.com
値: v=spf1 a:www3625.sakura.ne.jp include:_spf.sakura.ne.jp ~all
```

**効果**:
- なりすまし防止
- 迷惑メール判定の軽減
- 主要メールプロバイダで認証

## DKIM設定について

### さくらインターネットの制約
さくらのレンタルサーバー（共用）では**DKIM署名機能が提供されていません**。

### 代替案

#### オプション1: SPFのみで運用（推奨）
**現在の構成を維持**
- SPF設定済み ✅
- 多くの中小規模サイトがこの構成
- 実用上問題なし

**メリット**:
- 追加コスト不要
- 設定がシンプル
- 管理が容易

**デメリット**:
- 一部の厳格なメールサーバーで評価が下がる可能性
- DMARC完全準拠できない

#### オプション2: 外部メールサービス利用
**DKIM対応サービスへ移行**

| サービス | 無料枠 | DKIM | 特徴 |
|---------|--------|------|------|
| SendGrid | 100通/日 | ✅ | 開発者向け |
| Amazon SES | 62,000通/月 | ✅ | AWS統合 |
| Mailgun | 1,000通/月 | ✅ | API充実 |
| Postmark | 100通/月 | ✅ | トランザクション特化 |

**実装例（SendGrid）**:
```javascript
// npm install @sendgrid/mail
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'recipient@example.com',
  from: 'noreply@kab137lab.com', // DKIMで署名される
  subject: 'Test Email',
  text: 'Hello World',
};

sgMail.send(msg);
```

#### オプション3: ハイブリッド構成
**通常メール**: さくらインターネット（SPFのみ）
**重要メール**: 外部サービス（SPF+DKIM）

```javascript
// 重要度に応じて送信方法を切り替え
if (email.priority === 'high') {
  await sendViaSendGrid(email);  // DKIM署名あり
} else {
  await sendViaSakura(email);    // SPFのみ
}
```

## DMARC設定（将来対応）

DKIMなしでも基本的なDMARC設定は可能：

```
タイプ: TXT
名前: _dmarc
値: v=DMARC1; p=none; rua=mailto:dmarc@kab137lab.com; sp=none; aspf=r;
```

**意味**:
- `p=none`: 監視モード（拒否しない）
- `aspf=r`: SPFチェックを緩い判定に
- `rua`: レポート送信先

## 推奨アクション

### 短期（現在）
1. ✅ SPF設定完了
2. 📊 メール到達率をモニタリング
3. 📧 ユーザーからの報告を収集

### 中期（必要に応じて）
1. 🔍 到達率に問題があれば外部サービス検討
2. 📈 送信量が増えたらSendGrid等へ移行
3. 🔐 DMARCレポート設定

### 長期（スケール時）
1. 🚀 専用メールサービスへ完全移行
2. 🛡️ DKIM+SPF+DMARC完全対応
3. 📊 詳細な配信分析

## 検証コマンド

### SPF確認
```bash
# Windows
nslookup -type=txt kab137lab.com 8.8.8.8

# スクリプト
node scripts/verify-spf.js kab137lab.com
```

### メール送信テスト
```bash
node scripts/test-spf-email.js
```

### ヘッダー確認ポイント
```
Authentication-Results: 
  spf=pass (sender IP is xxx.xxx.xxx.xxx) smtp.mailfrom=kab137lab.com
```

## トラブルシューティング

### 迷惑メール判定される場合

1. **SPFレコードを確認**
   ```bash
   nslookup -type=txt kab137lab.com
   ```

2. **送信元IPを確認**
   - さくらのIPが変更されていないか
   - `www3625.sakura.ne.jp`のAレコード確認

3. **メール内容を見直し**
   - スパムワードを避ける
   - HTMLとテキストの両方を含める
   - 配信停止リンクを含める

### 外部サービス移行時の注意

1. **DNSレコード更新**
   - 新サービスのSPF追加
   - DKIMレコード追加

2. **段階的移行**
   - テスト送信から開始
   - 重要度の低いメールから切り替え
   - 完全移行は慎重に

## まとめ

**現状の推奨**: SPFのみで運用継続

- さくらインターネットではDKIM不可
- SPF設定済みで基本的な認証は確保
- 必要に応じて外部サービスを検討

**将来の拡張性**: 
- SendGrid等への移行パスは確保
- コード変更は最小限で対応可能
- 段階的な移行が可能