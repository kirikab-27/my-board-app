# GitHub Projects 自動化システム（改訂版）

## Week3 SNS Development プロジェクト管理ガイド

### 📊 プロジェクト概要

**Week3 SNS Development**は、GitHub Projects（カンバンボード）を使用して、SNS機能開発の全タスクを体系的に管理します。

### 🎯 ステータス管理（5段階）

| ステータス | 絵文字 | 説明 | 責任者 |
|-----------|-------|------|--------|
| **Backlog** | 📋 | 未着手タスク | プロダクトオーナー |
| **Today** | 🎯 | 本日作業予定 | 開発者 |
| **In Progress** | 🚧 | 作業中 | 開発者 |
| **Review** | 👀 | レビュー待ち（動作確認） | ユーザー |
| **Done** | ✅ | 完了 | - |

### 🔄 改訂ワークフロー

#### 1. **新規タスクの登録**
```bash
# Issue作成と同時にプロジェクトへ追加
gh issue create --title "Phase 6.X: 機能名実装" \
  --body "## 概要\n詳細説明\n\n## 受け入れ条件\n- [ ] 条件1\n- [ ] 条件2" \
  --project "Week3 SNS Development"
```

#### 2. **開発者の作業フロー**

**朝のスタンドアップ:**
- Backlogから本日のタスクを「Today」へ移動
- 優先度とブロッカーの確認

**作業開始時:**
```bash
# Issueを「In Progress」へ移動
gh project item-edit --id [ITEM_ID] \
  --field-id PVTSSF_lAHOB5DmjM4BAytuzgzfW84 \
  --project-id 2 \
  --value "In Progress"

# ブランチ作成
git checkout -b feature/issue-[番号]
```

**作業・テスト完了時:**
```bash
# 1. PRを作成してIssueにリンク
gh pr create --title "Fix #[番号]: 機能名実装" \
  --body "Closes #[番号]\n\n## 変更内容\n- 実装内容\n\n## テスト\n- [ ] 単体テスト\n- [ ] 統合テスト\n- [ ] ビルド確認"

# 2. ⚠️ 重要：「Review」に移動（Doneではない）
gh project item-edit --id [ITEM_ID] \
  --field-id PVTSSF_lAHOB5DmjM4BAytuzgzfW84 \
  --project-id 2 \
  --value "Review"

# 3. レビュー依頼コメント追加
gh issue comment [番号] \
  --body "## 🔍 レビュー依頼\n\n**実装完了・テスト済み**\n\n**動作確認をお願いします：**\n- [ ] 基本機能動作\n- [ ] エラーハンドリング\n- [ ] UI/UX確認\n- [ ] レスポンシブ対応\n\n**確認URL:** http://localhost:3010/[パス]\n\n@kirikab-27 動作確認をお願いします 🙏"
```

#### 3. **レビュアー（ユーザー）の作業フロー** 🆕

**動作確認実施:**
1. 開発環境で機能をテスト
2. 受け入れ条件をチェック
3. UI/UXを評価

**問題なしの場合:**
```bash
# 1. 「Done」へ移動
gh project item-edit --id [ITEM_ID] \
  --field-id PVTSSF_lAHOB5DmjM4BAytuzgzfW84 \
  --project-id 2 \
  --value "Done"

# 2. Issueクローズ
gh issue close [番号] \
  --comment "## ✅ レビュー完了\n\n**動作確認済み：**\n- [x] 基本機能正常動作\n- [x] UI/UX良好\n- [x] エラーハンドリング確認\n\n承認します。お疲れさまでした！ 🎉"
```

**問題ありの場合:**
```bash
# 1. 「In Progress」へ戻す
gh project item-edit --id [ITEM_ID] \
  --field-id PVTSSF_lAHOB5DmjM4BAytuzgzfW84 \
  --project-id 2 \
  --value "In Progress"

# 2. フィードバックコメント
gh issue comment [番号] \
  --body "## 🔧 修正依頼\n\n**問題点：**\n- [ ] 問題1の詳細\n- [ ] 問題2の詳細\n\n**期待する動作：**\n- 期待する動作の説明\n\n**再確認項目：**\n- [ ] 修正後の動作確認\n\n修正後、再度Reviewステータスへ移動してください。"
```

### 💡 ベストプラクティス

#### 1. **Issue駆動開発**
- すべての作業はIssueから開始
- コミットメッセージにIssue番号を含める（`Fix #5: 通知機能実装`）
- PRタイトルは「Fix #番号: 機能名」形式

#### 2. **レビュー重視の品質管理** 🆕
- 必ず「Review」ステータスを経由
- 動作確認完了まで「Done」にしない
- レビューフィードバックを詳細に文書化
- 受け入れ条件の明確化

#### 3. **自動化活用**
```bash
# PR作成時の自動リンク
gh pr create --title "Fix #5: 機能名" --body "Closes #5"

# マージ時の自動クローズ
git commit -m "Fix #5: 機能実装完了

- 実装内容1
- 実装内容2

Closes #5"
```

#### 4. **定期的な更新**
- 1日2回（朝・夕）のステータス更新
- レビュー待ちタスクの優先処理
- 週次でバックログの整理

### 📊 進捗管理コマンド

```bash
# プロジェクト全体の状況確認
gh project item-list 2 --owner kirikab-27

# レビュー待ちタスクの確認
gh issue list --state open --label "status:review"

# 今日のタスク確認
gh issue list --project "Week3 SNS Development" --state open

# 完了タスクの統計
gh issue list --project "Week3 SNS Development" --state closed
```

### 🎯 現在のプロジェクト状況

**完了済み（✅ Done）:**
- Issue #2: Phase 6.0 MongoDB基盤構築
- Issue #3: Phase 6.1 フォロー機能
- Issue #4: Phase 6.2 通知システム
- Issue #10: ユーザー統計更新バグ修正

**レビュー待ち（👀 Review）:**
- Issue #9: 通知バリデーションエラー修正

**バックログ（📋 Backlog）:**
- Issue #5: Phase 6.3 コメント機能
- Issue #6: Phase 6.4 ハッシュタグ機能
- Issue #7: Phase 6.5 メディアアップロード
- Issue #8: Phase 7.0 WebSocket統合

### 🚀 品質保証の強化

この改訂により以下が実現されます：

1. **品質向上**: 全ての機能がユーザー動作確認を経て本番リリース
2. **フィードバックループ**: 問題の早期発見と修正
3. **責任分離**: 開発とレビューの明確な分離
4. **プロセス可視化**: GitHub Projectsでの進捗の透明性
5. **継続的改善**: レビューフィードバックによる開発プロセス改善

この管理システムにより、高品質なSNS機能開発を効率的に進めることができます。