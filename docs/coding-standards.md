# コーディング規約

## 1. 基本方針

このプロジェクトでは、保守性、可読性、一貫性を重視したコーディング規約を採用します。チーム開発において統一された品質を保つため、以下の規約に従ってください。

## 2. 命名規則

### 2.1 ファイル名

#### Reactコンポーネント
```typescript
// ✅ 良い例
PostForm.tsx         // PascalCase
PostList.tsx
ThemeProvider.tsx

// ❌ 悪い例
postForm.tsx         // camelCase
post-form.tsx        // kebab-case
POST_FORM.tsx        // UPPER_CASE
```

#### ページファイル（Next.js App Router）
```typescript
// ✅ 良い例
page.tsx             // Next.js規約に従う
layout.tsx
loading.tsx
error.tsx

// API Routes
route.ts             // Next.js規約に従う
```

#### ユーティリティ・ライブラリファイル
```typescript
// ✅ 良い例
mongodb.ts           // camelCase
dateUtils.ts
validationHelpers.ts

// ❌ 悪い例
MongoDB.ts           // PascalCase（コンポーネントではないため）
date_utils.ts        // snake_case
```

#### 設定ファイル
```typescript
// ✅ 良い例
next.config.js       // プロジェクト慣例に従う
tsconfig.json
.env.local

// ドキュメント
requirements.md      // kebab-case（ドキュメントのみ）
api-specs.md
```

### 2.2 変数名・関数名

#### 基本ルール（camelCase）
```typescript
// ✅ 良い例
const postContent = "投稿内容";
const isLoading = false;
const hasError = true;
const createdAt = new Date();

function fetchPosts() { }
function handleSubmit() { }
function validateContent() { }

// ❌ 悪い例
const post_content = "投稿内容";    // snake_case
const PostContent = "投稿内容";     // PascalCase
const POSTCONTENT = "投稿内容";     // UPPER_CASE
```

#### boolean値の命名
```typescript
// ✅ 良い例
const isLoading = false;          // is + 形容詞
const hasError = true;            // has + 名詞
const canEdit = false;            // can + 動詞
const shouldRefresh = true;       // should + 動詞

// ❌ 悪い例
const loading = false;            // 動詞の現在進行形
const error = true;               // 名詞のみ
const edit = false;               // 動詞のみ
```

#### 配列・オブジェクトの命名
```typescript
// ✅ 良い例
const posts = [];                 // 複数形
const postList = [];              // リストであることを明示
const postData = {};              // データであることを明示
const postById = {};              // 用途を明示

// ❌ 悪い例
const post = [];                  // 単数形（配列なのに）
const data = {};                  // 汎用的すぎる
const obj = {};                   // 意味不明
```

### 2.3 定数の命名

#### プロジェクトレベル定数（UPPER_SNAKE_CASE）
```typescript
// ✅ 良い例
const MAX_POST_LENGTH = 200;
const API_BASE_URL = '/api';
const DEFAULT_PAGE_SIZE = 20;
const ERROR_MESSAGES = {
  REQUIRED: '必須項目です',
  TOO_LONG: '文字数が超過しています'
} as const;

// ❌ 悪い例
const maxPostLength = 200;        // camelCase
const apiBaseUrl = '/api';        // camelCase
```

#### ローカル定数（camelCase）
```typescript
// ✅ 良い例（関数内やコンポーネント内）
function PostForm() {
  const maxLength = 200;          // ローカルスコープ
  const defaultValue = '';
  // ...
}
```

### 2.4 クラス・インターフェース・型の命名

#### インターフェース（PascalCase + I prefix）
```typescript
// ✅ 良い例
interface IPost {
  _id: string;
  content: string;
  createdAt: Date;
}

interface IPostFormProps {
  onPostCreated: () => void;
  editingPost?: IPost | null;
}

// ❌ 悪い例
interface post {                  // 小文字始まり
  // ...
}

interface PostInterface {         // Interface suffix（冗長）
  // ...
}
```

#### 型エイリアス（PascalCase）
```typescript
// ✅ 良い例
type PostStatus = 'draft' | 'published' | 'archived';
type ApiResponse<T> = {
  data: T;
  error?: string;
};

// ❌ 悪い例
type postStatus = 'draft' | 'published';  // 小文字始まり
```

