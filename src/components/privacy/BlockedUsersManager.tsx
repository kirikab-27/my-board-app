'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Chip,
  Pagination,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Block as BlockIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';

interface BlockedUser {
  _id: string;
  blockedUser: {
    id: string;
    username: string;
    name: string;
    avatar?: string;
  };
  reason?: string;
  createdAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const BlockedUsersManager: React.FC = () => {
  const { data: session } = useSession();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // ユーザーブロック用の状態
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blocking, setBlocking] = useState(false);

  // ブロックリスト読み込み
  useEffect(() => {
    if (session?.user?.id) {
      fetchBlockedUsers(1);
    }
  }, [session]);

  const fetchBlockedUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/privacy/block?page=${page}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setBlockedUsers(data.blocks || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('ブロックリストの読み込みに失敗:', error);
      setMessage({ type: 'error', text: 'ブロックリストの読み込みに失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  // ユーザー検索
  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(`/api/users?search=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('ユーザー検索に失敗:', error);
    } finally {
      setSearching(false);
    }
  };

  // ユーザーブロック
  const handleBlockUser = async () => {
    if (!selectedUser) return;

    try {
      setBlocking(true);
      const response = await fetch('/api/privacy/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: selectedUser._id,
          reason: blockReason.trim(),
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `${selectedUser.name}をブロックしました` });
        setBlockDialogOpen(false);
        setSelectedUser(null);
        setBlockReason('');
        setSearchQuery('');
        setSearchResults([]);
        fetchBlockedUsers(1);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'ブロックに失敗しました' });
      }
    } catch (error) {
      console.error('ブロック処理に失敗:', error);
      setMessage({ type: 'error', text: 'ブロック処理に失敗しました' });
    } finally {
      setBlocking(false);
    }
  };

  // ブロック解除
  const handleUnblockUser = async (blockedUser: BlockedUser) => {
    if (!confirm(`${blockedUser.blockedUser.name}のブロックを解除しますか？`)) {
      return;
    }

    try {
      setUnblocking(blockedUser._id);
      const response = await fetch(`/api/privacy/block?targetUserId=${blockedUser.blockedUser.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `${blockedUser.blockedUser.name}のブロックを解除しました` });
        fetchBlockedUsers(pagination?.currentPage || 1);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'ブロック解除に失敗しました' });
      }
    } catch (error) {
      console.error('ブロック解除に失敗:', error);
      setMessage({ type: 'error', text: 'ブロック解除に失敗しました' });
    } finally {
      setUnblocking(null);
    }
  };

  // 検索実行
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchUsers(searchQuery);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {message && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 2 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* ヘッダー */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" display="flex" alignItems="center" gap={1}>
          <BlockIcon color="primary" />
          ブロック済みユーザー
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setBlockDialogOpen(true)}
        >
          ユーザーをブロック
        </Button>
      </Box>

      {/* ブロックリスト */}
      {blockedUsers.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
              ブロック済みユーザーはいません
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <List>
            {blockedUsers.map((blockedUser, index) => (
              <React.Fragment key={blockedUser._id}>
                <ListItem>
                  <ListItemAvatar>
                    {blockedUser.blockedUser.avatar ? (
                      <Avatar src={blockedUser.blockedUser.avatar} />
                    ) : (
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">
                          {blockedUser.blockedUser.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @{blockedUser.blockedUser.username}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box mt={0.5}>
                        {blockedUser.reason && (
                          <Chip 
                            label={blockedUser.reason} 
                            size="small" 
                            variant="outlined" 
                            sx={{ mr: 1, mb: 0.5 }}
                          />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {new Date(blockedUser.createdAt).toLocaleDateString('ja-JP')}にブロック
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleUnblockUser(blockedUser)}
                      disabled={unblocking === blockedUser._id}
                      startIcon={unblocking === blockedUser._id ? <CircularProgress size={16} /> : <DeleteIcon />}
                    >
                      {unblocking === blockedUser._id ? '解除中...' : 'ブロック解除'}
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < blockedUsers.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Card>
      )}

      {/* ページネーション */}
      {pagination && pagination.totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage}
            onChange={(e, page) => fetchBlockedUsers(page)}
            color="primary"
          />
        </Box>
      )}

      {/* ユーザーブロック ダイアログ */}
      <Dialog 
        open={blockDialogOpen} 
        onClose={() => setBlockDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>ユーザーをブロック</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            ブロックしたいユーザーを検索してください。ブロックすると、お互いの投稿やプロフィールが見えなくなります。
          </DialogContentText>

          {/* ユーザー検索 */}
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="ユーザーを検索"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.length >= 2) {
                  searchUsers(e.target.value);
                } else {
                  setSearchResults([]);
                }
              }}
              InputProps={{
                endAdornment: searching && <CircularProgress size={20} />,
              }}
              placeholder="名前またはユーザー名を入力"
            />
          </Box>

          {/* 検索結果 */}
          {searchResults.length > 0 && (
            <List sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
              {searchResults.map((user) => (
                <ListItem
                  key={user._id}
                  component="div"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setSelectedUser(user)}
                >
                  <ListItemAvatar>
                    {user.avatar ? (
                      <Avatar src={user.avatar} sx={{ width: 32, height: 32 }} />
                    ) : (
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <PersonIcon />
                      </Avatar>
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.name}
                    secondary={`@${user.username}`}
                  />
                </ListItem>
              ))}
            </List>
          )}

          {/* 選択されたユーザー */}
          {selectedUser && (
            <Card sx={{ mb: 2, bgcolor: 'action.selected' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  ブロック対象ユーザー
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  {selectedUser.avatar ? (
                    <Avatar src={selectedUser.avatar} />
                  ) : (
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  )}
                  <Box>
                    <Typography variant="subtitle2">{selectedUser.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{selectedUser.username}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* ブロック理由 */}
          {selectedUser && (
            <TextField
              fullWidth
              label="ブロック理由（任意）"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              multiline
              rows={2}
              placeholder="スパム、嫌がらせ、不適切なコンテンツなど"
              inputProps={{ maxLength: 500 }}
              helperText={`${blockReason.length}/500文字`}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={handleBlockUser}
            disabled={!selectedUser || blocking}
            startIcon={blocking ? <CircularProgress size={16} /> : <BlockIcon />}
          >
            {blocking ? 'ブロック中...' : 'ブロック'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};