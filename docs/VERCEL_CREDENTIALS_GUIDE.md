# Vercel認証情報取得ガイド

## 🔑 必要な3つの値

1. **VERCEL_TOKEN** - API認証トークン
2. **VERCEL_ORG_ID** - 組織/チームID
3. **VERCEL_PROJECT_ID** - プロジェクトID

---

## 1️⃣ VERCEL_TOKEN の取得方法

### 方法A: Vercel Dashboard から取得（推奨）

1. **[Vercel Dashboard](https://vercel.com/account/tokens)** にアクセス
   - または: Vercel Dashboard → Settings → Tokens

2. **「Create Token」** ボタンをクリック

3. **トークン設定**
   - Token Name: `github-actions-deployment`（任意の名前）
   - Scope: `Full Account`を選択（推奨）
   - Expiration: `No Expiration`または適切な期限

   LCU8BMf086ZaHWrDvbolrWJO

4. **「Create」** をクリック

5. **トークンをコピー**
   ```
   例: xxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   ⚠️ **重要**: トークンは一度しか表示されません！必ずコピーして安全に保管

### 方法B: Vercel CLI から取得

```bash
# Vercel CLIをインストール
npm i -g vercel

# ログイン
vercel login

# トークン作成
vercel tokens create github-actions-deployment
```

---

## 2️⃣ VERCEL_ORG_ID の取得方法

### 方法A: Vercel Dashboard から取得

1. **[Vercel Dashboard](https://vercel.com/dashboard)** にアクセス

2. **チーム/組織を選択**
   - 左上のチーム名をクリック
   - 個人アカウントの場合は自分の名前

3. **Settings** タブをクリック

4. **General** セクションを確認

5. **Team ID** または **Your ID** をコピー
   ```
   例: team_xxxxxxxxxxxxxxxxxx
   ```

### 方法B: Vercel CLI から取得

```bash
# プロジェクトディレクトリで実行
cd my-board-app

# Vercel設定を確認
vercel whoami --json

# 出力例：
{
  "id": "team_xxxxxxxxxxxxxxxxxx",  ← これがORG_ID
  "name": "Your Team Name"
}
```

### 方法C: .vercel/project.json から取得

```bash
# プロジェクトに.vercelフォルダがある場合
cat .vercel/project.json

# 内容例：
{
  "orgId": "team_xxxxxxxxxxxxxxxxxx",  ← これがORG_ID
  "projectId": "prj_xxxxxxxxxxxxxxxxxx"
}
```

---

## 3️⃣ VERCEL_PROJECT_ID の取得方法

### 方法A: Vercel Dashboard から取得（推奨）

1. **プロジェクトページ** にアクセス
   - https://vercel.com/[your-username]/my-board-app

2. **Settings** タブをクリック

3. **General** セクションを確認

4. **Project ID** をコピー
   ```
   例: prj_xxxxxxxxxxxxxxxxxx
   ```

### 方法B: URL から取得

1. Vercelのプロジェクト設定ページのURLを確認

   ```
   https://vercel.com/[username]/my-board-app/settings
   ```

2. ブラウザの開発者ツールを開く（F12）

3. Networkタブで任意のAPIリクエストを確認

4. Request HeadersまたはResponseでprojectIdを探す

### 方法C: .vercel/project.json から取得

```bash
# プロジェクトルートで実行
cat .vercel/project.json

# 内容例：
{
  "orgId": "team_xxxxxxxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxxxxxxx"  ← これがPROJECT_ID
}
```

### 方法D: Vercel CLI から取得

```bash
# プロジェクトディレクトリで実行
vercel ls

# 出力から my-board-app を探す
# URLの最後の部分がプロジェクトID
```

---

## 📋 確認チェックリスト

取得した値を以下の形式で確認：

```env
# ✅ VERCEL_TOKEN（長い文字列）
VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxx

# ✅ VERCEL_ORG_ID（team_で始まる）
VERCEL_ORG_ID=team_xxxxxxxxxxxxxxxxxx

# ✅ VERCEL_PROJECT_ID（prj_で始まる）
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxxxxxxx
```

---

## 🔧 GitHub Secretsへの設定方法

### GitHub Web UIから設定

1. **リポジトリ** → **Settings** → **Secrets and variables** → **Actions**

2. **「New repository secret」** をクリック

3. 各値を設定：
   - Name: `VERCEL_TOKEN`
   - Secret: 取得したトークン値
   - 「Add secret」をクリック

4. 同様に `VERCEL_ORG_ID` と `VERCEL_PROJECT_ID` も設定

### GitHub CLIから設定

```bash
# GitHub CLIで設定
gh secret set VERCEL_TOKEN --body "xxxxxxxxxxxxxxxxxxxxxxxxx"
gh secret set VERCEL_ORG_ID --body "team_xxxxxxxxxxxxxxxxxx"
gh secret set VERCEL_PROJECT_ID --body "prj_xxxxxxxxxxxxxxxxxx"

# 確認
gh secret list
```

---

## 🧪 設定値の動作確認

### 1. Vercel CLIで確認

```bash
# 環境変数をエクスポート
export VERCEL_TOKEN=your_token_here
export VERCEL_ORG_ID=your_org_id
export VERCEL_PROJECT_ID=your_project_id

# API経由でプロジェクト情報取得
curl -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/$VERCEL_PROJECT_ID?teamId=$VERCEL_ORG_ID"

# 成功すれば、プロジェクト情報がJSON形式で返される
```

### 2. GitHub Actionsで確認

`.github/workflows/test-vercel.yml` を作成：

```yaml
name: Test Vercel Credentials
on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test Vercel API
        run: |
          curl -f -H "Authorization: Bearer ${{ secrets.VERCEL_TOKEN }}" \
            "https://api.vercel.com/v9/projects/${{ secrets.VERCEL_PROJECT_ID }}?teamId=${{ secrets.VERCEL_ORG_ID }}"
        continue-on-error: false

      - name: Success
        if: success()
        run: echo "✅ Vercel credentials are valid!"
```

---

## ⚠️ トラブルシューティング

### "Invalid token" エラー

- トークンの期限を確認
- トークンを再生成
- スペースや改行が含まれていないか確認

### "Project not found" エラー

- PROJECT_IDが正しいか確認
- ORG_IDが正しいか確認
- プロジェクトが存在するか確認

### "Unauthorized" エラー

- トークンのスコープを確認（Full Accountが必要）
- チーム/組織の権限を確認

---

## 🔒 セキュリティ注意事項

### やってはいけないこと

- ❌ トークンをソースコードにハードコード
- ❌ トークンを公開リポジトリにコミット
- ❌ トークンをログに出力
- ❌ トークンを他人と共有

### やるべきこと

- ✅ GitHub Secretsで管理
- ✅ 定期的にトークンをローテーション
- ✅ 最小限の権限スコープを設定
- ✅ 使用しないトークンは削除

---

## 📚 参考リンク

- [Vercel API Documentation](https://vercel.com/docs/rest-api)
- [Vercel Tokens](https://vercel.com/docs/accounts/create-a-token)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
