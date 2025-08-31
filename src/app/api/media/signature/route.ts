import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { generateSignature } from '@/lib/cloudinary';
import { v4 as uuidv4 } from 'uuid';

// Vercel Runtime設定: Edge Runtimeでnode:cryptoが制限されるため、Node.js Runtimeを強制
export const runtime = 'nodejs';

/**
 * Cloudinary署名付きアップロードのための署名を生成
 * クライアントから直接Cloudinaryにアップロード可能
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { type = 'image' } = await request.json();

    // Cloudinary環境変数チェック（詳細デバッグ情報付き）
    const cloudinaryConfig = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    };

    console.log('🔍 Cloudinary環境変数確認:', {
      cloudName: cloudinaryConfig.cloudName ? '設定済み' : '未設定',
      apiKey: cloudinaryConfig.apiKey ? '設定済み' : '未設定',
      apiSecret: cloudinaryConfig.apiSecret ? '設定済み' : '未設定',
      isDefaultValue: cloudinaryConfig.cloudName === 'your_cloud_name_here'
    });

    if (
      !cloudinaryConfig.cloudName ||
      !cloudinaryConfig.apiKey ||
      !cloudinaryConfig.apiSecret ||
      cloudinaryConfig.cloudName === 'your_cloud_name_here'
    ) {
      console.error('❌ Cloudinary設定エラー:', {
        missingCloudName: !cloudinaryConfig.cloudName,
        missingApiKey: !cloudinaryConfig.apiKey,
        missingApiSecret: !cloudinaryConfig.apiSecret,
        isDefaultValue: cloudinaryConfig.cloudName === 'your_cloud_name_here'
      });

      return NextResponse.json(
        {
          error: 'Cloudinary直接アップロードが利用できません',
          message: 'フォールバック機能により、内部API経由でアップロードを継続します',
          details: 'Cloudinary環境変数（CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET）をVercel環境で設定してください',
          fallbackAvailable: true
        },
        { status: 503 }
      );
    }

    // 一意のpublicIdを生成
    const publicId = `${type}_${session.user.id}_${uuidv4()}`;
    const timestamp = Math.round(new Date().getTime() / 1000);

    // アップロードパラメータ（型安全対応）
    const uploadParams: {
      public_id: string;
      folder: string;
      timestamp: number;
      tags: string;
      overwrite: boolean;
      invalidate: boolean;
      transformation?: string;
      eager?: string;
    } = {
      public_id: publicId,
      folder: type === 'avatar' ? 'board-app/avatars' : 'board-app/images',
      timestamp: timestamp,
      tags: [session.user.id, type].join(','),
      overwrite: false,
      invalidate: true,
    };

    // 設定に基づく変換を追加
    if (type === 'avatar') {
      uploadParams.transformation = 'w_400,h_400,c_fill,g_face,q_auto:good';
      uploadParams.eager = 'w_50,h_50,c_fill,g_face,q_auto|w_100,h_100,c_fill,g_face,q_auto|w_200,h_200,c_fill,g_face,q_auto';
    } else if (type === 'image') {
      uploadParams.transformation = 'w_1920,h_1080,c_limit,q_auto:good';
      uploadParams.eager = 'w_150,h_150,c_thumb,q_auto|w_800,h_600,c_limit,q_auto';
    }

    // 署名を生成
    const signature = generateSignature(uploadParams);

    // クライアントが使用する署名付きアップロード情報を返す
    return NextResponse.json({
      signature,
      timestamp,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      public_id: publicId,
      folder: uploadParams.folder,
      tags: uploadParams.tags,
      transformation: uploadParams.transformation,
      eager: uploadParams.eager,
      eager_async: true,
      overwrite: false,
      invalidate: true,
    });
  } catch (error) {
    console.error('Cloudinary署名生成エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}