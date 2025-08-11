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
    const { content, isPublic } = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
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

    if (content.length > 200) {
      return NextResponse.json(
        { error: '投稿は200文字以内で入力してください' },
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

    // 編集内容の構築
    const updateData: any = { 
      content: content.trim(),
      authorName: user.name || '匿名ユーザー' // 名前が更新された場合に対応
    };
    
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
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