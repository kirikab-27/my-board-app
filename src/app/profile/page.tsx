import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/nextauth';
import { redirect } from 'next/navigation';
import { Container, Paper, Typography, Box, Button, Divider, Chip, Stack } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import InfoIcon from '@mui/icons-material/Info';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LanguageIcon from '@mui/icons-material/Language';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Link from 'next/link';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import FollowStats from '@/components/follow/FollowStats';

async function getProfile(userId: string) {
  await dbConnect();

  const user = await User.findById(userId).select('-password').lean();

  if (!user) return null;

  // 型安全性確保のためunknown経由でキャスト
  const safeUser = user as unknown as {
    _id: any;
    name: string;
    email: string;
    bio?: string;
    website?: string;
    location?: string;
    avatar?: string;
    emailVerified: Date | null;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  };

  return {
    id: safeUser._id.toString(),
    name: safeUser.name,
    email: safeUser.email,
    bio: safeUser.bio || '',
    website: safeUser.website || '',
    location: safeUser.location || '',
    avatar: safeUser.avatar || '',
    emailVerified: safeUser.emailVerified,
    role: safeUser.role,
    createdAt: safeUser.createdAt,
    updatedAt: safeUser.updatedAt,
  };
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const profile = await getProfile(session.user.id);

  if (!profile) {
    redirect('/');
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'moderator':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理者';
      case 'moderator':
        return 'モデレーター';
      default:
        return '一般ユーザー';
    }
  };

  return (
    <>
      <ProfileHeader title="プロフィール" />

      <Container maxWidth="md" sx={{ mt: { xs: 18, sm: 20, md: 20 }, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          {/* ヘッダー部分 */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 4,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {profile.avatar ? (
                <Box
                  component="img"
                  src={profile.avatar}
                  alt={`${profile.name}のプロフィール画像`}
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid',
                    borderColor: 'primary.main'
                  }}
                />
              ) : (
                <ProfileAvatar name={profile.name} size="xlarge" />
              )}
              <Box>
                <Typography variant="h4" gutterBottom>
                  {profile.name}
                </Typography>
                <Chip
                  label={getRoleLabel(profile.role)}
                  color={getRoleBadgeColor(profile.role)}
                  size="small"
                />
              </Box>
            </Box>

            <Stack spacing={1}>
              <Button
                component={Link}
                href="/profile/edit"
                variant="contained"
                startIcon={<EditIcon />}
              >
                プロフィール編集
              </Button>
              <Button
                component={Link}
                href="/profile/password"
                variant="outlined"
                startIcon={<LockIcon />}
              >
                パスワード変更
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* フォロー統計 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              フォロー統計
            </Typography>
            <FollowStats userId={profile.id} showRelationship={false} />
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* プロフィール情報 */}
          <Stack spacing={3}>
            {/* メールアドレス */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EmailIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  メールアドレス
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">{profile.email}</Typography>
                  {profile.emailVerified && (
                    <Chip label="認証済み" size="small" color="success" sx={{ height: 20 }} />
                  )}
                </Box>
              </Box>
            </Box>

            {/* 自己紹介 */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <InfoIcon color="action" sx={{ mt: 0.5 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  自己紹介
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {profile.bio || '自己紹介が設定されていません'}
                </Typography>
              </Box>
            </Box>

            {/* ウェブサイト */}
            {profile.website && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LanguageIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    ウェブサイト
                  </Typography>
                  <Typography 
                    variant="body1" 
                    component="a" 
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {profile.website}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* 位置情報 */}
            {profile.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LocationOnIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    位置情報
                  </Typography>
                  <Typography variant="body1">
                    {profile.location}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* 登録日 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarTodayIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  登録日
                </Typography>
                <Typography variant="body1">{formatDate(profile.createdAt)}</Typography>
              </Box>
            </Box>

            {/* 最終更新日 */}
            {profile.updatedAt && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CalendarTodayIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    最終更新日
                  </Typography>
                  <Typography variant="body1">{formatDate(profile.updatedAt)}</Typography>
                </Box>
              </Box>
            )}
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* 注意事項 */}
          <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>ご注意:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              • メールアドレスは変更できません
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • パスワードは定期的に変更することをお勧めします
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • プロフィール情報は他のユーザーには公開されません
            </Typography>
          </Box>
        </Paper>
      </Container>
    </>
  );
}
