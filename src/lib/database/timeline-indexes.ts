import mongoose from 'mongoose';
import Post from '@/models/Post';
import Follow from '@/models/Follow';
import User from '@/models/User';

// タイムライン最適化インデックス設定
export async function createTimelineIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    
    console.log('タイムライン最適化インデックスを作成中...');
    
    // Posts Collection インデックス
    const PostModel = Post;
    
    // 1. タイムライン基本クエリ用複合インデックス（最重要）
    await PostModel.collection.createIndex(
      { 
        userId: 1, 
        isDeleted: 1, 
        isPublic: 1, 
        createdAt: -1 
      },
      { 
        name: 'timeline_basic_query',
        background: true,
        comment: 'タイムライン基本クエリ用（ユーザーID + 削除状態 + 公開設定 + 作成日時降順）'
      }
    );

    // 2. ページネーション最適化インデックス
    await PostModel.collection.createIndex(
      { 
        createdAt: -1, 
        _id: 1 
      },
      { 
        name: 'timeline_pagination',
        background: true,
        comment: 'カーソルベースページネーション用'
      }
    );

    // 3. いいね数順ソート用インデックス
    await PostModel.collection.createIndex(
      { 
        isDeleted: 1, 
        isPublic: 1, 
        likes: -1, 
        createdAt: -1 
      },
      { 
        name: 'posts_by_popularity',
        background: true,
        comment: 'いいね数順表示用'
      }
    );

    // 4. 特定ユーザーの投稿検索用
    await PostModel.collection.createIndex(
      { 
        userId: 1, 
        createdAt: -1 
      },
      { 
        name: 'user_posts_timeline',
        background: true,
        comment: '特定ユーザーの投稿一覧用'
      }
    );

    // 5. 全文検索用テキストインデックス
    await PostModel.collection.createIndex(
      { 
        title: 'text', 
        content: 'text' 
      },
      { 
        name: 'posts_text_search',
        background: true,
        weights: { title: 10, content: 5 },
        comment: '投稿内容全文検索用'
      }
    );

    // Follow Collection インデックス
    const FollowModel = Follow;

    // 6. フォロー関係検索最適化
    await FollowModel.collection.createIndex(
      { 
        follower: 1, 
        isAccepted: 1, 
        following: 1 
      },
      { 
        name: 'follow_relationship_lookup',
        background: true,
        comment: 'フォロー関係高速検索用'
      }
    );

    // 7. フォロワー一覧取得用
    await FollowModel.collection.createIndex(
      { 
        following: 1, 
        isAccepted: 1, 
        createdAt: -1 
      },
      { 
        name: 'followers_list',
        background: true,
        comment: 'フォロワー一覧取得用'
      }
    );

    // 8. フォロー中一覧取得用
    await FollowModel.collection.createIndex(
      { 
        follower: 1, 
        isAccepted: 1, 
        createdAt: -1 
      },
      { 
        name: 'following_list',
        background: true,
        comment: 'フォロー中一覧取得用'
      }
    );

    // 9. 相互フォロー判定用
    await FollowModel.collection.createIndex(
      { 
        follower: 1, 
        following: 1, 
        isAccepted: 1 
      },
      { 
        name: 'mutual_follow_check',
        background: true,
        unique: true,
        comment: '相互フォロー判定・重複防止用'
      }
    );

    // User Collection インデックス
    const UserModel = User;

    // 10. ユーザー検索最適化
    await UserModel.collection.createIndex(
      { 
        username: 1 
      },
      { 
        name: 'username_lookup',
        background: true,
        unique: true,
        sparse: true,
        comment: 'ユーザー名検索用'
      }
    );

    // 11. アクティブユーザー取得用
    await UserModel.collection.createIndex(
      { 
        lastActiveAt: -1, 
        isActive: 1 
      },
      { 
        name: 'active_users',
        background: true,
        comment: 'アクティブユーザー検索用'
      }
    );

    console.log('✅ タイムライン最適化インデックス作成完了');
    
    // インデックス使用状況の分析を実行
    await analyzeIndexUsage();
    
    return {
      success: true,
      indexesCreated: 11,
      message: 'タイムライン最適化インデックスが正常に作成されました'
    };
    
  } catch (error) {
    console.error('❌ インデックス作成エラー:', error);
    throw error;
  }
}

