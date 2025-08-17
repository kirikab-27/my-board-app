'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Pagination,
  Skeleton,
  Paper,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import FollowButton from './FollowButton';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';

interface FollowListProps {
  userId: string;
  type: 'followers' | 'following';
  title?: string;
  maxHeight?: string | number;
}

interface FollowUser {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  followedAt: string;
  isAccepted: boolean;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FollowListData {
  followers?: FollowUser[];
  following?: FollowUser[];
  pagination: PaginationInfo;
}

export default function FollowList({ 
  userId, 
  type, 
  title,
  maxHeight = 400 
}: FollowListProps) {
  const [data, setData] = useState<FollowListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const limit = 20;

  // フォローリストを取得
  const fetchFollowList = async (pageNum: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/follow/${userId}?type=${type}&page=${pageNum}&limit=${limit}`
      );
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        console.error('フォローリストの取得に失敗しました');
      }
    } catch (error) {
      console.error('フォローリスト取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // ページ変更ハンドラ
  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
    fetchFollowList(newPage);
  };

  // フォロー状態変更ハンドラ
  const handleFollowChange = () => {
    // リストを再取得して最新状態を反映
    fetchFollowList(page);
  };

  useEffect(() => {
    if (userId) {
      fetchFollowList(1);
      setPage(1);
    }
  }, [userId, type, fetchFollowList]);

  // ローディング表示
  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        {title && (
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
        )}
        <List>
          {[...Array(5)].map((_, index) => (
            <ListItem key={index} divider>
              <ListItemAvatar>
                <Skeleton variant="circular" width={40} height={40} />
              </ListItemAvatar>
              <ListItemText
                primary={<Skeleton variant="text" width={120} />}
                secondary={<Skeleton variant="text" width={80} />}
              />
              <Skeleton variant="rectangular" width={80} height={32} />
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  }

  if (!data) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">
          データを取得できませんでした
        </Typography>
      </Paper>
    );
  }

  const users = type === 'followers' ? data.followers : data.following;
  const isEmpty = !users || users.length === 0;

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      {/* ヘッダー */}
      {title && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.pagination.totalCount} 人
          </Typography>
        </Box>
      )}

      {/* リスト */}
      {isEmpty ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary" gutterBottom>
            {type === 'followers' ? 'フォロワーがいません' : 'フォローしているユーザーがいません'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {type === 'followers' 
              ? '他のユーザーと交流してフォロワーを増やしましょう' 
              : '興味のあるユーザーをフォローしてみましょう'
            }
          </Typography>
        </Box>
      ) : (
        <Box sx={{ maxHeight, overflow: 'auto' }}>
          <List disablePadding>
            {users?.map((user, index) => (
              <React.Fragment key={user.id}>
                <ListItem
                  sx={{
                    py: 2,
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <ProfileAvatar 
                      name={user.name} 
                      size="medium"
                    />
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2" noWrap>
                          {user.name}
                        </Typography>
                        {user.username && (
                          <Typography variant="body2" color="text.secondary" noWrap>
                            @{user.username}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {new Date(user.followedAt).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Typography>
                    }
                  />

                  {/* フォローボタン（モバイルでは小さく） */}
                  <Box ml={1}>
                    <FollowButton
                      targetUserId={user.id}
                      targetUserName={user.name}
                      size={isMobile ? 'small' : 'medium'}
                      variant="outlined"
                      onFollowChange={() => handleFollowChange()}
                    />
                  </Box>
                </ListItem>
                
                {index < users.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}

      {/* ページネーション */}
      {data.pagination.totalPages > 1 && (
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: 1, borderColor: 'divider' }}>
          <Pagination
            count={data.pagination.totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size={isMobile ? 'small' : 'medium'}
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Paper>
  );
}