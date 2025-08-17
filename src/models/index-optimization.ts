/**
 * Phase 6.0 MongoDB インデックス設計・最適化
 * 
 * このファイルはSNSアプリケーションの全8モデルのインデックス戦略を
 * 包括的に定義し、パフォーマンス最適化を実現します。
 */

import mongoose from 'mongoose';

// インデックス作成関数の型定義
interface IndexDefinition {
  collection: string;
  name: string;
  index: Record<string, any>;
  options?: Record<string, any>;
  description: string;
  queryPattern: string;
  estimatedUsage: 'high' | 'medium' | 'low';
}

/**
 * SNSアプリケーション用最適化インデックス定義
 * 
 * パフォーマンス要件：
 * - タイムライン表示: < 100ms
 * - 検索機能: < 200ms
 * - 通知取得: < 50ms
 * - ユーザーフォロー関係: < 50ms
 */
export const OPTIMIZED_INDEXES: IndexDefinition[] = [
  
  // ==========================================
  // User Collection - ユーザー管理最適化
  // ==========================================
  {
    collection: 'users',
    name: 'user_login_lookup',
    index: { email: 1 },
    options: { unique: true, background: true },
    description: 'ログイン時のメール検索',
    queryPattern: 'User.findOne({ email })',
    estimatedUsage: 'high'
  },
  {
    collection: 'users',
    name: 'user_username_lookup',
    index: { username: 1 },
    options: { unique: true, background: true },
    description: 'ユーザー名検索・@メンション解決',
    queryPattern: 'User.findOne({ username })',
    estimatedUsage: 'high'
  },
  {
    collection: 'users',
    name: 'user_popular_active',
    index: { isPrivate: 1, 'stats.followersCount': -1, lastSeen: -1 },
    options: { background: true },
    description: '人気・アクティブユーザー検索',
    queryPattern: 'User.find({ isPrivate: false }).sort({ stats.followersCount: -1 })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'users',
    name: 'user_online_status',
    index: { isOnline: 1, lastSeen: -1 },
    options: { background: true },
    description: 'オンラインユーザー一覧・アクティビティ',
    queryPattern: 'User.find({ isOnline: true })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'users',
    name: 'user_role_verified',
    index: { role: 1, isVerified: 1, 'stats.followersCount': -1 },
    options: { background: true },
    description: '認証・ロール別ユーザー管理',
    queryPattern: 'User.find({ role: "admin", isVerified: true })',
    estimatedUsage: 'low'
  },
  {
    collection: 'users',
    name: 'user_text_search',
    index: { name: 'text', username: 'text', bio: 'text' },
    options: { 
      weights: { name: 3, username: 2, bio: 1 },
      background: true,
      name: 'user_search_index'
    },
    description: 'ユーザー検索・オートコンプリート',
    queryPattern: 'User.find({ $text: { $search: query } })',
    estimatedUsage: 'high'
  },

  // ==========================================
  // Post Collection - 投稿・タイムライン最適化
  // ==========================================
  {
    collection: 'posts',
    name: 'post_timeline_main',
    index: { isDeleted: 1, privacy: 1, createdAt: -1 },
    options: { background: true },
    description: 'メインタイムライン表示（最重要）',
    queryPattern: 'Post.find({ isDeleted: false, privacy: "public" }).sort({ createdAt: -1 })',
    estimatedUsage: 'high'
  },
  {
    collection: 'posts',
    name: 'post_user_timeline',
    index: { userId: 1, isDeleted: 1, createdAt: -1 },
    options: { background: true },
    description: 'ユーザー個別タイムライン',
    queryPattern: 'Post.find({ userId, isDeleted: false }).sort({ createdAt: -1 })',
    estimatedUsage: 'high'
  },
  {
    collection: 'posts',
    name: 'post_hashtag_timeline',
    index: { hashtags: 1, isDeleted: 1, createdAt: -1 },
    options: { background: true },
    description: 'ハッシュタグ別投稿表示',
    queryPattern: 'Post.find({ hashtags: tag, isDeleted: false }).sort({ createdAt: -1 })',
    estimatedUsage: 'high'
  },
  {
    collection: 'posts',
    name: 'post_popular_trending',
    index: { isDeleted: 1, 'stats.likes': -1, createdAt: -1 },
    options: { background: true },
    description: '人気投稿・トレンド表示',
    queryPattern: 'Post.find({ isDeleted: false }).sort({ stats.likes: -1 })',
    estimatedUsage: 'high'
  },
  {
    collection: 'posts',
    name: 'post_mentions_lookup',
    index: { 'mentions.userId': 1, isDeleted: 1, createdAt: -1 },
    options: { background: true },
    description: 'メンション通知・履歴表示',
    queryPattern: 'Post.find({ "mentions.userId": userId, isDeleted: false })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'posts',
    name: 'post_engagement_analysis',
    index: { type: 1, createdAt: -1, 'stats.likes': -1, 'stats.comments': -1 },
    options: { background: true },
    description: 'エンゲージメント分析',
    queryPattern: 'Post.find({ type: "post" }).sort({ stats.likes: -1 })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'posts',
    name: 'post_repost_chain',
    index: { originalPostId: 1, type: 1, isDeleted: 1 },
    options: { background: true },
    description: 'リポスト・引用チェーン追跡',
    queryPattern: 'Post.find({ originalPostId, type: "repost" })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'posts',
    name: 'post_location_search',
    index: { 'location.latitude': '2dsphere' },
    options: { background: true },
    description: '位置情報検索',
    queryPattern: 'Post.find({ location: { $near: coordinates } })',
    estimatedUsage: 'low'
  },
  {
    collection: 'posts',
    name: 'post_full_text_search',
    index: { title: 'text', content: 'text', hashtags: 'text' },
    options: { 
      weights: { title: 3, content: 2, hashtags: 1 },
      background: true,
      name: 'post_content_search'
    },
    description: '投稿内容検索',
    queryPattern: 'Post.find({ $text: { $search: query } })',
    estimatedUsage: 'high'
  },

  // ==========================================
  // Follow Collection - フォロー関係最適化
  // ==========================================
  {
    collection: 'follows',
    name: 'follow_relationship_unique',
    index: { follower: 1, following: 1 },
    options: { unique: true, background: true },
    description: 'フォロー関係の重複防止（最重要）',
    queryPattern: 'Follow.findOne({ follower, following })',
    estimatedUsage: 'high'
  },
  {
    collection: 'follows',
    name: 'follow_followers_list',
    index: { following: 1, isAccepted: 1, createdAt: -1 },
    options: { background: true },
    description: 'フォロワー一覧表示',
    queryPattern: 'Follow.find({ following: userId, isAccepted: true })',
    estimatedUsage: 'high'
  },
  {
    collection: 'follows',
    name: 'follow_following_list',
    index: { follower: 1, isAccepted: 1, createdAt: -1 },
    options: { background: true },
    description: 'フォロー中一覧表示',
    queryPattern: 'Follow.find({ follower: userId, isAccepted: true })',
    estimatedUsage: 'high'
  },
  {
    collection: 'follows',
    name: 'follow_pending_requests',
    index: { following: 1, isPending: 1, createdAt: -1 },
    options: { background: true },
    description: 'フォロー承認待ち一覧',
    queryPattern: 'Follow.find({ following: userId, isPending: true })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'follows',
    name: 'follow_status_management',
    index: { follower: 1, status: 1, lastInteractionAt: -1 },
    options: { background: true },
    description: 'フォロー状態管理・最近のやり取り',
    queryPattern: 'Follow.find({ follower: userId, status: "accepted" })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'follows',
    name: 'follow_stats_calculation',
    index: { following: 1, isAccepted: 1 },
    options: { background: true },
    description: 'フォロワー数計算用',
    queryPattern: 'Follow.countDocuments({ following: userId, isAccepted: true })',
    estimatedUsage: 'high'
  },

  // ==========================================
  // Comment Collection - コメントシステム最適化
  // ==========================================
  {
    collection: 'comments',
    name: 'comment_post_timeline',
    index: { postId: 1, isDeleted: 1, createdAt: 1 },
    options: { background: true },
    description: '投稿のコメント一覧表示（最重要）',
    queryPattern: 'Comment.find({ postId, isDeleted: false }).sort({ createdAt: 1 })',
    estimatedUsage: 'high'
  },
  {
    collection: 'comments',
    name: 'comment_thread_display',
    index: { threadId: 1, depth: 1, createdAt: 1 },
    options: { background: true },
    description: 'コメントスレッド表示',
    queryPattern: 'Comment.find({ threadId }).sort({ depth: 1, createdAt: 1 })',
    estimatedUsage: 'high'
  },
  {
    collection: 'comments',
    name: 'comment_reply_chain',
    index: { parentId: 1, isDeleted: 1, createdAt: 1 },
    options: { background: true },
    description: '返信チェーン表示',
    queryPattern: 'Comment.find({ parentId, isDeleted: false })',
    estimatedUsage: 'high'
  },
  {
    collection: 'comments',
    name: 'comment_user_activity',
    index: { userId: 1, isDeleted: 1, createdAt: -1 },
    options: { background: true },
    description: 'ユーザーのコメント履歴',
    queryPattern: 'Comment.find({ userId, isDeleted: false }).sort({ createdAt: -1 })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'comments',
    name: 'comment_mentions_notification',
    index: { 'mentions.userId': 1, isDeleted: 1, createdAt: -1 },
    options: { background: true },
    description: 'コメントメンション通知',
    queryPattern: 'Comment.find({ "mentions.userId": userId, isDeleted: false })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'comments',
    name: 'comment_moderation',
    index: { isHidden: 1, reportCount: -1, createdAt: -1 },
    options: { background: true },
    description: 'コメントモデレーション',
    queryPattern: 'Comment.find({ isHidden: true }).sort({ reportCount: -1 })',
    estimatedUsage: 'low'
  },
  {
    collection: 'comments',
    name: 'comment_hashtag_search',
    index: { hashtags: 1, isDeleted: 1, createdAt: -1 },
    options: { background: true },
    description: 'コメント内ハッシュタグ検索',
    queryPattern: 'Comment.find({ hashtags: tag, isDeleted: false })',
    estimatedUsage: 'low'
  },
  {
    collection: 'comments',
    name: 'comment_text_search',
    index: { content: 'text', hashtags: 'text' },
    options: { 
      weights: { content: 2, hashtags: 1 },
      background: true,
      name: 'comment_content_search'
    },
    description: 'コメント内容検索',
    queryPattern: 'Comment.find({ $text: { $search: query } })',
    estimatedUsage: 'medium'
  },

  // ==========================================
  // Notification Collection - 通知システム最適化
  // ==========================================
  {
    collection: 'notifications',
    name: 'notification_user_timeline',
    index: { userId: 1, isDeleted: 1, isHidden: 1, createdAt: -1 },
    options: { background: true },
    description: 'ユーザー通知一覧表示（最重要）',
    queryPattern: 'Notification.find({ userId, isDeleted: false, isHidden: false })',
    estimatedUsage: 'high'
  },
  {
    collection: 'notifications',
    name: 'notification_unread_count',
    index: { userId: 1, isRead: 1, isDeleted: 1, isHidden: 1 },
    options: { background: true },
    description: '未読通知数カウント',
    queryPattern: 'Notification.countDocuments({ userId, isRead: false, isDeleted: false })',
    estimatedUsage: 'high'
  },
  {
    collection: 'notifications',
    name: 'notification_type_filter',
    index: { userId: 1, type: 1, isRead: 1, createdAt: -1 },
    options: { background: true },
    description: '通知タイプ別フィルタリング',
    queryPattern: 'Notification.find({ userId, type: "like_post" })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'notifications',
    name: 'notification_batch_management',
    index: { isBatched: 1, 'batchInfo.batchId': 1 },
    options: { background: true },
    description: 'バッチ通知管理',
    queryPattern: 'Notification.find({ isBatched: true, "batchInfo.batchId": batchId })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'notifications',
    name: 'notification_priority_urgent',
    index: { userId: 1, priority: 1, isRead: 1, createdAt: -1 },
    options: { background: true },
    description: '優先度別通知表示',
    queryPattern: 'Notification.find({ userId, priority: "urgent", isRead: false })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'notifications',
    name: 'notification_auto_cleanup',
    index: { expiresAt: 1 },
    options: { expireAfterSeconds: 0, background: true },
    description: '期限切れ通知の自動削除',
    queryPattern: 'TTL Index for automatic cleanup',
    estimatedUsage: 'high'
  },

  // ==========================================
  // Hashtag Collection - ハッシュタグ・トレンド最適化
  // ==========================================
  {
    collection: 'hashtags',
    name: 'hashtag_name_lookup',
    index: { name: 1 },
    options: { unique: true, background: true },
    description: 'ハッシュタグ名検索（最重要）',
    queryPattern: 'Hashtag.findOne({ name })',
    estimatedUsage: 'high'
  },
  {
    collection: 'hashtags',
    name: 'hashtag_trending_rank',
    index: { isTrending: 1, 'stats.trendScore': -1, 'stats.totalPosts': -1 },
    options: { background: true },
    description: 'トレンドハッシュタグランキング',
    queryPattern: 'Hashtag.find({ isTrending: true }).sort({ stats.trendScore: -1 })',
    estimatedUsage: 'high'
  },
  {
    collection: 'hashtags',
    name: 'hashtag_category_popular',
    index: { category: 1, status: 1, 'stats.totalPosts': -1 },
    options: { background: true },
    description: 'カテゴリ別人気ハッシュタグ',
    queryPattern: 'Hashtag.find({ category, status: "active" }).sort({ stats.totalPosts: -1 })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'hashtags',
    name: 'hashtag_recent_activity',
    index: { status: 1, 'stats.lastUsed': -1 },
    options: { background: true },
    description: '最近使用されたハッシュタグ',
    queryPattern: 'Hashtag.find({ status: "active" }).sort({ stats.lastUsed: -1 })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'hashtags',
    name: 'hashtag_autocomplete',
    index: { 
      name: 'text', 
      displayName: 'text', 
      aliases: 'text', 
      searchTerms: 'text' 
    },
    options: { 
      weights: { name: 5, displayName: 4, aliases: 3, searchTerms: 2 },
      background: true,
      name: 'hashtag_search_index'
    },
    description: 'ハッシュタグオートコンプリート検索',
    queryPattern: 'Hashtag.find({ $text: { $search: query } })',
    estimatedUsage: 'high'
  },
  {
    collection: 'hashtags',
    name: 'hashtag_growth_analysis',
    index: { 'stats.weeklyGrowth': -1, 'stats.monthlyGrowth': -1 },
    options: { background: true },
    description: 'ハッシュタグ成長率分析',
    queryPattern: 'Hashtag.find().sort({ stats.weeklyGrowth: -1 })',
    estimatedUsage: 'low'
  },

  // ==========================================
  // Media Collection - メディア管理最適化
  // ==========================================
  {
    collection: 'media',
    name: 'media_cloudinary_lookup',
    index: { 'cloudinary.publicId': 1 },
    options: { unique: true, background: true },
    description: 'Cloudinary公開ID検索（最重要）',
    queryPattern: 'Media.findOne({ "cloudinary.publicId": publicId })',
    estimatedUsage: 'high'
  },
  {
    collection: 'media',
    name: 'media_user_gallery',
    index: { uploadedBy: 1, status: 1, type: 1, createdAt: -1 },
    options: { background: true },
    description: 'ユーザーメディアギャラリー',
    queryPattern: 'Media.find({ uploadedBy: userId, status: "ready" }).sort({ createdAt: -1 })',
    estimatedUsage: 'high'
  },
  {
    collection: 'media',
    name: 'media_public_browse',
    index: { visibility: 1, status: 1, type: 1, 'stats.views': -1 },
    options: { background: true },
    description: '公開メディア閲覧・人気順',
    queryPattern: 'Media.find({ visibility: "public", status: "ready" }).sort({ stats.views: -1 })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'media',
    name: 'media_usage_tracking',
    index: { usedInPosts: 1, usedInComments: 1, usedInProfiles: 1 },
    options: { background: true, sparse: true },
    description: 'メディア使用箇所追跡',
    queryPattern: 'Media.find({ usedInPosts: postId })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'media',
    name: 'media_cleanup_unused',
    index: { uploadedAt: 1, status: 1, usedInPosts: 1 },
    options: { background: true, sparse: true },
    description: '未使用メディアクリーンアップ',
    queryPattern: 'Media.find({ uploadedAt: { $lt: date }, usedInPosts: { $size: 0 } })',
    estimatedUsage: 'low'
  },
  {
    collection: 'media',
    name: 'media_auto_delete',
    index: { autoDeleteAt: 1 },
    options: { expireAfterSeconds: 0, background: true },
    description: 'メディア自動削除',
    queryPattern: 'TTL Index for automatic cleanup',
    estimatedUsage: 'medium'
  },
  {
    collection: 'media',
    name: 'media_text_search',
    index: { 
      filename: 'text', 
      title: 'text', 
      description: 'text', 
      alt: 'text', 
      tags: 'text' 
    },
    options: { 
      weights: { title: 3, filename: 2, tags: 2, alt: 1, description: 1 },
      background: true,
      name: 'media_content_search'
    },
    description: 'メディア内容検索',
    queryPattern: 'Media.find({ $text: { $search: query } })',
    estimatedUsage: 'medium'
  },

  // ==========================================
  // Analytics Collection - 分析データ最適化
  // ==========================================
  {
    collection: 'analytics',
    name: 'analytics_event_timeline',
    index: { eventType: 1, timestamp: -1 },
    options: { background: true },
    description: 'イベント別タイムライン分析',
    queryPattern: 'Analytics.find({ eventType }).sort({ timestamp: -1 })',
    estimatedUsage: 'high'
  },
  {
    collection: 'analytics',
    name: 'analytics_user_activity',
    index: { userId: 1, timestamp: -1 },
    options: { background: true, sparse: true },
    description: 'ユーザー行動分析',
    queryPattern: 'Analytics.find({ userId }).sort({ timestamp: -1 })',
    estimatedUsage: 'high'
  },
  {
    collection: 'analytics',
    name: 'analytics_session_tracking',
    index: { 'sessionInfo.sessionId': 1, timestamp: 1 },
    options: { background: true },
    description: 'セッション追跡',
    queryPattern: 'Analytics.find({ "sessionInfo.sessionId": sessionId })',
    estimatedUsage: 'high'
  },
  {
    collection: 'analytics',
    name: 'analytics_page_performance',
    index: { path: 1, eventType: 1, timestamp: -1 },
    options: { background: true },
    description: 'ページ別パフォーマンス分析',
    queryPattern: 'Analytics.find({ path, eventType: "page_view" })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'analytics',
    name: 'analytics_device_breakdown',
    index: { 'deviceInfo.deviceType': 1, 'deviceInfo.browser': 1, timestamp: -1 },
    options: { background: true },
    description: 'デバイス・ブラウザ別分析',
    queryPattern: 'Analytics.find({ "deviceInfo.deviceType": "mobile" })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'analytics',
    name: 'analytics_location_analysis',
    index: { 'locationInfo.country': 1, 'locationInfo.region': 1, timestamp: -1 },
    options: { background: true, sparse: true },
    description: '地域別分析',
    queryPattern: 'Analytics.find({ "locationInfo.country": "Japan" })',
    estimatedUsage: 'low'
  },
  {
    collection: 'analytics',
    name: 'analytics_error_monitoring',
    index: { eventType: 1, errorType: 1, timestamp: -1 },
    options: { background: true, sparse: true },
    description: 'エラー監視・分析',
    queryPattern: 'Analytics.find({ eventType: "error", errorType })',
    estimatedUsage: 'medium'
  },
  {
    collection: 'analytics',
    name: 'analytics_realtime_active',
    index: { timestamp: -1, anonymousId: 1 },
    options: { background: true },
    description: 'リアルタイムアクティブユーザー',
    queryPattern: 'Analytics.find({ timestamp: { $gte: cutoff } })',
    estimatedUsage: 'high'
  },
  {
    collection: 'analytics',
    name: 'analytics_auto_cleanup',
    index: { timestamp: 1 },
    options: { expireAfterSeconds: 365 * 24 * 60 * 60, background: true },
    description: '1年後の自動データ削除',
    queryPattern: 'TTL Index for automatic cleanup',
    estimatedUsage: 'high'
  }
];

