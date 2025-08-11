import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import mongoose from 'mongoose';
import { 
  requireApiAuth, 
  checkUserPermission,
  createUnauthorizedResponse, 
  createForbiddenResponse,
  createServerErrorResponse 
} from '@/lib/auth/server';
import { sanitizePlainText, detectXSSAttempt } from '@/utils/security/sanitizer';
import { logXSSAttempt } from '@/lib/security/audit-logger';
import { validateObjectId, sanitizeUpdateObject } from '@/lib/security/input-validation';

// 投稿詳細取得（GET /api/posts/[id]）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // ObjectID の検証強化
    if (!validateObjectId(id)) {
      console.warn('🚨 無効なObjectID検出:', { id, ip: request.ip });
      return NextResponse.json(
        { error: '無効な投稿IDです' },
        { status: 400 }
      );
    }

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    console.log('✅ 投稿詳細取得成功:', { 
      postId: post._id,
      title: post.title || '(タイトルなし)',
      authorName: post.authorName || '匿名ユーザー'
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('❌ 投稿詳細取得エラー:', error);
    return createServerErrorResponse('投稿の取得に失敗しました');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証確認
    const { user } = await requireApiAuth(request);
    console.log('✅ 認証ユーザー投稿編集:', user.email, user.name);
    
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const { title, content, isPublic } = body;

    // ObjectID の検証強化
    if (!validateObjectId(id)) {
      console.warn('🚨 無効なObjectID検出（PUT）:', { id, ip: request.ip });
      return NextResponse.json(
        { error: '無効な投稿IDです' },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: '投稿内容を入力してください' },
        { status: 400 }
      );
    }

    // XSS攻撃の検出
    if (detectXSSAttempt(content) || (title && detectXSSAttempt(title))) {
      console.warn('🚨 XSS攻撃を検出（編集）:', { 
        userId: user.id, 
        email: user.email,
        postId: id,
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

    // 投稿の存在確認と本人確認
    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // 投稿者本人確認
    if (!checkUserPermission(user.id, existingPost.userId)) {
      console.log('🚫 編集権限なし:', { 
        userId: user.id, 
        postUserId: existingPost.userId,
        postId: id 
      });
      return createForbiddenResponse('この投稿を編集する権限がありません');
    }

    // 編集内容の構築（サニタイズ済みデータ使用）
    const sanitizedTitle = title !== undefined ? sanitizePlainText(title.trim()) : undefined;
    const sanitizedContent = sanitizePlainText(content.trim());
    
    const updateData: any = { 
      content: sanitizedContent,
      authorName: user.name || '匿名ユーザー' // 名前が更新された場合に対応
    };

    // サニタイズされたタイトルが指定されている場合のみ更新
    if (sanitizedTitle !== undefined) {
      updateData.title = sanitizedTitle;
    }
    
    // isPublicが指定されている場合のみ更新
    if (typeof isPublic === 'boolean') {
      updateData.isPublic = isPublic;
    }

    const post = await Post.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ 投稿編集成功:', { 
      postId: post._id, 
      userId: user.id, 
      authorName: user.name,
      isPublic: post.isPublic 
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('❌ 投稿編集エラー:', error);
    
    // 認証エラーの場合
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return createUnauthorizedResponse('投稿を編集するにはログインが必要です');
    }
    
    return createServerErrorResponse('投稿の更新に失敗しました');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証確認
    const { user } = await requireApiAuth(request);
    console.log('✅ 認証ユーザー投稿削除:', user.email, user.name);
    
    await dbConnect();
    const { id } = await params;

    // ObjectID の検証強化
    if (!validateObjectId(id)) {
      console.warn('🚨 無効なObjectID検出（DELETE）:', { id, ip: request.ip });
      return NextResponse.json(
        { error: '無効な投稿IDです' },
        { status: 400 }
      );
    }

    // 投稿の存在確認と本人確認
    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return NextResponse.json(
        { error: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    // 投稿者本人確認
    if (!checkUserPermission(user.id, existingPost.userId)) {
      console.log('🚫 削除権限なし:', { 
        userId: user.id, 
        postUserId: existingPost.userId,
        postId: id 
      });
      return createForbiddenResponse('この投稿を削除する権限がありません');
    }

    const post = await Post.findByIdAndDelete(id);

    console.log('✅ 投稿削除成功:', { 
      postId: post._id, 
      userId: user.id, 
      authorName: user.name
    });

    return NextResponse.json({ message: '投稿を削除しました' });
  } catch (error) {
    console.error('❌ 投稿削除エラー:', error);
    
    // 認証エラーの場合
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return createUnauthorizedResponse('投稿を削除するにはログインが必要です');
    }
    
    return createServerErrorResponse('投稿の削除に失敗しました');
  }
}