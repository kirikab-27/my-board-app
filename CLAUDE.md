# 掲示板アプリ (Board App)

日本語で書かれたシンプルな掲示板アプリケーションです。React、Next.js、MongoDB、Material-UIを使用して構築されています。

## 🚨 【重要】ルール厳守警告

**このドキュメントのルールは絶対に遵守すること。軽視・無視は致命的なプロジェクト破綻を招く。**

### ⛔ 禁止事項（違反厳禁）

- ❌ **既存情報の確認なしに新規設定を追加** → 情報の不整合・設定ミス
- ❌ **部分的な情報のみで判断・実装** → プロジェクト全体の整合性破綻
- ❌ **環境変数・URL・ドメインの一貫性確認怠り** → 本番環境での致命的エラー
- ❌ **ルールの表面的遵守（形だけの更新）** → 実質的なドキュメント管理破綻

### ✅ 必須実行事項（例外なし）

- ✅ **機能追加前**: 既存設定・環境変数・関連ドキュメントの全確認
- ✅ **設定変更時**: プロジェクト全体との整合性チェック（grep検索・ファイル横断確認）
- ✅ **ドキュメント更新時**: 関連セクション・既存情報との一貫性検証
- ✅ **疑問発生時**: 推測ではなく確実な情報確認・ユーザーへの確認

**このルールを軽視した場合、プロジェクトの信頼性と継続性に重大な損害を与える。**

## 📚 ドキュメント管理ルール

### CLAUDE.mdの役割と制限

- **最大サイズ**: 1500行以内を維持
- **各セクション上限**: 200行（超過時は別ファイルへ）
- **更新タイミング**: 機能追加・エラー解決・設定変更時に即座更新

### ドキュメント配置ルール

#### CLAUDE.mdに記載するもの（コア情報のみ）

- ✅ 環境変数のリスト（詳細説明は最小限）
- ✅ APIエンドポイント一覧（1-2行の説明）
- ✅ よくあるエラーTOP10
- ✅ 他ドキュメントへのリンク集
- ✅ プロジェクト構造（概要レベル）

#### 別ファイルに分離するもの

- 📄 `docs/setup/[機能名].md` - 詳細な設定手順
- 📄 `docs/api/[機能名].md` - API詳細仕様
- 📄 `docs/troubleshooting/[機能名].md` - 詳細なトラブルシューティング
- 📄 `README-[機能名].md` - 利用者向け簡易手順書

### 実装時の更新プロトコル

```
機能実装の依頼を受けたら：
1. 実装規模を判断（小/中/大）
2. 小規模 → CLAUDE.mdのみ更新
3. 中規模 → CLAUDE.md + README-*.md作成
4. 大規模 → CLAUDE.md + docs/* + README-*.md作成
5. 必ずCLAUDE.mdの「参考ドキュメント」セクションにリンク追加
```

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
- **Phase 2.5**: 会員制システム基盤・ページ構成最適化・ブルートフォース対策・ローディングUI統合 ✅ **統合完了** ✨ **develop統合済み**
- **Phase 3**: 会員専用投稿機能・権限管理・匿名対応 ✅ **統合完了** ✨ **認証保護API実装完了**
- **Phase 4**: プロフィール管理・認証UI/UX改善・レスポンシブ ✅ **統合完了** ✨ **プロフィール機能・パスワード変更・頭文字アバター**
- **Phase 4.5**: 会員制掲示板CRUD機能拡張 ✅ **統合完了** ✨ **タイトル付き投稿・編集削除権限・会員限定投稿・権限チェック**
- **Phase 5**: セキュリティ強化・CSRF・レート制限・XSS対策 ✅ **統合完了** ✨ **エンタープライズ級セキュリティ基盤完成**
- **Phase 6.0**: SNS機能・MongoDB拡張スキーマ・68インデックス最適化 ✅ **DryRunテスト完了** 🚧 **本番マイグレーション準備完了**

### ✅ Phase 5.5統合完了（2025/08/13）

全ブランチ統合・依存関係解決・本番デプロイ完了。https://kab137lab.com 稼働中。

### ✅ Phase 5実装完了機能（セキュリティ強化）

エンタープライズ級セキュリティ基盤完成。詳細は `README-phase-5-security.md` 参照。

### ✅ Phase 4.5実装完了機能（会員制掲示板CRUD拡張）

タイトル付き投稿・会員限定CRUD・権限管理・UI/UX改善完了。詳細は `README-board-crud.md` 参照。

### ✅ Phase 6.0実装完了機能（SNSプラットフォーム基盤）

SNS機能・MongoDB拡張スキーマ・68インデックス最適化。詳細は `README-phase-6-sns-schema.md` 参照。

### 🚧 Phase 6.0本番マイグレーション準備完了（2025/08/15）

**DryRunテスト結果**（1.2秒・エラーなし・MongoDB Atlas接続成功）:

- **データベース状態**: 21オブジェクト・5ユーザー・15投稿・MongoDB Atlas接続確認済み
- **バックアップ作成**: `backups/phase5.5-backup-2025-08-15T13-51-46-545Z.json` 自動生成済み
- **6新規コレクション**: follows・comments・notifications・hashtags・media・analytics 作成準備完了
- **整合性問題3件検出**: ユーザー名なし（5件）・重複ユーザー名（1件）・投稿タイプ未設定（15件）→ **本番時自動修正**

### 📋 Phase 6.1以降計画機能

- **フォロー・タイムライン機能**: フォロー関係・パーソナライズドタイムライン・フィード生成
- **コメント・リプライシステム**: ネストコメント・スレッド表示・メンション通知
- **通知システム**: リアルタイム通知・プッシュ通知・バッチ処理・優先度管理
- **ハッシュタグ・トレンド**: トレンド分析・関連タグ・カテゴリ分類・オートコンプリート
- **メディア管理**: Cloudinary統合・画像・動画・アップロード・最適化・セキュリティスキャン
- **分析ダッシュボード**: ユーザー行動・パフォーマンス・エンゲージメント・A/Bテスト統計

## 技術スタック

- **フロントエンド**: React 19.1.0, Next.js 15.4.5
- **UI ライブラリ**: Material-UI (MUI) 7.2.0
- **スタイリング**: Emotion, Tailwind CSS 4
- **データベース**: MongoDB with Mongoose 8.17.0
- **認証**: NextAuth.js v4 + OAuth(Google/GitHub) + MongoDB Adapter + bcrypt（Phase 2完了・メール認証・パスワードリセット対応済み）
- **メール**: Nodemailer + React Email + さくらSMTP (DKIM/SPF/DMARC・認証メール・ウェルカムメール・パスワードリセット完全対応)
- **開発言語**: TypeScript 5
- **テスト**: Jest 29.7, Testing Library, Playwright
- **品質管理**: ESLint, Prettier, Husky
- **CI/CD**: GitHub Actions
- **監視・分析**: Sentry, Web Vitals, カスタムメトリクス
- **セキュリティ**: DOMPurify, CSP, CSRF対策, レート制限, 監査ログ, NoSQLインジェクション対策（Phase 5完了）

## プロジェクト構造

