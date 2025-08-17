# Phase 6.0: SNS機能 MongoDB拡張スキーマ実装ガイド

**2025年8月15日 - DryRunテスト完了・本番マイグレーション準備完了**

## 📋 概要

Phase 6.0では、既存の掲示板アプリケーションを本格的なSNSプラットフォームに拡張するため、MongoDBスキーマの包括的な設計・実装を行いました。

### ✅ 実装完了項目

- **8モデル拡張スキーマ設計**: User・Post・Follow・Comment・Notification・Hashtag・Media・Analytics
- **68インデックス最適化**: タイムライン・検索・通知・統計の高速化（<100ms目標）
- **包括的マイグレーションシステム**: Phase 5.5→6.0安全移行・バックアップ・ロールバック
- **DryRunテスト**: 1.2秒・エラーなし・整合性チェック・MongoDB Atlas接続確認済み

## 🚀 8モデル拡張スキーマ詳細

### 1. User モデル拡張
**ファイル**: `src/models/User.ts`

**新規追加フィールド**:
```typescript
// SNS機能対応
username: string;              // 一意ユーザー名（@メンション用）
displayName: string;           // 表示名
bio?: string;                  // 自己紹介（500文字）
location?: string;             // 所在地
website?: string;              // ウェブサイトURL

// 統計情報
stats: {
  postsCount: number;          // 投稿数
  followersCount: number;      // フォロワー数
  followingCount: number;      // フォロー中数
  likesReceived: number;       // 受信いいね数
  commentsReceived: number;    // 受信コメント数
}

// ユーザー設定
preferences: {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  language: string;
  theme: string;
}

// アクティビティ
lastSeen: Date;
isOnline: boolean;
isVerified: boolean;           // 認証バッジ
isPrivate: boolean;           // プライベートアカウント
```

### 2. Post モデル拡張
**ファイル**: `src/models/Post.ts`

**新規追加フィールド**:
```typescript
// SNS機能
type: PostType;               // 'post' | 'repost' | 'quote' | 'reply'
hashtags: string[];           // ハッシュタグ一覧
mentions: Mention[];          // @メンション一覧
media: string[];              // 添付メディアID一覧
originalPostId?: string;      // リポスト・引用元投稿ID
parentId?: string;           // 返信元投稿ID

// 統計情報拡張
stats: {
  likes: number;
  comments: number;
  reposts: number;
  quotes: number;
  views: number;
  shares: number;
}

// メタデータ
privacy: 'public' | 'followers' | 'private';
language: string;
isEdited: boolean;
isPinned: boolean;
isDeleted: boolean;
reportCount: number;
```

### 3. Follow モデル（新規作成）
**ファイル**: `src/models/Follow.ts`

```typescript
interface IFollow {
  follower: string;            // フォロワーのユーザーID
  following: string;           // フォロー対象のユーザーID
  status: 'pending' | 'accepted' | 'blocked';
  
  // フォロー管理
  isAccepted: boolean;
  isPending: boolean;
  isMuted: boolean;           // ミュート設定
  
  // 通知設定
  notifications: {
    posts: boolean;
    reposts: boolean;
    likes: boolean;
    comments: boolean;
  };
  
  // 関係性メタデータ
  followedAt: Date;
  acceptedAt?: Date;
  mutedAt?: Date;
  lastInteractionAt?: Date;
}
```

### 4. Comment モデル（新規作成）
**ファイル**: `src/models/Comment.ts`

```typescript
interface IComment {
  content: string;
  userId: string;
  postId: string;
  
  // ネストコメント
  parentId?: string;          // 親コメントID
  threadId: string;           // スレッドID
  depth: number;              // ネスト深度
  
  // SNS機能
  hashtags: string[];
  mentions: Mention[];
  media: string[];
  
  // 統計・管理
  likes: number;
  likedBy: string[];
  isHidden: boolean;
  isDeleted: boolean;
  reportCount: number;
}
```

### 5. Notification モデル（新規作成）
**ファイル**: `src/models/Notification.ts`

