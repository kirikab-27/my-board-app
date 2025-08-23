import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';

/**
 * 画像URLからハッシュを計算するプロキシAPI
 * CORS制限を回避するためにサーバーサイドで処理
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URLが必要です' },
        { status: 400 }
      );
    }

    // CloudinaryのURLか確認（セキュリティ制限）
    if (!url.includes('res.cloudinary.com') && !url.includes('cloudinary.com')) {
      return NextResponse.json(
        { error: 'Cloudinary URLのみサポートされています' },
        { status: 400 }
      );
    }

    console.log('🌐 サーバーサイド画像ハッシュ計算開始:', url);

    // サーバーサイドで画像をfetch
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'BoardApp/1.0'
      }
    });

    if (!response.ok) {
      console.error('❌ 画像取得エラー:', response.status, response.statusText);
      return NextResponse.json(
        { error: `画像の取得に失敗しました: ${response.status}` },
        { status: 400 }
      );
    }

    // ArrayBufferとして画像データを取得
    const arrayBuffer = await response.arrayBuffer();
    
    // SHA-256ハッシュを計算
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

    console.log('✅ サーバーサイド画像ハッシュ計算完了:', {
      url: url.substring(0, 50) + '...',
      size: arrayBuffer.byteLength,
      hash: hashHex.substring(0, 16) + '...'
    });

    return NextResponse.json({
      hash: hashHex,
      size: arrayBuffer.byteLength,
      url: url
    });

  } catch (error) {
    console.error('❌ サーバーサイド画像ハッシュ計算エラー:', error);
    return NextResponse.json(
      { 
        error: '画像ハッシュ計算に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}