## 3. TypeScript型定義ルール

### 3.1 型定義の基本方針

#### 厳密な型定義
```typescript
// ✅ 良い例
interface IPostFormProps {
  onPostCreated: () => void;
  editingPost?: IPost | null;     // 明示的なnull許可
  onEditCancel?: () => void;      // オプショナル
}

// ❌ 悪い例
interface IPostFormProps {
  onPostCreated: any;             // any使用禁止
  editingPost?: any;              // any使用禁止
}
```

#### Union型の活用
```typescript
// ✅ 良い例
type LoadingState = 'idle' | 'loading' | 'success' | 'error';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const [status, setStatus] = useState<LoadingState>('idle');
```

### 3.2 API関連の型定義

#### APIレスポンス型
```typescript
// ✅ 良い例
interface IApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface IPostResponse extends IApiResponse<IPost> {}
interface IPostListResponse extends IApiResponse<IPost[]> {}

// 使用例
async function fetchPosts(): Promise<IPostListResponse> {
  // ...
}
```

#### APIリクエスト型
```typescript
// ✅ 良い例
interface ICreatePostRequest {
  content: string;
}

interface IUpdatePostRequest extends ICreatePostRequest {
  id: string;
}
```

### 3.3 コンポーネントProps型定義

#### 基本的なProps
```typescript
// ✅ 良い例
interface IPostListProps {
  posts: IPost[];
  loading?: boolean;
  onRefresh: () => void;
  onEditPost: (post: IPost) => void;
}

// React.FCを使用する場合
const PostList: React.FC<IPostListProps> = ({ 
  posts, 
  loading = false, 
  onRefresh, 
  onEditPost 
}) => {
  // ...
};
```

#### 拡張可能なProps
```typescript
// ✅ 良い例（HTMLAttributesを継承）
interface ICustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}
```

### 3.4 ユーティリティ型の活用

```typescript
// ✅ 良い例
type PostKeys = keyof IPost;                    // '_id' | 'content' | 'createdAt' | 'updatedAt'
type CreatePostData = Omit<IPost, '_id'>;       // IDを除いた型
type PostPreview = Pick<IPost, 'content' | 'createdAt'>;  // 特定フィールドのみ

// 部分更新用の型
type UpdatePostData = Partial<Pick<IPost, 'content'>>;
```

## 4. コンポーネント設計方針

### 4.1 コンポーネント分割の基準

#### 単一責任の原則
```typescript
// ✅ 良い例：責任が明確
const PostForm = () => { };      // 投稿フォームのみ
const PostList = () => { };      // 投稿一覧表示のみ
const PostItem = () => { };      // 個別投稿表示のみ

// ❌ 悪い例：複数の責任
const PostManager = () => { };   // フォーム+一覧+編集
```

#### 再利用可能性
```typescript
// ✅ 良い例：汎用的なコンポーネント
interface IConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<IConfirmDialogProps> = (props) => {
  // ...
};

// 使用例
<ConfirmDialog
  open={deleteDialogOpen}
  title="投稿を削除"
  message="この投稿を削除してもよろしいですか？"
  onConfirm={handleDeleteConfirm}
  onCancel={handleDeleteCancel}
/>
```

### 4.2 コンポーネント構造

#### ファイル構成
```typescript
// PostForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { /* MUI imports */ } from '@mui/material';

// 1. インターフェース定義
interface IPostFormProps {
  // ...
}

// 2. コンポーネント定義
export default function PostForm({ 
  onPostCreated, 
  editingPost, 
  onEditCancel 
}: IPostFormProps) {
  // 3. State定義
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 4. Effect定義
  useEffect(() => {
    // ...
  }, [editingPost]);
  
  // 5. Handler定義
  const handleSubmit = async (e: React.FormEvent) => {
    // ...
  };
  
  // 6. JSX return
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      {/* ... */}
    </Paper>
  );
}
```

### 4.3 Custom Hooks