```typescript
interface INotification {
  userId: string;             // 通知対象ユーザーID
  type: NotificationType;     // 15種類の通知タイプ
  title: string;
  message: string;
  
  // 関連オブジェクト
  relatedUserId?: string;
  relatedPostId?: string;
  relatedCommentId?: string;
  
  // 状態管理
  isRead: boolean;
  isHidden: boolean;
  isDeleted: boolean;
  
  // バッチ処理
  isBatched: boolean;
  batchInfo?: BatchInfo;
  
  // 優先度・期限
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: Date;          // TTLインデックスで自動削除
}
```

### 6. Hashtag モデル（新規作成）
**ファイル**: `src/models/Hashtag.ts`

```typescript
interface IHashtag {
  name: string;               // 一意ハッシュタグ名
  displayName: string;        // 表示名
  description?: string;
  category: HashtagCategory;  // 14カテゴリ
  
  // 統計情報
  stats: {
    totalPosts: number;
    totalComments: number;
    uniqueUsers: number;
    weeklyGrowth: number;
    monthlyGrowth: number;
    trendScore: number;       // 0-100のトレンドスコア
    dailyStats: DailyStats[]; // 直近30日
  };
  
  // 管理・状態
  status: 'active' | 'blocked' | 'review' | 'deprecated';
  isOfficial: boolean;
  isTrending: boolean;
  isBlocked: boolean;
  
  // 関連情報
  relatedTags: RelatedHashtag[];
  synonyms: string[];
  aliases: string[];
}
```

### 7. Media モデル（新規作成）
**ファイル**: `src/models/Media.ts`

```typescript
interface IMedia {
  type: 'image' | 'video' | 'gif' | 'audio' | 'document';
  status: 'uploading' | 'processing' | 'ready' | 'failed' | 'deleted';
  visibility: 'public' | 'unlisted' | 'private';
  
  // ファイル情報
  filename: string;
  size: number;              // バイト
  metadata: MediaMetadata;   // EXIF・サイズ・形式等
  
  // Cloudinary統合
  cloudinary: {
    publicId: string;
    url: string;
    secureUrl: string;
    thumbnailUrl?: string;
    transformations?: string[];
  };
  
  // 統計・管理
  stats: {
    views: number;
    downloads: number;
    shares: number;
    bandwidth: number;
    dailyViews: DailyMediaStats[];
  };
  
  // セキュリティ
  security: {
    isScanned: boolean;
    isSafe: boolean;
    threats: string[];
    adultContent?: number;    // 0-1スコア
  };
  
  // 使用箇所追跡
  usedInPosts: string[];
  usedInComments: string[];
  usedInProfiles: string[];
}
```

### 8. Analytics モデル（新規作成）
**ファイル**: `src/models/Analytics.ts`

```typescript
interface IAnalytics {
  eventType: AnalyticsEventType; // 36種類のイベント
  eventName: string;
  
  // ユーザー・セッション情報
  userId?: string;
  anonymousId: string;
  sessionInfo: SessionInfo;
  deviceInfo: DeviceInfo;
  locationInfo?: LocationInfo;
  
  // ページ・コンテンツ情報
  url: string;
  path: string;
  contentId?: string;
  targetId?: string;
  
  // パフォーマンス・エラー情報
  performance?: PerformanceInfo;
  errorMessage?: string;
  errorStack?: string;
  
  // A/Bテスト・カスタムデータ
  experimentId?: string;
  customData?: any;
  
  // メタデータ
  source: 'web' | 'mobile' | 'api';
  environment: 'development' | 'staging' | 'production';
  timestamp: Date;           // TTLインデックス（1年）
}
```

## 📊 68インデックス最適化設計

**ファイル**: `src/models/index-optimization.ts`

### パフォーマンス目標
- **タイムライン表示**: < 100ms
- **検索機能**: < 200ms
- **通知取得**: < 50ms
- **ユーザーフォロー関係**: < 50ms

### 高優先度インデックス（20個）
```typescript
// タイムライン最適化
{ collection: 'posts', index: { isDeleted: 1, privacy: 1, createdAt: -1 } }
{ collection: 'posts', index: { userId: 1, isDeleted: 1, createdAt: -1 } }

// フォロー関係最適化
{ collection: 'follows', index: { follower: 1, following: 1 }, unique: true }
{ collection: 'follows', index: { following: 1, isAccepted: 1, createdAt: -1 } }

// 通知システム最適化
{ collection: 'notifications', index: { userId: 1, isDeleted: 1, createdAt: -1 } }
{ collection: 'notifications', index: { userId: 1, isRead: 1, isDeleted: 1 } }

// ハッシュタグ・検索最適化
{ collection: 'hashtags', index: { name: 1 }, unique: true }
{ collection: 'posts', index: { hashtags: 1, isDeleted: 1, createdAt: -1 } }
```

