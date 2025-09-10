# Issue #61: Vercelデプロイエラー記録

## 発生日時

2025-01-10 21:04 (JST)

## エラー内容

```
Module not found: Can't resolve '@/lib/auth/authOptions'
```

## 影響ファイル

- ./src/app/api/admin/config/diff/route.ts
- ./src/app/api/admin/config/export/route.ts
- ./src/app/api/admin/config/rollback/route.ts

## 原因

ローカルでは修正したが、GitHubにプッシュされたコードに古いインポートパスが残っている。
Git操作の問題でファイルの変更が正しくステージングされていなかった可能性。

## 修正内容

```typescript
// 誤ったパス（修正前）
import { authOptions } from '@/lib/auth/authOptions';

// 正しいパス（修正後）
import { authOptions } from '@/lib/auth/nextauth';
```

## 対応

1. 3つのファイルの再確認と修正
2. git statusで変更状況確認
3. 正しくステージング・コミット・プッシュ

## 教訓

- git addで個別ファイルを指定する際は、ワイルドカードに注意
- コミット前にgit statusで確実に変更がステージングされているか確認
- Vercelデプロイエラーは本番環境の実際のコードを反映している