```
src/
├── app/
│   ├── api/
│   │   ├── auth/            # NextAuth.js v4 API routes（実装完了）
│   │   ├── monitoring/      # 監視・メトリクス API
│   │   ├── profile/         # プロフィール管理API（Phase 4・GET/PUT profile・パスワード変更）
│   │   ├── security/        # セキュリティAPI（Phase 5・監査ログ・CSRF・CSPレポート）
│   │   └── posts/           # Post API routes (認証統合済み)
│   ├── register/            # カスタム新規登録ページ（ソーシャルログイン統合済み）
│   ├── login/               # カスタムログインページ（ソーシャルログイン統合済み）
│   ├── board/               # 会員限定掲示板（Phase 4.5 CRUD拡張完了・Phase 5セキュリティ強化済み）
│   │   ├── create/          # 投稿作成ページ（Phase 4.5実装完了・認証必須・XSS対策済み）
│   │   ├── [id]/            # 投稿詳細ページ（Phase 4.5実装完了・SafeContent統合）
│   │   └── [id]/edit/       # 投稿編集ページ（Phase 4.5実装完了・権限チェック・XSS対策）
│   ├── dashboard/           # 認証後ダッシュボード（クイックアクション追加・ナビゲーション統合）
│   ├── members-only/        # callbackURL機能確認（認証フロー検証用）
│   ├── admin/security/      # セキュリティ管理ダッシュボード（ブロック解除・攻撃統計）
│   ├── monitoring/          # 監視ダッシュボード画面
│   ├── auth/                # 認証関連画面（エラー・認証完了・パスワードリセット）
│   ├── profile/             # プロフィール管理（Phase 4・表示・編集・パスワード変更）
│   ├── layout.tsx           # Root layout (AuthButton統合済み)
│   ├── page.tsx             # ランディングページ（会員登録促進・認証済み→掲示板リダイレクト）
│   └── landing.tsx          # ランディングページコンポーネント（機能紹介・CTA・レスポンシブ）
├── components/
│   ├── auth/                # 認証関連コンポーネント
│   │   ├── AuthButton.tsx   # ログイン/ログアウトボタン（ナビゲーション統合済み）
│   │   ├── AuthGuard.tsx    # 基本認証ガード（旧式）
│   │   └── AuthGuardImproved.tsx # 改良版認証ガード（callbackURL対応）
│   ├── ui/Loading/          # ローディングコンポーネント統合システム（Phase 2.5）
│   │   ├── BaseLoading.tsx  # 基本ローディング（5種類のバリアント・レスポンシブ対応）
│   │   ├── SkeletonLoading.tsx # ページ別スケルトン（認証・ダッシュボード・掲示板・プロフィール）
│   │   ├── ErrorFallback.tsx # エラーフォールバック（認証・ネットワーク・タイムアウト対応）
│   │   ├── AuthLoadingWrapper.tsx # useRequireAuth統合ローディング（7種類のコンポーネント）
│   │   └── index.ts         # 統合エクスポート
│   ├── examples/            # 使用例・デモコンポーネント
│   │   └── AuthHookExamples.tsx # useRequireAuth使用例集（Material-UI統合）
│   ├── profile/             # プロフィール関連コンポーネント（Phase 4）
│   │   ├── ProfileAvatar.tsx # 頭文字アバター（6色・4サイズ・日英対応）
│   │   └── ProfileHeader.tsx # プロフィールヘッダー（Server/Client分離・AuthButton統合）
│   ├── SafeContent.tsx      # セキュリティコンテンツ表示（Phase 5・XSS対策・DOMPurify統合）
│   ├── SessionProvider.tsx  # NextAuth.jsセッションプロバイダー（自動更新設定済み）
│   ├── PostForm.tsx         # 投稿フォーム（認証対応・XSS対策統合）
│   ├── PostList.tsx         # 投稿リスト（権限表示・SafeContent統合）
│   └── ...                  # その他UI components
├── lib/
│   ├── auth/                # NextAuth.js v4設定・MongoDB Adapter（実装完了・認証フロー動作確認済み）
│   ├── validations/         # Zod認証バリデーション（実装完了・日本語文字対応済み）
│   ├── monitoring/          # 監視・分析基盤（Phase 0.5）
│   ├── security/            # セキュリティ基盤（Phase 5完了・XSS・CSRF・監査ログ・NoSQL対策）
│   ├── middleware/          # ミドルウェア設定・セキュリティ機能
│   │   ├── auth-config.ts   # ルート保護設定・権限管理・リダイレクト設定
│   │   ├── security.ts      # レート制限・CSRF保護・ボット検出・IP制限
│   │   └── __tests__/       # ミドルウェアテストスイート
│   ├── email/               # メール基盤（DKIM統合済み）
│   └── mongodb.ts           # DB接続
├── hooks/                   # カスタムReactフック
│   ├── useRequireAuth.ts    # 認証必須フック（権限・ロール・自動リダイレクト・エラーハンドリング）
│   ├── useLoadingState.ts   # ローディング状態管理フック（5種類・メトリクス・タイムアウト・デバウンス対応）
│   └── __tests__/           # フックのテスト
│       └── useRequireAuth.test.ts # Jest + RTL テストスイート
├── types/                   # TypeScript型定義
│   ├── auth.ts              # 認証関連型定義（UserRole・ProtectionLevel・認証オプション）
│   └── loading.ts           # ローディング型定義（BaseLoadingProps・LoadingStateHook・LoadingMetrics）
├── models/
│   ├── User.ts              # ユーザーモデル（bcrypt・Phase 6.0拡張: username・stats・preferences・SNS機能対応）
│   ├── Post.ts              # 投稿モデル（Phase 6.0拡張: hashtags・mentions・media・stats・SNS機能対応）
│   ├── Follow.ts            # フォローモデル（Phase 6.0: フォロー関係・承認・ミュート・通知設定）
│   ├── Comment.ts           # コメントモデル（Phase 6.0: ネストコメント・スレッド・メンション・いいね）
│   ├── Notification.ts      # 通知モデル（Phase 6.0: リアルタイム・バッチ・優先度・自動期限削除）
│   ├── Hashtag.ts           # ハッシュタグモデル（Phase 6.0: トレンド・関連タグ・統計・カテゴリ管理）
│   ├── Media.ts             # メディアモデル（Phase 6.0: Cloudinary・統計・セキュリティ・使用箇所追跡）
│   ├── Analytics.ts         # 分析モデル（Phase 6.0: ユーザー行動・パフォーマンス・36イベント・1年TTL）
│   ├── index-optimization.ts # インデックス最適化（Phase 6.0: 68インデックス・パフォーマンス分析・レポート）
│   ├── AuditLog.ts          # セキュリティ監査ログモデル（Phase 5・12種類イベント・4段階重要度）
│   └── VerificationToken.ts # 認証トークン
├── utils/
│   ├── loading/             # ローディングユーティリティ（Phase 2.5）
│   │   ├── animations.ts    # アニメーションキーフレーム（8種類・テーマ対応・パフォーマンス最適化）
│   │   └── responsive.ts    # レスポンシブローディング（ブレークポイント・アクセシビリティ・デバイス対応）
│   └── security/            # セキュリティユーティリティ（Phase 5・XSS対策・入力サニタイゼーション）
├── middleware.ts            # Next.js 15強化ミドルウェア（/board保護・ロール制御・セキュリティ統合・完全動作確認済み）
└── types/global.d.ts        # TypeScript定義

# テスト・品質保証
tests/                       # テスト基盤（Phase 0）
├── unit/                    # 単体テスト
├── integration/             # 統合テスト
├── e2e/                     # E2Eテスト
└── security/                # セキュリティテスト（Phase 5・XSS・CSRF・NoSQL侵入テスト）

# ドキュメント・手順書
docs/                        # 技術仕様・ガイド
README-phase-*.md           # Phase別実装手順書
scripts/                    # 開発・テストスクリプト
```