#### 共通ロジックの分離
```typescript
// hooks/usePosts.ts
interface IUsePostsReturn {
  posts: IPost[];
  loading: boolean;
  error: string;
  fetchPosts: () => Promise<void>;
  createPost: (content: string) => Promise<void>;
  updatePost: (id: string, content: string) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
}

export function usePosts(): IUsePostsReturn {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const fetchPosts = useCallback(async () => {
    // ...
  }, []);
  
  return {
    posts,
    loading,
    error,
    fetchPosts,
    createPost,
    updatePost,
    deletePost
  };
}
```

## 5. コメントの書き方

### 5.1 JSDoc形式のコメント

#### 関数・メソッド
```typescript
/**
 * 投稿を作成する
 * @param content 投稿内容（200文字以内）
 * @returns 作成された投稿データ
 * @throws {Error} バリデーションエラー時
 */
async function createPost(content: string): Promise<IPost> {
  // ...
}

/**
 * 投稿内容をバリデーションする
 * @param content - 検証対象の投稿内容
 * @returns バリデーション結果
 */
function validatePostContent(content: string): {
  isValid: boolean;
  errorMessage?: string;
} {
  // ...
}
```

#### コンポーネント
```typescript
/**
 * 投稿作成・編集フォームコンポーネント
 * 
 * 新規作成モードと編集モードの両方に対応。
 * 文字数制限（200文字）とリアルタイムバリデーションを提供。
 * 
 * @example
 * ```tsx
 * // 新規作成モード
 * <PostForm onPostCreated={handleRefresh} />
 * 
 * // 編集モード
 * <PostForm 
 *   onPostCreated={handleRefresh}
 *   editingPost={selectedPost}
 *   onEditCancel={handleCancel}
 * />
 * ```
 */
export default function PostForm({ onPostCreated, editingPost, onEditCancel }: IPostFormProps) {
  // ...
}
```

### 5.2 インラインコメント

#### 複雑なロジックの説明
```typescript
// ✅ 良い例
function PostList({ posts, onRefresh, onEditPost }: IPostListProps) {
  // 編集中の投稿を管理するためのstate
  // nullの場合は編集モードではない
  const [editingPost, setEditingPost] = useState<IPost | null>(null);
  
  const handleEdit = (post: IPost) => {
    // 編集モードに入る前に、既存の編集をキャンセル
    if (editingPost) {
      setEditingPost(null);
    }
    
    // 選択された投稿を編集モードに設定
    setEditingPost(post);
  };
}

// ❌ 悪い例
function PostList({ posts, onRefresh, onEditPost }: IPostListProps) {
  // 投稿
  const [editingPost, setEditingPost] = useState<IPost | null>(null);
  
  const handleEdit = (post: IPost) => {
    // 編集
    setEditingPost(post);
  };
}
```

#### TODOコメント
```typescript
// TODO: ページネーション機能を実装
// FIXME: MongoDB接続エラーのハンドリング改善が必要
// HACK: 一時的な回避策（将来的にリファクタリング予定）
// NOTE: この実装はMaterial-UI v5の仕様に依存
```

### 5.3 APIドキュメントコメント

```typescript
/**
 * 投稿API - 新規作成
 * 
 * @route POST /api/posts
 * @param {Object} body - リクエストボディ
 * @param {string} body.content - 投稿内容（1-200文字）
 * @returns {Object} 201 - 作成された投稿データ
 * @returns {Object} 400 - バリデーションエラー
 * @returns {Object} 500 - サーバーエラー
 * 
 * @example
 * // Request
 * POST /api/posts
 * {
 *   "content": "これは投稿内容です"
 * }
 * 
 * // Response (201)
 * {
 *   "_id": "...",
 *   "content": "これは投稿内容です",
 *   "createdAt": "2025-01-20T10:30:00.000Z",
 *   "updatedAt": "2025-01-20T10:30:00.000Z"
 * }
 */
export async function POST(request: NextRequest) {
  // ...
}
```

## 6. Git コミットメッセージ規約

### 6.1 コミットメッセージ形式（Conventional Commits）

#### 基本形式
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

