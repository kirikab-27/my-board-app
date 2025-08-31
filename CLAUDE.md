# 掲示板アプリ (Board App)

日本語で書かれたシンプルな掲示板アプリケーションです。React、Next.js、MongoDB、Material-UIを使用して構築されています。

## 🚨 【重要】ルール厳守警告

**このドキュメントのルールは絶対に遵守すること。軽視・無視は致命的なプロジェクト破綻を招く。**

### ⛔ 禁止事項（違反厳禁）

- ❌ **既存情報の確認なしに新規設定を追加** → 情報の不整合・設定ミス
- ❌ **部分的な情報のみで判断・実装** → プロジェクト全体の整合性破綻
- ❌ **環境変数・URL・ドメインの一貫性確認怠り** → 本番環境での致命的エラー
- ❌ **ルールの表面的遵守（形だけの更新）** → 実質的なドキュメント管理破綻
- ❌ **🚨 Issue管理フロー無視（最重要）** → **即座実装禁止・Issue更新→ステータス移動→実装開始厳守**
- ❌ **🚨 言動不一致（信用失墜）** → **「修正した」と報告しながら実際は未実行・確認怠り・同じミス繰り返し**

### ✅ 必須実行事項（例外なし）

- ✅ **機能追加前**: 既存設定・環境変数・関連ドキュメントの全確認
- ✅ **設定変更時**: プロジェクト全体との整合性チェック（grep検索・ファイル横断確認）
- ✅ **ドキュメント更新時**: 関連セクション・既存情報との一貫性検証
- ✅ **疑問発生時**: 推測ではなく確実な情報確認・ユーザーへの確認
- ✅ **🚨 Issue管理フロー厳守（最重要）**: ユーザー要望→Issue更新→ステータス移動→実装開始（例外なし）
- ✅ **🚨 言動一致の徹底**: 報告前の実際確認・口約束禁止・実行後検証・ユーザー信頼維持
- ✅ **🤝 共同作業の基本姿勢**: 完成偽装より正確な現状報告・困った時は助けを求める・助け合いの精神

**このルールを軽視した場合、プロジェクトの信頼性と継続性に重大な損害を与える。**

### 🤝 共同作業における信頼の原則

**「完成した」と嘘をつくより、「ここまでできました。この部分で困っています」と正直に報告する方が100倍信頼できる。**

- **✅ 正確な現状報告**: 良いニュースも悪いニュースも正直に
- **✅ 困った時の相談**: 一人で抱え込まず助けを求める
- **✅ 助け合いの姿勢**: 共同作業なので一緒に考える
- **❌ 完成偽装**: 表面的な「できました」報告は信頼を破壊する

**信頼関係はプロジェクト成功の基盤。技術力より信頼維持が重要。**

## 📚 ドキュメント管理ルール

### CLAUDE.mdの役割と制限

- **最大サイズ**: 40KB以内を厳守
- **各セクション上限**: 重要情報のみ（詳細は別ファイルへ）
- **更新タイミング**: 機能追加・エラー解決・設定変更時に即座更新

### ドキュメント配置ルール

#### CLAUDE.mdに記載するもの（コア情報のみ）

- ✅ 環境変数リスト（詳細説明は最小限）
- ✅ APIエンドポイント一覧（1行説明）
- ✅ よくあるエラーTOP10
- ✅ 他ドキュメントへのリンク集
- ✅ プロジェクト構造（概要レベル）

#### 別ファイルに分離するもの

- 📄 `docs/issue-history-archive.md` - Issue実装履歴詳細
- 📄 `docs/api-detailed-specs.md` - API詳細仕様
- 📄 `docs/setup/[機能名].md` - 詳細な設定手順
- 📄 `docs/troubleshooting/[機能名].md` - 詳細なトラブルシューティング
- 📄 `README-[機能名].md` - 利用者向け簡易手順書

## プロジェクト概要

このアプリケーションは以下の機能を提供します：

### ✅ 実装済み機能（Week 1完了）

- 投稿の作成・編集・削除（200文字制限）
- 投稿の一覧表示・詳細表示
- いいね機能（ハートアイコン・カウント）
- 検索機能（部分一致・リアルタイム）
- 並び替え機能（作成日時・更新日時・いいね数）
- ページネーション（件数切り替え対応）
- メール送信基盤（SMTP・テンプレート）
- レスポンシブデザイン（Material-UI）

### ✅ 全Phase実装完了（develop統合済み・Phase 5.5完了）

