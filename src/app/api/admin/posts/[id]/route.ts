import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';

/**
 * 個別投稿管理API
 * Issue #59: 投稿管理システム（AI自動モデレーション）
 */

// PATCH: 投稿編集
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 管理者権限チェック
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;
    if (!session?.user || !['admin', 'moderator'].includes(userRole)) {
      return NextResponse.json(
        { success: false, message: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    await dbConnect();

    // 投稿更新
    const updatedPost = await Post.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    if (!updatedPost) {
      return NextResponse.json(
        { success: false, message: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    console.log('Admin API: 投稿編集', {
      adminId: (session.user as { id?: string })?.id || session.user?.email,
      postId: id,
      updates: Object.keys(body),
    });

    return NextResponse.json({
      success: true,
      data: updatedPost,
    });
  } catch (error) {
    console.error('Admin Post Edit Error:', error);
    return NextResponse.json(
      { success: false, message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// DELETE: 投稿削除
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 管理者権限チェック
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;
    if (!session?.user || userRole !== 'admin') {
      return NextResponse.json(
        { success: false, message: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    const { id } = params;

    await dbConnect();

    // 論理削除
    const deletedPost = await Post.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        isPublic: false,
      },
      { new: true }
    );

    if (!deletedPost) {
      return NextResponse.json(
        { success: false, message: '投稿が見つかりません' },
        { status: 404 }
      );
    }

    console.log('Admin API: 投稿削除', {
      adminId: (session.user as { id?: string })?.id || session.user?.email,
      postId: id,
    });

    return NextResponse.json({
      success: true,
      message: '投稿を削除しました',
    });
  } catch (error) {
    console.error('Admin Post Delete Error:', error);
    return NextResponse.json(
      { success: false, message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
