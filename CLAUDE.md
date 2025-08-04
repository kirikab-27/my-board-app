# 掲示板アプリ (Board App)

日本語で書かれたシンプルな掲示板アプリケーションです。React、Next.js、MongoDB、Material-UIを使用して構築されています。

## プロジェクト概要

このアプリケーションは以下の機能を提供します：
- 投稿の作成（200文字制限）
- 投稿の一覧表示（作成日時順）
- 投稿の編集・更新
- 投稿の削除
- レスポンシブデザイン

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
│   └── ThemeProvider.tsx    # MUI theme configuration
├── lib/
│   └── mongodb.ts           # MongoDB connection setup
├── models/
│   └── Post.ts              # Mongoose schema for posts
├── theme/
│   └── theme.ts             # MUI theme customization
└── types/
    └── global.d.ts          # Global TypeScript definitions
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
MONGODB_URI=mongodb://localhost:27017/board-app
```

## API エンドポイント

### 投稿関連
- `GET /api/posts` - 全投稿の取得（作成日時降順）
- `POST /api/posts` - 新しい投稿の作成
- `PUT /api/posts/[id]` - 投稿の更新
- `DELETE /api/posts/[id]` - 投稿の削除

### データ形式
```typescript
interface Post {
  _id: string;
  content: string;        // 投稿内容（最大200文字）
  createdAt: string;      // 作成日時
  updatedAt: string;      // 更新日時
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

### 開発サーバーが起動しない
1. `npm install` で依存関係を再インストール
2. MongoDB接続を確認
3. ポート3000が使用可能か確認

### データベース接続エラー
1. MongoDBサーバーの起動状況を確認
2. `MONGODB_URI` 環境変数の設定を確認
3. ネットワーク接続を確認

## テスト

現在、テストフレームワークは設定されていません。将来的にJest + React Testing Libraryの導入を検討してください。