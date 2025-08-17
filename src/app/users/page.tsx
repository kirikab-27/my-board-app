'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useSession } from 'next-auth/react';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import FollowButton from '@/components/follow/FollowButton';
import FollowStats from '@/components/follow/FollowStats';

interface User {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const { data: session } = useSession();
  // session is used for authentication context
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // ユーザー一覧取得
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        setError('ユーザー一覧の取得に失敗しました');
      }
    } catch (error) {
      console.error('ユーザー一覧取得エラー:', error);
      setError('ユーザー一覧の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 検索フィルタリング
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.bio && user.bio.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // フォロー状態変更ハンドラー
  const handleFollowChange = (userId: string, isFollowing: boolean, isPending: boolean) => {
    // フォロー状態が変更された時の処理（必要に応じて統計を更新等）
    console.log(`User ${userId} follow state changed: following=${isFollowing}, pending=${isPending}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  // const getRoleColor = (role: string) => {
  //   switch (role) {
  //     case 'admin':
  //       return 'error';
  //     case 'moderator':
  //       return 'warning';
  //     default:
  //       return 'primary';
  //   }
  // };

  return (
    <>
      <ProfileHeader title="ユーザー一覧" />
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          {/* ヘッダー */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              ユーザー一覧
            </Typography>
            <Typography variant="body1" color="text.secondary">
              他のユーザーを探してフォローしましょう
            </Typography>
          </Box>

          {/* 検索バー */}
          <Box sx={{ mb: 4 }}>
            <TextField
              fullWidth
              placeholder="ユーザー名や自己紹介で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* エラー表示 */}
          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}

          {/* ローディング */}
          {loading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}

          {/* ユーザー一覧 */}
          {!loading && !error && (
            <Grid container spacing={3}>
              {filteredUsers.map((user) => (
                <Grid item xs={12} sm={6} md={4} key={user._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      {/* ユーザー基本情報 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ProfileAvatar name={user.name} size="medium" />
                        <Box sx={{ ml: 2, flexGrow: 1 }}>
                          <Typography variant="h6" noWrap>
                            {user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getRoleLabel(user.role)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* 自己紹介 */}
                      {user.bio && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '3.6em'
                          }}
                        >
                          {user.bio}
                        </Typography>
                      )}

                      {/* フォロー統計 */}
                      <Box sx={{ mb: 2 }}>
                        <FollowStats 
                          userId={user._id} 
                          compact={true}
                          showRelationship={false}
                        />
                      </Box>

                      {/* 登録日 */}
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                        {formatDate(user.createdAt)} に登録
                      </Typography>

                      {/* フォローボタン */}
                      <FollowButton
                        targetUserId={user._id}
                        targetUserName={user.name}
                        fullWidth
                        onFollowChange={(isFollowing, isPending) => 
                          handleFollowChange(user._id, isFollowing, isPending)
                        }
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* 検索結果なし */}
          {!loading && !error && filteredUsers.length === 0 && searchTerm && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                「{searchTerm}」に一致するユーザーが見つかりませんでした
              </Typography>
            </Box>
          )}

          {/* ユーザーなし */}
          {!loading && !error && users.length === 0 && !searchTerm && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                まだユーザーがいません
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </>
  );
}