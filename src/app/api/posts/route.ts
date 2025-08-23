import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import Hashtag from '@/models/Hashtag';
import { requireApiAuth, createUnauthorizedResponse, createServerErrorResponse } from '@/lib/auth/server';
import { sanitizePlainText, detectXSSAttempt } from '@/utils/security/sanitizer';
import { logXSSAttempt } from '@/lib/security/audit-logger';
import { 
  validatePaginationParams, 
  validateSortParam, 
  sanitizeSearchQuery 
} from '@/lib/security/input-validation';

// ハッシュタグ処理関数
async function processHashtags(hashtags: string[], userId: string, userName: string) {
  try {
    for (const tagName of hashtags) {
      let hashtag = await Hashtag.findOne({ name: tagName });
      
      if (!hashtag) {
        // 新規ハッシュタグ作成
        hashtag = new Hashtag({
          name: tagName,
          displayName: tagName,
          category: 'general',
          createdBy: userId,
          creatorName: userName,
          stats: {
            totalPosts: 1,
            totalComments: 0,
            uniqueUsers: 1,
            weeklyGrowth: 0,
            monthlyGrowth: 0,
            trendScore: 0,
            lastUsed: new Date(),
            dailyStats: [{
              date: new Date(),
              postCount: 1,
              commentCount: 0,
              uniqueUsers: 1,
              engagementScore: 0
            }]
          }
        });
      } else {
        // 既存ハッシュタグの統計更新
        hashtag.stats.totalPosts += 1;
        hashtag.stats.lastUsed = new Date();
        
        // 日別統計更新
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayStatIndex = hashtag.stats.dailyStats.findIndex(
          (stat: any) => stat.date.getTime() === today.getTime()
        );
        
        if (todayStatIndex >= 0) {
          hashtag.stats.dailyStats[todayStatIndex].postCount += 1;
        } else {
          hashtag.stats.dailyStats.push({
            date: today,
            postCount: 1,
            commentCount: 0,
            uniqueUsers: 1,
            engagementScore: 0
          });
        }
        
        // 古い統計データ削除（30日間のみ保持）
        hashtag.stats.dailyStats = hashtag.stats.dailyStats
          .sort((a: any, b: any) => b.date.getTime() - a.date.getTime())
          .slice(0, 30);
      }
      
      await hashtag.save();
    }
  } catch (error) {
    console.error('ハッシュタグ処理エラー:', error);
    // ハッシュタグ処理の失敗は投稿の作成を妨げない
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const rawPage = searchParams.get('page');
    const rawLimit = searchParams.get('limit');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const searchQuery = searchParams.get('search');
    
    // ページネーションパラメータの検証とサニタイゼーション
    const { page, limit, valid: paginationValid } = validatePaginationParams(rawPage, rawLimit);
    
    if (!paginationValid) {
      return NextResponse.json(
        { error: 'ページ番号と取得件数は1以上の整数である必要があります（取得件数は100以下）' },
        { status: 400 }
      );
    }
    
    // ソート条件の検証
    const validSortFields = ['createdAt', 'updatedAt', 'likes'];
    const validSortOrders = ['asc', 'desc'];
    
    if (!validateSortParam(sortBy, validSortFields)) {
      return NextResponse.json(
        { error: '無効なソートフィールドです' },
        { status: 400 }
      );
    }
    
    if (!validSortOrders.includes(sortOrder)) {
      return NextResponse.json(
        { error: '無効なソート順です' },
        { status: 400 }
      );
    }
    
    // 検索クエリのサニタイゼーション
    const sanitizedSearch = searchQuery ? sanitizeSearchQuery(searchQuery) : null;
    
    // ソート条件の構築
    const sortOptions: { [key: string]: 1 | -1 } = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // 検索条件の構築
    const searchFilter: Record<string, unknown> = {};
    if (sanitizedSearch) {
      searchFilter.content = { 
        $regex: sanitizedSearch, 
        $options: 'i' 
      };
    }
    
    // 投稿フィルタリング：権限ベースアクセス制御
    // セッション情報を取得
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth/nextauth');
    const session = await getServerSession(authOptions);
    
    const currentUserId = session?.user?.id;
    const currentUserRole = session?.user ? (session.user as { role?: string }).role : null;
    
    // 管理者投稿の表示制御
    if (currentUserRole === 'admin') {
      // 管理者：すべての投稿を表示（管理者・一般ユーザー問わず）
      if (currentUserId) {
        searchFilter.$or = [
          { isPublic: true },  // 公開投稿
          { userId: currentUserId }  // 自分の投稿（公開・非公開問わず）
        ];
      } else {
        searchFilter.isPublic = true;
      }
    } else {
      // 一般ユーザー・未認証ユーザー：管理者投稿を除外
      const baseFilter = { authorRole: { $ne: 'admin' } };  // 管理者投稿除外
      
      if (currentUserId) {
        searchFilter.$and = [
          baseFilter,
          {
            $or: [
              { isPublic: true },  // 公開投稿（一般ユーザーのみ）
              { userId: currentUserId }  // 自分の投稿（公開・非公開問わず）
            ]
          }
        ];
      } else {
        // 未認証ユーザー：一般ユーザーの公開投稿のみ
        searchFilter.$and = [
          baseFilter,
          { isPublic: true }
        ];
      }
    }
    
    // ページネーション計算
    const skip = (page - 1) * limit;
    
    // データ取得（NoSQLインジェクション対策済みフィルタ使用）
    const [posts, totalCount] = await Promise.all([
      Post.find(searchFilter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(searchFilter)
    ]);

    // 各投稿のコメント件数を取得
    const postsWithCommentCounts = await Promise.all(
      posts.map(async (post: any) => {
        const commentCount = await Comment.countDocuments({ postId: post._id });
        return {
          ...post,
          commentsCount: commentCount
        };
      })
    );
    
    // ページネーション情報
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      posts: postsWithCommentCounts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 認証確認
    const { user } = await requireApiAuth(request);
    console.log('✅ 認証ユーザー投稿作成:', user.email, user.name);
    
    await dbConnect();
    const body = await request.json();
    const { title, content, hashtags = [], media = [], isPublic = true } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: '投稿内容を入力してください' },
        { status: 400 }
      );
    }

    // XSS攻撃の検出
    if (detectXSSAttempt(content) || (title && detectXSSAttempt(title))) {
      console.warn('🚨 XSS攻撃を検出:', { 
        userId: user.id, 
        email: user.email,
        content: content.substring(0, 100),
        title: title?.substring(0, 50)
      });
      
      // セキュリティ監査ログに記録
      await logXSSAttempt(request, title ? `${title}\n${content}` : content, user.id);
      
      return NextResponse.json(
        { error: '不正なコンテンツが検出されました' },
        { status: 400 }
      );
    }

    if (title && title.length > 100) {
      return NextResponse.json(
        { error: 'タイトルは100文字以内で入力してください' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: '投稿は1000文字以内で入力してください' },
        { status: 400 }
      );
    }

    // 入力のサニタイゼーション
    const sanitizedTitle = title ? sanitizePlainText(title.trim()) : undefined;
    const sanitizedContent = sanitizePlainText(content.trim());
    
    // ハッシュタグのバリデーションとサニタイゼーション
    let processedHashtags: string[] = [];
    if (hashtags && Array.isArray(hashtags)) {
      processedHashtags = hashtags
        .filter(tag => typeof tag === 'string')
        .map(tag => tag.toLowerCase().replace(/^#/, '').trim())
        .filter(tag => /^[a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/.test(tag))
        .filter(tag => tag.length >= 1 && tag.length <= 50)
        .slice(0, 10); // 最大10個
    }

    // コンテンツとタイトルからもハッシュタグを自動抽出
    const text = `${sanitizedTitle || ''} ${sanitizedContent}`;
    const hashtagRegex = /#([a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+)/g;
    const extractedHashtags = [];
    let match;
    while ((match = hashtagRegex.exec(text)) !== null) {
      const tag = match[1].toLowerCase();
      if (tag.length >= 1 && tag.length <= 50 && !processedHashtags.includes(tag)) {
        extractedHashtags.push(tag);
      }
    }
    
    // 手動入力 + 自動抽出を統合（重複排除）
    const finalHashtags = [...new Set([...processedHashtags, ...extractedHashtags])].slice(0, 10);

    // 認証ユーザーの重複投稿チェック（ユーザー別・5分以内）
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const duplicatePost = await Post.findOne({
      userId: user.id,
      content: sanitizedContent,
      createdAt: { $gte: fiveMinutesAgo }
    });

    if (duplicatePost) {
      return NextResponse.json(
        { error: '同じ内容の投稿が5分以内に既に投稿されています' },
        { status: 409 }
      );
    }

    // 認証ユーザー情報付きで投稿作成（サニタイズ済みデータ使用）
    const postData: Record<string, unknown> = { 
      content: sanitizedContent,
      userId: user.id,
      authorName: user.name || '匿名ユーザー',
      authorRole: (user as { role?: string }).role || 'user', // ユーザーの役割を設定
      isPublic: Boolean(isPublic)
    };

    // サニタイズされたタイトルが存在する場合のみ追加
    if (sanitizedTitle && sanitizedTitle.length > 0) {
      postData.title = sanitizedTitle;
    }
    
    // ハッシュタグを追加
    if (finalHashtags.length > 0) {
      postData.hashtags = finalHashtags;
    }
    
    // メディアを追加
    if (media && media.length > 0) {
      postData.media = media.map((m: any) => ({
        mediaId: m.id,
        type: m.type,
        url: m.url,
        thumbnailUrl: m.thumbnailUrl,
        publicId: m.publicId || '',
        title: m.title || '',
        alt: m.alt || '',
        width: m.metadata?.width,
        height: m.metadata?.height,
        size: m.size || 0,
        mimeType: m.metadata?.mimeType || '',
        hash: m.metadata?.hash // SHA-256 ハッシュ値（重複防止用）
      }));
    }

    const post = new Post(postData);
    await post.save();

    // ハッシュタグモデルの作成・更新
    if (finalHashtags.length > 0) {
      await processHashtags(finalHashtags, user.id, user.name || '匿名ユーザー');
    }

    console.log('✅ 投稿作成成功:', { 
      postId: post._id, 
      title: post.title || '(タイトルなし)',
      userId: user.id, 
      authorName: user.name,
      isPublic: isPublic,
      hashtags: finalHashtags
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('❌ 投稿作成エラー:', error);
    
    // 認証エラーの場合
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return createUnauthorizedResponse('投稿を作成するにはログインが必要です');
    }
    
    return createServerErrorResponse('投稿の作成に失敗しました');
  }
}