# メール認証設定チートシート

**プロジェクト**: 掲示板アプリ (Board App)  
**ドメイン**: kab137lab.com  
**メールサーバー**: さくらインターネット  
**DNS管理**: Cloudflare  
**作成日**: 2025年8月

---

## 🎯 設定概要

| 項目 | 設定値 | 状態 |
|------|--------|------|
| **ドメイン** | `kab137lab.com` | ✅ 設定完了 |
| **メールサーバー** | `kab137lab.sakura.ne.jp` | ✅ 設定完了 |
| **メール送信元** | `noreply@kab137lab.com` | ✅ 設定完了 |
| **DNS管理** | Cloudflare | ✅ 設定完了 |

---

## 📧 SMTP設定

| 設定項目 | 設定値 | 環境変数名 |
|----------|--------|------------|
| **SMTPホスト** | `kab137lab.sakura.ne.jp` | `SMTP_HOST` |
| **SMTPポート** | `587` | `SMTP_PORT` |
| **暗号化** | `STARTTLS (false)` | `SMTP_SECURE` |
| **認証ユーザー** | `noreply@kab137lab.sakura.ne.jp` | `SMTP_USER` |
| **パスワード** | `"Noreply#2025Kab!"` | `SMTP_PASSWORD` |
| **送信者名** | `KAB137Lab掲示板システム` | `MAIL_FROM_NAME` |
| **送信者アドレス** | `noreply@kab137lab.com` | `MAIL_FROM_ADDRESS` |

---

## 🔐 メール認証設定

### SPF (Sender Policy Framework)

| 設定項目 | 値 |
|----------|-----|
| **タイプ** | `TXT` |
| **名前** | `@` (ドメインルート) |
| **値** | `v=spf1 a:www3625.sakura.ne.jp include:_spf.sakura.ne.jp ~all` |
| **TTL** | `Auto (Cloudflare)` |
| **状態** | ✅ 設定済み・認証成功 |

**認証結果**: `spf=pass`

### DKIM (DomainKeys Identified Mail)

| 設定項目 | 値 |
|----------|-----|
| **タイプ** | `TXT` |
| **名前** | `default._domainkey` |
| **値** | `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3Fuq5ojsKoo...` |
| **セレクタ** | `default` |
| **アルゴリズム** | `rsa-sha256` |
| **状態** | ✅ 設定済み・DNS反映中 |

**認証結果**: `dkim=neutral` → `dkim=pass` (反映待ち)

### DMARC (Domain-based Message Authentication)

| 設定項目 | 値 |
|----------|-----|
| **タイプ** | `TXT` |
| **名前** | `_dmarc` |
| **値** | `v=DMARC1; p=none; rua=mailto:noreply@kab137lab.com` |
| **ポリシー** | `none` (監視モード) |
| **レポート送信先** | `noreply@kab137lab.com` |
| **状態** | ✅ 設定済み・認証成功 |

**認証結果**: `dmarc=pass`

---

## 🛠️ 支援ツール一覧

### メール送信テスト

| コマンド | 機能 | 用途 |
|----------|------|------|
| `node scripts/test-email.js` | 基本SMTP接続テスト | 初期接続確認 |
| `node scripts/test-spf-email.js` | SPF認証テスト | SPF設定確認 |
| `node scripts/test-dkim-email.js` | DKIM署名テスト | DKIM設定確認 |

### DNS・認証検証

| コマンド | 機能 | 用途 |
|----------|------|------|
| `node scripts/verify-spf.js kab137lab.com` | SPFレコード検証 | SPF設定解析 |
| `node scripts/verify-dkim.js kab137lab.com default` | DKIMレコード検証 | DKIM設定解析 |

### 設定支援

| コマンド | 機能 | 用途 |
|----------|------|------|
| `node scripts/dkim-setup-helper.js` | DKIM設定支援 | DNS設定情報生成 |

---

## 📊 認証ステータス確認

### 期待される認証結果

| 認証方式 | ヘッダー表示 | ステータス |
|----------|-------------|------------|
| **SPF** | `spf=pass` | ✅ 成功 |
| **DKIM** | `dkim=pass` | ⏳ 反映中 |
| **DMARC** | `dmarc=pass` | ✅ 成功 |

### 認証失敗パターン

| 認証方式 | 失敗表示 | 原因・対処法 |
|----------|----------|-------------|
| **SPF** | `spf=fail` | IPアドレス不一致 → SPFレコード確認 |
| **DKIM** | `dkim=fail` | 署名検証失敗 → 公開鍵確認 |
| **DKIM** | `dkim=neutral` | 無効な公開鍵 → DNS反映待ち |
| **DMARC** | `dmarc=fail` | SPF/DKIM両方失敗 → 各設定を再確認 |

