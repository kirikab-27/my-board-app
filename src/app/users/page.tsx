'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import FollowButton from '@/components/follow/FollowButton';
import FollowStats from '@/components/follow/FollowStats';

interface User {
  _id: string;
  name: string;
  username?: string;
  email: string;
  bio?: string;
  role: string;
  avatar?: string;
  createdAt: string;
}

export default function UsersPage() {
  useSession();
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

  // 検索フィルタリング（@メンション検索対応）
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    
    // @メンション検索の場合
    if (searchTerm.startsWith('@')) {
      const searchUsername = searchTerm.slice(1).toLowerCase(); // @を除去
      return user.username && user.username.toLowerCase().includes(searchUsername);
    }
    
    // 通常検索（名前、ユーザー名、自己紹介）
    return (
      user.name.toLowerCase().includes(searchLower) ||
      (user.username && user.username.toLowerCase().includes(searchLower)) ||
      (user.bio && user.bio.toLowerCase().includes(searchLower))
    );
  });

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
      
      <Container maxWidth="lg" sx={{ mt: { xs: 18, sm: 20, md: 20 }, mb: 4 }}>
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

          {/* 検索バー & 高度な検索へのリンク */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                placeholder="名前、@ユーザー名、自己紹介で検索..."
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
              <Button
                component={Link}
                href="/users/search"
                variant="outlined"
                startIcon={<ManageSearchIcon />}
                sx={{ whiteSpace: 'nowrap' }}
              >
                高度な検索
              </Button>
            </Box>
            
            {/* クイック検索提案 */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                クイック検索:
              </Typography>
              <Chip 
                label="@で検索" 
                size="small" 
                clickable 
                onClick={() => setSearchTerm('@')}
              />
              <Chip 
                label="認証済みユーザー" 
                size="small" 
                clickable 
                component={Link}
                href="/users/search?filter=verified"
              />
              <Chip 
                label="オンライン" 
                size="small" 
                clickable 
                component={Link}
                href="/users/search?filter=online"
              />
              <Chip 
                label="人気ユーザー" 
                size="small" 
                clickable 
                component={Link}
                href="/users/search?sortBy=followers"
              />
            </Box>
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
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                gap: 3 
              }}
            >
              {filteredUsers.map((user) => (
                <Box key={user._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      {/* ユーザー基本情報 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {user.avatar ? (
                          <Avatar
                            src={user.avatar}
                            alt={user.name}
                            sx={{ width: 56, height: 56 }}
                          />
                        ) : (
                          <ProfileAvatar name={user.name} size="medium" />
                        )}
                        <Box sx={{ ml: 2, flexGrow: 1 }}>
                          <Typography variant="h6" noWrap>
                            {user.name}
                          </Typography>
                          {user.username && (
                            <Typography variant="body2" color="text.secondary" noWrap>
                              @{user.username}
                            </Typography>
                          )}
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
                </Box>
              ))}
            </Box>
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