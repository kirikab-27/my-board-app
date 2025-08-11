# 📧 メール送信機能 トラブルシューティングガイド

## 概要

このドキュメントは、さくらインターネットのメールサービスを使用したメール送信機能実装時に発生した実際のエラーと解決策をまとめたものです。

**作成日**: 2025年1月現在  
**対象**: さくらのメールボックス + Node.js + Nodemailer  
**基づく実体験**: プロジェクト実装時の実際のエラーケース

---

## 🕐 エラーの発生順序と解決過程

### 1. **ESモジュールエラー** (`ERR_MODULE_NOT_FOUND`)

**❌ エラーメッセージ**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'C:\...\src\lib\email\config'
imported from C:\...\src\lib\email\smtp-test.ts
```

**🔍 根本原因**
- TypeScriptファイル（`.ts`）をCommonJS環境から直接requireしようとした
- ESモジュールとCommonJSの混在による互換性問題
- テスト環境とアプリケーション環境のモジュールシステムの不一致

**✅ 解決方法**
1. テストスクリプトを完全にCommonJS形式で書き直し
2. TypeScriptの import/export を使わず、require/module.exports を使用
3. 機能をTypeScriptファイルからJavaScriptファイルに移植

**📝 予防策**
- プロジェクト全体でモジュールシステムを統一
- テストスクリプトは本体とは独立したCommonJS形式で作成
- package.jsonの"type"設定を明確にする

---

### 2. **依存関係エラー** (`MODULE_NOT_FOUND`)

**❌ エラーメッセージ**
```
Error: Cannot find module 'dotenv'
```

**🔍 根本原因**
- `.env.local`ファイルを読み込むための`dotenv`パッケージが未インストール
- 開発依存関係の管理不備

**✅ 解決方法**
```bash
npm install dotenv
npm install --save-dev @types/nodemailer
```

**📝 予防策**
- 依存関係をpackage.jsonで適切に管理
- 新しい環境でのセットアップ手順を明文化

---

### 3. **API関数名エラー** (`TypeError`)

**❌ エラーメッセージ**
```
TypeError: nodemailer.createTransporter is not a function
```

**🔍 根本原因**
- Nodemailerの正しいAPI関数名は`createTransport`
- `createTransporter`は存在しない関数名（タイポ）

**✅ 解決方法**
```javascript
// 間違い
const transporter = nodemailer.createTransporter(config);

// 正解
const transporter = nodemailer.createTransport(config);
```

**📝 予防策**
- 公式ドキュメントでAPI仕様を必ず確認
- IDE・エディタの補完機能を活用
- 単体テストでAPI使用箇所を検証

---

### 4. **環境変数パース エラー**

**❌ 現象**
```
パスワード長: 7文字  # 実際は16文字のはず
```

**🔍 根本原因**
- 環境変数のパスワードに`#`記号が含まれている
- `.env`ファイルでは`#`がコメント開始記号として認識される
- `SMTP_PASSWORD=Noreply#2025Kab!` → `#`以降が無視される

**✅ 解決方法**
```env
# 間違い
SMTP_PASSWORD=Noreply#2025Kab!

# 正解
SMTP_PASSWORD="Noreply#2025Kab!"
```

**📝 予防策**
- 特殊文字を含むパスワードは必ずクォートで囲む
- 環境変数の読み込み確認スクリプトを作成
- パスワード生成時は`.env`ファイルとの互換性を考慮

---

### 5. **SMTP認証エラー** (`535 5.7.0 authentication failed`)

**❌ エラーメッセージ**
```
Error: Invalid login: 535 5.7.0 authentication failed
```

**🔍 根本原因**
- さくらインターネットのSMTP認証で間違ったユーザー名を使用
- `SMTP_USER=noreply@kab137lab.com` （独自ドメイン）を使用
- さくらでは**初期ドメイン**（`@xxx.sakura.ne.jp`）での認証が必須

**✅ 解決方法**
```env
# 間違い
SMTP_USER=noreply@kab137lab.com

# 正解  
SMTP_USER=noreply@kab137lab.sakura.ne.jp

# 送信元アドレスは独自ドメインでOK
MAIL_FROM_ADDRESS=noreply@kab137lab.com
```

**📝 予防策**
- 各メールサービスプロバイダーの認証仕様を事前調査
- 認証用ユーザー名と送信元アドレスは別物として管理
- 複数の認証パターンをテストするスクリプトを作成

---

### 6. **ネットワーク接続エラー** (`ETIMEDOUT`, `ECONNRESET`)

**❌ エラーメッセージ**
```
Error: connect ETIMEDOUT 49.212.243.165:587
Error: read ECONNRESET  
```

**🔍 根本原因**
- ISP（インターネットプロバイダー）によるSMTPポートのブロック
- スパム対策として25, 587, 465番ポートが制限されている
- 家庭用回線での一般的な制約

