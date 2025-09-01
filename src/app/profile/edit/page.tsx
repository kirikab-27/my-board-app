'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Stack,
  CircularProgress,
  AppBar,
  Toolbar,
  InputAdornment,
  useTheme,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { AuthButton } from '@/components/auth/AuthButton';
import OptimizedImage from '@/components/ui/OptimizedImage';
import MediaUpload, { UploadedMedia } from '@/components/media/MediaUpload';
import Link from 'next/link';
import { getNavigationHeaderStyles } from '@/styles/navigationHeaderStyles';

export default function ProfileEditPage() {
  const router = useRouter();
  const theme = useTheme(); // Issue #38: ダークモード対応
  const { data: session, status, update } = useSession();

  // Issue #35: 検索機能ハンドラー（HeaderSearchIcon表示のため）
  const handleSearch = (query: string) => {
    router.push(`/board?search=${encodeURIComponent(query)}`);
  };

  const handleClearSearch = () => {
    // プロフィール編集ページでのクリア処理（特に何もしない）
  };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    username: '', // ユーザー名（@mention用）
    bio: '',
    email: '', // 表示のみ（変更不可）
    website: '',
    location: '',
    avatar: '', // プロフィール画像URL
  });

  const [charCount, setCharCount] = useState({
    name: 0,
    username: 0,
    bio: 0,
    website: 0,
    location: 0,
  });

  // ユーザー名可用性チェック状態
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
    error: boolean;
  }>({
    checking: false,
    available: null,
    message: '',
    error: false,
  });

  const usernameCheckRef = useRef<NodeJS.Timeout | null>(null);

  // プロフィール取得
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    fetchProfile();
  }, [session, status, router]);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (usernameCheckRef.current) {
        clearTimeout(usernameCheckRef.current);
      }
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'プロフィールの取得に失敗しました');
      }

      setFormData({
        name: data.user.name || '',
        username: data.user.username || '',
        bio: data.user.bio || '',
        email: data.user.email || '',
        website: data.user.website || '',
        location: data.user.location || '',
        avatar: data.user.avatar || '',
      });

      setCharCount({
        name: data.user.name?.length || 0,
        username: data.user.username?.length || 0,
        bio: data.user.bio?.length || 0,
        website: data.user.website?.length || 0,
        location: data.user.location?.length || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // アバター画像アップロード処理
  const handleAvatarUpload = (uploadedMedia: UploadedMedia[]) => {
    if (uploadedMedia.length > 0) {
      const avatarUrl = uploadedMedia[0].url;
      setFormData(prev => ({
        ...prev,
        avatar: avatarUrl
      }));
    }
  };

  const handleAvatarUploadError = (error: string) => {
    setError(`アバター画像のアップロードに失敗しました: ${error}`);
  };

  // ユーザー名可用性チェック（デバウンス処理）
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (username.length < 3 || !username) {
      setUsernameStatus({
        checking: false,
        available: null,
        message: '',
        error: false,
      });
      return;
    }

    setUsernameStatus({
      checking: true,
      available: null,
      message: 'ユーザー名を確認中...',
      error: false,
    });

    try {
      const response = await fetch(`/api/profile/check-username?username=${encodeURIComponent(username)}`);
      const data = await response.json();

      if (response.ok) {
        setUsernameStatus({
          checking: false,
          available: data.available,
          message: data.message || data.error || '',
          error: !data.available,
        });
      } else {
        setUsernameStatus({
          checking: false,
          available: false,
          message: data.error || 'ユーザー名の確認に失敗しました',
          error: true,
        });
      }
    } catch (error) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: 'ネットワークエラーが発生しました',
        error: true,
      });
    }
  }, []);

  // デバウンス処理付きユーザー名チェック
  const debouncedUsernameCheck = useCallback((username: string) => {
    // 既存のタイマーをクリア
    if (usernameCheckRef.current) {
      clearTimeout(usernameCheckRef.current);
    }

    // 500ms後にチェック実行
    usernameCheckRef.current = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500);
  }, [checkUsernameAvailability]);

  const handleChange = (field: 'name' | 'username' | 'bio' | 'website' | 'location') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // 文字数制限チェック
    if (field === 'name' && value.length > 50) return;
    if (field === 'username' && value.length > 30) return;
    if (field === 'bio' && value.length > 300) return;
    if (field === 'website' && value.length > 200) return;
    if (field === 'location' && value.length > 100) return;

    // ユーザー名の文字種制限チェック
    if (field === 'username') {
      // 英数字とアンダースコアのみ許可
      const usernameRegex = /^[a-zA-Z0-9_]*$/;
      if (!usernameRegex.test(value)) {
        return; // 不正な文字が入力された場合は更新しない
      }
      
      // 小文字に変換
      const lowercaseValue = value.toLowerCase();
      
      setFormData((prev) => ({
        ...prev,
        [field]: lowercaseValue,
      }));
      
      setCharCount((prev) => ({
        ...prev,
        [field]: lowercaseValue.length,
      }));

      // ユーザー名可用性チェック（デバウンス処理）
      if (lowercaseValue.length >= 3) {
        debouncedUsernameCheck(lowercaseValue);
      } else {
        setUsernameStatus({
          checking: false,
          available: null,
          message: '',
          error: false,
        });
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      setCharCount((prev) => ({
        ...prev,
        [field]: value.length,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // バリデーション
    if (!formData.name.trim()) {
      setError('名前は必須です');
      return;
    }

    // ユーザー名バリデーション
    if (!formData.username.trim()) {
      setError('ユーザー名は必須です');
      return;
    }

    if (formData.username.length < 3) {
      setError('ユーザー名は3文字以上で入力してください');
      return;
    }

    // 予約語チェック
    const reservedUsernames = [
      'admin', 'api', 'www', 'mail', 'support', 'help', 
      'blog', 'news', 'about', 'contact', 'privacy', 'terms',
      'login', 'register', 'dashboard', 'profile', 'settings',
      'board', 'post', 'comment', 'user', 'users', 'timeline',
      'hashtag', 'hashtags', 'notification', 'notifications'
    ];

    if (reservedUsernames.includes(formData.username.toLowerCase())) {
      setError('このユーザー名は予約されているため使用できません');
      return;
    }

    // ユーザー名可用性チェック
    if (usernameStatus.error || (usernameStatus.available === false && usernameStatus.message !== '現在のユーザー名です')) {
      setError('ユーザー名が使用できません: ' + usernameStatus.message);
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          username: formData.username.trim(),
          bio: formData.bio.trim(),
          website: formData.website.trim(),
          location: formData.location.trim(),
          avatar: formData.avatar,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'プロフィールの更新に失敗しました');
      }

      setSuccess('プロフィールを更新しました');

      // セッションを更新して最新のプロフィール画像を反映
      console.log('🔄 Triggering session update for avatar reflection');
      await update();

      // 2秒後にプロフィールページに戻る
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              プロフィール編集
            </Typography>
            <AuthButton 
              onSearch={handleSearch}
              onClearSearch={handleClearSearch}
            />
          </Toolbar>
          <Toolbar variant="dense" sx={getNavigationHeaderStyles(theme)}>
            <AuthButton isNavigationRow />
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: { xs: 18, sm: 20, md: 20 } }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}
          >
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            プロフィール編集
          </Typography>
          <AuthButton 
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
          />
        </Toolbar>
        <Toolbar variant="dense" sx={getNavigationHeaderStyles(theme)}>
          <AuthButton isNavigationRow />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: { xs: 18, sm: 20, md: 20 }, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            プロフィール編集
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* アバタープレビュー */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6">プロフィール画像</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {formData.avatar ? (
                    <Box sx={{ position: 'relative', width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '2px solid', borderColor: 'primary.main' }}>
                      <OptimizedImage
                        src={formData.avatar}
                        alt="プロフィール画像"
                        fill
                        sizes="80px"
                        quality={90}
                        objectFit="cover"
                      />
                    </Box>
                  ) : (
                    <ProfileAvatar name={formData.name} size="large" />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {formData.avatar ? '現在のプロフィール画像' : 'プロフィール画像をアップロードするか、名前の頭文字が自動表示されます'}
                    </Typography>
                  </Box>
                </Box>
                
                {/* アバター画像アップロード */}
                <MediaUpload
                  onUploadComplete={handleAvatarUpload}
                  onUploadError={handleAvatarUploadError}
                  maxFiles={1}
                  acceptedTypes="image"
                  uploadType="avatar"
                  showPreview={false}
                  disabled={saving}
                />
              </Box>

              {/* 名前 */}
              <TextField
                label="名前"
                value={formData.name}
                onChange={handleChange('name')}
                required
                fullWidth
                disabled={saving}
                helperText={`${charCount.name}/50文字`}
                error={charCount.name > 50}
              />

              {/* ユーザー名（@mention用） */}
              <TextField
                label="ユーザー名"
                value={formData.username}
                onChange={handleChange('username')}
                required
                fullWidth
                disabled={saving}
                helperText={
                  usernameStatus.checking 
                    ? 'ユーザー名を確認中...'
                    : usernameStatus.message
                      ? `${usernameStatus.message} (${charCount.username}/30文字)`
                      : `${charCount.username}/30文字 (英数字とアンダースコアのみ・@メンション用)`
                }
                error={charCount.username > 30 || usernameStatus.error}
                placeholder="username"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: 'text.secondary',
                          fontWeight: 'bold'
                        }}
                      >
                        @
                      </Typography>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    usernameStatus.checking && (
                      <InputAdornment position="end">
                        <CircularProgress size={20} />
                      </InputAdornment>
                    )
                  )
                }}
              />

              {/* メールアドレス（変更不可） */}
              <TextField
                label="メールアドレス"
                value={formData.email}
                fullWidth
                disabled
                helperText="メールアドレスは変更できません"
              />

              {/* 自己紹介 */}
              <TextField
                label="自己紹介"
                value={formData.bio}
                onChange={handleChange('bio')}
                multiline
                rows={4}
                fullWidth
                disabled={saving}
                helperText={`${charCount.bio}/300文字`}
                error={charCount.bio > 300}
                placeholder="あなたについて教えてください（任意）"
              />

              {/* ウェブサイトURL */}
              <TextField
                label="ウェブサイト"
                value={formData.website}
                onChange={handleChange('website')}
                fullWidth
                disabled={saving}
                helperText={`${charCount.website}/200文字 (http://またはhttps://から始まるURL)`}
                error={charCount.website > 200}
                placeholder="https://example.com"
                type="url"
              />

              {/* 位置情報 */}
              <TextField
                label="位置情報"
                value={formData.location}
                onChange={handleChange('location')}
                fullWidth
                disabled={saving}
                helperText={`${charCount.location}/100文字`}
                error={charCount.location > 100}
                placeholder="東京, 日本（任意）"
              />

              {/* ボタン */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  component={Link}
                  href="/profile"
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  disabled={saving}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={saving || !formData.name.trim()}
                >
                  {saving ? '保存中...' : '保存'}
                </Button>
              </Box>
            </Stack>
          </form>
        </Paper>
      </Container>
    </>
  );
}
