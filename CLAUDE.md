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
- ❌ **🔴 勝手な実装開始（2025/09/06違反）** → **分析・戦略策定段階での無断ファイル作成・実装は重大違反**
- ❌ **🔴 承認前の行動** → **「良かれと思って」の独善的判断による勝手な実装・ユーザー計画無視**

### ✅ 必須実行事項（例外なし）

- ✅ **機能追加前**: 既存設定・環境変数・関連ドキュメントの全確認
- ✅ **設定変更時**: プロジェクト全体との整合性チェック（grep検索・ファイル横断確認）
- ✅ **ドキュメント更新時**: 関連セクション・既存情報との一貫性検証
- ✅ **疑問発生時**: 推測ではなく確実な情報確認・ユーザーへの確認
- ✅ **🚨 Issue管理フロー厳守（最重要）**: ユーザー要望→Issue更新→ステータス移動→実装開始（例外なし）
- ✅ **🚨 言動一致の徹底**: 報告前の実際確認・口約束禁止・実行後検証・ユーザー信頼維持
- ✅ **🤝 共同作業の基本姿勢**: 完成偽装より正確な現状報告・困った時は助けを求める・助け合いの精神
- ✅ **🔵 段階的確認（2025/09/06追加）**: 分析完了→「戦略策定へ進んでよろしいですか？」→承認待ち
- ✅ **🔵 作業前通知**: 「今から〜を行います」→実行→「〜が完了しました。次は？」
- ✅ **🔵 不明点即座確認**: 曖昧な指示→推測行動❌→「〜という理解で正しいですか？」✅

**このルールを軽視した場合、プロジェクトの信頼性と継続性に重大な損害を与える。**

### 🤝 共同作業における信頼の原則

**「完成した」と嘘をつくより、「ここまでできました。この部分で困っています」と正直に報告する方が100倍信頼できる。**

- **✅ 正確な現状報告**: 良いニュースも悪いニュースも正直に
- **✅ 困った時の相談**: 一人で抱え込まず助けを求める
- **✅ 助け合いの姿勢**: 共同作業なので一緒に考える
- **❌ 完成偽装**: 表面的な「できました」報告は信頼を破壊する

**信頼関係はプロジェクト成功の基盤。技術力より信頼維持が重要。**

### 🔴 作業フロー厳守（2025/09/06失敗を教訓に）

**絶対的作業順序**:
```
1. 要求分析     → 「分析完了。戦略策定に進んでよろしいですか？」
2. 戦略策定     → 「戦略完了。実装計画を提示してよろしいですか？」
3. 実装計画提示 → 「この計画で実装してよろしいですか？」
4. ユーザー承認 → 「承認ありがとうございます。実装開始します」
5. 実装実行     → 「実装完了。動作確認をお願いします」
```

**NG例（2025/09/06違反）**:
- ユーザー：「実装要求内容を確認して戦略を詰めて」
- AI：勝手に11ファイル作成開始 ❌

**OK例（正しい対応）**:
- ユーザー：「実装要求内容を確認して戦略を詰めて」
- AI：「要求内容を分析し、戦略を策定しました。実装に進んでよろしいですか？」✅

### 📝 「CLAUDE.mdのルールに従って」前置きの解釈（2025/09/07追加）

**現実的な運用ルール**:

「CLAUDE.mdのルールに従って」という前置きがある場合の行動指針：

- **＋「どう思いますか？」「意見を聞かせてください」** → **分析・意見のみ提供（実装しない）**
- **＋「実装してください」「作成してください」** → **CLAUDE.mdのルールに従って実装する**

**重要な理解**:
- 「CLAUDE.mdのルールに従って」は実装を禁止するものではない
- CLAUDE.mdには実装時のルール（段階的確認、Issue管理フロー等）も含まれる
- 後続の具体的要求（意見 or 実装）に応じて適切に行動する

**実装例**:
- ❌ ユーザー：「デプロイについてどう思いますか？」→ AI：勝手にCI/CD実装開始
- ✅ ユーザー：「CLAUDE.mdのルールに従って、デプロイについてどう思いますか？」→ AI：分析と意見のみ提供

## 🔧 エラー対処・記録ルール（2025/09/07追加）

### エラー記録体系

**すべてのエラーと修正内容を体系的に記録し、将来の参考資料とする**