**✅ 解決方法**
1. **即座の解決策**
   - モバイル回線（テザリング）を使用
   - VPNサービス経由での接続
   - プロクシサーバーの利用

2. **本番環境での対策**
   - VPS・クラウドサーバーからの送信
   - メール配信サービス（SendGrid等）の利用
   - ISPとの契約変更（ビジネス向けプラン）

**📝 予防策**
- 複数の接続手段を用意（開発・本番共に）
- ネットワーク接続確認スクリプトの準備
- ISPの制限事項を事前調査

---

## 🎯 エラー分類マトリックス

### 技術的・実装エラー
| エラー種類 | 影響度 | 解決難易度 | 所要時間目安 |
|----------|-------|----------|------------|
| ESモジュールエラー | 高 | 中 | 30分 |
| 依存関係不足 | 中 | 低 | 5分 |
| API関数名間違い | 中 | 低 | 10分 |
| 環境変数パース | 中 | 低 | 15分 |

### 設定・サービス固有エラー
| エラー種類 | 影響度 | 解決難易度 | 所要時間目安 |
|----------|-------|----------|------------|
| SMTP認証失敗 | 高 | 中 | 45分 |
| プロバイダー仕様 | 高 | 高 | 1-2時間 |

### インフラ・ネットワークエラー  
| エラー種類 | 影響度 | 解決難易度 | 所要時間目安 |
|----------|-------|----------|------------|
| ISPポートブロック | 高 | 高 | 数時間-数日 |
| 接続タイムアウト | 中 | 中 | 1時間 |

---

## 🛠️ 診断・解決フローチャート

### Step 1: 基本確認
```bash
# 環境変数の確認
echo "SMTP_HOST: $SMTP_HOST"
echo "SMTP_PORT: $SMTP_PORT" 
echo "SMTP_USER: $SMTP_USER"
echo "パスワード設定: ${SMTP_PASSWORD:+設定済み}"
```

### Step 2: ネットワーク接続確認
```bash
# pingテスト
ping -c 1 your-smtp-host.com

# ポート接続テスト（Windows）
powershell "Test-NetConnection -ComputerName your-smtp-host.com -Port 587"

# ポート接続テスト（Linux/Mac）
telnet your-smtp-host.com 587
```

### Step 3: 段階的テスト実行
```bash
# 1. 基本テスト
node scripts/test-email.js

# 2. 詳細診断  
node scripts/debug-email.js

# 3. プロバイダー固有テスト
node scripts/check-sakura-settings.js
```

### Step 4: エラー分類と対策

**接続エラー（ETIMEDOUT, ECONNREFUSED）**
→ ネットワーク・インフラ問題 → 回線変更・VPN使用

**認証エラー（535 authentication failed）**  
→ 設定問題 → 認証情報・プロバイダー仕様確認

**モジュールエラー（MODULE_NOT_FOUND）**
→ 技術問題 → 依存関係・コード修正

---

## 📋 さくらインターネット固有の設定チェックリスト

### SMTP設定
- [ ] SMTP_HOST: `初期ドメイン名.sakura.ne.jp`
- [ ] SMTP_PORT: `587` (STARTTLS) または `465` (SSL)
- [ ] SMTP_USER: `username@初期ドメイン名.sakura.ne.jp`
- [ ] SMTP_PASSWORD: 管理画面で設定したメールパスワード（ログインパスワードとは別）

### 送信設定  
- [ ] MAIL_FROM_ADDRESS: `独自ドメイン@your-domain.com` でOK
- [ ] 認証用ユーザー名と送信元アドレスは別設定
- [ ] パスワードの特殊文字はクォートで囲む

### 管理画面確認
- [ ] メールアドレスが「使用中」状態
- [ ] メールボックス容量に余裕あり
- [ ] SMTP認証が有効
- [ ] セキュリティ制限が適切

---

## 🚀 本番環境への適用時の注意点

### DNS設定
- SPF レコード: `"v=spf1 include:spf.sakura.ne.jp ~all"`
- DKIM設定: さくらが提供するキーを設定
- DMARC設定: `"v=DMARC1; p=quarantine; rua=mailto:admin@your-domain.com"`

### 監視・ログ
- 送信成功/失敗のログ記録
- バウンスメール処理
- 送信数制限の監視（1000通/時間）

### セキュリティ
- 環境変数の適切な保護
- SMTP接続の暗号化確認
- パスワードローテーション計画

---

## 📞 サポート・参考情報

### さくらインターネット
- サポート電話: `0120-775-664` (平日10:00-18:00)
- ヘルプページ: https://help.sakura.ad.jp/
- メール設定ガイド: https://help.sakura.ad.jp/mail/

### 技術資料
- Nodemailer公式: https://nodemailer.com/
- Node.js環境変数: https://nodejs.org/api/process.html#processenv
- SMTP認証仕様: RFC 4954

---

**最終更新**: 2025年1月  
**作成者**: Claude Code Assistant  
**ステータス**: プロダクション実証済み