'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  CloudUpload,
  Image as ImageIcon,
  Close,
  ZoomIn,
  DeleteOutline,
  PlayCircleOutline,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import OptimizedImage from '@/components/ui/OptimizedImage';

// アップロードされたメディアの型定義
export interface UploadedMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  optimizedUrl?: string;
  publicId: string;
  title: string;
  alt: string;
  size: number;
  metadata: {
    originalName: string;
    mimeType: string;
    width?: number;
    height?: number;
    duration?: number;
    hash?: string; // SHA-256 ハッシュ値
  };
}

interface MediaUploadProps {
  onUploadComplete: (media: UploadedMedia[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  acceptedTypes?: 'image' | 'video' | 'all';
  uploadType?: 'image' | 'video' | 'avatar';
  showPreview?: boolean;
  disabled?: boolean;
  initialMedia?: UploadedMedia[]; // 編集モードで既存メディアを設定
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  acceptedTypes = 'all',
  uploadType = 'image',
  showPreview = true,
  disabled = false,
  initialMedia = []
}) => {
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>(initialMedia);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewMedia, setPreviewMedia] = useState<UploadedMedia | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [editingMedia, setEditingMedia] = useState<UploadedMedia | null>(null);
  
  // 重複チェック関連の状態
  const [duplicateCheckDialog, setDuplicateCheckDialog] = useState<boolean>(false);
  const [duplicateFiles, setDuplicateFiles] = useState<{
    file: File;
    hash: string;
    existingMedia: UploadedMedia;
  }[]>([]);
  const [pendingUniqueFiles, setPendingUniqueFiles] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初期メディアの設定（マウント時のみ実行、onUploadCompleteは呼ばない）
  useEffect(() => {
    console.log('📸 MediaUpload初期化:', { 
      initialMediaCount: initialMedia?.length || 0,
      hasHashes: initialMedia?.some(m => m.metadata?.hash) || false
    });
    if (initialMedia && initialMedia.length > 0) {
      setUploadedMedia(initialMedia);
      // 初期メディアのハッシュ状況をログ出力
      initialMedia.forEach((media, index) => {
        console.log(`📸 初期メディア${index + 1}:`, {
          id: media.id,
          title: media.title,
          hasHash: !!media.metadata?.hash,
          hashPreview: media.metadata?.hash?.substring(0, 16) + '...' || 'なし'
        });
      });
    } else {
      // プロフィール編集など、初期メディアが空の場合
      setUploadedMedia([]);
    }
  }, []);

  // initialMediaが変更された場合のみ更新（onUploadCompleteは呼ばない）
  useEffect(() => {
    // 初期メディアが空の場合、何もしない（プロフィール編集など）
    if (!initialMedia || initialMedia.length === 0) return;
    
    console.log('📸 initialMedia変更:', { 
      newCount: initialMedia?.length || 0,
      hasHashes: initialMedia?.some(m => m.metadata?.hash) || false 
    });
    setUploadedMedia(initialMedia);
  }, [initialMedia?.length]);

