# 掲示板アプリ (Board App)

日本語で書かれたシンプルな掲示板アプリケーションです。React、Next.js、MongoDB、Material-UIを使用して構築されています。

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

### ✅ 実装完了機能（Week 2完了・Phase 2.5追加実装）

- **Phase 0**: テスト基盤・開発環境整備（Jest・Playwright・CI/CD）✅ **実装完了**
- **Phase 0.5**: 観測基盤・モニタリング設定（Sentry・Analytics）✅ **実装完了**
- **Phase 1**: NextAuth.js v4認証基盤・ソーシャルログイン・MongoDB統合 ✅ **実装完了・テスト済み**
- **Phase 2**: メール認証・React Email・ウェルカムメール・パスワードリセット・さくらSMTP統合 ✅ **実装完了・テスト済み**
- **Phase 2.5**: 会員制システム基盤・ページ構成最適化・ブルートフォース対策・ローディングUI統合 ✅ **実装完了** ✨ **新規追加**
- **Phase 3**: 会員専用投稿機能・権限管理・匿名対応 ✅ **実装完了** ✨ **認証保護API実装完了**
- **Phase 4**: 認証UI/UX改善・プロフィール管理・レスポンシブ 🚧 計画済み
- **Phase 5**: セキュリティ強化・CSRF・レート制限・XSS対策 🚧 計画済み

### 📋 将来拡張機能

- 管理者ダッシュボード・ユーザー管理
- リアルタイム通知・WebSocket統合
- 画像アップロード・ファイル管理システム

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

## プロジェクト構造

```
src/
├── app/
│   ├── api/
│   │   ├── auth/            # NextAuth.js v4 API routes（実装完了）
│   │   ├── monitoring/      # 監視・メトリクス API
│   │   ├── security/        # ブルートフォース対策API（Phase 2.5）
│   │   └── posts/           # Post API routes (認証統合済み)
│   ├── register/            # カスタム新規登録ページ（ソーシャルログイン統合済み）
│   ├── login/               # カスタムログインページ（ソーシャルログイン統合済み）
│   ├── board/               # 会員限定掲示板（Phase 2.5・AuthGuard保護・旧ルート機能移行）
│   ├── dashboard/           # 認証後ダッシュボード（クイックアクション追加・ナビゲーション統合）
│   ├── members-only/        # callbackURL機能確認（認証フロー検証用）
│   ├── admin/security/      # セキュリティ管理ダッシュボード（ブロック解除・攻撃統計）
│   ├── monitoring/          # 監視ダッシュボード画面
│   ├── auth/                # 認証関連画面（エラー・認証完了・パスワードリセット）
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
│   ├── SessionProvider.tsx  # NextAuth.jsセッションプロバイダー（自動更新設定済み）
│   ├── PostForm.tsx         # 投稿フォーム（認証対応）
│   ├── PostList.tsx         # 投稿リスト（権限表示）
│   └── ...                  # その他UI components
├── lib/
│   ├── auth/                # NextAuth.js v4設定・MongoDB Adapter（実装完了・認証フロー動作確認済み）
│   ├── validations/         # Zod認証バリデーション（実装完了・日本語文字対応済み）
│   ├── monitoring/          # 監視・分析基盤（Phase 0.5）
│   ├── security/            # ブルートフォース対策・レート制限（Phase 2.5実装完了）
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
│   ├── User.ts              # ユーザーモデル（bcrypt・自動ハッシュ化動作確認済み）
│   ├── Post.ts              # 投稿モデル（権限管理）
│   └── VerificationToken.ts # 認証トークン
├── utils/loading/           # ローディングユーティリティ（Phase 2.5）
│   ├── animations.ts        # アニメーションキーフレーム（8種類・テーマ対応・パフォーマンス最適化）
│   └── responsive.ts        # レスポンシブローディング（ブレークポイント・アクセシビリティ・デバイス対応）
├── middleware.ts            # Next.js 15強化ミドルウェア（/board保護・ロール制御・セキュリティ統合・完全動作確認済み）
└── types/global.d.ts        # TypeScript定義

# テスト・品質保証
tests/                       # テスト基盤（Phase 0）
├── unit/                    # 単体テスト
├── integration/             # 統合テスト
└── e2e/                     # E2Eテスト

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

# 認証保護APIテスト
node scripts/test-auth-apis.js

# 投稿データ移行（既存データの認証システム対応）
node scripts/migrate-posts-to-auth.js

# ユーザーrole設定（認証トラブル解決）
node scripts/update-user-roles.js

# セッション完全クリア（認証リセット時）
node scripts/clear-sessions.js
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
APP_URL=http://localhost:3010
APP_NAME=掲示板システム

# NextAuth.js v4設定（Phase 1実装完了・ソーシャルログイン対応）
NEXTAUTH_URL=http://localhost:3010
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

# セキュリティ設定（Phase 2.5）
SECURITY_API_TOKEN=your_security_admin_token_here
```