/**
 * 全インデックスの作成実行
 */
export async function createAllIndexes(): Promise<void> {
  console.log('🚀 SNS Application - インデックス最適化開始');
  
  let created = 0;
  let errors = 0;
  
  for (const indexDef of OPTIMIZED_INDEXES) {
    try {
      const collection = mongoose.connection.collection(indexDef.collection);
      
      // インデックス存在チェック
      const existingIndexes = await collection.listIndexes().toArray();
      const indexExists = existingIndexes.some(idx => idx.name === indexDef.name);
      
      if (!indexExists) {
        await collection.createIndex(indexDef.index, {
          name: indexDef.name,
          ...indexDef.options
        });
        
        console.log(`✅ インデックス作成完了: ${indexDef.collection}.${indexDef.name}`);
        created++;
      } else {
        console.log(`⏭️  インデックス既存: ${indexDef.collection}.${indexDef.name}`);
      }
      
    } catch (error) {
      console.error(`❌ インデックス作成失敗: ${indexDef.collection}.${indexDef.name}`, error);
      errors++;
    }
  }
  
  console.log(`🎯 インデックス最適化完了 - 作成: ${created}, エラー: ${errors}, 総数: ${OPTIMIZED_INDEXES.length}`);
}

/**
 * インデックス使用統計の取得
 */