#### logsディレクトリ構造
```
logs/
├── ERROR_TEMPLATE.md              # エラー記録テンプレート
├── issue-[番号]-[概要]/          # Issue別エラー記録
│   ├── ERROR_LOG.md              # エラー詳細記録
│   ├── fix-[日付]-[概要].md      # 修正記録
│   └── test-results/             # テスト結果
└── daily/                        # 日次作業記録（必要時）
```

#### エラー記録フロー
1. **エラー発生**: 即座にERROR_TEMPLATE.mdを基に記録開始
2. **原因分析**: 推測ではなく実際のログ・コードで確認
3. **修正実施**: 段階的修正・各段階で動作確認
4. **記録完了**: logs/issue-XX/ERROR_LOG.mdに詳細記録
5. **CLAUDE.md更新**: よくあるエラーに追加（TOP10維持）

#### 記録の重要性
- **知識の蓄積**: 同じエラーの再発防止
- **引き継ぎ資料**: 他の開発者への情報共有
- **品質向上**: エラーパターンの分析・予防策立案

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

### ✅ 基本機能実装完了

- 投稿の作成・編集・削除（200文字制限）
- 投稿の一覧表示・詳細表示
- いいね機能（ハートアイコン・カウント）
- 検索機能（部分一致・リアルタイム）
- 並び替え機能（作成日時・更新日時・いいね数）
- ページネーション（件数切り替え対応）
- メール送信基盤（SMTP・テンプレート）
- レスポンシブデザイン（Material-UI）

### ✅ 全Phase実装完了（2025/09まで）

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

#### 管理者機能関連（2025/09）
- **Issue #49**: NextAuth認証システムの修復と正常化（2025/09/07完了）- MongoDB Adapter条件付き有効化・緊急コード削除
- **Issue #45-46**: 管理者機能基盤・UI完成 - 管理画面・権限システム・監査ログ
- **Issue #47**: RBAC権限管理システム - Enterprise級セキュリティ実装計画

#### SNS・UX機能（2025/08）
- **Issue #36**: 画像アップロード405エラー修正 - Cloudinary統合・Node.js Runtime強制
- **Issue #30**: 包括的プライバシー設定 - エンタープライズ級ユーザー保護
- **Issue #29**: Twitter/Slack風メンション機能 - リアルタイム通知
- **Issue #28**: パフォーマンス最適化 - Lighthouse 35点→62点改善
- **Issue #27**: PWA機能 - Service Worker・オフライン対応
- **Issue #24**: 無限スクロール - Intersection Observer実装

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
npm run dev                  # デフォルトポート3010（推奨）
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

### ポート問題対策（重要・再発防止）

#### 症状
- 複数ポート使用による混乱・アクセス先不明
- ポート占有・競合・開発サーバー起動不可
- Issue #29・Issue #45・Issue #47等で繰り返し発生

#### 標準ポート（厳守）
```bash
# 🔧 標準開発ポート（変更禁止）
http://localhost:3010  # 開発環境・デバッグ・テスト

# 🚨 緊急時のみ使用
npm run dev -- --port 3012  # ポート3010占有時のみ
```

#### 再発防止策
1. **ポート3010厳守**: 原則として3010以外使用しない
2. **プロセス確認**: `netstat -ano | findstr :3010` で占有確認
3. **プロセス終了**: `taskkill /PID [PID] /F` またはプロセス管理
4. **緊急スクリプト**: `./scripts/emergency-env-reset.sh` 使用

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

# メディアアップロード設定（Cloudinary）
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
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

### メディア関連

- `POST /api/media/upload` - 画像・動画アップロード
- `GET /api/media` - メディア一覧取得
- `DELETE /api/media/[id]` - メディア削除

### 管理者関連

- `GET /api/admin/users` - ユーザー管理
- `GET /api/admin/posts` - 投稿管理
- `GET /api/admin/analytics` - 分析データ
- `POST /api/admin/verification/send` - 検証コード送信
- `POST /api/admin/verification/verify` - 検証コード確認

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

### Next.js環境破損問題（重要・再発防止）

#### 症状
- `Cannot find module 'next/dist/bin/next'` エラー
- `pages-manifest.json` 欠損エラー
- 開発サーバー完全起動不可

