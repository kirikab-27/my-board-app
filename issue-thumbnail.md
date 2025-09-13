## 🐛 問題の概要

掲示板で画像を添付した際、サムネイル画像が真っ暗（黒い画像）になってしまう。

## 📋 現象

- 画像のアップロード自体は成功する
- フルサイズの画像は正常に表示される
- サムネイル画像のみが真っ暗になる
- CloudinaryのURL変換処理に問題がある可能性

## 🔍 調査結果

### 1. サムネイル生成処理（src/models/Media.ts: 470-494行）

```typescript
MediaSchema.methods.generateThumbnail = async function (): Promise<string> {
  if (this.cloudinary.thumbnailUrl) {
    return this.cloudinary.thumbnailUrl;
  }

  const baseUrl = this.cloudinary.secureUrl;
  let thumbnailUrl = '';

  if (this.type === 'image' || this.type === 'gif') {
    // 画像の場合: 150x150のサムネイルを生成
    thumbnailUrl = baseUrl.replace('/upload/', '/upload/c_fill,w_150,h_150,q_auto,f_auto/');
  } else if (this.type === 'video') {
    // 動画の場合: 最初のフレームからサムネイルを生成
    thumbnailUrl = baseUrl.replace(
      '/upload/',
      '/upload/c_fill,w_150,h_150,q_auto,f_jpg,fl_attachment/'
    );
  }

  if (thumbnailUrl) {
    this.cloudinary.thumbnailUrl = thumbnailUrl;
    await this.save();
  }

  return thumbnailUrl;
};
```

### 2. Cloudinary設定（src/lib/cloudinary.ts: 33-36行）

```typescript
eager: [
  { width: 150, height: 150, crop: 'thumb', quality: 'auto' }, // サムネイル
  { width: 800, height: 600, crop: 'limit', quality: 'auto' }  // 中サイズ
],
```

### 3. アップロード処理（src/app/api/media/upload/route.ts: 259行）

```typescript
thumbnailUrl: result.eager?.[0]?.secure_url,
```

## 🎯 問題の原因

1. **eager変換の競合**: Cloudinaryの`eager`設定で事前生成されるサムネイルと、`generateThumbnail`メソッドで動的に生成されるURLが競合している可能性

2. **URL変換パラメータの問題**:
   - `c_fill`（塗りつぶし）モードが画像を真っ暗にしている可能性
   - `f_auto`（自動フォーマット）が適切に動作していない可能性

3. **eager_async: true**の影響: 非同期処理により、サムネイルが生成される前にURLが返されている可能性

## 💡 修正案

### 案1: eager変換を優先する

- `generateThumbnail`メソッドで`result.eager[0].secure_url`を優先的に使用
- eager変換が存在しない場合のみURL変換を実行

### 案2: URL変換パラメータの修正

- `c_fill` → `c_thumb`（サムネイル専用モード）に変更
- `gravity: 'auto'`を追加して画像の重要部分を自動検出

### 案3: eager_asyncを無効化

- `eager_async: false`に変更して同期的にサムネイルを生成
- アップロード時のレスポンスは遅くなるが、確実性が向上

## 📝 再現手順

1. 掲示板の投稿作成画面を開く
2. 画像ファイルを選択してアップロード
3. 投稿を作成
4. 投稿一覧でサムネイルが真っ暗になることを確認

## 🔧 影響範囲

- 掲示板の投稿機能
- タイムライン機能
- ユーザープロフィール画像
- その他画像アップロード機能全般

## 🏷️ ラベル

- bug
- critical
- media-upload