export async function getIndexStats(): Promise<any[]> {
  const stats: any[] = [];
  
  const collections = ['users', 'posts', 'follows', 'comments', 'notifications', 'hashtags', 'media', 'analytics'];
  
  for (const collectionName of collections) {
    try {
      const collection = mongoose.connection.collection(collectionName);
      const indexStats = await collection.aggregate([
        { $indexStats: {} }
      ]).toArray();
      
      stats.push({
        collection: collectionName,
        indexes: indexStats.map(stat => ({
          name: stat.name,
          usage: stat.accesses,
          size: stat.spec
        }))
      });
    } catch (error) {
      console.error(`インデックス統計取得失敗: ${collectionName}`, error);
    }
  }
  
  return stats;
}

/**
 * 未使用インデックスの検出
 */
export async function findUnusedIndexes(): Promise<any[]> {
  const unused: any[] = [];
  const stats = await getIndexStats();
  
  for (const collectionStat of stats) {
    for (const indexStat of collectionStat.indexes) {
      if (indexStat.usage.ops === 0 && indexStat.name !== '_id_') {
        unused.push({
          collection: collectionStat.collection,
          index: indexStat.name
        });
      }
    }
  }
  
  return unused;
}

/**
 * インデックスサイズ分析
 */
export async function analyzeIndexSizes(): Promise<any[]> {
  const analysis: any[] = [];
  const collections = ['users', 'posts', 'follows', 'comments', 'notifications', 'hashtags', 'media', 'analytics'];
  
  for (const collectionName of collections) {
    try {
      const collection = mongoose.connection.collection(collectionName);
      const collStats = await collection.stats();
      
      analysis.push({
        collection: collectionName,
        totalSize: collStats.size,
        indexSize: collStats.totalIndexSize,
        indexRatio: (collStats.totalIndexSize / collStats.size * 100).toFixed(2) + '%',
        indexCount: collStats.nindexes,
        documentCount: collStats.count
      });
    } catch (error) {
      console.error(`サイズ分析失敗: ${collectionName}`, error);
    }
  }
  
  return analysis;
}