- **Phase 0**: テスト基盤・開発環境整備（Jest・Playwright・CI/CD）✅ **統合完了**
- **Phase 0.5**: 観測基盤・モニタリング設定（Sentry・Analytics）✅ **統合完了**
- **Phase 1**: NextAuth.js v4認証基盤・ソーシャルログイン・MongoDB統合 ✅ **統合完了・テスト済み**
- **Phase 2**: メール認証・React Email・ウェルカムメール・パスワードリセット・さくらSMTP統合 ✅ **統合完了・テスト済み**
- **Phase 2.5**: 会員制システム基盤・ページ構成最適化・ブルートフォース対策・ローディングUI統合 ✅ **統合完了**
- **Phase 3**: 会員専用投稿機能・権限管理・匿名対応 ✅ **統合完了**
- **Phase 4**: プロフィール管理・認証UI/UX改善・レスポンシブ ✅ **統合完了**
- **Phase 4.5**: 会員制掲示板CRUD機能拡張 ✅ **統合完了**
- **Phase 5**: セキュリティ強化・CSRF・レート制限・XSS対策 ✅ **統合完了**
- **Phase 6.0**: SNS機能・MongoDB拡張スキーマ・68インデックス最適化 ✅ **統合完了**
- **Phase 6.5**: メディアアップロード機能・Instagram風UI・SHA-256重複防止システム ✅ **実装完了**

### ✅ 最新Issue実装完了

- **Phase 7.0**: リアルタイム機能（2025/08/24完了）- 管理者限定WebSocket・ポーリング最適化・保守的アプローチ完全遵守。
- **Issue #27**: PWA機能（2025/08/24完了）- next-pwa統合・Service Worker・ネイティブアプリ級体験。
- **Issue #22**: ユーザー検索拡張（2025/08/23完了）- 日本語対応・高度検索・@username検索・認証システム修復。
- **Issue #24**: 無限スクロール機能（2025/08/23完了）- Intersection Observer・デバイス別最適化・Twitter/Instagramレベル体験実現。
- **Issue #21**: エンゲージメント表示（2025/08/23完了）- ハートアイコン・コメント件数・メディア表示・Instagram/Twitter風UI。
- **Issue #20**: 検索バーのヘッダー移動（2025/08/24完了）- 虫眼鏡アイコン化・ポップオーバー検索・GitHub風UX。
- **Issue #25**: ヘッダー2段目ハッシュタグナビゲーション（2025/08/24完了）- Hydrationエラー修正・完全統合。
- **Issue #11**: プロフィール画像統合（2025/08/24完了）- 全箇所反映・セッション同期・愛着向上。
- **Issue #18**: アバターメニュー整理（2025/08/24完了）- GitHub風2段ヘッダー・14項目→4項目整理。
- **Issue #17**: 通知ベル一括既読・テーマ切り替え簡素化（2025/08/23完了）
- **Issue #16**: ランディングページテーマ切り替え（2025/08/23完了）
- **Issue #19**: ヘッダー固定機能（2025/08/24完了）
- **Issue #28**: 包括的パフォーマンス最適化（2025/08/25完了）- Lighthouse 35点→62点改善
- **Issue #30**: 包括的プライバシー設定（2025/08/27完了）- エンタープライズ級ユーザー保護
- **Issue #29**: Twitter/Slack風メンション機能（2025/08/26完了）- アプリ起動問題修正

詳細な実装履歴は `docs/issue-history-archive.md` 参照。

## 技術スタック

- **フロントエンド**: React 19.1.0, Next.js 15.4.5
- **UI ライブラリ**: Material-UI (MUI) 7.2.0
- **データベース**: MongoDB with Mongoose 8.17.0
- **認証**: NextAuth.js v4 + OAuth(Google/GitHub) + MongoDB Adapter + bcrypt
- **メール**: Nodemailer + React Email + さくらSMTP (DKIM/SPF/DMARC対応)
- **開発言語**: TypeScript 5
- **テスト**: Jest 29.7, Testing Library, Playwright
- **CI/CD**: GitHub Actions
- **監視・分析**: Sentry, Web Vitals
- **セキュリティ**: DOMPurify, CSP, CSRF対策, レート制限, 監査ログ
- **メディア**: Cloudinary統合・画像動画最適化・Instagram風UI

## 開発コマンド

