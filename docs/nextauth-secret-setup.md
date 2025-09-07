# NEXTAUTH_SECRET 設定ガイド

## 🚨 重要性

NEXTAUTH_SECRETは以下の用途で使用される重要な秘密鍵です：
- JWTトークンの署名と検証
- セッションの暗号化
- CSRF保護トークンの生成

**現在の値（脆弱）**: `your-super-secret-nextauth-key-for-phase1-auth-system-updated-2025`
→ 推測可能な文字列のため、本番環境では使用しないでください

## 🔧 安全な秘密鍵の生成方法

### 方法1: OpenSSLを使用（推奨）
```bash
openssl rand -base64 32
```

### 方法2: Node.jsを使用
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 方法3: PowerShellを使用（Windows）
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### 方法4: オンラインツール
NextAuth.js公式の秘密鍵生成ツール：
https://generate-secret.vercel.app/32

## 📝 生成例

以下のような形式の文字列が生成されます：
```
tBQFqjZ7XGqKzYn5L8vFHkQmRp3WJdN2xAcE9SuVhM4=
```

## 🚀 Vercel環境変数の設定手順

### 1. Vercelダッシュボードにアクセス
1. https://vercel.com にログイン
2. `my-board-app` プロジェクトを選択

### 2. 環境変数設定画面へ
1. Settings タブをクリック
2. 左メニューから「Environment Variables」を選択

### 3. NEXTAUTH_SECRETを更新
1. 既存の `NEXTAUTH_SECRET` を探す
2. 編集ボタン（鉛筆アイコン）をクリック
3. 新しく生成した秘密鍵を入力
4. Environment: `Production`, `Preview`, `Development` すべてにチェック
5. 「Save」をクリック

### 4. 再デプロイ
1. Deployments タブへ移動
2. 最新のデプロイメントの「...」メニューをクリック
3. 「Redeploy」を選択
4. 「Use existing Build Cache」のチェックを外す
5. 「Redeploy」ボタンをクリック

## ⚠️ 注意事項

### セキュリティ
- **絶対にGitHubにコミットしない**
- **公開リポジトリに含めない**
- **定期的に更新する**（6ヶ月〜1年）
- **複数環境で同じ値を使用しない**

### ローカル開発環境
`.env.local` ファイルに設定：
```env
NEXTAUTH_SECRET=生成した秘密鍵
```

### トラブルシューティング

#### エラー: `[next-auth][error][JWT_SESSION_ERROR]`
- 原因: NEXTAUTH_SECRETが設定されていない、または不正
- 解決: 上記手順で新しい秘密鍵を生成・設定

#### エラー: `MIDDLEWARE_INVOCATION_FAILED`
- 原因: 本番環境でNEXTAUTH_SECRETが未設定
- 解決: Vercel環境変数を確認・更新

## 📊 推奨設定

| 項目 | 推奨値 |
|------|--------|
| 長さ | 32バイト以上 |
| 文字種 | Base64エンコード |
| 更新頻度 | 6ヶ月〜1年 |
| 環境別 | 開発・ステージング・本番で別々の値 |

## 🔐 その他の環境変数確認

同時に以下の環境変数も確認してください：

```env
# 本番環境
NEXTAUTH_URL=https://kab137lab.com
MONGODB_URI=mongodb+srv://... (MongoDB Atlas URI)

# OAuth設定（必要に応じて）
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_ID=...
GITHUB_SECRET=...
```

---

**作成日**: 2025/09/07
**最終更新**: 2025/09/07