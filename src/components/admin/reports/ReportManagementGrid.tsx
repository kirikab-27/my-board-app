'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridToolbar,
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
  Alert,
  Snackbar,
  Typography,
  Stack,
} from '@mui/material';
import { Visibility, CheckCircle, Cancel, Refresh, Download } from '@mui/icons-material';

/**
 * 通報管理グリッドコンポーネント
 * Issue #60: レポート・通報システム
 */

interface Report {
  _id: string;
  reportNumber: string;
  reporterId?: string;
  reporterEmail?: string;
  targetType: string;
  targetId: string;
  category: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected' | 'escalated';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ReportManagementGrid() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });
  const [selectedRows, setSelectedRows] = useState<GridRowId[]>([]);
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; report: Report | null }>({
    open: false,
    report: null,
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // データ取得
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(paginationModel.page + 1),
        limit: String(paginationModel.pageSize),
      });

      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) {
        throw new Error('通報一覧の取得に失敗しました');
      }

      const data = await response.json();
      setReports(data.data.reports);
      setTotalCount(data.data.pagination.totalCount);
    } catch (error) {
      console.error('Fetch reports error:', error);
      setSnackbar({
        open: true,
        message: '通報一覧の取得に失敗しました',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [paginationModel]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ステータス変更
  const handleStatusChange = async (reportId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('ステータスの変更に失敗しました');
      }

      await fetchReports();
      setSnackbar({
        open: true,
        message: 'ステータスを変更しました',
        severity: 'success',
      });
    } catch {
      setSnackbar({
        open: true,
        message: 'ステータスの変更に失敗しました',
        severity: 'error',
      });
    }
  };

  // 優先度の色設定
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  // ステータスの色設定
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'reviewing':
        return 'info';
      case 'resolved':
        return 'success';
      case 'rejected':
        return 'default';
      case 'escalated':
        return 'error';
      default:
        return 'default';
    }
  };

  // カラム定義
  const columns: GridColDef[] = [
    {
      field: 'reportNumber',
      headerName: '受付番号',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'category',
      headerName: 'カテゴリー',
      width: 120,
      renderCell: (params) => <Chip label={params.value} size="small" variant="outlined" />,
    },
    {
      field: 'targetType',
      headerName: '対象',
      width: 100,
    },
    {
      field: 'priority',
      headerName: '優先度',
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color={getPriorityColor(params.value) as any} />
      ),
    },
    {
      field: 'status',
      headerName: 'ステータス',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color={getStatusColor(params.value) as any} />
      ),
    },
    {
      field: 'description',
      headerName: '説明',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: '通報日時',
      width: 150,
      valueFormatter: (value) => {
        return new Date(value).toLocaleString('ja-JP');
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'アクション',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<Visibility />}
          label="詳細"
          onClick={() => setDetailDialog({ open: true, report: params.row })}
        />,
        <GridActionsCellItem
          key="resolve"
          icon={<CheckCircle />}
          label="解決"
          onClick={() => handleStatusChange(params.row._id, 'resolved')}
          disabled={params.row.status === 'resolved'}
        />,
        <GridActionsCellItem
          key="reject"
          icon={<Cancel />}
          label="却下"
          onClick={() => handleStatusChange(params.row._id, 'rejected')}
          disabled={params.row.status === 'rejected'}
        />,
      ],
    },
  ];

  // CSVエクスポート
  const handleExportCSV = () => {
    const csvContent = [
      ['受付番号', 'カテゴリー', '対象', '優先度', 'ステータス', '説明', '通報日時'],
      ...reports.map((report) => [
        report.reportNumber,
        report.category,
        report.targetType,
        report.priority,
        report.status,
        report.description,
        new Date(report.createdAt).toLocaleString('ja-JP'),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reports_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* ツールバー */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchReports}>
          更新
        </Button>
        <Button variant="outlined" startIcon={<Download />} onClick={handleExportCSV}>
          CSVエクスポート
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="body2" color="text.secondary">
          総件数: {totalCount}件
        </Typography>
      </Box>

      {/* DataGrid */}
      <DataGrid
        rows={reports}
        columns={columns}
        getRowId={(row) => row._id}
        loading={loading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50, 100]}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection as GridRowId[])}
        rowSelectionModel={selectedRows}
        slots={{
          toolbar: GridToolbar,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          height: 600,
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
        }}
      />

      {/* 詳細ダイアログ */}
      <Dialog
        open={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, report: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>通報詳細 - {detailDialog.report?.reportNumber}</DialogTitle>
        <DialogContent>
          {detailDialog.report && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  カテゴリー
                </Typography>
                <Chip label={detailDialog.report.category} size="small" variant="outlined" />
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  優先度
                </Typography>
                <Chip
                  label={detailDialog.report.priority}
                  size="small"
                  color={getPriorityColor(detailDialog.report.priority) as any}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  ステータス
                </Typography>
                <Chip
                  label={detailDialog.report.status}
                  size="small"
                  color={getStatusColor(detailDialog.report.status) as any}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  説明
                </Typography>
                <Typography variant="body2">{detailDialog.report.description}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  通報対象
                </Typography>
                <Typography variant="body2">
                  {detailDialog.report.targetType} - {detailDialog.report.targetId}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  通報日時
                </Typography>
                <Typography variant="body2">
                  {new Date(detailDialog.report.createdAt).toLocaleString('ja-JP')}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog({ open: false, report: null })}>閉じる</Button>
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
