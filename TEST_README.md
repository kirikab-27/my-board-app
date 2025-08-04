# テスト実行ガイド

このプロジェクトでは、Jest（単体テスト）とPlaywright（E2Eテスト）を使用して包括的なテストを実装しています。

## 🧪 テストの種類

### 1. 単体テスト（Unit Tests）
- **ツール**: Jest + React Testing Library
- **対象**: コンポーネント、API関数、ユーティリティ関数
- **場所**: `src/**/*.test.ts(x)`

### 2. E2Eテスト（End-to-End Tests）
- **ツール**: Playwright
- **対象**: ユーザーフロー全体
- **場所**: `e2e/**/*.spec.ts`

## 🚀 テスト実行方法

### 事前準備

```bash
# 依存関係のインストール
npm install

# Playwrightブラウザのインストール
npx playwright install
```

### 単体テスト

```bash
# 全ての単体テストを実行
npm run test

# ウォッチモードで実行（開発時推奨）
npm run test:watch

# カバレッジレポート付きで実行
npm run test:coverage
```

### E2Eテスト

```bash
# 事前に開発サーバーを起動
npm run dev

# 別ターミナルでE2Eテストを実行
npm run test:e2e

# Playwright UIモードで実行（デバッグ時推奨）
npm run test:e2e:ui
```

### 全てのテストを実行

```bash
# 単体テスト → E2Eテストの順で実行
npm run test:all
```

## 📁 テストファイル構成

```
├── src/
│   ├── components/
│   │   ├── PostForm.test.tsx       # PostFormコンポーネントのテスト
│   │   └── PostList.test.tsx       # PostListコンポーネントのテスト
│   ├── lib/
│   │   └── validation.test.ts      # バリデーション関数のテスト
│   ├── utils/
│   │   └── dateFormat.test.ts      # 日付フォーマット関数のテスト
│   └── app/api/
│       └── posts/
│           ├── route.test.ts           # 投稿API（一覧・作成）のテスト
│           └── [id]/route.test.ts      # 投稿API（更新・削除）のテスト
├── e2e/
│   └── post-management.spec.ts     # 投稿管理のE2Eテスト
├── jest.config.js                  # Jest設定
├── jest.setup.js                   # Jestセットアップ
└── playwright.config.ts            # Playwright設定
```

## 🧪 テストの詳細

### 単体テスト内容

#### コンポーネントテスト
- **PostForm**: 投稿作成・編集フォームの動作
- **PostList**: 投稿一覧表示・メニュー操作

#### APIテスト
- **GET /api/posts**: 投稿一覧取得
- **POST /api/posts**: 投稿作成
- **PUT /api/posts/[id]**: 投稿更新
- **DELETE /api/posts/[id]**: 投稿削除

#### ユーティリティテスト
- **validation**: 投稿内容のバリデーション
- **dateFormat**: 日付フォーマット関数

### E2Eテスト内容

#### 投稿作成フロー
- 正常な投稿作成
- 改行を含む投稿
- 空投稿のエラー処理
- 文字数制限の確認
- ローディング状態

#### 投稿編集フロー
- 投稿の編集
- 編集のキャンセル
- 編集中のバリデーション

#### 投稿削除フロー
- 投稿の削除
- 削除のキャンセル
- 削除中のローディング状態

#### レスポンシブテスト
- モバイル表示
- タブレット表示

#### エラーハンドリング
- APIエラー
- ネットワークエラー

## 🐛 トラブルシューティング

### よくある問題と解決法

#### 1. MongoDBエラー
```bash
# MongoDB Memory Serverの問題
Error: spawn mongod ENOENT

# 解決法
# 1. MongoDB Community Editionをインストール
# 2. または、テスト用のMongoDBクラウドインスタンスを使用
```

#### 2. Playwrightブラウザが見つからない
```bash
Error: Executable doesn't exist at /path/to/browser

# 解決法
npx playwright install --with-deps
```

#### 3. ポート競合エラー
```bash
Error: Port 3000 is already in use

# 解決法
# 1. 既存のNext.jsサーバーを停止
# 2. または別のポートを使用
PORT=3001 npm run dev
```

#### 4. テストタイムアウト
```bash
# Playwrightでタイムアウトエラーが発生する場合
# playwright.config.tsでタイムアウトを調整
use: {
  actionTimeout: 30000,
  navigationTimeout: 30000,
}
```

## 📊 カバレッジ目標

| メトリック | 目標値 |
|-----------|--------|
| Line Coverage | 85%以上 |
| Branch Coverage | 80%以上 |
| Function Coverage | 90%以上 |
| Statement Coverage | 85%以上 |

## 🔧 CI/CD設定

### GitHub Actions
- **ファイル**: `.github/workflows/test.yml`
- **実行タイミング**: Push、Pull Request
- **内容**:
  - Node.js 18.x, 20.x でのマトリックステスト
  - 単体テスト実行
  - E2Eテスト実行
  - カバレッジレポート生成

### 手動実行
```bash
# GitHub Actionsと同じ流れをローカルで実行
npm ci
npm run lint
npm run test:coverage
npm run build
npm run test:e2e
```

## 📝 テスト作成ガイドライン

### 新しいテストを追加する場合

1. **単体テスト**:
   - ファイル名: `[component-name].test.tsx` または `[function-name].test.ts`
   - 場所: テスト対象と同じディレクトリ

2. **E2Eテスト**:
   - ファイル名: `[feature-name].spec.ts`
   - 場所: `e2e/` ディレクトリ

### テスト命名規則
- `describe`: 機能やコンポーネント名
- `test`: 「〜ができる」「〜の場合、〜になる」の形式

### 例
```typescript
describe('PostForm', () => {
  test('正常な投稿ができる', async () => {
    // テストコード
  });
  
  test('空投稿の場合、エラーメッセージが表示される', async () => {
    // テストコード
  });
});
```

このガイドに従って、品質の高いテストを継続的に実行・保守してください。