// インデックス使用状況分析
export async function analyzeIndexUsage() {
  try {
    console.log('インデックス使用状況を分析中...');
    
    const collections = ['posts', 'follows', 'users'];
    const analysis: Record<string, any> = {};
    
    for (const collectionName of collections) {
      const collection = mongoose.connection.collection(collectionName);
      
      // インデックス一覧取得
      const indexes = await collection.indexes();
      
      // インデックス統計取得
      const stats = await collection.aggregate([
        { $indexStats: {} }
      ]).toArray();
      
      analysis[collectionName] = {
        indexCount: indexes.length,
        indexes: indexes.map(idx => ({
          name: idx.name,
          key: idx.key,
          size: idx.size || 'N/A'
        })),
        usage: stats.map(stat => ({
          name: stat.name,
          ops: stat.accesses?.ops || 0,
          since: stat.accesses?.since || 'N/A'
        }))
      };
    }
    
    console.log('📊 インデックス分析結果:', JSON.stringify(analysis, null, 2));
    
    return analysis;
    
  } catch (error) {
    console.error('インデックス分析エラー:', error);
    return null;
  }
}

// タイムラインクエリパフォーマンステスト
export async function testTimelinePerformance(userId: string, limit = 20) {
  try {
    console.log('タイムラインパフォーマンステストを実行中...');
    
    // フォロー中のユーザーを取得
    const followStartTime = Date.now();
    const followedUsers = await Follow.find({
      follower: userId,
      isAccepted: true
    }).select('following').lean();
    const followTime = Date.now() - followStartTime;
    
    const targetUserIds = [userId, ...followedUsers.map(f => f.following)];
    
    // タイムライン集約クエリのパフォーマンステスト
    const timelineStartTime = Date.now();
    const timelinePosts = await Post.aggregate([
      {
        $match: {
          userId: { $in: targetUserIds },
          isDeleted: { $ne: true },
          isPublic: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'author',
          pipeline: [
            {
              $project: {
                name: 1,
                username: 1,
                avatar: 1
              }
            }
          ]
        }
      },
      {
        $addFields: {
          author: { $arrayElemAt: ['$author', 0] }
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: limit }
    ]).explain('executionStats');
    
    const timelineTime = Date.now() - timelineStartTime;
    
    // パフォーマンス結果
    const performance = {
      followLookupTime: followTime,
      timelineQueryTime: timelineTime,
      totalTime: followTime + timelineTime,
      targetUsers: targetUserIds.length,
      queryStats: {
        totalDocsExamined: timelinePosts.executionStats?.totalDocsExamined || 0,
        totalDocsReturned: timelinePosts.executionStats?.totalDocsReturned || 0,
        indexesUsed: timelinePosts.executionStats?.indexesUsed || []
      }
    };
    
    console.log('⚡ パフォーマンステスト結果:', performance);
    
    // パフォーマンス警告
    if (performance.totalTime > 1000) {
      console.warn('⚠️  タイムライン取得が1秒を超えています:', performance.totalTime + 'ms');
    }
    
    if (performance.queryStats.totalDocsExamined > performance.queryStats.totalDocsReturned * 10) {
      console.warn('⚠️  インデックス効率が悪い可能性があります');
    }
    
    return performance;
    
  } catch (error) {
    console.error('パフォーマンステストエラー:', error);
    throw error;
  }
}

// データベース接続とインデックス作成の便利関数
export async function optimizeTimelineDatabase() {
  try {
    await createTimelineIndexes();
    console.log('🚀 タイムラインデータベース最適化完了');
    return true;
  } catch (error) {
    console.error('❌ データベース最適化失敗:', error);
    return false;
  }
}