  // ファイル形式設定
  const getAcceptedFiles = () => {
    if (acceptedTypes === 'image') {
      return {
        'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif']
      };
    } else if (acceptedTypes === 'video') {
      return {
        'video/*': ['.mp4', '.webm', '.mov']
      };
    } else {
      return {
        'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
        'video/*': ['.mp4', '.webm', '.mov']
      };
    }
  };

  // Cloudinary直接アップロード処理
  const uploadFileDirectToCloudinary = async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadedMedia> => {
    try {
      // 署名を取得
      const signatureResponse = await fetch('/api/media/signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: uploadType }),
      });

      if (!signatureResponse.ok) {
        const errorData = await signatureResponse.json();
        
        // 503エラー（Cloudinary設定問題）の場合は親切なメッセージ
        if (signatureResponse.status === 503 && errorData.fallbackAvailable) {
          console.log('ℹ️ Cloudinary直接アップロード不可、内部API使用:', errorData.message);
          throw new Error('Cloudinary設定問題により内部API経由でアップロードします');
        }
        
        throw new Error(errorData.error || '署名の取得に失敗しました');
      }

      const signatureData = await signatureResponse.json();
      
      // ファイルハッシュを事前計算
      const fileHash = await calculateFileHash(file);
      
      // Cloudinaryに直接アップロード
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signatureData.api_key);
      formData.append('timestamp', signatureData.timestamp.toString());
      formData.append('signature', signatureData.signature);
      formData.append('public_id', signatureData.public_id);
      formData.append('folder', signatureData.folder);
      formData.append('tags', signatureData.tags);
      if (signatureData.transformation) formData.append('transformation', signatureData.transformation);
      if (signatureData.eager) formData.append('eager', signatureData.eager);
      formData.append('eager_async', 'true');
      formData.append('overwrite', 'false');
      formData.append('invalidate', 'true');

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/image/upload`;
      
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // プログレス更新
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });

        // 完了時の処理
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const cloudinaryResponse = JSON.parse(xhr.responseText);
              
              // Cloudinaryレスポンスを内部形式に変換
              const media: UploadedMedia = {
                id: cloudinaryResponse.public_id,
                type: file.type.startsWith('video/') ? 'video' : 'image',
                url: cloudinaryResponse.secure_url,
                thumbnailUrl: cloudinaryResponse.eager?.[0]?.secure_url,
                optimizedUrl: cloudinaryResponse.eager?.[1]?.secure_url,
                publicId: cloudinaryResponse.public_id,
                title: file.name,
                alt: file.name,
                size: file.size,
                metadata: {
                  originalName: file.name,
                  mimeType: file.type,
                  width: cloudinaryResponse.width,
                  height: cloudinaryResponse.height,
                  duration: cloudinaryResponse.duration,
                  hash: fileHash,
                },
              };
              
              resolve(media);
            } catch (error) {
              reject(new Error('Cloudinaryレスポンスの解析に失敗しました'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error?.message || 'Cloudinaryアップロードに失敗しました'));
            } catch (error) {
              reject(new Error(`Cloudinaryアップロードエラー: ${xhr.status}`));
            }
          }
        });

        // エラー時の処理
        xhr.addEventListener('error', () => {
          reject(new Error('Cloudinaryアップロードでネットワークエラーが発生しました'));
        });

        // タイムアウト時の処理
        xhr.addEventListener('timeout', () => {
          reject(new Error('Cloudinaryアップロードがタイムアウトしました'));
        });

        // タイムアウト設定（60秒 - Cloudinary直接アップロードは長めに設定）
        xhr.timeout = 60000;

        // リクエスト送信
        xhr.open('POST', cloudinaryUrl);
        xhr.send(formData);
      });
      
    } catch (error) {
      console.error('Cloudinary直接アップロードエラー:', error);
      throw error;
    }
  };

  // ファイルアップロード処理（フォールバック対応）
  const uploadFile = async (file: File, onProgress?: (progress: number) => void): Promise<UploadedMedia> => {
    // ファイルハッシュを事前計算
    const fileHash = await calculateFileHash(file);
    
    // 405エラー対策: まずCloudinary直接アップロードを試行
    try {
      return await uploadFileDirectToCloudinary(file, onProgress);
    } catch (directUploadError) {
      console.warn('⚠️ Cloudinary直接アップロードが失敗、内部APIフォールバック:', directUploadError);
      
      // フォールバック: 既存の内部API経由でアップロード
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', uploadType);
        formData.append('title', file.name);
        formData.append('alt', file.name);
        formData.append('hash', fileHash); // 元ファイルハッシュを追加

        const xhr = new XMLHttpRequest();

        // プログレス更新
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });

        // 完了時の処理
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response.media);
            } catch (error) {
              reject(new Error('レスポンスの解析に失敗しました'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || 'アップロードに失敗しました'));
            } catch (error) {
              reject(new Error(`アップロードエラー: ${xhr.status}`));
            }
          }
        });

        // エラー時の処理
        xhr.addEventListener('error', () => {
          reject(new Error('ネットワークエラーが発生しました'));
        });

        // タイムアウト時の処理
        xhr.addEventListener('timeout', () => {
          reject(new Error('アップロードがタイムアウトしました'));
        });

        // タイムアウト設定（30秒）
        xhr.timeout = 30000;

        // リクエスト送信
        xhr.open('POST', '/api/media/upload');
        xhr.send(formData);
      });
    }
  };

  // ファイルハッシュ値計算（SHA-256）
  const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  // URLから画像をダウンロードしてハッシュを計算（サーバープロキシ経由）
  const calculateImageHashFromUrl = async (url: string): Promise<string | null> => {
    try {
      console.log('🌐 サーバープロキシ画像ハッシュ計算開始:', url);
      
      const response = await fetch('/api/media/hash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ サーバープロキシ画像ハッシュ計算完了:', {
        hash: data.hash.substring(0, 16) + '...',
        size: data.size
      });
      
      return data.hash;
    } catch (error) {
      console.error('❌ サーバープロキシ画像ハッシュ計算エラー:', error);
      return null;
    }
  };

  // ハッシュベース重複ファイルチェック関数
  const findDuplicateByHash = async (file: File): Promise<UploadedMedia | null> => {
    try {
      console.log('🚀 findDuplicateByHash開始:', {
        fileName: file.name,
        fileSize: file.size
      });
      
      const fileHash = await calculateFileHash(file);
      console.log('🔍 ファイルハッシュ計算完了:', { 
        fileName: file.name, 
        fileSize: file.size,
        hash: fileHash.substring(0, 16) + '...' 
      });
      
      console.log('🔍 既存メディア検索対象:', {
        totalCount: uploadedMedia.length,
        withHashes: uploadedMedia.filter(m => m.metadata?.hash).length,
        withoutHashes: uploadedMedia.filter(m => !m.metadata?.hash).length,
        mediaDetails: uploadedMedia.map(m => ({
          title: m.title,
          hasHash: !!m.metadata?.hash,
          hashPreview: m.metadata?.hash ? m.metadata.hash.substring(0, 8) + '...' : 'なし'
        }))
      });
      
      // 既存メディアからハッシュが一致するものを検索
      for (let i = 0; i < uploadedMedia.length; i++) {
        const media = uploadedMedia[i];
        const hasHash = !!media.metadata?.hash;
        
        console.log(`🔍 既存メディア${i + 1}チェック:`, {
          title: media.title,
          size: media.size,
          hasHash: hasHash,
          hashPreview: hasHash ? media.metadata.hash!.substring(0, 16) + '...' : 'なし'
        });
        
        // 通常のハッシュ比較
        if (hasHash && media.metadata.hash === fileHash) {
          console.log('✅ ハッシュ一致による重複検出:', {
            newFile: file.name,
            newFileHash: fileHash.substring(0, 16) + '...',
            existingFile: media.metadata?.originalName || media.title,
            existingHash: media.metadata.hash!.substring(0, 16) + '...',
            match: true
          });
          return media;
        }
        
        // ハッシュ値がない既存メディアはスキップ（今後のアップロードから重複防止開始）
        if (!hasHash) {
          console.log('⏭️ ハッシュなし既存メディアをスキップ:', {
            title: media.title,
            reason: 'メタデータハッシュなし（今後のアップロードから重複防止適用）'
          });
          continue; // フォールバック処理なしでスキップ
        }
      }
      
      console.log('🔍 重複なし:', {
        newFile: file.name,
        newFileHash: fileHash.substring(0, 16) + '...',
        searchedMedia: uploadedMedia.length,
        result: 'ユニーク'
      });
      return null;
    } catch (error) {
      console.error('❌ ハッシュ計算エラー:', error);
      return null;
    }
  };

  // 重複ファイルチェック関数
  const isDuplicateFile = (file: File): boolean => {
    const isDuplicate = uploadedMedia.some(media => {
      // ファイル名とサイズで重複判定
      const nameMatch = media.metadata?.originalName === file.name;
      const sizeMatch = media.size === file.size;
      const isDup = nameMatch && sizeMatch;
      
      if (isDup) {
        console.log('🔍 重複ファイル検出:', {
          fileName: file.name,
          fileSize: file.size,
          existingName: media.metadata?.originalName,
          existingSize: media.size
        });
      }
      
      return isDup;
    });
    
    return isDuplicate;
  };

  // ドロップゾーンの設定
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return;
    
    // ハッシュベース重複チェック
    const duplicates: { file: File; hash: string; existingMedia: UploadedMedia }[] = [];
    const uniqueFiles: File[] = [];
    
    console.log('🔍 重複チェック開始:', {
      newFiles: acceptedFiles.length,
      existingMedia: uploadedMedia.length,
      existingWithHash: uploadedMedia.filter(m => m.metadata?.hash).length
    });
    
    for (const file of acceptedFiles) {
      const duplicateMedia = await findDuplicateByHash(file);
      if (duplicateMedia) {
        const fileHash = await calculateFileHash(file);
        duplicates.push({ file, hash: fileHash, existingMedia: duplicateMedia });
      } else {
        uniqueFiles.push(file);
      }
    }

    // 重複ファイルがある場合
    if (duplicates.length > 0) {
      setDuplicateFiles(duplicates);
      setPendingUniqueFiles(uniqueFiles);
      setDuplicateCheckDialog(true);
      return; // ダイアログで処理を継続
    }
    
    // ファイル数制限チェック
    if (uploadedMedia.length + uniqueFiles.length > maxFiles) {
      setError(`最大${maxFiles}ファイルまでアップロード可能です`);
      return;
    }
    
    // 重複なしの場合は直接アップロード処理
    await processUniqueFiles(uniqueFiles);
  }, [uploadedMedia, maxFiles, uploadType, onUploadComplete, onUploadError, disabled, findDuplicateByHash, calculateFileHash]);

  // ファイルアップロード処理（分離）
  const processUniqueFiles = async (filesToProcess: File[]) => {
    if (filesToProcess.length === 0) return;

    setUploading(true);
    setError('');
    setUploadProgress(0);
    setTotalFiles(filesToProcess.length);
    setCurrentFileIndex(0);

    try {
      const newMedia = [];
      
      // 順次アップロード（並列処理だとプログレス更新が正しく動作しない）
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        setCurrentFile(file.name);
        setCurrentFileIndex(i + 1);
        
        try {
          const media = await uploadFile(file, (fileProgress) => {
            // 全体の進捗を計算（現在のファイルの進捗 + 完了済みファイル数）
            const completedFiles = i;
            const currentFileWeight = 1 / filesToProcess.length;
            const overallProgress = (completedFiles / filesToProcess.length) * 100 + (fileProgress * currentFileWeight);
            
            setUploadProgress(Math.min(overallProgress, 100));
          });
          
          // uploadFile関数内でハッシュが設定されるため、ここでは不要
          
          newMedia.push(media);
          
          // ファイル完了時の進捗更新
          const completedProgress = ((i + 1) / filesToProcess.length) * 100;
          setUploadProgress(completedProgress);
          
        } catch (fileError) {
          console.error(`ファイル ${file.name} のアップロードに失敗:`, fileError);
          throw fileError;
        }
      }

      const updatedMedia = [...uploadedMedia, ...newMedia];
      
      setUploadedMedia(updatedMedia);
      onUploadComplete(updatedMedia);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'アップロードエラー';
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setCurrentFile('');
      setCurrentFileIndex(0);
      setTotalFiles(0);
    }
  };

  // 重複確認ダイアログの処理
  const handleDuplicateDialogConfirm = async (selectedDuplicates: { file: File; existingMedia: UploadedMedia }[]) => {
    // 既存画像を使用する場合
    const existingMediaToUse = selectedDuplicates.map(d => d.existingMedia);
    const updatedMedia = [...uploadedMedia, ...existingMediaToUse];
    
    // 新しいファイルがある場合はアップロード
    if (pendingUniqueFiles.length > 0) {
      await processUniqueFiles(pendingUniqueFiles);
    } else {
      setUploadedMedia(updatedMedia);
      onUploadComplete(updatedMedia);
    }
    
    // ダイアログを閉じる
    setDuplicateCheckDialog(false);
    setDuplicateFiles([]);
    setPendingUniqueFiles([]);
  };

  const handleDuplicateDialogCancel = () => {
    setDuplicateCheckDialog(false);
    setDuplicateFiles([]);
    setPendingUniqueFiles([]);
  };

  const handleDuplicateDialogIgnore = async () => {
    // 重複を無視して新しいファイルのみアップロード
    if (pendingUniqueFiles.length > 0) {
      await processUniqueFiles(pendingUniqueFiles);
    }
    
    setDuplicateCheckDialog(false);
    setDuplicateFiles([]);
    setPendingUniqueFiles([]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptedFiles() as any, // 型エラー回避
    maxFiles: maxFiles - uploadedMedia.length,
    disabled: disabled || uploading
  });

  // メディア削除
  const handleRemoveMedia = (mediaId: string) => {
    console.log('🔍 削除対象ID:', mediaId);
    console.log('🔍 削除前のメディア:', uploadedMedia.map(m => ({ id: m.id, title: m.title })));
    
    let updatedMedia;
    
    // インデックスベースのIDの場合（media-item-0 のような形式）
    if (mediaId.startsWith('media-item-')) {
      const index = parseInt(mediaId.replace('media-item-', ''));
      console.log('🔍 インデックスベース削除:', index);
      updatedMedia = uploadedMedia.filter((_, i) => i !== index);
    } else {
      // 通常のID削除
      const matchingMedia = uploadedMedia.find(media => media.id === mediaId);
      console.log('🔍 マッチするメディア:', matchingMedia);
      updatedMedia = uploadedMedia.filter(media => media.id !== mediaId);
    }
    
    console.log('🔍 削除後のメディア:', updatedMedia.map(m => ({ id: m.id, title: m.title })));
    
    if (updatedMedia.length === uploadedMedia.length) {
      console.warn('⚠️ 削除されなかった - IDが一致しませんでした');
      console.warn('⚠️ 削除対象ID:', mediaId);
      console.warn('⚠️ 存在するIDs:', uploadedMedia.map(m => m.id));
    }
    
    // ファイル削除後、同一ファイルの再アップロードを可能にするためinput要素をリセット
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
      console.log('ファイルinput要素をリセットしました');
    }
    
    setUploadedMedia(updatedMedia);
    onUploadComplete(updatedMedia);
  };

  // プレビュー表示
  const handlePreview = (media: UploadedMedia) => {
    setPreviewMedia(media);
    setPreviewOpen(true);
  };

  // メディア編集
  const handleEditMedia = (media: UploadedMedia) => {
    setEditingMedia(media);
    setEditDialogOpen(true);
  };

  // メディア情報保存
  const handleSaveMediaInfo = () => {
    if (editingMedia) {
      const updatedMedia = uploadedMedia.map(media =>
        media.id === editingMedia.id ? editingMedia : media
      );
      setUploadedMedia(updatedMedia);
      onUploadComplete(updatedMedia);
      setEditDialogOpen(false);
      setEditingMedia(null);
    }
  };

  // ファイル選択ボタン
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      {/* ドラッグ&ドロップエリア */}
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          bgcolor: isDragActive ? 'primary.50' : 'grey.50',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: disabled || uploading ? 'grey.300' : 'primary.main',
            bgcolor: disabled || uploading ? 'grey.50' : 'primary.50'
          }
        }}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        <CloudUpload 
          sx={{ 
            fontSize: 48, 
            color: disabled || uploading ? 'grey.400' : 'primary.main',
            mb: 2 
          }} 
        />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'ファイルをドロップしてください' : 'ファイルをドラッグ&ドロップ'}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          または
        </Typography>
        <Button
          variant="outlined"
          onClick={handleFileSelect}
          disabled={disabled || uploading}
          sx={{ mt: 1 }}
        >
          ファイルを選択
        </Button>
        <Typography variant="caption" display="block" sx={{ mt: 2 }}>
          {acceptedTypes === 'image' && 'JPG, PNG, WebP, GIF (最大5MB)'}
          {acceptedTypes === 'video' && 'MP4, WebM, MOV (最大50MB)'}
          {acceptedTypes === 'all' && '画像・動画ファイル (画像:5MB、動画:50MB)'}
        </Typography>
      </Box>

      {/* アップロード進捗 */}
      {uploading && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2">
              {currentFile ? `アップロード中: ${currentFile}` : 'アップロード準備中...'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {totalFiles > 1 ? `${currentFileIndex}/${totalFiles} (${Math.round(uploadProgress)}%)` : `${Math.round(uploadProgress)}%`}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={uploadProgress}
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: 'primary.main'
              }
            }}
          />
          {totalFiles > 1 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {currentFileIndex > totalFiles ? '完了' : `残り ${totalFiles - currentFileIndex + 1} ファイル`}
            </Typography>
          )}
        </Box>
      )}

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* アップロード済みメディア一覧 - Instagram風 */}
      {showPreview && uploadedMedia.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            アップロード済みファイル ({uploadedMedia.length})
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gap: 1,
            gridTemplateColumns: {
              xs: 'repeat(3, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(5, 1fr)'
            }
          }}>
            {uploadedMedia.map((media, index) => (
              <Box 
                key={media.id || `media-item-${index}`}
                sx={{
                  position: 'relative',
                  paddingTop: '100%', // 1:1 アスペクト比（正方形）
                  backgroundColor: '#000',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  '&:hover': {
                    '& .media-overlay': {
                      opacity: 1
                    },
                    '& .media-image': {
                      transform: 'scale(1.05)'
                    }
                  }
                }}
              >
                {/* メディア表示 */}
                <Box
                  className="media-image"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    transition: 'transform 0.3s ease'
                  }}
                >
                  {media.type === 'image' ? (
                    <OptimizedImage
                      src={media.thumbnailUrl || media.url}
                      alt={media.alt || media.title}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      quality={75}
                      objectFit="cover"
                      objectPosition="center"
                      loading="lazy"
                      placeholder="blur"
                    />
                  ) : (
                    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                      <Box
                        component="video"
                        src={media.url}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <PlayCircleOutline 
                        sx={{ 
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          fontSize: 48,
                          color: 'white',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                        }}
                      />
                    </Box>
                  )}
                </Box>
                
                {/* ホバーオーバーレイ */}
                <Box
                  className="media-overlay"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5))',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 1
                  }}
                >
                  {/* 上部アクション */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                    {[
                      <IconButton
                        key={`preview-${media.id || index}`}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(media);
                        }}
                        sx={{
                          color: 'white',
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.5)'
                          }
                        }}
                      >
                        <ZoomIn fontSize="small" />
                      </IconButton>,
                      <IconButton
                        key={`delete-${media.id || index}`}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMedia(media.id || `media-item-${index}`);
                        }}
                        sx={{
                          color: 'white',
                          backgroundColor: 'rgba(255,0,0,0.3)',
                          '&:hover': {
                            backgroundColor: 'rgba(255,0,0,0.5)'
                          }
                        }}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    ]}
                  </Box>
                  
                  {/* 下部情報 */}
                  <Box sx={{ color: 'white' }}>
                    <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                      {media.title}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {media.type === 'video' ? 'ビデオ' : '画像'} • {(media.size / (1024 * 1024)).toFixed(1)}MB
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* プレビューダイアログ */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {previewMedia?.title}
            <IconButton onClick={() => setPreviewOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {previewMedia && (
            <Box sx={{ textAlign: 'center' }}>
              {previewMedia.type === 'video' ? (
                <video
                  src={previewMedia.url}
                  controls
                  style={{ maxWidth: '100%', maxHeight: '400px' }}
                />
              ) : (
                <OptimizedImage
                  src={previewMedia.url}
                  alt={previewMedia.alt}
                  width={800}
                  height={400}
                  quality={90}
                  objectFit="contain"
                  priority
                  style={{ maxWidth: '100%', maxHeight: '400px' }}
                />
              )}
              <Typography variant="body2" sx={{ mt: 2 }}>
                {previewMedia.metadata.originalName}
              </Typography>
              {previewMedia.metadata.width && previewMedia.metadata.height && (
                <Typography variant="caption" display="block">
                  {previewMedia.metadata.width} x {previewMedia.metadata.height}px
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>メディア情報編集</DialogTitle>
        <DialogContent>
          {editingMedia && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="タイトル"
                value={editingMedia.title}
                onChange={(e) => setEditingMedia({ ...editingMedia, title: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="代替テキスト"
                value={editingMedia.alt}
                onChange={(e) => setEditingMedia({ ...editingMedia, alt: e.target.value })}
                margin="normal"
                helperText="視覚障害者向けの説明文"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSaveMediaInfo} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 重複確認ダイアログ */}
      <Dialog
        open={duplicateCheckDialog}
        onClose={handleDuplicateDialogCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          重複画像が検出されました
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            以下の画像は既にアップロード済みです。どのように処理しますか？
          </Typography>
          
          {duplicateFiles.map((duplicate, index) => (
            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                📄 {duplicate.file.name}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {/* 新しいファイル */}
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    新しいファイル
                  </Typography>
                  <Box sx={{ 
                    width: 100, 
                    height: 100, 
                    border: '2px dashed #ccc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    mx: 'auto'
                  }}>
                    <ImageIcon sx={{ fontSize: 40, color: '#ccc' }} />
                  </Box>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    サイズ: {Math.round(duplicate.file.size / 1024)}KB
                  </Typography>
                </Box>
                
                {/* 矢印 */}
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                  ➔
                </Box>
                
                {/* 既存ファイル */}
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    既存ファイル
                  </Typography>
                  <Box sx={{ position: 'relative', width: 100, height: 100, mx: 'auto' }}>
                    <OptimizedImage
                      src={duplicate.existingMedia.url}
                      alt={duplicate.existingMedia.alt}
                      fill
                      sizes="100px"
                      quality={75}
                      objectFit="cover"
                      style={{ borderRadius: '4px' }}
                      loading="lazy"
                    />
                  </Box>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    サイズ: {Math.round(duplicate.existingMedia.size / 1024)}KB
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
          
          {pendingUniqueFiles.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {pendingUniqueFiles.length}個の新しいファイルも同時にアップロード予定です。
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleDuplicateDialogCancel} 
            color="inherit"
          >
            キャンセル
          </Button>
          <Button 
            onClick={handleDuplicateDialogIgnore}
            variant="outlined"
            color="primary"
          >
            新しいファイルのみアップロード
          </Button>
          <Button 
            onClick={() => handleDuplicateDialogConfirm(duplicateFiles.map(d => ({ 
              file: d.file, 
              existingMedia: d.existingMedia 
            })))}
            variant="contained"
            color="primary"
            startIcon={<CheckCircle />}
          >
            既存画像を使用
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MediaUpload;