# Issue #65 サムネイル画像修正レポート

## 問題

掲示板で画像を添付した際、サムネイル画像が真っ暗（黒い画像）になる問題

## 原因

- Cloudinaryの`c_fill`（塗りつぶし）モードが画像を真っ暗にしていた
- `f_auto`（自動フォーマット）が適切に動作していなかった可能性

## 修正内容

### 1. Media.ts - generateThumbnailメソッドの修正

**修正箇所**: `src/models/Media.ts` (行482-488)

#### 変更前

```typescript
// c_fillモードを使用（問題の原因）
thumbnailUrl = baseUrl.replace('/upload/', '/upload/c_fill,w_150,h_150,q_auto,f_auto/');
```

#### 変更後

```typescript
// c_thumbモード + g_auto（重要部分自動検出）に変更
thumbnailUrl = baseUrl.replace('/upload/', '/upload/c_thumb,w_150,h_150,g_auto,q_auto/');
```

### 2. cloudinary.ts - eager変換設定の修正

**修正箇所**: `src/lib/cloudinary.ts`

#### 画像用設定（行34）

```typescript
// 変更前
{ width: 150, height: 150, crop: 'thumb', quality: 'auto' }

// 変更後
{ width: 150, height: 150, crop: 'thumb', gravity: 'auto', quality: 'auto' }
```

#### アバター用設定（行66-68）

```typescript
// crop: 'fill' → 'thumb' に統一
{ width: 50, height: 50, crop: 'thumb', gravity: 'face', quality: 'auto' }
{ width: 100, height: 100, crop: 'thumb', gravity: 'face', quality: 'auto' }
{ width: 200, height: 200, crop: 'thumb', gravity: 'face', quality: 'auto' }
```

## 技術的詳細

### c_fill vs c_thumb の違い

- **c_fill**: 指定サイズに完全に塗りつぶす（画像が黒くなる原因）
- **c_thumb**: サムネイル専用モード（適切なトリミング）

### gravity パラメータ

- **g_auto**: 画像の重要部分を自動検出
- **g_face**: 顔検出（アバター用）

## テスト項目

- [ ] 新規画像アップロード時のサムネイル生成
- [ ] 既存画像のサムネイル再生成
- [ ] 各種画像形式（JPG, PNG, WebP）での動作確認
- [ ] アバター画像のサムネイル生成

## 影響範囲

- 掲示板の投稿機能
- タイムライン機能
- ユーザープロフィール画像
- メディアアップロード機能全般

## デプロイ状況

- 修正日時: 2025-09-13
- 修正ファイル:
  - src/models/Media.ts
  - src/lib/cloudinary.ts