## 開発コマンド

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動（Turbopack使用）
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバーの起動
npm start

# Linting
npm run lint

# 🚨 開発ベストプラクティス（必須）
npm run build         # コミット前に必ず実行（エラー事前発見）
npm run type-check    # TypeScript厳格チェック
npm run build && npm run start  # PR前に本番環境テスト

# 🚀 並走開発（リアルタイムエラー検知）
npm run dev:safe      # Next.js + TypeScript + ESLint 同時実行
npm run dev:all       # 上記と同じ（エラー時全停止版）
npm run typecheck:watch  # TypeScript監視のみ
npm run lint:watch    # ESLint監視のみ

# 認証保護APIテスト
node scripts/test-auth-apis.js

# 投稿データ移行（既存データの認証システム対応）
node scripts/migrate-posts-to-auth.js

# ユーザーrole設定（認証トラブル解決）
node scripts/update-user-roles.js

# セッション完全クリア（認証リセット時）
node scripts/clear-sessions.js

# Phase 4.5: 会員制掲示板CRUD機能（実装完了）
node scripts/test-board-crud.js          # 投稿CRUD機能テスト
node scripts/migrate-posts-add-title.js  # 既存投稿にタイトルフィールド追加 ✅ **実行完了**

# Phase 5: セキュリティテスト（実装完了）
node scripts/test-security-phase5.js     # XSS・CSRF・NoSQL・レート制限・監査ログテスト ✅ **新規実装**

# Phase 6.0: SNS機能マイグレーション（DryRunテスト完了・2025/08/15）
node scripts/migrate-phase6-sns.js --dry-run --verbose  # DryRunテスト実行 ✅ **1.2秒・エラーなし・整合性チェック完了**
node scripts/migrate-phase6-sns.js --verbose            # 本番マイグレーション実行 🚧 **準備完了**

# Phase 5.5: Vercel本番デプロイ（既存プロジェクト更新）
git checkout main                         # mainブランチ切り替え
git merge develop --no-ff                 # develop統合版をmainに反映
git push origin main                      # 自動デプロイトリガー（https://kab137lab.com）
```

## 環境設定

### MongoDB接続

MongoDBの接続設定は `src/lib/mongodb.ts` で管理されています。環境変数 `MONGODB_URI` を設定してください。

### 必要な環境変数

```
# データベース設定
MONGODB_URI=mongodb://localhost:27017/board-app
# または MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/board-app

# メール設定（さくらインターネット - Phase 2継続使用・DKIM/SPF/DMARC設定済み）
SMTP_HOST=初期ドメイン名.sakura.ne.jp
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=username@初期ドメイン名.sakura.ne.jp
SMTP_PASSWORD="パスワード"
MAIL_FROM_ADDRESS=username@your-domain.com
MAIL_FROM_NAME=アプリケーション名

# アプリケーション設定
APP_URL=http://localhost:3010        # 開発環境
APP_URL=https://kab137lab.com        # 本番環境（Vercel）
APP_NAME=掲示板システム

# NextAuth.js v4設定（Phase 1実装完了・ソーシャルログイン対応）
NEXTAUTH_URL=http://localhost:3010   # 開発環境
NEXTAUTH_URL=https://kab137lab.com   # 本番環境（Vercel）
NEXTAUTH_SECRET=your-super-secret-nextauth-key

# Google OAuth設定（ソーシャルログイン）
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# GitHub OAuth設定（ソーシャルログイン）
GITHUB_ID=your_github_id_here
GITHUB_SECRET=your_github_secret_here

# 監視・分析設定（Phase 0.5）
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_DSN=your_sentry_dsn_here
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
SLACK_WEBHOOK_URL=your_slack_webhook_url

# セキュリティ設定（Phase 5）
SECURITY_API_TOKEN=your_security_admin_token_here

# Vercel本番環境（既存プロジェクト: my-board-app）
NEXTAUTH_URL=https://kab137lab.com
APP_URL=https://kab137lab.com