/**
 * パフォーマンス最適化レポート生成
 */
export async function generateOptimizationReport(): Promise<any> {
  console.log('📊 パフォーマンス最適化レポート生成中...');
  
  const indexStats = await getIndexStats();
  const unusedIndexes = await findUnusedIndexes();
  const sizeAnalysis = await analyzeIndexSizes();
  
  const report = {
    summary: {
      totalIndexes: OPTIMIZED_INDEXES.length,
      highUsageIndexes: OPTIMIZED_INDEXES.filter(idx => idx.estimatedUsage === 'high').length,
      mediumUsageIndexes: OPTIMIZED_INDEXES.filter(idx => idx.estimatedUsage === 'medium').length,
      lowUsageIndexes: OPTIMIZED_INDEXES.filter(idx => idx.estimatedUsage === 'low').length,
      unusedCount: unusedIndexes.length
    },
    performance: {
      timelineOptimization: '🚀 高速化（< 100ms目標）',
      searchOptimization: '🔍 検索最適化（< 200ms目標）',
      notificationOptimization: '🔔 通知高速化（< 50ms目標）'
    },
    recommendations: [
      unusedIndexes.length > 0 ? `⚠️  未使用インデックス ${unusedIndexes.length}個を削除検討` : '✅ 未使用インデックスなし',
      '📈 高使用率インデックスのパフォーマンス監視を継続',
      '🔄 定期的なインデックス統計分析を実施',
      '💾 インデックスサイズとストレージ使用量の最適化'
    ],
    indexStats,
    unusedIndexes,
    sizeAnalysis
  };
  
  console.log('✅ 最適化レポート生成完了');
  return report;
}

/**
 * 開発環境用インデックス作成スクリプト
 */
export async function setupDevelopmentIndexes(): Promise<void> {
  console.log('🔧 開発環境用インデックス設定開始...');
  
  // 高優先度インデックスのみ作成（開発効率重視）
  const highPriorityIndexes = OPTIMIZED_INDEXES.filter(idx => idx.estimatedUsage === 'high');
  
  for (const indexDef of highPriorityIndexes) {
    try {
      const collection = mongoose.connection.collection(indexDef.collection);
      await collection.createIndex(indexDef.index, {
        name: indexDef.name,
        background: false, // 開発環境では即座に作成
        ...indexDef.options
      });
      
      console.log(`⚡ 高優先度インデックス作成: ${indexDef.collection}.${indexDef.name}`);
    } catch (error) {
      console.error(`❌ インデックス作成失敗: ${indexDef.collection}.${indexDef.name}`, error);
    }
  }
  
  console.log('✅ 開発環境用インデックス設定完了');
}

export default {
  OPTIMIZED_INDEXES,
  createAllIndexes,
  getIndexStats,
  findUnusedIndexes,
  analyzeIndexSizes,
  generateOptimizationReport,
  setupDevelopmentIndexes
};