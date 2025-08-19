'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Pagination,
  Chip,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import FollowButton from '@/components/follow/FollowButton';

interface FollowUser {
  id: string;
  name: string;
  email: string;
  bio: string;
  role: string;
  followedAt: string;
  createdAt: string;
  isFollowedByCurrentUser: boolean;
  isSelf: boolean;
}

interface FollowListModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  title?: string;
}

export default function FollowListModal({
  open,
  onClose,
  userId,
  type,
  title
}: FollowListModalProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const modalTitle = title || (type === 'followers' ? 'フォロワー' : 'フォロー中');

  // データ取得（useCallbackでメモ化）
  const fetchUsers = useCallback(async (currentPage: number = 1) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `/api/follow/list?userId=${userId}&type=${type}&page=${currentPage}&limit=20`
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.totalCount);
      } else {
        const errorData = await response.json();
        setError(errorData.error || `${modalTitle}一覧の取得に失敗しました`);
      }
    } catch (error) {
      console.error(`${modalTitle}一覧取得エラー:`, error);
      setError(`${modalTitle}一覧の取得中にエラーが発生しました`);
    } finally {
      setLoading(false);
    }
  }, [userId, type, modalTitle]);

  // ページ変更ハンドラー
  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
    fetchUsers(newPage);
  };

  // フォロー状態変更ハンドラー
  const handleFollowChange = (targetUserId: string, isFollowing: boolean) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === targetUserId
          ? { ...user, isFollowedByCurrentUser: isFollowing }
          : user
      )
    );
  };

  // モーダルが開かれた時にデータを取得
  useEffect(() => {
    if (open) {
      setPage(1);
      fetchUsers(1);
    } else {
      // モーダルが閉じられた時にリセット
      setUsers([]);
      setError('');
      setPage(1);
    }
  }, [open, fetchUsers]);

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ロール表示
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'moderator':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '80vh' }
      }}
    >
      {/* ヘッダー */}
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {modalTitle} {totalCount > 0 && `(${totalCount}人)`}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* コンテンツ */}
      <DialogContent dividers sx={{ px: 0 }}>
        {/* エラー表示 */}
        {error && (
          <Box sx={{ px: 3, mb: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {/* ローディング */}
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {/* ユーザー一覧 */}
        {!loading && !error && (
          <>
            {users.length === 0 ? (
              <Box textAlign="center" py={4} px={3}>
                <Typography variant="body1" color="text.secondary">
                  {modalTitle}がいません
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {users.map((user, index) => (
                  <ListItem key={user.id} divider={index < users.length - 1}>
                    <ListItemAvatar>
                      <ProfileAvatar name={user.name} size="medium" />
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" component="span">
                            {user.name}
                          </Typography>
                          <Chip
                            label={getRoleLabel(user.role)}
                            size="small"
                            color={getRoleColor(user.role) as any}
                            sx={{ height: 20 }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          {user.bio && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {user.bio}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(user.followedAt)} から{type === 'followers' ? 'フォロー' : 'フォロー中'}
                          </Typography>
                        </Box>
                      }
                    />

                    <ListItemSecondaryAction>
                      {!user.isSelf && (
                        <FollowButton
                          targetUserId={user.id}
                          targetUserName={user.name}
                          size="small"
                          variant="outlined"
                          onFollowChange={(isFollowing) =>
                            handleFollowChange(user.id, isFollowing)
                          }
                        />
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}

            {/* ページネーション */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" py={2}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="medium"
                />
              </Box>
            )}
          </>
        )}
      </DialogContent>

      {/* フッター */}
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
}