---

## 🔧 トラブルシューティング

### 送信エラー

| エラー | 原因 | 解決方法 |
|--------|------|----------|
| **535 authentication failed** | 認証情報不正 | SMTP_USER/PASSWORDを確認 |
| **ETIMEDOUT** | ネットワーク接続 | テザリング使用・ファイアウォール確認 |
| **MODULE_NOT_FOUND** | パス間違い | プロジェクトルートから実行 |

### DNS設定エラー

| 問題 | 症状 | 解決方法 |
|------|------|----------|
| **SPF未反映** | `spf=none` | 24-48時間待機・レコード再確認 |
| **DKIM未反映** | `dkim=none` | DNS反映待ち・セレクタ確認 |
| **文字数制限** | DKIM長すぎ | 複数行に分割設定 |

### メール配信エラー

| 問題 | 症状 | 解決方法 |
|------|------|----------|
| **迷惑メール判定** | スパムフォルダ行き | 認証設定完了まで待機 |
| **配信拒否** | 受信されない | MXレコード設定・サーバー確認 |

---

## ⏰ DNS反映時間

| 設定 | 反映時間 | 確認方法 |
|------|----------|----------|
| **SPF** | 1-6時間 | `nslookup -type=txt kab137lab.com` |
| **DKIM** | 1-24時間 | `nslookup -type=txt default._domainkey.kab137lab.com` |
| **DMARC** | 1-6時間 | `nslookup -type=txt _dmarc.kab137lab.com` |

---

## 🌐 外部検証ツール

### オンライン検証サービス

| サービス | URL | 用途 |
|----------|-----|------|
| **MXToolbox** | https://mxtoolbox.com/spf.aspx | SPF検証 |
| **DMARCIAN** | https://dmarcian.com/spf-survey/ | SPF詳細分析 |
| **Mail Tester** | https://www.mail-tester.com | 総合メール分析 |
| **DKIM Validator** | https://mxtoolbox.com/dkim.aspx | DKIM検証 |

### コマンドライン確認

```bash
# SPF確認
nslookup -type=txt kab137lab.com 8.8.8.8

# DKIM確認
nslookup -type=txt default._domainkey.kab137lab.com 8.8.8.8

# DMARC確認  
nslookup -type=txt _dmarc.kab137lab.com 8.8.8.8
```

---

## 📈 設定完了チェックリスト

### さくらインターネット側

- [ ] kab137lab.comドメイン追加完了
- [ ] DKIM設定有効化（セレクタ: default）
- [ ] DMARC設定有効化（ポリシー: none）
- [ ] SMTP認証情報確認済み

### Cloudflare側

- [ ] SPF TXTレコード設定完了
- [ ] DKIM TXTレコード設定完了（default._domainkey）
- [ ] DMARC TXTレコード設定完了（_dmarc）
- [ ] DNS反映確認済み

### 動作確認

- [ ] SMTP接続テスト成功
- [ ] SPF認証テスト成功 (`spf=pass`)
- [ ] DKIM署名付きメール送信成功
- [ ] DMARC認証テスト成功 (`dmarc=pass`)
- [ ] メールが迷惑フォルダに入らない

---

## 🎯 最終状態

| 認証方式 | 状態 | 備考 |
|----------|------|------|
| **SPF** | ✅ 完了 | `spf=pass` 確認済み |
| **DKIM** | ⏳ 反映中 | DNS反映待ち（24時間以内） |
| **DMARC** | ✅ 完了 | `dmarc=pass` 確認済み |
| **総合** | 🟡 ほぼ完了 | DKIM反映後に完全完了 |

---

## 📞 サポート情報

### 問題発生時の連絡先

| 問題種別 | 連絡先 | 確認事項 |
|----------|--------|----------|
| **さくらサーバー関連** | さくらインターネットサポート | SMTP設定・DKIM設定状況 |
| **Cloudflare関連** | Cloudflareサポート | DNS設定・反映状況 |
| **アプリケーション関連** | 開発チーム | ログ・環境変数設定 |

### ドキュメント参照先

- **詳細トラブルシューティング**: `docs/email-troubleshooting-guide.md`
- **メール認証技術解説**: `docs/email-authentication-guide.md`
- **プロジェクト全体概要**: `CLAUDE.md`

---

**最終更新**: 2025年8月9日  
**次回確認予定**: DNS反映後（24時間以内）