#### 原因（Issue #45で発生）
1. **不完全な環境操作**: .next削除中に稼働プロセスが存在
2. **複数プロセス競合**: npm install中の複数Node.jsプロセス
3. **中途半端な削除**: node_modules部分破損・依存関係不整合
4. **npm installタイムアウト**: 不完全インストール・モジュール欠損

#### 緊急解決手順
```bash
# 1. 全Node.jsプロセス確認・終了
tasklist | findstr node
taskkill /F /IM node.exe  # 必要時のみ

# 2. 完全クリーンアップ
rm -rf node_modules package-lock.json .next

# 3. クリーンインストール
npm install --legacy-peer-deps

# 4. 開発サーバー起動確認
npm run dev
```

#### 再発防止策
1. **環境操作前**: 全Node.jsプロセス終了確認
2. **段階的操作**: .next削除→プロセス確認→npm install
3. **完了確認**: Next.jsバイナリ存在確認（node_modules/next/dist/bin/next）
4. **緊急スクリプト**: `./scripts/emergency-env-reset.sh` 使用

### UIコンポーネント表示・非表示問題（重要・Issue #35・#47で発生）

#### 症状
- ヘッダーアイコン（検索・通知・テーマ等）が突然消失
- React再レンダリングで一時表示→消失を繰り返し
- セッション・状態管理による表示不安定

#### 原因パターン
1. **セッション依存**: useSession・session?.user?.id 依存による消失
2. **条件分岐**: AuthButton・権限チェック・プロップ渡し不足
3. **useEffect無限ループ**: status='loading'繰り返し・React再レンダリング
4. **構文エラー**: コメントブロック未完了・TypeScriptコンパイルエラー

#### 解決手順
```bash
# 1. デバッグログ追加・原因特定
console.log('コンポーネント状態:', { status, session, props });

# 2. セッション依存除去
const [固定値, set固定値] = useState(初期値);  // useSession回避

# 3. 条件分岐簡素化
{条件1 || 条件2 || メールアドレス条件} && コンポーネント

# 4. 段階的修正・1つずつ確認
```

#### 予防策
1. **セッション依存最小化**: 必要最小限のsession使用
2. **条件分岐デバッグ**: console.logによる条件確認
3. **段階的実装**: 複雑なコンポーネントは段階的構築
4. **構文チェック**: TypeScript・ESLint確認

詳細なトラブルシューティングは参考ドキュメント参照。

## GitHub Projects タスク管理

**プロジェクト**: my-board-app Development - GitHub Projects管理

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

### 5分ルール（運用中）

**緊急要望受信時**: `./scripts/emergency-brake.sh` 実行（必須）

#### 必須質問（5分以内）
- ✅ 何が本当の問題？（症状ではなく原因）
- ✅ なぜ緊急？（真の緊急 vs 単なる急ぎ）
- ✅ Issue作成 vs 即座修正？
- ✅ 適切なブランチで作業しているか？

#### 緊急度4段階（30秒判定）
- 🔴 CRITICAL: 本番サービス停止・セキュリティ侵害
- 🟡 HIGH: 一部ユーザー影響・機能停止
- 🟢 MEDIUM: 改善・バグ修正・新機能
- ⚪ LOW: タイポ・スタイル・ドキュメント

#### 対応フロー（ブランチ戦略統合）
- 🔴 CRITICAL → hotfixブランチ→30分調査→即座対応→main直接マージ
- 🟡 HIGH → hotfixブランチ→30分調査→対応→main直接マージ
- 🟢 MEDIUM → featureブランチ→通常Issue管理フロー→develop→main
- ⚪ LOW → mainブランチ→即座修正（簡易確認のみ）

### 効果
- 緊急対応の適切な判断
- Issue管理フローの遵守率向上
- 不要な緊急対応の削減

## Git ブランチ戦略

```
main (本番環境)
├── develop (統合・テスト環境)
│   └── feature/phase6.x-xxx (機能開発)
│   └── hotfix/xxx (緊急修正)
```

**デプロイフロー**:

```
【機能開発】
feature/issue-xx-xxx → 実装・テスト → develop マージ → deployed-dev ラベル
     ↓
動作確認完了 → main マージ → 本番デプロイ → deployed-prod ラベル

【緊急修正】  
hotfix/xxx → 実装・確認 → main 直接マージ → 本番デプロイ → deployed-prod ラベル
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