```bash
# 開発サーバーの起動
npm run dev                  # デフォルトポート3010
npm run dev -- -p 3030      # カスタムポート指定
npm run dev -- --port 3012  # Issue #29対応ポート

# プロダクションビルド
npm run build

# プロダクションサーバーの起動
npm start

# Linting
npm run lint

# 重要：実装中ビルドチェック（必須）
npm run build         # 実装中・コミット前に必ず実行
npm run type-check    # TypeScript厳格チェック
```

## 環境設定

### 必要な環境変数

```env
# データベース設定
MONGODB_URI=mongodb://localhost:27017/board-app

# メール設定（さくらインターネット）
SMTP_HOST=初期ドメイン名.sakura.ne.jp
SMTP_PORT=587
SMTP_USER=username@初期ドメイン名.sakura.ne.jp
SMTP_PASSWORD="パスワード"
MAIL_FROM_ADDRESS=username@your-domain.com

# アプリケーション設定
APP_URL=http://localhost:3010        # 開発環境
APP_URL=https://kab137lab.com        # 本番環境（Vercel）

# NextAuth.js v4設定
NEXTAUTH_URL=http://localhost:3010   # 開発環境
NEXTAUTH_URL=https://kab137lab.com   # 本番環境
NEXTAUTH_SECRET=your-super-secret-nextauth-key

# Google OAuth設定
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# GitHub OAuth設定
GITHUB_ID=your_github_id_here
GITHUB_SECRET=your_github_secret_here

# 監視・分析設定
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SLACK_WEBHOOK_URL=your_slack_webhook_url

# セキュリティ設定
SECURITY_API_TOKEN=your_security_admin_token_here
```

## API エンドポイント

### 投稿関連

- `GET /api/posts` - 投稿一覧取得
- `POST /api/posts` - 投稿作成
- `GET /api/posts/[id]` - 投稿詳細
- `PUT /api/posts/[id]` - 投稿更新
- `DELETE /api/posts/[id]` - 投稿削除
- `POST/DELETE /api/posts/[id]/like` - いいね機能
- `GET /api/posts/search` - 投稿検索

### 認証関連

- `GET/POST /api/auth/[...nextauth]` - NextAuth.js統合認証
- `POST /api/auth/register` - ユーザー登録・メール認証送信
- `GET /api/auth/verify-email` - メール認証確認
- `POST /api/auth/reset-password/request` - パスワードリセット要求
- `POST /api/auth/reset-password/confirm` - パスワードリセット確定

### SNS関連

- `GET/POST/DELETE /api/follow` - フォロー機能
- `GET /api/timeline` - タイムライン取得
- `GET /api/users` - ユーザー一覧・検索
- `GET/POST/PATCH /api/notifications` - 通知システム

### セキュリティ関連

- `GET /api/security/stats` - 攻撃統計
- `POST /api/security/unblock` - ブロック解除
- `GET/POST/PATCH /api/security/audit` - 監査ログ

詳細なAPI仕様は `docs/api-detailed-specs.md` 参照。

## よくある問題と解決策

### 開発サーバーが起動しない

1. `npm install` で依存関係を再インストール
2. MongoDB接続を確認
3. ポート競合確認（`npm run dev -- -p 3012`等で回避）

### TypeScriptビルドエラー

1. `npm run build` でエラー確認
2. `npm run type-check` でTypeScript型チェック
3. 実装→ビルド→修正→完了フロー厳守

### 認証・ログイン問題

1. CredentialsProvider有効確認
2. 環境変数同期（APP_URL・NEXTAUTH_URL）
3. `node scripts/update-user-roles.js` でrole設定

### メール送信エラー

1. さくらSMTP設定確認
2. DKIM/SPF/DMARC設定確認
3. 国外IPアクセス制限無効化（Vercel対応）

詳細なトラブルシューティングは参考ドキュメント参照。

## GitHub Projects タスク管理

**プロジェクト**: Week3 SNS Development - 5段階カンバンボード管理

### ワークフロー（確定版）

**新機能・改善**: Issue作成→Review(spec)→Backlog→Today→In Progress→Review(test)→**ユーザー確認→コミット実行**→Done

### ⚠️ 重要ルール（厳守必須）

- **全問題はIssue作成必須**: 発見→即修正禁止
- **🚨 実装ファーストの癖を矯正**: ユーザー要望受領→手を止める→Issue更新→ステータス移動→実装許可→実装開始
- **💾 コミットタイミング厳守**: ユーザー動作確認完了→コミット実行→Done移動（確認前コミット禁止）

## 🛡️ 試験導入: 緊急性罠回避システム

### VibeCoding最適化フロー（人間主導・AI助言支援）

