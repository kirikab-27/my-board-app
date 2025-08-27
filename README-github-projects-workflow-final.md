# GitHub Projects ワークフロー確定版

## 📋 カラム構成（確定）

| ステータス | 説明 | 責任者 | 滞在期間目安 |
|-----------|------|--------|------------|
| **📋 Backlog** | 未着手タスク | プロダクトオーナー | - |
| **🎯 Today** | 本日作業予定 | 開発者 | 1日 |
| **🚧 In Progress** | 作業中 | 開発者 | 1-3日 |
| **👀 Review** | レビュー | ユーザー | 1-2日 |
| **✅ Done** | 完了 | - | - |

## 🏷️ ラベル体系

### レビュー種別ラベル（Review使用時）
- **`spec-review`** 🟡 - 仕様確認（実装前）
- **`test-review`** 🔵 - 動作確認（実装後）

### Issue種別ラベル
- **`feature`** 🟢 - 新機能の実装
- **`bug`** 🔴 - バグ修正
- **`improvement`** 🟠 - 既存機能の改善
- **`critical`** 🔴 - 緊急対応が必要

## 🔄 フロー定義

### 新機能・改善の場合
```
Issue作成 → Review(spec-review) → 承認後Backlog → Today → In Progress → Review(test-review) → Done
```

### 緊急バグの場合
```
Issue作成 → In Progress → Review(test-review) → Done
```

### 通常バグの場合
```
Issue作成 → Review(spec-review) → 承認後Backlog → Today → In Progress → Review(test-review) → Done
```

## 📝 運用ルール

### Issue作成時
1. **全ての問題・要望は必ずIssue作成**
2. **適切な種別ラベルを付与**（feature/bug/improvement/critical）
3. **初期配置先の決定:**
   - 新機能・改善・通常バグ → Review + spec-review
   - 緊急バグ → In Progress + critical

### Review運用
1. **spec-review**: 仕様・実装方法の確認
   - 実装予定内容の詳細説明
   - 技術的アプローチの提示
   - ユーザーの承認待ち

2. **test-review**: 動作確認・品質チェック
   - 実装完了後の機能テスト
   - ユーザーによる最終確認
   - 問題があればIn Progressに戻す

### 緊急判定基準
**critical対象:**
- システムが起動しない
- 重要な機能が完全に使用不可
- セキュリティの重大な脆弱性
- データ損失の危険性

## 🎯 開発者向けガイドライン

### 問題発見時の対応
```bash
# 1. Issue作成（CLI使用）
gh issue create --title "問題のタイトル" --body "詳細説明" --label "適切なラベル"

# 2. プロジェクトに追加
gh project item-add 2 --owner kirikab-27 --url [Issue URL]

# 3. 適切なステータスに配置
# spec-review必要な場合: Review + spec-review
# 緊急の場合: In Progress + critical
```

### ラベル付与例
```bash
# 新機能提案
gh issue edit [番号] --add-label "feature,spec-review"

# 通常バグ報告
gh issue edit [番号] --add-label "bug,spec-review"

# 緊急バグ
gh issue edit [番号] --add-label "bug,critical"

# 実装完了後
gh issue edit [番号] --add-label "test-review" --remove-label "spec-review"
```

## 🚨 重要な禁止事項

### 絶対に守ること
1. **仕様確認なしの新機能実装禁止**
2. **Issue作成せずの問題対応禁止**
3. **ユーザー承認なしの実装開始禁止**
4. **Review段階のスキップ禁止**（緊急バグ除く）

### 例外的緊急対応
**criticalラベル付きの場合のみ:**
- spec-reviewスキップ可能
- 即座実装開始可能
- ただし実装後test-reviewは必須

## 📊 進捗追跡

### 健全な状態
- **Backlog**: 5-10件（計画的なタスク蓄積）
- **Today**: 1-3件（実現可能な作業量）
- **In Progress**: 1-2件（集中的な開発）
- **Review**: 2-5件（適切なレビュー待ち）

### 要注意状態
- **In Progress**: 4件以上（作業分散）
- **Review**: 10件以上（レビュー滞留）
- **Backlog**: 20件以上（計画見直し必要）

## 🔄 定期メンテナンス

### 週次チェック
- [ ] 古いReviewアイテムの確認
- [ ] Backlogの優先順位見直し
- [ ] 完了Issueのクローズ確認

### 月次分析
- [ ] 各段階の滞在時間分析
- [ ] ボトルネック特定
- [ ] ワークフロー改善点抽出

---

## 📚 関連ドキュメント

- [GitHub Projects CLI操作ガイド](./README-github-projects-automation.md)
- [Issue管理ベストプラクティス](./README-github-projects-strict-workflow.md)
- [開発フロー全体図](./CLAUDE.md#github-projects-タスク管理)

---

**最終更新**: 2025/08/18  
**ステータス**: 確定・運用開始  
**承認者**: @kirikab-27