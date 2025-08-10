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

### ✅ 実装完了機能（Week 2 - 会員制システム完了）
- **Phase 0**: テスト基盤・開発環境整備（Jest・Playwright・CI/CD）
- **Phase 0.5**: 観測基盤・モニタリング設定（Sentry・Analytics）
- **Phase 1**: NextAuth認証基盤・ユーザーモデル・bcrypt
- **Phase 2**: メール認証・パスワードリセット・DKIM統合
- **Phase 3**: 会員専用投稿機能・権限管理・匿名対応
- **Phase 4**: 認証UI/UX改善・プロフィール管理・レスポンシブ
- **Phase 5**: セキュリティ強化・CSRF・レート制限・XSS対策

### 📋 将来拡張機能
- 管理者ダッシュボード・ユーザー管理
- リアルタイム通知・WebSocket統合
- 画像アップロード・ファイル管理システム

## 技術スタック

- **フロントエンド**: React 19.1.0, Next.js 15.4.5
- **UI ライブラリ**: Material-UI (MUI) 7.2.0
- **スタイリング**: Emotion, Tailwind CSS 4
- **データベース**: MongoDB with Mongoose 8.17.0
- **認証**: NextAuth.js + bcrypt + JWT
- **メール**: Nodemailer (SMTP/DKIM/SPF/DMARC)
- **開発言語**: TypeScript 5

## プロジェクト構造

```
src/
├── app/
│   ├── api/
│   │   ├── auth/            # NextAuth API routes
│   │   └── posts/           # Post API routes (認証統合済み)
│   ├── auth/                # 認証画面（ログイン・登録・リセット）
│   ├── layout.tsx           # Root layout (AuthButton統合済み)
│   └── page.tsx             # Main page component
├── components/
│   ├── auth/                # 認証関連コンポーネント
│   │   ├── AuthButton.tsx   # ログイン/ログアウトボタン
│   │   └── AuthGuard.tsx    # 認証ガード
│   ├── PostForm.tsx         # 投稿フォーム（認証対応）
│   ├── PostList.tsx         # 投稿リスト（権限表示）
│   └── ...                  # その他UI components
├── lib/
│   ├── auth/                # 認証設定・バリデーション
│   ├── security/            # セキュリティ（レート制限・CSRF）
│   ├── email/               # メール基盤（DKIM統合済み）
│   └── mongodb.ts           # DB接続
├── models/
│   ├── User.ts              # ユーザーモデル（bcrypt）
│   ├── Post.ts              # 投稿モデル（権限管理）
│   └── VerificationToken.ts # 認証トークン
├── middleware.ts            # 認証・セキュリティミドルウェア
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

# メール設定（さくらインターネット）
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
```

## API エンドポイント

### 投稿関連
- `GET /api/posts` - 全投稿の取得（ページネーション・ソート・検索対応）
- `POST /api/posts` - 新しい投稿の作成
- `PUT /api/posts/[id]` - 投稿の更新
- `DELETE /api/posts/[id]` - 投稿の削除
- `POST /api/posts/[id]/like` - いいね追加/削除
- `GET /api/posts/search` - 投稿検索（部分一致）

### 認証関連（実装完了 - Phase 1-2）
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js統合認証
- `POST /api/auth/register` - ユーザー登録・メール認証送信
- `GET /api/auth/verify-email` - メール認証確認・トークン検証
- `POST /api/auth/reset-password` - パスワードリセット（メール送信）

### データ形式
```typescript
// 投稿データ（認証統合済み）
interface Post {
  _id: string;
  content: string;        // 投稿内容（最大200文字）
  likes: number;          // いいね数
  likedBy: string[];      // いいねしたユーザーID一覧
  userId?: string;        // 投稿者ID（認証ユーザー）
  authorName?: string;    // 投稿者名（匿名対応）
  isPublic: boolean;      // 公開設定（会員限定機能）
  createdAt: string;      // 作成日時
  updatedAt: string;      // 更新日時
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
type SortOption = 'createdAt_desc' | 'createdAt_asc' | 
                  'likes_desc' | 'likes_asc' | 
                  'updatedAt_desc' | 'updatedAt_asc';

// ユーザーデータ（実装完了）
interface User {
  _id: string;
  email: string;           // メールアドレス（ログイン用）
  name: string;            // 表示名
  password: string;        // bcryptハッシュ化パスワード
  emailVerified: Date | null;  // メール認証日時
  image?: string;          // プロフィール画像URL
  createdAt: Date;         // 登録日時
  updatedAt: Date;         // 更新日時
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
- `feature/test-infrastructure` - 🚧 Phase 0: テスト基盤（実装中）
- `feature/monitoring` - 📋 Phase 0.5: 観測基盤（次）
- `feature/auth-system` - 📋 Phase 1-2: 認証機能（予定）
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

## テスト・品質保証

**Phase 0実装済み**: 完全なテスト基盤が構築されています

### テストフレームワーク
- **Jest**: 単体・統合テスト（カバレッジ80%以上目標）
- **Testing Library**: React コンポーネントテスト
- **Playwright**: E2Eテスト・ブラウザ自動化
- **GitHub Actions**: CI/CDパイプライン・自動品質チェック

### 実行コマンド
```bash
npm run test:unit        # 単体テスト実行
npm run test:integration # 統合テスト実行
npm run test:e2e         # E2Eテスト実行
npm run test:coverage    # カバレッジレポート生成
npm run lint            # コード品質チェック
```

## 参考ドキュメント

### トラブルシューティング・ガイド
プロジェクト開発時に発生する問題の解決方法については、以下の専用ドキュメントを参照してください：

- **[メール送信機能 トラブルシューティングガイド](./docs/email-troubleshooting-guide.md)** - メール送信実装時のエラーと解決策
- **[基本的なメールテスト手順](./README-email-test.md)** - さくらメール設定と動作確認方法

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
- **[Phase 1-2 - 認証基盤実装手順](./README-phase-1-2.md)** - NextAuth・メール認証・bcrypt統合
- **[Phase 3-5 - 会員機能実装手順](./README-phase-3-5.md)** - 権限管理・UI/UX・セキュリティ強化

### システム設計・戦略ドキュメント
- **[会員制ブランチ戦略](./docs/member-branch-strategy.md)** - 7段階実装のブランチ戦略・依存関係
- **[テスト・品質保証戦略](./docs/test-quality-strategy.md)** - Phase 0テスト基盤・品質管理
- **[監視・分析ガイド](./docs/monitoring-guide.md)** - Sentry・パフォーマンス監視・ユーザー分析
- **[リスク管理・ロールバック戦略](./docs/risk-management.md)** - カナリアリリース・緊急対応手順

### その他のドキュメント
- `docs/` フォルダには詳細な技術仕様書やガイドが格納されています
- 各機能固有の設定やトラブルは該当するREADMEファイルを確認してください