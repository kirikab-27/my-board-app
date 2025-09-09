'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridToolbar,
  GridPaginationModel,
  GridFilterModel,
  GridSortModel,
  GridRowId,
} from '@mui/x-data-grid';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Alert,
  Snackbar,
  Avatar,
  Typography,
  Stack,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Flag,
  Download,
  AutoFixHigh,
  Refresh,
  Warning,
} from '@mui/icons-material';

interface PostAuthor {
  _id: string;
  name: string;
  email: string;
  username?: string;
}

interface ModerationData {
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  spamScore: number;
  flags: string[];
  reviewedAt?: Date;
  reviewedBy?: string;
}

interface AdminPostView {
  _id: string;
  title?: string;
  content: string;
  author: PostAuthor | string;
  authorName?: string;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  isDeleted?: boolean;
  moderation?: ModerationData;
  tags?: string[];
}

interface PostManagementGridProps {
  initialData?: AdminPostView[];
  onRefresh?: () => void;
}

export default function PostManagementGrid({ initialData = [] }: PostManagementGridProps) {
  const [posts, setPosts] = useState<AdminPostView[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [selectionModel, setSelectionModel] = useState<GridRowId[]>([]);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [totalRows, setTotalRows] = useState(0);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);

  // ダイアログ状態
  const [editDialog, setEditDialog] = useState<AdminPostView | null>(null);
  const [editContent, setEditContent] = useState('');
  const [bulkActionDialog, setBulkActionDialog] = useState<string | null>(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<AdminPostView | null>(null);

  // スナックバー
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // データ取得
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(paginationModel.page + 1),
        limit: String(paginationModel.pageSize),
        sortBy: sortModel[0]?.field || 'createdAt',
        sortOrder: sortModel[0]?.sort || 'desc',
      });

      // フィルター適用
      if (filterModel.items.length > 0) {
        filterModel.items.forEach((item) => {
          if (item.value) {
            params.append(item.field, String(item.value));
          }
        });
      }

      const response = await fetch(`/api/admin/posts?${params}`);

      if (!response.ok) {
        throw new Error(`エラー: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setPosts(result.data.posts);
        setTotalRows(result.data.pagination.totalCount);
      } else {
        throw new Error(result.message || 'データの取得に失敗しました');
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : '投稿データの取得に失敗しました',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, sortModel, filterModel]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // モデレーションステータスの色
  const getModerationColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'flagged':
        return 'warning';
      default:
        return 'default';
    }
  };

  // スパムスコアの色
  const getSpamScoreColor = (score: number) => {
    if (score >= 0.8) return 'error';
    if (score >= 0.5) return 'warning';
    return 'success';
  };

  // カラム定義
  const columns: GridColDef[] = [
    {
      field: 'content',
      headerName: '投稿内容',
      width: 300,
      renderCell: (params) => (
        <Box>
          <Typography
            variant="body2"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'authorName',
      headerName: '投稿者',
      width: 150,
      renderCell: (params) => {
        const author = params.row.author;
        const name = typeof author === 'object' ? author.name : params.value || '不明';
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ width: 24, height: 24 }}>{name.charAt(0).toUpperCase()}</Avatar>
            <Typography variant="body2">{name}</Typography>
          </Stack>
        );
      },
    },
    {
      field: 'moderation',
      headerName: 'ステータス',
      width: 120,
      renderCell: (params) => {
        const status = params.value?.status || 'pending';
        const labels = {
          pending: '確認待ち',
          approved: '承認済み',
          rejected: '却下',
          flagged: '要確認',
        };
        return (
          <Chip
            label={labels[status as keyof typeof labels]}
            color={getModerationColor(status) as 'default' | 'success' | 'error' | 'warning'}
            size="small"
            icon={status === 'flagged' ? <Warning /> : undefined}
          />
        );
      },
    },
    {
      field: 'spamScore',
      headerName: 'スパムスコア',
      width: 120,
      renderCell: (params) => {
        const score = params.row.moderation?.spamScore || 0;
        return (
          <Chip
            label={`${(score * 100).toFixed(0)}%`}
            color={getSpamScoreColor(score) as 'success' | 'warning' | 'error'}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'likes',
      headerName: 'いいね',
      width: 80,
      type: 'number',
    },
    {
      field: 'isPublic',
      headerName: '公開',
      width: 80,
      type: 'boolean',
      renderCell: (params) =>
        params.value ? (
          <Visibility color="primary" fontSize="small" />
        ) : (
          <VisibilityOff color="disabled" fontSize="small" />
        ),
    },
    {
      field: 'createdAt',
      headerName: '投稿日時',
      width: 150,
      type: 'dateTime',
      valueGetter: (value) => (value ? new Date(value) : null),
      renderCell: (params) => (params.value ? new Date(params.value).toLocaleString('ja-JP') : '-'),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '操作',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<Edit />}
          label="編集"
          onClick={() => handleEditPost(params.row)}
        />,
        <GridActionsCellItem
          key="visibility"
          icon={params.row.isPublic ? <VisibilityOff /> : <Visibility />}
          label={params.row.isPublic ? '非公開' : '公開'}
          onClick={() => handleToggleVisibility(params.row)}
        />,
        <GridActionsCellItem
          key="flag"
          icon={<Flag />}
          label="フラグ"
          onClick={() => handleFlagPost(params.row)}
          showInMenu
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete />}
          label="削除"
          onClick={() => setDeleteConfirmDialog(params.row)}
          showInMenu
        />,
      ],
    },
  ];

  // 個別操作ハンドラー
  const handleEditPost = (post: AdminPostView) => {
    setEditDialog(post);
    setEditContent(post.content);
  };

  const handleSaveEdit = async () => {
    if (!editDialog) return;

    try {
      const response = await fetch(`/api/admin/posts/${editDialog._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: '投稿を更新しました',
          severity: 'success',
        });
        setEditDialog(null);
        fetchPosts();
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'エラーが発生しました',
        severity: 'error',
      });
    }
  };

  const handleToggleVisibility = async (post: AdminPostView) => {
    try {
      const response = await fetch(`/api/admin/posts/${post._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !post.isPublic }),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: post.isPublic ? '非公開にしました' : '公開しました',
          severity: 'success',
        });
        fetchPosts();
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'エラーが発生しました',
        severity: 'error',
      });
    }
  };

  const handleFlagPost = async (post: AdminPostView) => {
    try {
      const response = await fetch(`/api/admin/posts/${post._id}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: '投稿にフラグを設定しました',
          severity: 'success',
        });
        fetchPosts();
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'エラーが発生しました',
        severity: 'error',
      });
    }
  };

  const handleDeletePost = async () => {
    if (!deleteConfirmDialog) return;

    try {
      const response = await fetch(`/api/admin/posts/${deleteConfirmDialog._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: '投稿を削除しました',
          severity: 'success',
        });
        setDeleteConfirmDialog(null);
        fetchPosts();
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'エラーが発生しました',
        severity: 'error',
      });
    }
  };

  // 一括操作ハンドラー
  const handleBulkAction = async (action: string) => {
    if (selectionModel.length === 0) {
      setSnackbar({
        open: true,
        message: '投稿を選択してください',
        severity: 'warning',
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/posts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postIds: selectionModel,
          action,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSnackbar({
          open: true,
          message: `${result.data.modifiedCount}件の投稿を処理しました`,
          severity: 'success',
        });
        setBulkActionDialog(null);
        setSelectionModel([]);
        fetchPosts();
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'エラーが発生しました',
        severity: 'error',
      });
    }
  };

  // エクスポート
  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch('/api/admin/posts/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `posts-export-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'エクスポートに失敗しました',
        severity: 'error',
      });
    }
  };

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {/* アクションバー */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AutoFixHigh />}
          onClick={() => setBulkActionDialog('moderate')}
          disabled={selectionModel.length === 0}
        >
          一括モデレーション
        </Button>
        <Button
          variant="outlined"
          startIcon={<VisibilityOff />}
          onClick={() => handleBulkAction('hide')}
          disabled={selectionModel.length === 0}
        >
          一括非公開
        </Button>
        <Button
          variant="outlined"
          startIcon={<Delete />}
          onClick={() => setBulkActionDialog('delete')}
          disabled={selectionModel.length === 0}
          color="error"
        >
          一括削除
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={fetchPosts}>
          <Refresh />
        </IconButton>
        <Button variant="outlined" startIcon={<Download />} onClick={() => handleExport('csv')}>
          CSV
        </Button>
        <Button variant="outlined" startIcon={<Download />} onClick={() => handleExport('json')}>
          JSON
        </Button>
      </Stack>

      {/* 選択状態表示 */}
      {selectionModel.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {selectionModel.length}件の投稿を選択中
        </Alert>
      )}

      {/* DataGrid */}
      <DataGrid
        rows={posts}
        columns={columns}
        getRowId={(row) => row._id}
        loading={loading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        rowCount={totalRows}
        paginationMode="server"
        sortingMode="server"
        filterMode="server"
        onSortModelChange={setSortModel}
        onFilterModelChange={setFilterModel}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={(newModel) => {
          if (Array.isArray(newModel)) {
            setSelectionModel(newModel);
          } else if (newModel && typeof newModel === 'object' && newModel.ids) {
            setSelectionModel(Array.from(newModel.ids));
          } else {
            setSelectionModel([]);
          }
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      />

      {/* 編集ダイアログ */}
      <Dialog open={!!editDialog} onClose={() => setEditDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>投稿内容の編集</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            margin="dense"
            inputProps={{ maxLength: 200 }}
            helperText={`${editContent.length}/200`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(null)}>キャンセル</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={!!deleteConfirmDialog} onClose={() => setDeleteConfirmDialog(null)}>
        <DialogTitle>投稿の削除確認</DialogTitle>
        <DialogContent>
          <DialogContentText>この投稿を削除しますか？この操作は取り消せません。</DialogContentText>
          {deleteConfirmDialog && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {deleteConfirmDialog.content.substring(0, 100)}...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog(null)}>キャンセル</Button>
          <Button onClick={handleDeletePost} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 一括操作ダイアログ */}
      <Dialog open={!!bulkActionDialog} onClose={() => setBulkActionDialog(null)}>
        <DialogTitle>
          {bulkActionDialog === 'moderate' && '一括モデレーション'}
          {bulkActionDialog === 'delete' && '一括削除確認'}
        </DialogTitle>
        <DialogContent>
          {bulkActionDialog === 'moderate' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>モデレーションアクション</InputLabel>
              <Select
                value=""
                label="モデレーションアクション"
                onChange={(e) => {
                  handleBulkAction(e.target.value);
                }}
              >
                <MenuItem value="approve">承認</MenuItem>
                <MenuItem value="reject">却下</MenuItem>
                <MenuItem value="flag">フラグ設定</MenuItem>
              </Select>
            </FormControl>
          )}
          {bulkActionDialog === 'delete' && (
            <Alert severity="warning">
              選択した{selectionModel.length}件の投稿を削除します。 この操作は取り消せません。
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialog(null)}>キャンセル</Button>
          {bulkActionDialog === 'delete' && (
            <Button onClick={() => handleBulkAction('delete')} color="error" variant="contained">
              削除
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