# デプロイ設定（vercel.json）
DISABLE_ESLINT_PLUGIN=true
SENTRY_SUPPRESS_INSTRUMENTATION_FILE_WARNING=1
SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING=1
```

## API エンドポイント

### 投稿関連（Phase 5 セキュリティ統合完了・XSS/NoSQL対策済み）

- `GET /api/posts` - 全投稿の取得（NoSQL対策・入力検証・検索サニタイゼーション）✅ **Phase 5強化完了**
- `POST /api/posts` - 新しい投稿の作成（XSS検出・監査ログ記録）✅ **Phase 5強化完了**
- `GET /api/posts/[id]` - 投稿詳細取得（ObjectID検証強化）✅ **Phase 5強化完了**
- `PUT /api/posts/[id]` - 投稿の更新（XSS検出・監査ログ・権限チェック）✅ **Phase 5強化完了**
- `DELETE /api/posts/[id]` - 投稿の削除（権限チェック・監査ログ）✅ **Phase 5強化完了**
- `POST/GET/DELETE /api/posts/[id]/like` - いいね機能 ✅ **認証/匿名対応・ユーザーID管理**
- `GET /api/posts/search` - 投稿検索（入力サニタイゼーション・NoSQL対策）✅ **Phase 5強化完了**

### 認証関連（Phase 2実装完了・メール認証・パスワードリセット対応済み）

- `GET/POST /api/auth/[...nextauth]` - NextAuth.js v4統合認証（JWT・MongoDB Adapter・メール認証対応）
- `GET /api/auth/rate-limit` - ログイン試行回数・制限状況確認API ✨ **新規追加**
- `POST /api/auth/register` - ユーザー登録・メール認証送信・React Email対応
- `GET /api/auth/verify-email` - メール認証確認・ウェルカムメール送信
- `POST /api/auth/reset-password/request` - パスワードリセット要求・React Emailでメール送信
- `POST /api/auth/reset-password/confirm` - パスワードリセット確定・新パスワード設定

### プロフィール関連（Phase 4実装完了）

- `GET /api/profile` - プロフィール取得（名前・メール・自己紹介・ロール）
- `PUT /api/profile` - プロフィール更新（名前・自己紹介）✨ **新規実装**
- `PUT /api/profile/password` - パスワード変更（現在確認・強度チェック）✨ **新規実装**

### ページ構成（Vercel本番デプロイ対応・https://kab137lab.com）

- `GET /` - ランディングページ（会員登録促進・機能紹介・認証済み→掲示板自動リダイレクト）✨ **本番対応**
- `GET /board` - 会員限定掲示板（AuthGuard保護・投稿CRUD・検索・いいね・ページネーション）✨ **本番対応**
- `GET /board/create` - 投稿作成ページ ✅ **Phase 4.5実装完了・本番対応**
- `GET /board/[id]` - 投稿詳細ページ（いいね・編集削除リンク）✅ **Phase 4.5実装完了・本番対応**
- `GET /board/[id]/edit` - 投稿編集ページ（本人のみアクセス可）✅ **Phase 4.5実装完了・本番対応**
- `GET /register` - 新規登録ページ（メール・Google・GitHub・パスワード強度インジケーター対応）
- `GET /login` - ログインページ（メール・Google・GitHub・パスワード忘れ・callbackURL・**試行回数表示**対応）
- `GET /dashboard` - 認証後ダッシュボード（クイックアクション・掲示板・セキュリティ管理リンク）✨ **機能拡張**
- `GET /profile` - プロフィール表示（アバター・名前・メール・自己紹介・ロール・登録日）✨ **Phase 4新規実装・本番対応**
- `GET /profile/edit` - プロフィール編集（名前・自己紹介・リアルタイム文字カウント）✨ **Phase 4新規実装・本番対応**
- `GET /profile/password` - パスワード変更（強度チェック・現在パスワード確認）✨ **Phase 4新規実装・本番対応**
- `GET /members-only` - callbackURL機能確認（AuthGuardImproved使用・自動リダイレクト）
- `GET /admin/security` - セキュリティ管理ダッシュボード（IP/ユーザー制限統計・レート制限監視・ブロック解除・リアルタイム攻撃状況）✨ **Phase 5実装・2025/08/13アクセス問題解決済み**
- `GET /auth/verified` - メール認証完了画面・ログイン画面へ誘導
- `GET /auth/error` - 認証エラー画面・詳細なエラーメッセージ対応
- `GET /auth/forgot-password` - パスワードリセット要求画面
- `GET /auth/reset-password` - パスワードリセット画面・トークン検証対応

### 監視・分析関連（Phase 0.5実装完了）

- `GET /api/monitoring/metrics` - システムメトリクス取得
- `POST /api/monitoring/send-alert-email` - アラートメール送信
- `POST /api/analytics/events` - ユーザー行動イベント収集

### セキュリティ関連（Phase 5実装完了・監査ログ・CSRF・CSP統合）

- `GET /api/security/stats` - 攻撃統計・ブロック状況取得
- `POST /api/security/unblock` - IP/ユーザーブロック解除
- `GET /api/security/audit` - 監査ログ取得・統計・脅威評価 ✅ **Phase 5新規実装**
- `POST /api/security/audit` - セキュリティイベント手動記録 ✅ **Phase 5新規実装**
- `PATCH /api/security/audit` - イベント解決マーク ✅ **Phase 5新規実装**
- `GET /api/security/csrf` - CSRFトークン生成 ✅ **Phase 5新規実装**
- `POST /api/security/csp-report` - CSP違反レポート受信 ✅ **Phase 5新規実装**

### データ形式

```typescript
// 投稿データ（Phase 5 セキュリティ統合完了・XSS対策・監査ログ統合）
interface Post {
  _id: string;
  title?: string; // 投稿タイトル（最大100文字・XSS対策済み）✅ **Phase 5強化完了**
  content: string; // 投稿内容（1000文字・XSS対策・SafeContent対応）✅ **Phase 5強化完了**
  likes: number; // いいね数
  likedBy: string[]; // いいねしたユーザーID一覧（認証ユーザー）・IPアドレス一覧（匿名ユーザー）
  userId?: string; // 投稿者ID（認証ユーザー）
  authorName?: string; // 投稿者名（匿名対応）
  isPublic: boolean; // 公開設定（会員限定機能）
  createdAt: string; // 作成日時
  updatedAt: string; // 更新日時
}