#### Type（必須）
| Type | 説明 | 例 |
|------|------|-----|
| `feat` | 新機能追加 | `feat: 投稿編集機能を追加` |
| `fix` | バグ修正 | `fix: 改行が表示されない問題を修正` |
| `docs` | ドキュメント更新 | `docs: API仕様書を更新` |
| `style` | コードフォーマット | `style: ESLintルールに従いフォーマット` |
| `refactor` | リファクタリング | `refactor: PostFormコンポーネントを分割` |
| `test` | テスト追加・修正 | `test: PostForm単体テストを追加` |
| `chore` | ビルド・設定変更 | `chore: Next.js 15にアップデート` |

#### Scope（オプション）
| Scope | 説明 |
|-------|------|
| `components` | Reactコンポーネント |
| `api` | APIエンドポイント |
| `models` | データモデル |
| `hooks` | Custom Hooks |
| `utils` | ユーティリティ |
| `docs` | ドキュメント |
| `config` | 設定ファイル |

### 6.2 具体的な例

#### 良いコミットメッセージ
```bash
# 新機能
git commit -m "feat(components): 投稿削除確認ダイアログを追加"

# バグ修正
git commit -m "fix(components): PostListで改行が表示されない問題を修正

whiteSpace: 'pre-wrap'をTypographyコンポーネントに追加して、
投稿内容の改行文字が正しく表示されるように修正。

Closes #123"

# ドキュメント更新
git commit -m "docs: コーディング規約を追加"

# 設定変更
git commit -m "chore: TypeScript strict modeを有効化"
```

#### 悪いコミットメッセージ
```bash
# ❌ 曖昧すぎる
git commit -m "update"
git commit -m "fix bug"
git commit -m "changes"

# ❌ 英語と日本語が混在
git commit -m "fix: バグを修正した"

# ❌ 詳細すぎて読みにくい
git commit -m "feat: 投稿作成フォームに文字数カウンター機能を追加し、リアルタイムでバリデーションを行い、200文字を超えた場合にエラーメッセージを表示する機能を実装"
```

### 6.3 ブランチ命名規約

#### ブランチ名形式
```
<type>/<ticket-number>-<short-description>
```

#### 例
```bash
# 機能開発
feature/POST-123-add-pagination
feature/POST-124-implement-search

# バグ修正
fix/POST-125-line-break-issue
fix/POST-126-mobile-layout

# ホットフィックス
hotfix/POST-127-critical-security-fix

# リリース
release/v1.2.0
```

## 7. ESLint・Prettier設定

### 7.1 推奨ESLint設定

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-const": "error",
    "prefer-const": "error",
    "no-var": "error",
    "no-console": "warn",
    "react/jsx-key": "error",
    "react/jsx-no-target-blank": "error"
  }
}
```

### 7.2 推奨Prettier設定

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

## 8. パフォーマンス考慮事項

### 8.1 React最適化

```typescript
// ✅ 良い例：React.memoを活用
const PostItem = React.memo(({ post, onEdit, onDelete }: IPostItemProps) => {
  return (
    <Paper>
      {/* ... */}
    </Paper>
  );
});

// useCallbackでハンドラーを最適化
const PostList = ({ posts }: IPostListProps) => {
  const handleEdit = useCallback((post: IPost) => {
    // ...
  }, []);
  
  const handleDelete = useCallback((id: string) => {
    // ...
  }, []);
  
  return (
    <div>
      {posts.map(post => (
        <PostItem
          key={post._id}
          post={post}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};
```

### 8.2 Bundle Size最適化

```typescript
// ✅ 良い例：Dynamic Import
const LazyPostEditor = dynamic(() => import('./PostEditor'), {
  loading: () => <CircularProgress />,
});

// MUIの個別インポート
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

// ❌ 悪い例：全体インポート
import * as MUI from '@mui/material';
import { /* 大量のコンポーネント */ } from '@mui/material';
```

## 9. 規約チェック自動化

### 9.1 Husky設定（Git Hooks）

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{md,json}": [
      "prettier --write"
    ]
  }
}
```

### 9.2 VSCode設定

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

この規約に従うことで、コードの品質と一貫性を保ち、チーム開発を効率的に進めることができます。