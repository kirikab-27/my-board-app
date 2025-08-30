import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import cloudinary, { validateFile, uploadConfig } from '@/lib/cloudinary';
import Media from '@/models/Media';
import dbConnect from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

// Vercel Runtime設定: Edge Runtimeでmultipart/form-dataが制限されるため、Node.js Runtimeを強制
export const runtime = 'nodejs';

// アップロード制限
const RATE_LIMIT_WINDOW = 60 * 1000; // 1分
const RATE_LIMIT_MAX_UPLOADS = 5; // 1分間に5回まで

// アップロード履歴管理（本番ではRedis推奨）
const uploadHistory = new Map<string, number[]>();

// レート制限チェック
const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const userHistory = uploadHistory.get(userId) || [];

  // 古い履歴を削除
  const recentHistory = userHistory.filter((time) => now - time < RATE_LIMIT_WINDOW);

  if (recentHistory.length >= RATE_LIMIT_MAX_UPLOADS) {
    return false;
  }

  recentHistory.push(now);
  uploadHistory.set(userId, recentHistory);
  return true;
};

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // レート制限チェック
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: 'アップロード制限に達しました。しばらくお待ちください。' },
        { status: 429 }
      );
    }

    // DB接続
    await dbConnect();

    // FormDataを取得
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as 'image' | 'video' | 'avatar';
    const title = formData.get('title') as string;
    const alt = formData.get('alt') as string;
    const description = formData.get('description') as string;
    const hash = formData.get('hash') as string; // 元ファイルハッシュ

    console.log('🔧 デバッグ: 受信データ:', {
      fileName: file?.name,
      fileSize: file?.size,
      hasHash: !!hash,
      hashPreview: hash ? hash.substring(0, 16) + '...' : 'なし',
      hashLength: hash ? hash.length : 0,
      hashType: typeof hash,
      rawHash: hash,
    });

    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 });
    }

    // ファイルバリデーション
    const validation = validateFile(file, type || 'image');
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // ファイルをBufferに変換
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 一意のpublicIdを生成
    const publicId = `${type || 'image'}_${session.user.id}_${uuidv4()}`;

    // Cloudinary環境変数チェック
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name_here'
    ) {
      return NextResponse.json(
        {
          error: 'Cloudinary設定が未完了です。実際のCloudinary認証情報を設定してください。',
          details:
            'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRETを設定してください。',
        },
        { status: 503 }
      );
    }

    // Cloudinaryにアップロード
    const uploadPromise = new Promise((resolve, reject) => {
      const config = uploadConfig[type || 'image'];

      cloudinary.uploader
        .upload_stream(
          {
            public_id: publicId,
            folder: config.folder,
            resource_type: config.resource_type,
            ...(config.transformation && { transformation: config.transformation }),
            eager: config.eager,
            eager_async: config.eager_async,
            overwrite: config.overwrite,
            invalidate: config.invalidate,
            tags: [session.user.id, type || 'image'],
            context: hash ? `originalHash=${hash}` : undefined, // 元ファイルハッシュをメタデータとして保存
          },
          async (error, result) => {
            if (error) {
              console.error('Cloudinaryアップロードエラー:', error);
              reject(error);
            } else if (result) {
              try {
                // Cloudinary結果をログ出力（デバッグ用）
                console.log('✅ Cloudinary結果:', {
                  public_id: result.public_id,
                  url: result.url,
                  secure_url: result.secure_url,
                  version: result.version,
                  signature: result.signature,
                  format: result.format,
                  resource_type: result.resource_type,
                  width: result.width,
                  height: result.height,
                  bytes: result.bytes,
                });

                // URL検証
                if (!result.url || !result.secure_url) {
                  console.error('❌ Cloudinary URLが取得できません:', result);
                  reject(new Error('CloudinaryからURLが取得できませんでした'));
                  return;
                }

                // HTTPSかURLの検証
                if (!result.secure_url.startsWith('https://')) {
                  console.error('❌ secure_urlがHTTPSではありません:', result.secure_url);
                  reject(new Error('無効なCloudinary HTTPS URL'));
                  return;
                }

                // Cloudinaryアップロード成功後にMediaドキュメントを作成
                console.log('📝 Creating Media document with data:', {
                  type: file.type.startsWith('video/') ? 'video' : 'image',
                  status: 'ready',
                  filename: file.name,
                  size: file.size,
                  cloudinary: {
                    publicId: result.public_id,
                    version: result.version,
                    signature: result.signature,
                    url: result.url,
                    secureUrl: result.secure_url,
                  },
                });

                const media = new Media({
                  type: file.type.startsWith('video/') ? 'video' : 'image',
                  status: 'ready',
                  visibility: 'public',
                  filename: file.name,
                  size: file.size,
                  metadata: {
                    originalName: file.name,
                    mimeType: file.type,
                    fileExtension: file.name.split('.').pop()?.toLowerCase() || '',
                    width: result.width,
                    height: result.height,
                    duration: result.duration,
                    dominantColors: result.colors?.map((c: any[]) => c[0]) || [],
                    hash: hash && hash.trim() ? hash.trim() : undefined, // 元ファイルハッシュを保存
                  },
                  cloudinary: {
                    publicId: result.public_id,
                    version: result.version,
                    signature: result.signature,
                    url: result.url,
                    secureUrl: result.secure_url,
                    thumbnailUrl: result.eager?.[0]?.secure_url,
                    optimizedUrl: result.eager?.[1]?.secure_url,
                  },
                  uploadedBy: session.user.id,
                  uploaderName: session.user.name || 'Unknown',
                  title: title || file.name,
                  description: description || '',
                  alt: alt || file.name,
                  tags: [],
                  stats: {
                    views: 0,
                    downloads: 0,
                    shares: 0,
                    bandwidth: 0,
                    uniqueViewers: 0,
                    dailyViews: [],
                  },
                  security: {
                    isScanned: false,
                    isSafe: true,
                    threats: [],
                  },
                  uploadedAt: new Date(),
                });

                await media.save();

                console.log('💾 Mediaドキュメント保存完了:', {
                  mediaId: media._id,
                  hasHash: !!media.metadata.hash,
                  hashPreview: media.metadata.hash
                    ? media.metadata.hash.substring(0, 16) + '...'
                    : 'なし',
                  hashLength: media.metadata.hash ? media.metadata.hash.length : 0,
                  savedHash: media.metadata.hash,
                  cloudinaryContext: result.context || 'なし',
                });

                // セキュリティスキャン（非同期）
                media.scanForSecurity().catch(console.error);

                resolve({ result, media });
              } catch (saveError) {
                console.error('Media保存エラー:', saveError);
                reject(saveError);
              }
            }
          }
        )
        .end(buffer);
    });

    try {
      const uploadResult = (await uploadPromise) as { media: any };
      const { media } = uploadResult;

      // サムネイル生成
      await media.generateThumbnail();

      return NextResponse.json({
        success: true,
        media: {
          id: media._id,
          type: media.type,
          url: media.cloudinary.secureUrl,
          thumbnailUrl: media.cloudinary.thumbnailUrl,
          optimizedUrl: media.cloudinary.optimizedUrl,
          publicId: media.cloudinary.publicId,
          title: media.title,
          alt: media.alt,
          size: media.size,
          metadata: media.metadata,
        },
      });
    } catch (uploadError) {
      console.error('Cloudinaryアップロードエラー:', uploadError);
      return NextResponse.json({ error: 'ファイルのアップロードに失敗しました' }, { status: 500 });
    }
  } catch (error) {
    console.error('メディアアップロードエラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// GET: メディア一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');

    const query: any = {
      uploadedBy: session.user.id,
      status: 'ready',
    };

    if (type) {
      query.type = type;
    }

    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-security -stats.dailyViews');

    const total = await Media.countDocuments(query);

    return NextResponse.json({
      media,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error('メディア取得エラー:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