// ページネーション情報
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ソートオプション
type SortOption =
  | 'createdAt_desc'
  | 'createdAt_asc'
  | 'likes_desc'
  | 'likes_asc'
  | 'updatedAt_desc'
  | 'updatedAt_asc';

// ユーザーデータ（NextAuth.js v4統合完了・実データ確認済み）
interface User {
  _id: string; // MongoDB ObjectId（例: 689868464fe2b2c660f3be0f）
  email: string; // メールアドレス（ログイン用・例: test@example.com）
  name: string; // 表示名（日本語完全対応・例: テストユーザー）
  password: string; // bcryptハッシュ化パスワード（例: $2b$12$CEgMMYFCx1Y28M2LroTDeevLJJWY.hNSi2JXa44repzcj4WpvCVyG）
  emailVerified: Date | null; // メール認証日時（Phase 1では即座認証・2025-08-10T09:37:10.575Z）
  image?: string; // プロフィール画像URL
  createdAt: Date; // 登録日時（2025-08-10T09:37:10.609Z）
  updatedAt: Date; // 更新日時（2025-08-10T09:37:10.609Z）
  __v: number; // Mongoose version key
}
```

## 主要コンポーネント

### PostForm (`src/components/PostForm.tsx`)

- 投稿の作成・編集フォーム（Phase 4.5で機能拡張）
- タイトル・コンテンツ文字数制限（100文字・1000文字）✅
- リアルタイムバリデーション・文字カウンター ✅

### PostList (`src/components/PostList.tsx`)

- 投稿一覧の表示（Phase 4.5でUI改善）
- タイトル表示・検索ハイライト対応 ✅
- 権限ベース編集・削除メニュー表示 ✅
- テキスト折り返し・レスポンシブ表示 ✅

### ページコンポーネント (`src/app/page.tsx`)

- メインページのロジック
- 投稿の取得・状態管理
- エラーハンドリング

## Phase 1認証基盤完了サマリー

**✅ 実装完了・動作確認済み機能（2025/08/10）**

- **NextAuth.js v4認証基盤**: 完全動作・JWT・MongoDB Adapter統合済み
- **ソーシャルログイン統合**: Google・GitHub OAuth認証を`/register`と`/login`に統合
- **カスタム認証ページ**: 統一UIの新規登録・ログインページ（Material-UI）
- **ユーザー登録**: カスタム登録フォーム・日本語名前対応・bcrypt自動ハッシュ化
- **MongoDB統合**: ユーザーデータ保存・MongoDB Compass確認済み（ObjectId: 689868464fe2b2c660f3be0f）
- **認証フロー**: 登録→自動ログイン→ダッシュボードリダイレクト完全動作
- **セキュリティ**: bcryptパスワードハッシュ化（例: $2b$12$CEgMMYFCx1Y28M2LroTDeevLJJWY.hNSi2JXa44repzcj4WpvCVyG）

**テスト済みユーザーデータ例**

```json
{
  "_id": "689868464fe2b2c660f3be0f",
  "name": "テストユーザー",
  "email": "test@example.com",
  "emailVerified": "2025-08-10T09:37:10.575Z",
  "createdAt": "2025-08-10T09:37:10.609Z"
}
```

**ソーシャルログイン設定手順（5-10分で完了）**

1. **Google OAuth設定**
   - [Google Cloud Console](https://console.cloud.google.com/) → 「APIとサービス」→「認証情報」
   - OAuth 2.0 クライアント作成 → リダイレクトURI: `http://localhost:3010/api/auth/callback/google`
   - `.env.local`の`GOOGLE_CLIENT_ID`と`GOOGLE_CLIENT_SECRET`を実際の値に更新

2. **GitHub OAuth設定**
   - GitHub → Settings → Developer settings → OAuth Apps → 「New OAuth App」
   - コールバックURL: `http://localhost:3010/api/auth/callback/github`
   - `.env.local`の`GITHUB_ID`と`GITHUB_SECRET`を実際の値に更新

3. **動作確認**
   - `http://localhost:3010/register` - 登録ページ（フォーム下部にソーシャルボタン）
   - `http://localhost:3010/login` - ログインページ（フォーム下部にソーシャルボタン）
   - Google・GitHubボタンクリックで認証開始

**認証ページUI/UX特徴**

- メール認証フォーム優先表示（上部）
- 「または」区切り線でソーシャルオプション提示（下部）
- Material-UIアイコン・ブランドカラー統一
- ローディング状態・エラーハンドリング実装済み

## Phase 2実装完了詳細

**✅ 実装完了（React Email + さくらSMTP統合）**

### メール機能要件

