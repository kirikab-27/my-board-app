'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminLayoutEnhanced } from '@/components/admin/AdminLayoutEnhanced';
import type { AdminUserView } from '@/types/admin';

/**
 * 管理者ユーザー管理ページ
 * Issue #46 Phase 2: ユーザー管理機能実装
 */
export default function AdminUsersPage() {
  const { session, isLoading, hasAccess } = useAdminAuth({
    requiredLevel: ['admin', 'moderator'],
  });

  // 状態管理
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  // 検索・フィルタ
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter] = useState<string>('all');

  // ページング
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // UI状態
  const [selectedUser, setSelectedUser] = useState<AdminUserView | null>(null);
  const [actionMenu, setActionMenu] = useState<null | HTMLElement>(null);
  const [actionDialog, setActionDialog] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ユーザーデータ取得
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
        search: searchTerm,
        role: roleFilter !== 'all' ? roleFilter : '',
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) {
        throw new Error('ユーザー一覧の取得に失敗しました');
      }

      const result = await response.json();
      setUsers(result.data.users);
      setTotalCount(result.data.pagination.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasAccess) return;
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess, page, rowsPerPage, searchTerm, roleFilter]);

  // アクションハンドラー
  const handleUserAction = async (action: string, user: AdminUserView) => {
    setActionLoading(true);
    setActionDialog(action);
    setSelectedUser(user);

    // 実装予定: API呼び出し・監査ログ記録
    console.log('管理者操作:', { action, userId: user._id, adminId: session?.user?.id });

    setTimeout(() => {
      setActionLoading(false);
      setActionDialog(null);
      setActionMenu(null);
    }, 2000);
  };

  const getRoleChip = (role: string) => {
    const colors = {
      admin: 'error',
      moderator: 'warning',
      user: 'default',
    } as const;

    return (
      <Chip
        label={role === 'admin' ? '管理者' : role === 'moderator' ? 'モデレーター' : '一般'}
        color={colors[role as keyof typeof colors]}
        size="small"
      />
    );
  };

  const getStatusIcon = (user: AdminUserView) => {
    if (user.moderation.reportCount > 0) {
      return (
        <Tooltip title={`報告${user.moderation.reportCount}件`}>
          <BlockIcon color="error" />
        </Tooltip>
      );
    }
    if (user.isVerified) {
      return (
        <Tooltip title="認証済み">
          <CheckCircleIcon color="success" />
        </Tooltip>
      );
    }
    return (
      <Tooltip title="未認証">
        <PersonIcon color="disabled" />
      </Tooltip>
    );
  };

  if (isLoading || !hasAccess) {
    return (
      <AdminLayoutEnhanced title="ユーザー管理">
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </AdminLayoutEnhanced>
    );
  }

  return (
    <AdminLayoutEnhanced title="ユーザー管理">
      <Container maxWidth="lg">
        {/* ヘッダー・検索 */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <PersonIcon color="primary" />
            ユーザー管理
          </Typography>

          {/* 検索バー */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              placeholder="名前・メールアドレス・ユーザー名で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button variant="outlined" startIcon={<FilterIcon />}>
              フィルタ
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              エクスポート
            </Button>
          </Box>
        </Box>

        {/* ユーザー一覧テーブル */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>状態</TableCell>
                  <TableCell>ユーザー情報</TableCell>
                  <TableCell>権限</TableCell>
                  <TableCell>統計</TableCell>
                  <TableCell>最終活動</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(user)}
                        {user.isOnline && <Chip label="オンライン" color="success" size="small" />}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{user.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                        {user.username && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            @{user.username}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>{getRoleChip(user.role)}</TableCell>

                    <TableCell>
                      <Box sx={{ fontSize: '0.875rem' }}>
                        <div>投稿: {user.stats.postsCount}</div>
                        <div>フォロワー: {user.stats.followersCount}</div>
                        <div>いいね: {user.stats.likesReceived}</div>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption">
                        {user.lastSeen
                          ? new Date(user.lastSeen).toLocaleDateString('ja-JP')
                          : '不明'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <IconButton
                        onClick={(e) => {
                          setActionMenu(e.currentTarget);
                          setSelectedUser(user);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* ページング */}
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="表示件数:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </Paper>

        {/* アクションメニュー */}
        <Menu anchorEl={actionMenu} open={Boolean(actionMenu)} onClose={() => setActionMenu(null)}>
          <MenuItem onClick={() => handleUserAction('view_details', selectedUser!)}>
            詳細表示
          </MenuItem>
          <MenuItem onClick={() => handleUserAction('suspend', selectedUser!)}>一時停止</MenuItem>
          <MenuItem onClick={() => handleUserAction('change_role', selectedUser!)}>
            権限変更
          </MenuItem>
          {session?.user?.role === 'admin' && (
            <MenuItem
              onClick={() => handleUserAction('delete', selectedUser!)}
              sx={{ color: 'error.main' }}
            >
              削除
            </MenuItem>
          )}
        </Menu>

        {/* 操作確認ダイアログ */}
        <Dialog open={Boolean(actionDialog)} onClose={() => setActionDialog(null)}>
          <DialogTitle>
            {actionDialog === 'suspend' && '一時停止の確認'}
            {actionDialog === 'delete' && '削除の確認'}
            {actionDialog === 'change_role' && '権限変更の確認'}
          </DialogTitle>
          <DialogContent>
            {selectedUser && (
              <Box>
                <Typography>ユーザー「{selectedUser.name}」に対する操作を実行しますか？</Typography>
                <Alert severity="warning" sx={{ mt: 2 }}>
                  この操作は監査ログに記録されます。
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActionDialog(null)}>キャンセル</Button>
            <Button variant="contained" color="error" disabled={actionLoading}>
              {actionLoading ? <CircularProgress size={20} /> : '実行'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 開発ステータス */}
        <Alert severity="info" sx={{ mt: 3 }}>
          🚧 Phase 2実装中: ダミーデータ表示・API統合は次のPhaseで実装予定
        </Alert>
      </Container>
    </AdminLayoutEnhanced>
  );
}