## API エンドポイント

### 投稿関連（Phase 3 認証保護API実装完了）

- `GET /api/posts` - 全投稿の取得（ページネーション・ソート・検索対応）
- `POST /api/posts` - 新しい投稿の作成 ✅ **認証必須・ユーザー情報保存**
- `PUT /api/posts/[id]` - 投稿の更新 ✅ **認証必須・本人確認**
- `DELETE /api/posts/[id]` - 投稿の削除 ✅ **認証必須・本人確認**
- `POST/GET/DELETE /api/posts/[id]/like` - いいね機能 ✅ **認証/匿名対応・ユーザーID管理**
- `GET /api/posts/search` - 投稿検索（部分一致）

### 認証関連（Phase 2実装完了・メール認証・パスワードリセット対応済み）

- `GET/POST /api/auth/[...nextauth]` - NextAuth.js v4統合認証（JWT・MongoDB Adapter・メール認証対応）
- `GET /api/auth/rate-limit` - ログイン試行回数・制限状況確認API ✨ **新規追加**
- `POST /api/auth/register` - ユーザー登録・メール認証送信・React Email対応
- `GET /api/auth/verify-email` - メール認証確認・ウェルカムメール送信
- `POST /api/auth/reset-password/request` - パスワードリセット要求・React Emailでメール送信
- `POST /api/auth/reset-password/confirm` - パスワードリセット確定・新パスワード設定

### ページ構成（Phase 2.5会員制システム最適化・ページ分離実装完了）

- `GET /` - ランディングページ（会員登録促進・機能紹介・認証済み→掲示板自動リダイレクト）✨ **新規実装**
- `GET /board` - 会員限定掲示板（AuthGuard保護・投稿CRUD・検索・いいね・ページネーション）✨ **新規実装**
- `GET /register` - 新規登録ページ（メール・Google・GitHub・パスワード強度インジケーター対応）
- `GET /login` - ログインページ（メール・Google・GitHub・パスワード忘れ・callbackURL・**試行回数表示**対応）
- `GET /dashboard` - 認証後ダッシュボード（クイックアクション・掲示板・セキュリティ管理リンク）✨ **機能拡張**
- `GET /members-only` - callbackURL機能確認（AuthGuardImproved使用・自動リダイレクト）
- `GET /admin/security` - セキュリティ管理ダッシュボード（攻撃統計・ブロック解除・制限状況確認）
- `GET /auth/verified` - メール認証完了画面・ログイン画面へ誘導
- `GET /auth/error` - 認証エラー画面・詳細なエラーメッセージ対応
- `GET /auth/forgot-password` - パスワードリセット要求画面
- `GET /auth/reset-password` - パスワードリセット画面・トークン検証対応

### 監視・分析関連（Phase 0.5実装完了）

- `GET /api/monitoring/metrics` - システムメトリクス取得
- `POST /api/monitoring/send-alert-email` - アラートメール送信
- `POST /api/analytics/events` - ユーザー行動イベント収集

### セキュリティ関連（Phase 2.5実装完了）

- `GET /api/security/stats` - 攻撃統計・ブロック状況取得
- `POST /api/security/unblock` - IP/ユーザーブロック解除

### データ形式

```typescript
// 投稿データ（認証統合済み）
interface Post {
  _id: string;
  content: string; // 投稿内容（最大200文字）
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

- 投稿の作成・編集フォーム
- 文字数制限（200文字）
- バリデーション機能

### PostList (`src/components/PostList.tsx`)

- 投稿一覧の表示
- 編集・削除機能
- レスポンシブ表示

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

#### NextAuth.js認証エラー（Phase 1実装完了・動作確認済み）

- **✅ ユーザー登録時の名前バリデーションエラー**: 
  - **解決完了**: 日本語文字（ひらがな・カタカナ・漢字）対応の正則表現に修正済み
  - **対応文字**: 英数字・ひらがな・カタカナ・漢字・スペース・ハイフン・アンダースコア
  - **確認済み**: "テストユーザー"での登録が正常に完了
- **✅ NextAuth.js依存関係エラー**: NextAuth.js v4.24.10使用（v5は依存関係競合のため回避）
- **✅ MongoDB接続エラー**: `connectDB`インポート問題を修正（mongodb.tsでexportエイリアス追加）
- **✅ セッションエラー**: MongoDB接続・環境変数（NEXTAUTH_URL, NEXTAUTH_SECRET）設定済み・動作確認完了

#### 認証済みユーザーがunauthorizedページにリダイレクトされる問題

**症状**: ログイン済みなのに `/` アクセス時に `/unauthorized` にリダイレクト  
**原因**: ユーザーrole情報がJWTトークン・セッションに含まれていない複合的エラー
- Userモデルにroleフィールド不足
- NextAuth.js Callbackでroleがトークンに設定されない  
- 既存JWTトークンに古い情報が残存

**解決方法**:
1. `node scripts/update-user-roles.js` で既存ユーザーにrole追加
2. NextAuth.js JWT/Session callbackでrole情報設定
3. `NEXTAUTH_SECRET`変更で既存トークン無効化・サーバー再起動
4. ブラウザでセッション状態確認・再ログイン

#### メール送信・認証エラー

- **SMTP接続エラー**: `node scripts/test-email.js` で接続確認
- **SPF認証失敗**: `node scripts/verify-spf.js kab137lab.com` で設定確認
- **DKIM署名問題**: `node scripts/verify-dkim.js kab137lab.com default` で検証
- **詳細解決策**: [メール認証設定チートシート](./docs/email-auth-cheatsheet.md)

#### パフォーマンス目標

- **ログイン応答**: < 500ms
- **メール送信**: < 2秒
- **ページ読込**: < 3秒
- **同時接続数**: 100ユーザー以上

### 開発時のコマンド

```bash
# 基本開発コマンド
npm run dev                    # 開発サーバー起動（Turbopack）
npx tsc --noEmit              # 型チェック
npm run lint                  # Lint実行