1. **ユーザー登録確認メール** ✅ **実装完了**
   - さくらSMTP基盤使用（DKIM/SPF/DMARC設定済み）
   - React Emailテンプレート実装済み（VerificationEmail.tsx）
   - HTML/Text両形式対応・24時間有効期限

2. **パスワードリセットメール** ✅ **実装完了**
   - トークン生成・有効期限管理（1時間）実装済み
   - React Emailテンプレート実装済み（ResetPasswordEmail.tsx）
   - セキュアなリセットフロー・使用済みトークン自動削除

3. **ウェルカムメール** ✅ **実装完了**
   - メール認証完了後の自動送信実装済み
   - React Emailテンプレート実装済み（WelcomeEmail.tsx）
   - ダッシュボードリンク・機能案内含む

4. **React Emailテンプレート** ✅ **実装完了**
   - 3種類のテンプレート実装済み（Welcome・Verification・Reset）
   - 統一されたブランドデザイン・アニメーション対応
   - レスポンシブ対応・絵文字・日本語最適化

5. **パスワード強度インジケーター** ✅ **実装完了** ✨ **新規追加**
   - リアルタイム強度チェック・色別プログレスバー（弱・普通・強・とても強の4段階）
   - 改善提案フィードバック・セキュリティガイダンス・スコア表示（0-100点）
   - Material-UI統合・レスポンシブ対応・登録ページ統合済み

6. **ログイン後リダイレクト機能** ✅ **実装完了** ✨ **新規追加**
   - 元のページ自動復帰・callbackURLパラメーター処理
   - AuthGuardImproved.tsx実装・会員限定ページ対応
   - ソーシャルログイン統合・URLエンコード/デコード対応

7. **ブルートフォース攻撃対策** ✅ **実装完了** ✨ **新規追加**（Phase 2.5）
   - IP制限（15分10回/1時間ロック）・ユーザー制限（15分5回/30分ロック）
   - 段階的ロックアウト・**残り試行回数リアルタイム表示**・段階的警告システム
   - セキュリティAPI・管理者ダッシュボード・LRUキャッシュ高速処理

8. **会員制システム基盤構築** ✅ **実装完了** ✨ **新規追加**（Phase 2.5）
   - ランディングページ実装・機能紹介・会員登録促進CTA・レスポンシブ対応
   - 掲示板の会員限定化・AuthGuard保護・未認証アクセス防止
   - ページ構成最適化・認証フロー改善（ホーム→登録→掲示板）
   - ナビゲーション統合・AuthButton機能拡張・ユーザーメニュー改善

9. **認証フックシステム** ✅ **実装完了** ✨ **新規追加**（Phase 2.5追加実装）
   - useRequireAuth統一フック・権限レベル制御・自動リダイレクト機能
   - ロール階層管理（user < moderator < admin）・メール認証必須オプション
   - カスタム認証チェック・エラーハンドリング・ローディング状態管理
   - TypeScript完全対応・Jest+RTLテストスイート・使用例コンポーネント

10. **ミドルウェア保護システム強化** ✅ **実装完了** ✨ **新規追加**（Phase 2.5追加実装）
    - /board保護追加・包括的ルート保護設定・ロールベースアクセス制御
    - レート制限統合（一般・認証別制限）・CSRF保護・ボット検出・IP制限
    - セキュリティヘッダー統合・疑わしいリクエスト検出・自動ブロック機能
    - 設定可能ルート管理・テストスイート完備・デモコンポーネント実装

### 技術実装詳細 ✅ **実装完了**

- **メールライブラリ**: Nodemailer (継続使用・React Email統合済み)
- **テンプレートエンジン**: React Email v2.0 (実装完了・3テンプレート対応)
- **SMTP**: さくらインターネット (DKIM/SPF/DMARC設定済み・完全動作確認済み)
- **フレームワーク**: Next.js 15 + TypeScript (既存基盤活用)
- **認証統合**: NextAuth.js v4 + メール認証フロー完全統合
- **UI/UX拡張**: パスワード強度インジケーター + リアルタイムフィードバック
- **セッション管理**: 自動更新設定（5分間隔・ウィンドウフォーカス時）
- **ユーザー体験**: callbackURL機能・元ページ自動復帰・会員限定ページ対応
- **セキュリティ強化**: ブルートフォース攻撃対策・レート制限・段階的ロック・攻撃監視
- **UI/UX基盤**: ランディングページ・Material-UIグラデーション・CTA最適化・レスポンシブ
- **ページ構成**: 会員制システム設計・認証フロー最適化・ナビゲーション統合・AuthGuard統合
- **認証フック**: useRequireAuth・ロール階層・自動リダイレクト・TypeScript型安全性・テスト完備
- **ミドルウェア保護**: Next.js 15 withAuth統合・多層セキュリティ・設定可能ルート・自動IP制限

### セキュリティ・品質 ✅ **実装完了**

