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

### 🚧 開発中機能（Week 2）
- ユーザー認証システム（JWT・ログイン・登録）
- 会員専用投稿機能
- メール通知（登録確認・パスワードリセット）
- プロフィール管理

### 📋 計画中機能
- 管理者ダッシュボード
- リアルタイム通知
- 画像アップロード機能

## 技術スタック

- **フロントエンド**: React 19.1.0, Next.js 15.4.5
- **UI ライブラリ**: Material-UI (MUI) 7.2.0
- **スタイリング**: Emotion, Tailwind CSS 4
- **データベース**: MongoDB with Mongoose 8.17.0
- **開発言語**: TypeScript 5

## プロジェクト構造

```
src/
├── app/
│   ├── api/posts/           # API routes for posts
│   │   ├── route.ts         # GET/POST endpoints
│   │   └── [id]/route.ts    # PUT/DELETE endpoints for specific posts
│   ├── layout.tsx           # Root layout with theme provider
│   └── page.tsx             # Main page component
├── components/
│   ├── PostForm.tsx         # Form for creating/editing posts
│   ├── PostList.tsx         # List display for posts
│   ├── Pagination.tsx       # Page navigation component
│   ├── SortSelector.tsx     # Sort options selector
│   ├── SearchBar.tsx        # Search functionality
│   └── ThemeProvider.tsx    # MUI theme configuration
├── lib/
│   ├── mongodb.ts           # MongoDB connection setup
│   └── email/               # Email functionality
│       ├── config.ts        # Email configuration
│       ├── sender.ts        # Email sending functions
│       └── smtp-test.ts     # SMTP testing utilities
├── models/
│   └── Post.ts              # Mongoose schema for posts
├── theme/
│   └── theme.ts             # MUI theme customization
├── types/
│   └── global.d.ts          # Global TypeScript definitions
└── utils/
    └── sortUtils.ts         # Sorting utility functions
docs/                        # Documentation and guides
├── email-troubleshooting-guide.md  # Email error solutions
└── ...                     # Other technical documents
scripts/                    # Development and test scripts
├── test-email.js           # Email functionality test
├── debug-email.js          # Email debugging script
└── check-sakura-settings.js  # Sakura-specific email tests
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

### 認証関連（開発中）
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - ユーザー情報取得

### データ形式
```typescript
// 投稿データ
interface Post {
  _id: string;
  content: string;        // 投稿内容（最大200文字）
  likes: number;          // いいね数
  likedBy: string[];      // いいねしたユーザーID一覧
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

### 開発時のコマンド
```bash
# 型チェック
npx tsc --noEmit

# Lint実行
npm run lint

# 開発サーバー起動（Turbopack）
npm run dev

# 依存関係の再インストール
rm -rf node_modules package-lock.json && npm install
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
- `feature/auth-system` - ユーザー認証機能
- `feature/user-management` - ユーザー管理機能
- `feature/admin-panel` - 管理者権限機能
- `feature/email-service` - メール送信機能
- `feature/member-posts` - 会員専用投稿機能
- `feature/member-ui` - 会員専用UI機能

### 開発フロー
1. `develop`から`feature/*`ブランチを作成
2. 機能開発完了後、Pull Requestで`develop`にマージ
3. `develop`から`main`へのリリース時はPull Request必須
4. コードレビューと自動テスト合格が必須

## テスト

現在、テストフレームワークは設定されていません。将来的にJest + React Testing Libraryの導入を検討してください。

## 参考ドキュメント

### トラブルシューティング・ガイド
プロジェクト開発時に発生する問題の解決方法については、以下の専用ドキュメントを参照してください：

- **[メール送信機能 トラブルシューティングガイド](./docs/email-troubleshooting-guide.md)** - メール送信実装時のエラーと解決策
- **[基本的なメールテスト手順](./README-email-test.md)** - さくらメール設定と動作確認方法

### DNS・メール認証設定
- **SPF設定**: ✅ `v=spf1 a:www3625.sakura.ne.jp include:_spf.sakura.ne.jp ~all`
- **DKIM設定**: ⏳ DNS反映中（セレクタ: default）
- **DMARC設定**: ✅ `v=DMARC1; p=none; rua=mailto:noreply@kab137lab.com`
- **完全チートシート**: [メール認証設定チートシート](./docs/email-auth-cheatsheet.md)

### プロジェクト状況
- **[プロジェクト実装状況レポート](./docs/project-implementation-status.md)** - 全機能の実装状況・進捗・評価

### 技術仕様書
- `docs/api-specs.md` - API仕様詳細
- `docs/database-specs.md` - データベース設計
- `docs/system-architecture.md` - システム構成

### その他のドキュメント
- `docs/` フォルダには詳細な技術仕様書やガイドが格納されています
- 各機能固有の設定やトラブルは該当するREADMEファイルを確認してください