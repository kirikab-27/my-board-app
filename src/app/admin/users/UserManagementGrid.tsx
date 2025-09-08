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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Avatar,
  Typography,
  Stack,
  IconButton,
} from '@mui/material';
import {
  Edit,
  Delete,
  Block,
  CheckCircle,
  Download,
  AdminPanelSettings,
  PersonOff,
  Refresh,
} from '@mui/icons-material';
import type { AdminUserView } from '@/types/admin';

interface UserManagementGridProps {
  initialData?: AdminUserView[];
  onRefresh?: () => void;
}

export default function UserManagementGrid({ initialData = [] }: UserManagementGridProps) {
  const [users, setUsers] = useState<AdminUserView[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [selectionModel, setSelectionModel] = useState<GridRowId[]>([]);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [totalRows, setTotalRows] = useState(0);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  
  // 一括操作ダイアログ
  const [bulkActionDialog, setBulkActionDialog] = useState<string | null>(null);
  const [bulkActionValue, setBulkActionValue] = useState<string>('');
  
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
  const fetchUsers = useCallback(async () => {
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
        filterModel.items.forEach(item => {
          if (item.value) {
            params.append(item.field, String(item.value));
          }
        });
      }

      const response = await fetch(`/api/admin/users?${params}`);
      
      // HTTPステータスコードチェック
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です。ログインしてください。');
        } else if (response.status === 403) {
          throw new Error('管理者権限が必要です。');
        } else if (response.status === 500) {
          let errorMessage = 'サーバーエラーが発生しました';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // JSONパースエラーを無視
          }
          throw new Error(errorMessage);
        } else {
          throw new Error(`エラー: ${response.status} ${response.statusText}`);
        }
      }
      
      const result = await response.json();

      if (result.success) {
        setUsers(result.data.users);
        setTotalRows(result.data.pagination.totalCount);
      } else {
        throw new Error(result.message || result.error || 'データの取得に失敗しました');
      }
    } catch {
      console.error('Failed to fetch users:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'ユーザーデータの取得に失敗しました',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, sortModel, filterModel]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // カラム定義
  const columns: GridColDef[] = [
    {
      field: 'avatar',
      headerName: '',
      width: 50,
      renderCell: (params) => (
        <Avatar sx={{ width: 32, height: 32 }}>
          {params.row.name?.charAt(0)?.toUpperCase()}
        </Avatar>
      ),
    },
    {
      field: 'name',
      headerName: '名前',
      width: 150,
      editable: false,
    },
    {
      field: 'email',
      headerName: 'メール',
      width: 200,
    },
    {
      field: 'username',
      headerName: 'ユーザー名',
      width: 120,
      renderCell: (params) => params.value ? `@${params.value}` : '-',
    },
    {
      field: 'role',
      headerName: 'ロール',
      width: 120,
      renderCell: (params) => {
        const roleColors = {
          admin: 'error' as const,
          moderator: 'warning' as const,
          user: 'default' as const,
        };
        const roleLabels = {
          admin: '管理者',
          moderator: 'モデレーター',
          user: '一般',
        };
        return (
          <Chip
            label={roleLabels[params.value as keyof typeof roleLabels] || params.value}
            color={roleColors[params.value as keyof typeof roleColors] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      field: 'isVerified',
      headerName: '認証',
      width: 80,
      type: 'boolean',
      renderCell: (params) => (
        params.value ? (
          <CheckCircle color="success" fontSize="small" />
        ) : (
          <PersonOff color="disabled" fontSize="small" />
        )
      ),
    },
    {
      field: 'isOnline',
      headerName: 'ステータス',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'オンライン' : 'オフライン'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'stats',
      headerName: '統計',
      width: 150,
      renderCell: (params) => (
        <Stack direction="column" spacing={0}>
          <Typography variant="caption">
            投稿: {params.value?.postsCount || 0}
          </Typography>
          <Typography variant="caption">
            フォロワー: {params.value?.followersCount || 0}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'createdAt',
      headerName: '登録日',
      width: 120,
      type: 'dateTime',
      valueGetter: (value) => value ? new Date(value) : null,
      renderCell: (params) => 
        params.value ? new Date(params.value).toLocaleDateString('ja-JP') : '-',
    },
    {
      field: 'lastSeen',
      headerName: '最終アクセス',
      width: 120,
      type: 'dateTime',
      valueGetter: (value) => value ? new Date(value) : null,
      renderCell: (params) => 
        params.value ? new Date(params.value).toLocaleDateString('ja-JP') : '-',
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '操作',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<Edit />}
          label="編集"
          onClick={() => handleEditUser(params.row)}
        />,
        <GridActionsCellItem
          key="block"
          icon={<Block />}
          label="停止"
          onClick={() => handleSuspendUser(params.row)}
          showInMenu
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete />}
          label="削除"
          onClick={() => handleDeleteUser(params.row)}
          showInMenu
        />,
      ],
    },
  ];

  // 個別操作ハンドラー
  const handleEditUser = (user: AdminUserView) => {
    console.log('Edit user:', user);
    // TODO: 編集ダイアログ表示
  };

  const handleSuspendUser = async (user: AdminUserView) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: [user._id],
          action: 'suspend',
        }),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'ユーザーを停止しました',
          severity: 'success',
        });
        fetchUsers();
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'エラーが発生しました',
        severity: 'error',
      });
    }
  };

  const handleDeleteUser = async (user: AdminUserView) => {
    if (!confirm(`ユーザー「${user.name}」を削除しますか？`)) return;
    
    // TODO: 削除API実装
    console.log('Delete user:', user);
  };

  // 一括操作ハンドラー
  const handleBulkAction = async () => {
    if (selectionModel.length === 0) {
      setSnackbar({
        open: true,
        message: 'ユーザーを選択してください',
        severity: 'warning',
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectionModel,
          action: bulkActionDialog,
          value: bulkActionValue,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSnackbar({
          open: true,
          message: `${result.data.modifiedCount}件のユーザーを更新しました`,
          severity: 'success',
        });
        setBulkActionDialog(null);
        setSelectionModel([]);
        fetchUsers();
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
      const response = await fetch('/api/admin/users/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${Date.now()}.${format}`;
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
          startIcon={<AdminPanelSettings />}
          onClick={() => setBulkActionDialog('changeRole')}
          disabled={selectionModel.length === 0}
        >
          権限変更
        </Button>
        <Button
          variant="outlined"
          startIcon={<Block />}
          onClick={() => setBulkActionDialog('suspend')}
          disabled={selectionModel.length === 0}
        >
          一括停止
        </Button>
        <Button
          variant="outlined"
          startIcon={<CheckCircle />}
          onClick={() => setBulkActionDialog('verify')}
          disabled={selectionModel.length === 0}
        >
          一括認証
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={fetchUsers}>
          <Refresh />
        </IconButton>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={() => handleExport('csv')}
        >
          CSV
        </Button>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={() => handleExport('json')}
        >
          JSON
        </Button>
      </Stack>

      {/* 選択状態表示 */}
      {selectionModel.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {selectionModel.length}件のユーザーを選択中
        </Alert>
      )}

      {/* DataGrid */}
      <DataGrid
        rows={users}
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
        onRowSelectionModelChange={(newModel: any) => {
          // Handle both array and object format from MUI DataGrid v7
          if (Array.isArray(newModel)) {
            setSelectionModel(newModel);
          } else if (newModel && typeof newModel === 'object' && newModel.ids) {
            // New format with { type: 'include'|'exclude', ids: Set<GridRowId> }
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

      {/* 一括操作ダイアログ */}
      <Dialog open={!!bulkActionDialog} onClose={() => setBulkActionDialog(null)}>
        <DialogTitle>
          {bulkActionDialog === 'changeRole' && '権限の一括変更'}
          {bulkActionDialog === 'suspend' && 'ユーザーの一括停止'}
          {bulkActionDialog === 'verify' && 'ユーザーの一括認証'}
        </DialogTitle>
        <DialogContent>
          {bulkActionDialog === 'changeRole' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>新しいロール</InputLabel>
              <Select
                value={bulkActionValue}
                onChange={(e) => setBulkActionValue(e.target.value)}
                label="新しいロール"
              >
                <MenuItem value="user">一般ユーザー</MenuItem>
                <MenuItem value="moderator">モデレーター</MenuItem>
                <MenuItem value="admin">管理者</MenuItem>
              </Select>
            </FormControl>
          )}
          {bulkActionDialog === 'suspend' && (
            <Alert severity="warning">
              選択した{selectionModel.length}件のユーザーを停止します。
              この操作は元に戻せます。
            </Alert>
          )}
          {bulkActionDialog === 'verify' && (
            <Alert severity="info">
              選択した{selectionModel.length}件のユーザーを認証済みにします。
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialog(null)}>キャンセル</Button>
          <Button onClick={handleBulkAction} variant="contained">
            実行
          </Button>
        </DialogActions>
      </Dialog>

      {/* スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}