- **VerificationTokenモデル**: MongoDB TTLインデックス・自動期限管理実装済み
- **トークンセキュリティ**: crypto.randomBytes(32)・ユニーク制約・期限検証
- **使用済み管理**: トークン即座削除・同一ユーザー全トークン削除
- **Sentryエラー監視**: 全メール送信・認証エラー監視統合済み
- **バリデーション**: Zodスキーマ・フロントエンド/バックエンド統合検証
- **パスワードセキュリティ**: 強度チェック・リアルタイム検証・改善提案表示
- **ブルートフォース対策**: IP/ユーザー制限・段階的ロック・LRUキャッシュ・管理者API

## 開発時の注意事項

- 投稿内容は200文字以内に制限されています
- MongoDBが起動していることを確認してください
- 日本語UIに最適化されています
- Material-UIのテーマカスタマイズは `src/theme/theme.ts` で行います

## トラブルシューティング

### よくある問題と解決策

#### 開発サーバーが起動しない

1. `npm install` で依存関係を再インストール
2. MongoDB接続を確認
3. ポート3000が使用可能か確認（`npm run dev` は自動でポート3010等に切り替わる）

#### データベース接続エラー

1. MongoDBサーバーの起動状況を確認
2. `MONGODB_URI` 環境変数の設定を確認
3. ネットワーク接続を確認

#### 型エラー・ビルドエラー

1. `npx tsc --noEmit` でTypeScript型チェック
2. `npm run lint` でESLintエラー確認
3. 依存関係のバージョン競合確認

- **開発環境注意**: `npm run build` でコミット前チェック必須

- **TypeScript エラー**: catchブロック型エラーは `error instanceof Error` で解決済み
- **認証エラー**: `node scripts/update-user-roles.js` でrole設定
- **メール送信エラー**: `node scripts/test-email.js` でSMTP接続確認
- **SPF認証失敗**: `node scripts/verify-spf.js kab137lab.com` で設定確認
- **DKIM署名問題**: `node scripts/verify-dkim.js kab137lab.com default` で検証
- **Gmail配信問題**: さくらSMTP→Gmail間でフィルタリング。Yahoo等は正常配信。Resend移行推奨
- **さくらIP制限**: 国外IPアドレスアクセス制限を無効化（Vercel対応）
- **詳細解決策**: [メール認証設定チートシート](./docs/email-auth-cheatsheet.md)

- **プロフィール機能**: Hydration エラー・アバター・バリデーション解決済み
- **Material-UI v7**: Grid型エラーはFlexboxレイアウトで解決済み

**技術的ポイント**:

- Grid依存を完全削除してFlexboxレイアウトに変更
- レスポンシブ対応を維持（xs: 100%, md: 50%）
- TypeScript型安全性を確保
- Material-UI v7完全対応

### Vercelデプロイ問題解決済み

21項目の技術問題（MongoDB依存関係・TypeScript型エラー・Next.js 15対応等）を解決。詳細は `README-vercel-deploy-errors-phase55.md` 参照。https://kab137lab.com 正常稼働中。

詳細なトラブルシューティング情報は参考ドキュメント参照。

**本番環境**: https://kab137lab.com (Vercel + MongoDB Atlas + Cloudflare DNS)

## 開発コマンド

```bash
# 基本開発
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド（コミット前必須）
npm run lint         # コード品質チェック
npm run test         # テスト実行
```

## Git ブランチ戦略

全フィーチャーブランチをdevelopに統合完了。詳細は `README-phase-5.5-integration.md` 参照。

## テスト・品質保証・監視

Jest・Playwright・Sentry・Web Vitals監視基盤完備。詳細は `docs/test-quality-strategy.md` 参照。

```

## 参考ドキュメント

### 主要実装ガイド

- **[Phase 6.0: SNS機能 MongoDB拡張スキーマ](./README-phase-6-sns-schema.md)** - DryRunテスト完了
- **[Phase 5: セキュリティ強化](./README-phase-5-security.md)** - エンタープライズ級セキュリティ完全ガイド
- **[会員制掲示板CRUD機能](./README-board-crud.md)** - タイトル付き投稿・権限管理
- **[プロフィール機能](./README-profile.md)** - 表示・編集・パスワード変更・アバター

### Phase別実装手順

- **[Phase 0-2](./README-phase-1-2.md)** - テスト・監視・認証基盤
- **[Phase 3-5](./README-phase-3-5.md)** - 会員機能・権限・セキュリティ

### デプロイ・トラブルシューティング

- **[Vercelデプロイエラー解決](./README-vercel-deploy-errors-phase55.md)** - 21項目の技術問題解決
- **[認証トラブルシューティング](./README-auth-troubleshooting.md)** - NextAuth.js問題解決
- **[メール送信設定](./docs/email-auth-cheatsheet.md)** - さくらSMTP・DKIM/SPF/DMARC
- **[Gmail配信問題解決](./docs/troubleshooting/gmail-delivery.md)** - さくらIP制限・Gmail フィルタリング対策

### システム設計・品質管理

- **[ブランチ戦略](./docs/member-branch-strategy.md)** - Git Flow・Phase別統合
- **[テスト・品質保証](./docs/test-quality-strategy.md)** - Jest・Playwright・監視
- **[API仕様](./docs/api-specs.md)** - エンドポイント・データ形式
```