### 中優先度インデックス（30個）
- コメント・リプライチェーン
- メディア管理・統計
- 分析・レポート生成
- セッション・デバイス別統計

### 低優先度インデックス（18個）
- 地域別統計・A/Bテスト
- 管理者・モデレーション機能
- 長期分析・履歴データ

## 🔄 マイグレーションシステム

**ファイル**: `scripts/migrate-phase6-sns.js`

### 8段階安全マイグレーション

1. **データベース接続・状態確認**
2. **自動バックアップ作成** - `backups/phase5.5-backup-[timestamp].json`
3. **既存ユーザーモデル拡張** - username生成・統計初期化・設定初期化
4. **既存投稿モデル拡張** - ハッシュタグ抽出・メンション解析・統計初期化
5. **新規コレクション作成** - follows・comments・notifications・hashtags・media・analytics
6. **初期ハッシュタグデータ生成** - 既存投稿からハッシュタグ解析・統計計算
7. **基本インデックス作成** - 高優先度インデックスのみ作成
8. **統計情報再計算・データ整合性チェック・クリーンアップ**

### DryRunテスト結果（2025年8月15日）

**✅ 実行成功**: 1.2秒・エラーなし・MongoDB Atlas接続確認

```bash
# 実行結果サマリー
📊 移行サマリー:
  👥 ユーザー拡張: 0/5（DryRunのため未更新）
  📝 投稿拡張: 0/15（DryRunのため未更新）
  🆕 新規コレクション: 6（作成準備完了）
  🏷️ ハッシュタグ作成: 0（既存投稿にハッシュタグなし）
  📊 インデックス作成: 0（DryRunでスキップ）
  📈 統計情報更新: 5（算出完了）
  ⚠️ 整合性問題: 3件（本番時自動修正）
```

**検出された整合性問題**（本番マイグレーション時に自動修正）:
- ユーザー名なし（5件）→ メールアドレスから自動生成
- 重複ユーザー名（1件）→ 連番追加で解決
- 投稿タイプ未設定（15件）→ "post"に自動設定

## 🚀 本番マイグレーション実行手順

### 1. 事前準備
```bash
# 依存関係確認
npm install dotenv
npm install mongoose

# データベース接続確認
node -e "require('dotenv').config({path:'.env.local'}); console.log('MONGODB_URI:', process.env.MONGODB_URI?.includes('mongodb') ? '✅ 設定済み' : '❌ 未設定');"
```

### 2. 本番マイグレーション実行
```bash
# 本番マイグレーション実行（推奨）
node scripts/migrate-phase6-sns.js --verbose

# バッチサイズ調整（大量データ時）
node scripts/migrate-phase6-sns.js --verbose --batch-size=500

# 詳細ログなし（本番環境）
node scripts/migrate-phase6-sns.js
```

### 3. 実行後確認
```bash
# データベース状態確認
node -e "
const mongoose = require('mongoose');
require('dotenv').config({path:'.env.local'});

async function checkCollections() {
  await mongoose.connect(process.env.MONGODB_URI);
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('📊 コレクション一覧:');
  collections.forEach(col => console.log('  -', col.name));
  
  // 統計確認
  const users = await mongoose.connection.collection('users').countDocuments();
  const posts = await mongoose.connection.collection('posts').countDocuments();
  console.log('📈 データ統計:');
  console.log('  - ユーザー:', users + '件');
  console.log('  - 投稿:', posts + '件');
  
  mongoose.disconnect();
}
checkCollections();
"
```

## 🔧 トラブルシューティング

### よくある問題と解決策

#### 1. MongoDB接続エラー
```bash
# エラー例: ECONNREFUSED ::1:27017
# 原因: MongoDB Atlasの接続文字列が正しく設定されていない

# 解決策
echo $MONGODB_URI  # 環境変数確認
# または
node -e "require('dotenv').config({path:'.env.local'}); console.log(process.env.MONGODB_URI);"
```

