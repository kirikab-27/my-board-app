# Production Errors - Issue #47 RBAC

## エラー発生日時

2025-01-10 21:00 JST

## エラー内容

### 1. PWAバナー警告（6回繰り返し）

```
Banner not shown: beforeinstallpromptevent.preventDefault() called.
The page must call beforeinstallpromptevent.prompt() to show the banner.
```

### 2. API 500エラー

```
/api/admin/secrets?action=list:1  Failed to load resource: the server responded with a status of 500 ()
```

### 3. API 403エラー

```
/api/admin/rbac/roles:1  Failed to load resource: the server responded with a status of 403 ()
/api/admin/rbac/permissions:1  Failed to load resource: the server responded with a status of 403 ()
```

## 原因分析

### PWAバナー警告

- Service Workerがインストールプロンプトイベントを防止している
- prompt()を呼び出していないため警告が表示

### API 500エラー（/api/admin/secrets）

- secretsエンドポイントが存在しない、または実装エラー

### API 403エラー（RBAC関連）

- 本番環境での権限チェックが正しく動作していない
- 開発環境のバイパスが本番環境で無効

## 解決策

1. PWAバナー: Service Worker設定を調整
2. API 500: secretsエンドポイントの作成または修正
3. API 403: 本番環境の権限チェックを修正

## ステータス

✅ 修正完了

## 修正内容

### 1. PWAバナー警告

- Service Worker内にbeforeinstallpromptイベント処理を追加
- バナー表示を明示的に無効化

### 2. API 500エラー（secrets）

- authOptionsのインポートパス修正: `@/lib/auth/nextauth` → `@/lib/auth/authOptions`

### 3. API 403エラー（RBAC）

- rbac.tsミドルウェアのauthOptionsインポートパス修正
- AdminUserレコードがなくても、ユーザーロールベースで権限判定するフォールバック追加
- super_admin/admin/moderator各ロールに適切な権限を付与

## 修正ファイル

- `public/sw.js`
- `src/app/api/admin/secrets/route.ts`
- `src/middleware/rbac.ts`
