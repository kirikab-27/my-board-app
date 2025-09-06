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
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import type { IAuditLog, AdminAction } from '@/types/admin';

/**
 * 管理者監査ログページ
 * Issue #46 Phase 3: 監査ログ・操作記録・透明性確保
 */
export default function AdminLogsPage() {
  const { session, isLoading, hasAccess } = useAdminAuth({
    requiredLevel: ['admin', 'moderator', 'audit']
  });

  // 状態管理
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 検索・フィルタ
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [adminFilter, setAdminFilter] = useState<string>('all');
  
  // ページング
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // ダミー監査ログデータ（Phase 3実装用）
  useEffect(() => {
    if (!hasAccess) return;

    setLoading(true);
    
    setTimeout(() => {
      const dummyLogs: IAuditLog[] = [
        {
          _id: '1',
          adminUserId: session?.user?.id || '1',
          action: 'user.suspend',
          targetType: 'user',
          targetId: '2',
          metadata: {
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0...',
            requestData: { reason: 'スパム行為', duration: 7 },
            changes: { before: { status: 'active' }, after: { status: 'suspended' } },
            sessionId: 'sess_123456'
          },
          result: 'success',
          timestamp: new Date('2025-09-03T10:30:00')
        },
        {
          _id: '2',
          adminUserId: session?.user?.id || '1',
          action: 'post.delete',
          targetType: 'post',
          targetId: '5',
          metadata: {
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0...',
            requestData: { reason: '不適切なコンテンツ' },
            sessionId: 'sess_123456'
          },
          result: 'success',
          timestamp: new Date('2025-09-03T09:15:00')
        },
        {
          _id: '3',
          adminUserId: session?.user?.id || '1',
          action: 'system.login',
          targetType: 'system',
          metadata: {
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0...',
            sessionId: 'sess_123456'
          },
          result: 'success',
          timestamp: new Date('2025-09-03T08:00:00')
        },
        {
          _id: '4',
          adminUserId: 'unknown',
          action: 'user.role_change',
          targetType: 'user',
          targetId: '3',
          metadata: {
            ipAddress: '10.0.0.50',
            userAgent: 'Mozilla/5.0...',
            requestData: { oldRole: 'user', newRole: 'admin' },
            sessionId: 'sess_789012'
          },
          result: 'failure',
          timestamp: new Date('2025-09-02T16:45:00')
        }
      ];
      
      setLogs(dummyLogs);
      setTotalCount(dummyLogs.length);
      setLoading(false);
    }, 1000);
  }, [hasAccess, session]);

  // アクションの日本語表示
  const getActionLabel = (action: AdminAction | string) => {
    const labels: Record<string, string> = {
      'user.view': 'ユーザー表示',
      'user.edit': 'ユーザー編集', 
      'user.suspend': 'ユーザー停止',
      'user.delete': 'ユーザー削除',
      'user.role_change': '権限変更',
      'post.view': '投稿表示',
      'post.hide': '投稿非表示',
      'post.delete': '投稿削除',
      'post.restore': '投稿復活',
      'system.login': 'システムログイン',
      'system.logout': 'システムログアウト',
      'system.settings': 'システム設定変更'
    };
    return labels[action] || action;
  };

  // 結果の表示
  const getResultChip = (result: string) => {
    const config = {
      success: { label: '成功', color: 'success' as const, icon: <CheckCircleIcon /> },
      failure: { label: '失敗', color: 'error' as const, icon: <ErrorIcon /> },
      partial: { label: '部分的', color: 'warning' as const, icon: <InfoIcon /> }
    };
    
    const item = config[result as keyof typeof config] || config.success;
    return (
      <Chip 
        label={item.label} 
        color={item.color} 
        size="small" 
        icon={item.icon}
      />
    );
  };

  // エクスポート処理
  const handleExport = () => {
    console.log('監査ログエクスポート:', { 
      searchTerm, 
      actionFilter, 
      resultFilter,
      adminId: session?.user?.id 
    });
    // 実装予定: CSV・JSON形式でのエクスポート
  };

  if (isLoading || !hasAccess) {
    return (
      <AdminLayout title="監査ログ">
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="監査ログ">
      <Container maxWidth="lg">
        {/* ヘッダー・検索 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon color="primary" />
            監査ログ・操作履歴
          </Typography>
          
          {/* 検索・フィルタバー */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="管理者名・操作・対象IDで検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 300 }}
            />
            
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>操作</InputLabel>
              <Select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                label="操作"
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="user">ユーザー操作</MenuItem>
                <MenuItem value="post">投稿操作</MenuItem>
                <MenuItem value="system">システム操作</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>結果</InputLabel>
              <Select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                label="結果"
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="success">成功</MenuItem>
                <MenuItem value="failure">失敗</MenuItem>
                <MenuItem value="partial">部分的</MenuItem>
              </Select>
            </FormControl>
            
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              エクスポート
            </Button>
          </Box>
        </Box>

        {/* 監査ログ統計 */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            本日の監査統計
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h4" color="primary">
                {logs.filter(log => log.result === 'success').length}
              </Typography>
              <Typography variant="caption">成功操作</Typography>
            </Box>
            <Box>
              <Typography variant="h4" color="error">
                {logs.filter(log => log.result === 'failure').length}
              </Typography>
              <Typography variant="caption">失敗操作</Typography>
            </Box>
            <Box>
              <Typography variant="h4" color="warning">
                {logs.filter(log => log.action.includes('delete')).length}
              </Typography>
              <Typography variant="caption">削除操作</Typography>
            </Box>
          </Box>
        </Paper>

        {/* 監査ログテーブル */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>時刻</TableCell>
                  <TableCell>管理者</TableCell>
                  <TableCell>操作</TableCell>
                  <TableCell>対象</TableCell>
                  <TableCell>結果</TableCell>
                  <TableCell>詳細</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log) => (
                  <TableRow key={String(log._id)} hover>
                    <TableCell>
                      <Typography variant="caption">
                        {log.timestamp.toLocaleString('ja-JP')}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="subtitle2">
                        {log.adminUserId === session?.user?.id ? '自分' : `ID: ${log.adminUserId}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        IP: {log.metadata.ipAddress}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={getActionLabel(log.action)} 
                        size="small"
                        color={log.action.includes('delete') ? 'error' : 'default'}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="caption">
                        {log.targetType}
                        {log.targetId && `: ${log.targetId}`}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      {getResultChip(log.result)}
                    </TableCell>
                    
                    <TableCell>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="caption">詳細</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ fontSize: '0.75rem' }}>
                            <div><strong>セッション:</strong> {log.metadata.sessionId}</div>
                            <div><strong>ブラウザ:</strong> {log.metadata.userAgent.substring(0, 50)}...</div>
                            {log.metadata.requestData && (
                              <div><strong>リクエスト:</strong> {JSON.stringify(log.metadata.requestData)}</div>
                            )}
                            {log.metadata.changes && (
                              <div><strong>変更:</strong> {JSON.stringify(log.metadata.changes)}</div>
                            )}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="表示件数:"
          />
        </Paper>

        {/* 開発ステータス */}
        <Alert severity="info" sx={{ mt: 3 }}>
          🚧 Phase 3実装中: 監査ログUI完成・実際のログ記録・エクスポート機能は次のPhase予定
        </Alert>
      </Container>
    </AdminLayout>
  );
}