# Git Workflow - 管理者機能開発

## 🎯 概要

my-board-app プロジェクトの管理者機能開発における Git ブランチ戦略とワークフローの定義。

---

## 🌳 ブランチ戦略

### **基本ブランチ構成**

```
main (本番環境)
├── develop (統合環境)
├── feature/admin-dashboard (管理者機能メイン)
│   ├── feature/admin-auth (管理者認証)
│   ├── feature/admin-users (ユーザー管理)
│   ├── feature/admin-posts (投稿管理)
│   └── feature/admin-analytics (分析機能)
└── hotfix/xxx (緊急修正)
```

### **ブランチの役割**

#### **main**

- **目的**: 本番環境デプロイ
- **品質**: 常にデプロイ可能な状態
- **保護**: 直接pushは緊急時のみ
- **更新**: developからのマージのみ

#### **develop**

- **目的**: 統合テスト環境
- **品質**: 全機能統合・テスト済み
- **更新**: featureブランチからのマージ

#### **feature/admin-dashboard**

- **目的**: 管理者機能全体の統合
- **役割**: サブ機能ブランチの統合先
- **ライフサイクル**: 管理者機能完了まで維持

#### **feature/admin-xxx**

- **目的**: 個別管理者機能の開発
- **ベース**: admin-dashboard から分岐
- **統合**: admin-dashboard にマージ

---

## 🔄 開発フロー

### **管理者機能開発フロー**

```
1. feature/admin-dashboard から新機能ブランチ作成
   git checkout feature/admin-dashboard
   git pull origin feature/admin-dashboard
   git checkout -b feature/admin-auth

2. 機能開発・テスト・コミット
   git add .
   git commit -m "feat(admin): 管理者認証機能実装"

3. admin-dashboard に統合
   git checkout feature/admin-dashboard
   git merge feature/admin-auth

4. 全管理者機能完了後、develop に統合
   git checkout develop
   git merge feature/admin-dashboard

5. 本番デプロイ
   git checkout main
   git merge develop
```

### **Pull Request フロー**

#### **サブ機能 → admin-dashboard**

1. PR作成: feature/admin-xxx → feature/admin-dashboard
2. コードレビュー・管理者機能専用チェック
3. マージ後、サブ機能ブランチ削除

#### **admin-dashboard → develop**

1. 管理者機能全体のPR作成
2. 統合テスト・既存機能影響確認
3. マージ後、統合テスト環境デプロイ

#### **develop → main**

1. 最終本番デプロイPR
2. 本番品質確認・セキュリティレビュー
3. マージ後、本番環境自動デプロイ

---

## 📝 コミットメッセージ規約

### **基本形式**

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### **Type 一覧**

- **feat**: 新機能追加
- **fix**: バグ修正
- **docs**: ドキュメント更新
- **style**: コードスタイル修正（空白・フォーマット等）
- **refactor**: リファクタリング（機能変更なし）
- **test**: テスト追加・修正
- **chore**: ビルド・補助ツール変更

### **Scope 一覧（管理者機能）**

- **admin**: 管理者機能全般
- **admin-auth**: 管理者認証
- **admin-users**: ユーザー管理
- **admin-posts**: 投稿管理
- **admin-analytics**: 分析機能

### **例**

```
feat(admin): 管理者ダッシュボード基本実装
fix(admin-auth): 管理者ログイン権限チェック修正
docs(admin): 管理者機能APIドキュメント追加
refactor(admin-users): ユーザー管理コンポーネント整理
```

---

## 🛠️ 実用的なGitコマンド

### **日常的な作業**

#### **ブランチ操作**

```bash
# 現在のブランチ確認
git branch
git status

# ブランチ切り替え
git checkout feature/admin-dashboard

# 新しい管理者機能ブランチ作成
./scripts/git-utils.sh create_admin_branch users

# ブランチ削除
./scripts/git-utils.sh delete_branch feature/admin-old
```

#### **変更管理**

```bash
# 作業の安全保存
./scripts/git-utils.sh safe_stash "Issue #XX実装中"

# mainブランチ最新化
./scripts/git-utils.sh update_main

# 差分確認
./scripts/git-utils.sh show_diff_main
```

### **統合・マージ**

#### **サブ機能統合**

```bash
# admin機能をadmin-dashboardに統合
git checkout feature/admin-dashboard
git pull origin feature/admin-dashboard
git merge feature/admin-auth
git push origin feature/admin-dashboard
```

#### **develop統合**

```bash
# 管理者機能全体をdevelopに統合
git checkout develop
git pull origin develop
git merge feature/admin-dashboard
git push origin develop
```

---

## 🧪 テスト・品質管理

### **pre-commit チェック**

- ブランチ名検証（admin-関連のみ許可）
- コミットメッセージ規約確認
- TypeScript・ESLint チェック
- 管理者機能テスト自動実行

### **マージ前チェックリスト**

- [ ] TypeScriptビルドエラーなし
- [ ] ESLintチェック通過
- [ ] 管理者権限テスト成功
- [ ] 既存機能への影響なし確認
- [ ] セキュリティレビュー完了

---

## 🚨 トラブルシューティング

### **よくある問題と解決策**

#### **1. コンフリクト発生**

```bash
# マージコンフリクト解決
git mergetool
# または手動解決後
git add .
git commit -m "fix: マージコンフリクト解決"
```

#### **2. 誤ったブランチで作業**

```bash
# 現在の変更を正しいブランチに移動
git stash
git checkout correct-branch
git stash pop
```

#### **3. mainとの同期ずれ**

```bash
# mainの最新を取り込み
git checkout feature/admin-dashboard
git merge main
# または
git rebase main
```

#### **4. 緊急時のリセット**

```bash
./scripts/git-utils.sh emergency_reset
```

---

## 📊 ブランチライフサイクル

### **管理者機能ブランチの管理**

#### **作成**

1. admin-dashboardから分岐
2. リモート追跡設定
3. 機能開発・テスト

#### **統合**

1. admin-dashboardにPR
2. コードレビュー・マージ
3. サブブランチ削除

#### **完了**

1. admin-dashboard → develop統合
2. develop → main統合
3. 本番デプロイ・完了

---

**重要**: 管理者機能は特にセキュリティが重要です。必ず段階的なレビュー・テストを実施してください。