#### 2. メモリ不足エラー（大量データ時）
```bash
# エラー例: JavaScript heap out of memory
# 解決策: Node.jsメモリ制限を増加
export NODE_OPTIONS="--max-old-space-size=4096"
node scripts/migrate-phase6-sns.js --verbose --batch-size=100
```

#### 3. 重複キーエラー
```bash
# エラー例: E11000 duplicate key error
# 原因: 既に一部のデータが移行されている

# 解決策: 特定コレクションのみクリーンアップ
node -e "
const mongoose = require('mongoose');
require('dotenv').config({path:'.env.local'});
async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.collection('follows').deleteMany({});
  console.log('follows コレクションをクリーンアップしました');
  mongoose.disconnect();
}
cleanup();
"
```

## 📈 パフォーマンス監視

### インデックス使用状況確認
```bash
node -e "
const mongoose = require('mongoose');
require('dotenv').config({path:'.env.local'});
require('./src/models/index-optimization.ts').then(async (module) => {
  await mongoose.connect(process.env.MONGODB_URI);
  const stats = await module.getIndexStats();
  const report = await module.generateOptimizationReport();
  console.log('📊 インデックス最適化レポート:', JSON.stringify(report, null, 2));
  mongoose.disconnect();
});
"
```

### パフォーマンステスト
```bash
# タイムライン表示速度テスト
time node -e "
const mongoose = require('mongoose');
require('dotenv').config({path:'.env.local'});
async function timelineTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  const start = Date.now();
  const posts = await mongoose.connection.collection('posts')
    .find({isDeleted: {$ne: true}, privacy: 'public'})
    .sort({createdAt: -1})
    .limit(20)
    .toArray();
  console.log('タイムライン取得:', Date.now() - start + 'ms', '投稿数:', posts.length);
  mongoose.disconnect();
}
timelineTest();
"
```

## 🔄 ロールバック手順

万が一問題が発生した場合のロールバック手順：

```bash
# 1. バックアップからの復元
node -e "
const mongoose = require('mongoose');
const fs = require('fs').promises;
require('dotenv').config({path:'.env.local'});

async function rollback() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // バックアップファイル読み込み
  const backupFile = './backups/phase5.5-backup-[timestamp].json';  // 実際のファイル名に置き換え
  const backup = JSON.parse(await fs.readFile(backupFile, 'utf8'));
  
  // users コレクション復元
  await mongoose.connection.collection('users').deleteMany({});
  if (backup.users.length > 0) {
    await mongoose.connection.collection('users').insertMany(backup.users);
  }
  
  // posts コレクション復元
  await mongoose.connection.collection('posts').deleteMany({});
  if (backup.posts.length > 0) {
    await mongoose.connection.collection('posts').insertMany(backup.posts);
  }
  
  console.log('ロールバック完了');
  mongoose.disconnect();
}
rollback();
"

# 2. 新規コレクションの削除
node -e "
const mongoose = require('mongoose');
require('dotenv').config({path:'.env.local'});
async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);
  const newCollections = ['follows', 'comments', 'notifications', 'hashtags', 'media', 'analytics'];
  for (const collection of newCollections) {
    await mongoose.connection.collection(collection).drop().catch(() => {});
  }
  console.log('新規コレクション削除完了');
  mongoose.disconnect();
}
cleanup();
"
```

## 📚 次のステップ

Phase 6.0のMongoDBスキーマ基盤が完成したら、Phase 6.1以降で以下の機能実装を予定：

1. **フォロー・タイムライン機能** - Follow モデルを活用したパーソナライズドフィード
2. **コメント・リプライシステム** - Comment モデルを活用したネスト表示
3. **リアルタイム通知** - Notification モデルを活用した通知システム
4. **ハッシュタグ・トレンド** - Hashtag モデルを活用したトレンド分析
5. **メディア管理システム** - Media モデルを活用した画像・動画アップロード
6. **分析ダッシュボード** - Analytics モデルを活用したユーザー行動分析

---

**Phase 6.0 MongoDB拡張スキーマ - DryRunテスト完了・本番マイグレーション準備完了** 🎉