**基本原則**: AI = 高度な助言者（対等ではなく支援者）・最終判断責任は人間

#### 健全な関係性
- **人間**: 判断者・責任者・意思決定者
- **AI**: 高度助言者・技術実装支援・分析提供者  
- **協議**: 創発的解決・相互学習・AI依存防止セーフガード

### 5分ルール（Week 1-2実装中）

**緊急要望受信時**: `./scripts/emergency-brake.sh` 実行（必須）

#### 必須質問（5分以内）
- ✅ 何が本当の問題？（症状ではなく原因）
- ✅ なぜ緊急？（真の緊急 vs 単なる急ぎ）
- ✅ Issue作成 vs 即座修正？

#### 緊急度4段階（30秒判定）
- 🔴 CRITICAL: 本番サービス停止・セキュリティ侵害
- 🟡 HIGH: 一部ユーザー影響・機能停止
- 🟢 MEDIUM: 改善・バグ修正・新機能
- ⚪ LOW: タイポ・スタイル・ドキュメント

#### 対応フロー
- 🔴 → Issue作成→30分調査→即座対応
- 🟡 → Issue作成→30分調査→翌日対応
- 🟢 → 通常Issue管理フロー
- ⚪ → 即座修正（簡易確認のみ）

### 効果測定（Week 1-2終了後）
- 5分ルール実行率・判定精度・問題解決時間短縮効果

## Git ブランチ戦略

```
main (本番環境)
├── develop (統合・テスト環境)
│   └── feature/phase6.x-xxx (機能開発)
│   └── hotfix/xxx (緊急修正)
```

**デプロイフロー**:

```
Issue完了 → Review確認 → develop マージ → deployed-dev ラベル
     ↓
週次まとめ → main マージ → 本番デプロイ → deployed-prod ラベル
```

**本番環境**: https://kab137lab.com (Vercel + MongoDB Atlas + Cloudflare DNS)

## ⚠️ **重要: GitHub API操作安全プロトコル**

- **[🚨 GitHub API操作安全プロトコル](./docs/GITHUB_API_SAFETY_PROTOCOL.md)** - 重大インシデント防止・プライバシー保護・厳格遵守必須 ⚠️ **最重要・GitHub操作前必読**

## 参考ドキュメント

### 主要実装ガイド

- **[🚨 実装規律強化ガイド](./README-implementation-discipline.md)** - 実装ファースト癖矯正・フロー厳守・信頼回復戦略 ⚠️ **最重要・必読**
- **[💾 GitHub Projects コミットワークフロー](./README-github-projects-commit-workflow.md)** - ユーザー確認後コミット・品質保証フロー ✨ **最新確定版**
- **[Issue実装履歴アーカイブ](./docs/issue-history-archive.md)** - 全Issue詳細実装履歴
- **[API詳細仕様](./docs/api-detailed-specs.md)** - エンドポイント・データ形式詳細

### Phase別実装手順

- **[Phase 0-2](./README-phase-1-2.md)** - テスト・監視・認証基盤
- **[Phase 3-5](./README-phase-3-5.md)** - 会員機能・権限・セキュリティ
- **[Phase 6.0: SNS機能](./README-phase-6-sns-schema.md)** - MongoDB拡張スキーマ
- **[Phase 6.1: タイムライン機能](./README-phase-6.1-timeline.md)** - フォロー・タイムライン完全ガイド

### システム設計・品質管理

- **[品質保証プロトコル](./docs/quality-assurance-protocol.md)** - 発表会前緊急チェック・45分フルプロセス
- **[ブランチ戦略](./docs/member-branch-strategy.md)** - Git Flow・Phase別統合
- **[テスト・品質保証](./docs/test-quality-strategy.md)** - Jest・Playwright・監視

### トラブルシューティング

- **[Vercelデプロイエラー解決](./README-vercel-deploy-errors-phase55.md)** - 21項目の技術問題解決
- **[認証トラブルシューティング](./README-auth-troubleshooting.md)** - NextAuth.js問題解決
- **[メール送信設定](./docs/email-auth-cheatsheet.md)** - さくらSMTP・DKIM/SPF/DMARC
- **[Issue #36: 画像アップロード405エラー修正完了](https://github.com/kirikab-27/my-board-app/issues/36)** - Node.js Runtime強制・CORS・Cloudinary直接アップロード実装

---

**重要**: このドキュメントは40KB制限を遵守するため、詳細情報は別ファイルに分離しています。実装時は必ず関連ドキュメントを参照してください。
