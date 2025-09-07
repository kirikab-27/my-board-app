'use client';

/**
 * 監査ログ管理画面
 * Issue #55: 監査ログシステム
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Search,
  VerifiedUser,
  Warning,
  Error,
  Info,
  Archive,
  CheckCircle,
  Cancel,
  Visibility,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface AuditLog {
  _id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  targetId?: string;
  targetType?: string;
  details?: any;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
  hash: string;
  previousHash?: string;
  signature?: string;
  archived: boolean;
  archivedAt?: string;
  retentionDate: string;
}

export default function AuditLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ページネーション
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  
  // フィルター
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    userId: '',
    startDate: '',
    endDate: '',
    archived: false,
  });
  
  // チェーン検証
  const [chainValid, setChainValid] = useState<boolean | null>(null);
  const [verifyDialog, setVerifyDialog] = useState(false);
  
  // 詳細表示
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || (session.user as any).role !== 'admin') {
      router.push('/');
      return;
    }
    
    fetchLogs();
  }, [session, status, page, rowsPerPage, filters]);
  
  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value) acc[key] = value.toString();
          return acc;
        }, {} as Record<string, string>),
      });
      
      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setLogs(data.logs);
        setTotalCount(data.pagination.totalCount);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('監査ログの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyChain = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-chain',
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        }),
      });
      
      const result = await response.json();
      setChainValid(result.valid);
      
      if (!result.valid) {
        setError(`チェーン検証失敗: ログID ${result.brokenAt} で改ざんを検出`);
      }
    } catch (err) {
      setError('チェーン検証に失敗しました');
    }
  };
  
  const handleArchive = async () => {
    if (!confirm('90日以前のログをアーカイブしますか？')) return;
    
    try {
      const response = await fetch('/api/admin/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive',
          daysOld: 90,
        }),
      });
      
      const result = await response.json();
      if (response.ok) {
        alert(`${result.archivedCount}件のログをアーカイブしました`);
        fetchLogs();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('アーカイブ処理に失敗しました');
    }
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <Error />;
      case 'HIGH': return <Warning />;
      case 'MEDIUM': return <Info />;
      case 'LOW': return <CheckCircle />;
      default: return null;
    }
  };
  
  return (
    <AdminLayout title="監査ログ管理">
      <Box sx={{ p: 3 }}>
      
      {/* 統計カード */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                総ログ数
              </Typography>
              <Typography variant="h5">
                {totalCount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                チェーン検証
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {chainValid === null ? (
                  <Typography variant="h6">未検証</Typography>
                ) : chainValid ? (
                  <>
                    <CheckCircle color="success" />
                    <Typography variant="h6" color="success.main">
                      正常
                    </Typography>
                  </>
                ) : (
                  <>
                    <Cancel color="error" />
                    <Typography variant="h6" color="error.main">
                      異常
                    </Typography>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* フィルター */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small" sx={{ minWidth: 150 }}>
              <InputLabel>タイプ</InputLabel>
              <Select
                value={filters.type}
                label="タイプ"
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value="AUTH_FAILURE">認証失敗</MenuItem>
                <MenuItem value="PERMISSION_DENIED">権限拒否</MenuItem>
                <MenuItem value="XSS_ATTEMPT">XSS試行</MenuItem>
                <MenuItem value="CSRF_VIOLATION">CSRF違反</MenuItem>
                <MenuItem value="RATE_LIMIT">レート制限</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl fullWidth size="small" sx={{ minWidth: 150 }}>
              <InputLabel>重要度</InputLabel>
              <Select
                value={filters.severity}
                label="重要度"
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value="CRITICAL">CRITICAL</MenuItem>
                <MenuItem value="HIGH">HIGH</MenuItem>
                <MenuItem value="MEDIUM">MEDIUM</MenuItem>
                <MenuItem value="LOW">LOW</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="開始日"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="終了日"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Search />}
              onClick={fetchLogs}
            >
              検索
            </Button>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<VerifiedUser />}
            onClick={() => setVerifyDialog(true)}
          >
            チェーン検証
          </Button>
          <Button
            variant="outlined"
            startIcon={<Archive />}
            onClick={handleArchive}
          >
            アーカイブ実行
          </Button>
        </Box>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* ログテーブル */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>日時</TableCell>
              <TableCell>重要度</TableCell>
              <TableCell>タイプ</TableCell>
              <TableCell>ユーザー</TableCell>
              <TableCell>IPアドレス</TableCell>
              <TableCell>パス</TableCell>
              <TableCell>結果</TableCell>
              <TableCell>署名</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log._id}>
                <TableCell>
                  {format(new Date(log.timestamp), 'yyyy/MM/dd HH:mm:ss')}
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    icon={getSeverityIcon(log.severity)}
                    label={log.severity}
                    color={getSeverityColor(log.severity) as any}
                  />
                </TableCell>
                <TableCell>{log.type}</TableCell>
                <TableCell>{log.userEmail || '-'}</TableCell>
                <TableCell>{log.ip}</TableCell>
                <TableCell>{log.path}</TableCell>
                <TableCell>
                  {log.success ? (
                    <CheckCircle color="success" fontSize="small" />
                  ) : (
                    <Cancel color="error" fontSize="small" />
                  )}
                </TableCell>
                <TableCell>
                  {log.signature ? (
                    <VerifiedUser color="primary" fontSize="small" />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Tooltip title="詳細表示">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedLog(log);
                        setDetailDialog(true);
                      }}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[25, 50, 100]}
        />
      </TableContainer>
      
      {/* チェーン検証ダイアログ */}
      <Dialog open={verifyDialog} onClose={() => setVerifyDialog(false)}>
        <DialogTitle>監査ログチェーン検証</DialogTitle>
        <DialogContent>
          <Typography>
            指定期間の監査ログチェーンを検証します。
            改ざんがないことを確認できます。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyDialog(false)}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              handleVerifyChain();
              setVerifyDialog(false);
            }}
          >
            検証実行
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 詳細ダイアログ */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>監査ログ詳細</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                基本情報
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  ID: {selectedLog._id}
                </Typography>
                <Typography variant="body2">
                  日時: {format(new Date(selectedLog.timestamp), 'yyyy/MM/dd HH:mm:ss')}
                </Typography>
                <Typography variant="body2">
                  ユーザー: {selectedLog.userEmail || '-'} ({selectedLog.userRole || '-'})
                </Typography>
                <Typography variant="body2">
                  IP: {selectedLog.ip}
                </Typography>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                セキュリティ情報
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  ハッシュ: {selectedLog.hash}
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  前のハッシュ: {selectedLog.previousHash || '-'}
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  署名: {selectedLog.signature || '-'}
                </Typography>
              </Box>
              
              {selectedLog.details && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    詳細データ
                  </Typography>
                  <Box sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                    <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </AdminLayout>
  );
}