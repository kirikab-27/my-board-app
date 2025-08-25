'use server';

import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import { cache } from 'react';
import { SortOrder } from 'mongoose';

// Phase 5: Server Component Serialization Utility
// MongoDB ObjectIDと日付オブジェクトを安全にシリアライズ（読み取り専用オブジェクト対応）
const serializeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeObject(item));
  }

  if (typeof obj === 'object') {
    // Date オブジェクトの ISO文字列化
    if (obj instanceof Date) {
      return obj.toISOString();
    }

    // 新しいオブジェクトを作成して再帰的に処理（読み取り専用プロパティ対応）
    const serialized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // MongoDB ObjectID の特別処理
        if (key === '_id' && obj[key] && typeof obj[key].toString === 'function') {
          serialized[key] = obj[key].toString();
        } else {
          serialized[key] = serializeObject(obj[key]);
        }
      }
    }
    return serialized;
  }

  return obj;
};

// Phase 5: ISR Initial Data Fetching - 掲示板初期データ取得最適化
// ISRキャッシュ機能付きで初期投稿データを取得（1,420ms → 改善対象）

interface BoardData {
  posts: any[];
  totalCount: number;
  hasMore: boolean;
}

// React cache() でサーバー側データキャッシュ
export const getBoardInitialData = cache(async (limit = 20): Promise<BoardData> => {
  try {
    await dbConnect();

    const query: Record<string, unknown> = {
      isPublic: { $ne: false } // 公開投稿のみ
    };

    const sortOptions: Record<string, SortOrder> = { _id: -1 as SortOrder }; // 最新順

    // 初期データを限られた件数で高速取得
    const [posts, totalCount] = await Promise.all([
      Post.find(query)
        .sort(sortOptions)
        .limit(limit)
        .populate('userId', 'name email avatar username displayName')
        .lean()
        .exec(),
      Post.countDocuments(query)
    ]);

    // コメント件数を効率的に取得・完全シリアライズ処理
    const postsWithCommentCounts = await Promise.all(
      posts.map(async (post: any) => {
        const commentCount = await Comment.countDocuments({ postId: post._id });
        
        // 投稿データの完全シリアライズ処理
        const serializedPost = serializeObject({
          ...post,
          commentsCount: commentCount
        });

        return serializedPost;
      })
    );

    return {
      posts: postsWithCommentCounts,
      totalCount,
      hasMore: totalCount > limit
    };

  } catch (error) {
    console.error('初期データ取得エラー:', error);
    return {
      posts: [],
      totalCount: 0,
      hasMore: false
    };
  }
});

// Phase 5: メタデータ最適化 - SEO・OGP最適化
export const getBoardMetadata = cache(async () => {
  try {
    await dbConnect();
    
    // 総投稿数とアクティブユーザー統計を取得
    const [totalPosts, recentPosts] = await Promise.all([
      Post.countDocuments({ isPublic: { $ne: false } }),
      Post.find({ isPublic: { $ne: false } })
        .sort({ _id: -1 })
        .limit(5)
        .select('title content authorName createdAt')
        .lean()
    ]);

    // OGP用の説明文を動的生成
    const latestTitle = recentPosts[0]?.title || '';
    const description = latestTitle 
      ? `最新投稿「${latestTitle}」など${totalPosts}件の投稿`
      : `${totalPosts}件の投稿が掲載されています`;

    return {
      title: '掲示板 - みんなの投稿',
      description,
      totalPosts,
      lastUpdated: recentPosts[0]?.createdAt || new Date()
    };
  } catch (error) {
    console.error('メタデータ取得エラー:', error);
    return {
      title: '掲示板',
      description: 'みんなの投稿を見てみましょう',
      totalPosts: 0,
      lastUpdated: new Date()
    };
  }
});