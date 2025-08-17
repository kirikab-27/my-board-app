import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { requireApiAuth, createUnauthorizedResponse, createServerErrorResponse } from '@/lib/auth/server';
import { sanitizePlainText, detectXSSAttempt } from '@/utils/security/sanitizer';
import { logXSSAttempt } from '@/lib/security/audit-logger';
import { 
  validatePaginationParams, 
  validateSortParam, 
  sanitizeSearchQuery 
} from '@/lib/security/input-validation';

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
    
    // 管理者投稿は管理者以外から非表示
    // セッション情報を取得してユーザーロールをチェック
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth/nextauth');
    const session = await getServerSession(authOptions);
    
    const userRole = session?.user ? (session.user as { role?: string }).role : null;
    if (userRole !== 'admin') {
      searchFilter.authorRole = { $ne: 'admin' };
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
    
    // ページネーション情報
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      posts,
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
    const { title, content, isPublic = true } = body;

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

    const post = new Post(postData);
    await post.save();

    console.log('✅ 投稿作成成功:', { 
      postId: post._id, 
      title: post.title || '(タイトルなし)',
      userId: user.id, 
      authorName: user.name,
      isPublic: isPublic 
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