# Phase別コマンド
npm run test:unit             # Phase 0: 単体テスト
npm run test:e2e              # Phase 0: E2Eテスト
npm run monitor:check         # Phase 0.5: 監視確認
npm run auth:test             # Phase 1+: 認証テスト
node scripts/test-brute-force.js # Phase 2.5: ブルートフォース攻撃テスト

# 品質管理
npm run test:coverage         # カバレッジ確認（80%以上目標）
npm run security:scan         # セキュリティスキャン
rm -rf node_modules package-lock.json && npm install  # 依存関係再構築
```

## Git ブランチ戦略

このプロジェクトはGit Flowベースのブランチ戦略を採用しています：

### ブランチ構成

- `main` - 本番環境用（安定版）
- `develop` - 開発統合用（次期リリース）
- `feature/*` - 機能開発用（個別機能ごと）
- `hotfix/*` - 緊急修正用
- `release/*` - リリース準備用

### フィーチャーブランチ

- `feature/email-service` - ✅ メール送信機能（完了）
- `feature/test-infrastructure` - ✅ Phase 0: テスト基盤（完了）
- `feature/monitoring` - ✅ Phase 0.5: 観測基盤（完了）
- `feature/auth-system` - ✅ Phase 1: NextAuth.js認証基盤（完了・動作確認済み）
- `feature/member-posts` - 📋 Phase 3: 会員投稿（予定）
- `feature/member-ui` - 📋 Phase 4-5: UI・セキュリティ（予定）
- `feature/admin-panel` - 📋 管理者機能（将来）

### 7段階開発フロー

1. **Phase 0**: `feature/email-service` → `feature/test-infrastructure`
2. **Phase 0.5**: `feature/test-infrastructure` → `feature/monitoring`
3. **Phase 1-2**: `feature/monitoring` → `feature/auth-system`
4. **Phase 3**: `feature/auth-system` → `feature/member-posts`
5. **Phase 4-5**: `feature/member-posts` → `feature/member-ui`
6. **各完了時**: `develop`にマージ + タグ付け（`phase-N-complete`）
7. **最終**: `develop` → `main`（Pull Request必須）

### 基盤Phase依存関係

- **Phase 1+**: Phase 0（テスト基盤）必須
- **Phase 1+**: Phase 0.5（観測基盤）必須
- **失敗時**: 段階的ロールバック（基盤→認証→機能）

## テスト・品質保証・監視

**✅ Phase 0実装完了**: 完全なテスト基盤が構築されています  
**✅ Phase 0.5実装完了**: 包括的な監視・分析基盤が構築されています

### 実装済みテストフレームワーク

- **Jest 29.7**: 単体・統合テスト（カバレッジ80%目標設定済み）
- **Testing Library**: React コンポーネントテスト
- **Playwright**: E2Eテスト・ブラウザ自動化（Chromium・Firefox・Mobile対応）
- **GitHub Actions**: CI/CDパイプライン・自動品質チェック
- **ESLint**: TypeScript対応・Prettier統合
- **Husky**: Git pre-commitフック・lint-staged設定

### 実装済み監視・分析基盤（Phase 0.5）

- **Sentry統合**: エラートラッキング・パフォーマンス監視・セッションリプレイ
- **Web Vitals監視**: CLS・FID・FCP・LCP・TTFB自動測定・閾値アラート
- **パフォーマンスモニター**: API応答時間・DB操作時間・カスタムメトリクス
- **ユーザー行動分析**: イベント追跡・セッション分析・Google Analytics統合
- **アラートマネージャー**: 閾値監視・Slack/メール通知・クールダウン制御
- **リアルタイムダッシュボード**: システム状況・チャート・エラー分布可視化

### 実行コマンド

```bash
# テスト実行
npm run test:unit        # 単体テスト実行
npm run test:integration # 統合テスト実行
npm run test:e2e         # E2Eテスト実行
npm run test:coverage    # カバレッジレポート生成
npm run test:all         # 全テスト実行
npm run lint             # コード品質チェック
npm run type-check       # TypeScript型チェック

# 監視・分析実行（Phase 0.5）
npm run monitor:check    # 監視サービス状況確認
npm run monitor:dashboard # ダッシュボードサーバー起動
npm run sentry:sourcemaps # Sentryソースマップアップロード
```

### テストディレクトリ構造

```
tests/
├── unit/                # 単体テスト
├── integration/         # 統合テスト
├── e2e/                 # E2Eテスト
└── setup.ts             # Jest設定
```

## 参考ドキュメント

### トラブルシューティング・ガイド

プロジェクト開発時に発生する問題の解決方法については、以下の専用ドキュメントを参照してください：

- **[NextAuth.js認証トラブルシューティング](./README-auth-troubleshooting.md)** - 認証・セッション・role権限問題の詳細解決方法 ✨ **新規追加**
- **[メール送信機能 トラブルシューティングガイド](./docs/email-troubleshooting-guide.md)** - メール送信実装時のエラーと解決策
- **[基本的なメールテスト手順](./README-email-test.md)** - さくらメール設定と動作確認方法
- **[パスワード強度インジケーター機能](./README-password-strength.md)** - リアルタイム強度評価・UI/UX詳細・4段階評価
- **[ブルートフォース攻撃対策](./README-brute-force-protection.md)** - レート制限・残り試行回数表示・段階的警告・管理者ダッシュボード
- **[Phase 2.5 ページ構成最適化](./README-page-structure-optimization.md)** - 会員制システム基盤・ランディングページ・認証フロー改善
- **[useRequireAuth認証フック](./README-useRequireAuth-hook.md)** - 権限制御・自動リダイレクト・エラーハンドリング・Material-UI統合・テスト完備
- **[ミドルウェア保護システム](./README-middleware-protection.md)** - /board保護・ロール制御・レート制限・CSRF保護・セキュリティヘッダー・多層防御
- **[ローディングUI統合システム](./README-loading-components.md)** - Material-UI統合・5種ローディング・4種スケルトン・useRequireAuth連携・レスポンシブ・アニメーション完備
- **[学習用Phase 0-2実装ガイド](./docs/learning-guide-phase-0-to-2.md)** - 完全学習ドキュメント・実装例・ベストプラクティス

### DNS・メール認証設定

- **SPF設定**: ✅ `v=spf1 a:www3625.sakura.ne.jp include:_spf.sakura.ne.jp ~all`
- **DKIM設定**: ✅ 完了・署名検証済み（セレクタ: default）
- **DMARC設定**: ✅ `v=DMARC1; p=none; rua=mailto:noreply@kab137lab.com`
- **完全チートシート**: [メール認証設定チートシート](./docs/email-auth-cheatsheet.md)

### プロジェクト状況

- **[プロジェクト実装状況レポート](./docs/project-implementation-status.md)** - 全機能の実装状況・進捗・評価

### 技術仕様書

- `docs/api-specs.md` - API仕様詳細
- `docs/database-specs.md` - データベース設計
- `docs/system-architecture.md` - システム構成

### 会員制システム実装ガイド（Phase別実装完了）

- **[Phase 0 - テスト基盤整備手順](./README-phase-0.md)** - Jest・Playwright・CI/CD構築ガイド
- **[Phase 0.5 - 監視基盤構築手順](./README-phase-0.5.md)** - Sentry・Analytics・ダッシュボード
- **[Phase 1-2 - 認証基盤実装手順](./README-phase-1-2.md)** - NextAuth・React Email・メール認証統合
- **[Phase 3-5 - 会員機能実装手順](./README-phase-3-5.md)** - 権限管理・UI/UX・セキュリティ強化

### システム設計・戦略ドキュメント

- **[会員制ブランチ戦略](./docs/member-branch-strategy.md)** - 7段階実装のブランチ戦略・依存関係
- **[テスト・品質保証戦略](./docs/test-quality-strategy.md)** - Phase 0テスト基盤・品質管理
- **[監視・分析ガイド](./docs/monitoring-guide.md)** - Sentry・パフォーマンス監視・ユーザー分析
- **[リスク管理・ロールバック戦略](./docs/risk-management.md)** - カナリアリリース・緊急対応手順

### その他のドキュメント

- `docs/` フォルダには詳細な技術仕様書やガイドが格納されています
- 各機能固有の設定やトラブルは該当するREADMEファイルを確認してください
