import { v2 as cloudinary } from 'cloudinary';

// Cloudinary設定
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// アップロード設定オプション
interface BaseUploadConfig {
  folder: string;
  allowed_formats: string[];
  max_file_size: number;
  eager: any[];
  eager_async: boolean;
  overwrite: boolean;
  invalidate: boolean;
  resource_type: 'image' | 'video';
  transformation?: any[];
}

export const uploadConfig: Record<string, BaseUploadConfig> = {
  // 画像のデフォルト設定
  image: {
    folder: 'board-app/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
    max_file_size: 5 * 1024 * 1024, // 5MB
    transformation: [{ width: 1920, height: 1080, crop: 'limit', quality: 'auto:good' }],
    eager: [
      { width: 150, height: 150, crop: 'thumb', gravity: 'auto', quality: 'auto' }, // サムネイル
      { width: 800, height: 600, crop: 'limit', quality: 'auto' }, // 中サイズ
    ],
    eager_async: true,
    overwrite: false,
    invalidate: true,
    resource_type: 'image' as const,
  },

  // 動画のデフォルト設定
  video: {
    folder: 'board-app/videos',
    allowed_formats: ['mp4', 'webm', 'mov', 'avi'],
    max_file_size: 50 * 1024 * 1024, // 50MB
    resource_type: 'video' as const,
    eager: [{ width: 300, height: 300, crop: 'pad', audio_codec: 'none' }],
    eager_async: true,
    overwrite: false,
    invalidate: true,
  },

  // プロフィール画像の設定
  avatar: {
    folder: 'board-app/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 5 * 1024 * 1024, // 5MB
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good' },
    ],
    eager: [
      { width: 50, height: 50, crop: 'thumb', gravity: 'face', quality: 'auto' }, // 小
      { width: 100, height: 100, crop: 'thumb', gravity: 'face', quality: 'auto' }, // 中
      { width: 200, height: 200, crop: 'thumb', gravity: 'face', quality: 'auto' }, // 大
    ],
    eager_async: true,
    overwrite: true,
    invalidate: true,
    resource_type: 'image' as const,
  },
};

// ファイル検証
export const validateFile = (
  file: File | Blob,
  type: 'image' | 'video' | 'avatar'
): { valid: boolean; error?: string } => {
  const config = uploadConfig[type];

  // ファイルサイズチェック
  if (file.size > config.max_file_size) {
    return {
      valid: false,
      error: `ファイルサイズは${config.max_file_size / (1024 * 1024)}MB以下にしてください`,
    };
  }

  // ファイル形式チェック
  const fileExtension = file.type.split('/')[1]?.toLowerCase();
  if (!fileExtension || !config.allowed_formats.includes(fileExtension)) {
    return {
      valid: false,
      error: `許可されているファイル形式: ${config.allowed_formats.join(', ')}`,
    };
  }

  return { valid: true };
};

// Cloudinaryアップロード用シグネチャ生成
export const generateSignature = async (params: Record<string, any>): Promise<string> => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = {
    timestamp,
    ...params,
  };

  // パラメータをアルファベット順にソート
  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key as keyof typeof paramsToSign]}`)
    .join('&');

  // SHA1ハッシュを生成
  const crypto = await import('crypto');
  const signature = crypto
    .createHash('sha1')
    .update(sortedParams + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');

  return signature;
};

// URLから変換オプションを生成
export const buildTransformationUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  }
): string => {
  const transformations = [];

  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);

  const transformationString = transformations.join(',');

  return cloudinary.url(publicId, {
    transformation: transformationString,
    secure: true,
  });
};

// Cloudinaryからファイル削除
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary削除エラー:', error);
    return false;
  }
};

export default cloudinary;
