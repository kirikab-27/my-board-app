'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  Card,
  CardContent,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  RotateRight as RotateIcon,
  Lock as LockIcon,
  Key as KeyIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AdminLayoutEnhanced } from '@/components/admin/AdminLayoutEnhanced';

interface SecretItem {
  key: string;
  value: string;
  category: string;
  environment: string;
  description?: string;
}

interface Statistics {
  totalSecrets: number;
  encryptedSecrets: number;
  byCategory: Record<string, number>;
  byEnvironment: Record<string, number>;
  recentAccess: any[];
  rotationDue: any[];
}

/**
 * 秘密情報管理ページ
 * Issue #52: 環境変数・秘密鍵管理システムUI
 */
export default function AdminSecretsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 状態管理
  const [tabValue, setTabValue] = useState(0);
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  // ダイアログ状態
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // フォーム状態
  const [formData, setFormData] = useState<SecretItem>({
    key: '',
    value: '',
    category: 'other',
    environment: 'all',
    description: '',
  });

  // 権限チェック
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/login?callbackUrl=/admin/secrets');
      return;
    }

    const userRole = (session.user as any).role;
    if (!['admin', 'super_admin'].includes(userRole)) {
      router.push('/admin/dashboard?error=insufficient-permissions');
      return;
    }
  }, [session, status, router]);

  // データ取得
  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session, tabValue]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (tabValue === 0) {
        // 秘密情報一覧
        const response = await fetch('/api/admin/secrets?action=list');
        if (!response.ok) throw new Error('Failed to fetch secrets');
        const data = await response.json();
        setSecrets(data.data || {});
      } else if (tabValue === 1) {
        // 統計情報
        const response = await fetch('/api/admin/secrets?action=stats');
        if (!response.ok) throw new Error('Failed to fetch statistics');
        const data = await response.json();
        setStatistics(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // 秘密情報の追加
  const handleAdd = async () => {
    try {
      const response = await fetch('/api/admin/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to add secret');

      setAddDialogOpen(false);
      setFormData({
        key: '',
        value: '',
        category: 'other',
        environment: 'all',
        description: '',
      });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add secret');
    }
  };

  // 秘密情報の更新
  const handleUpdate = async () => {
    try {
      const response = await fetch('/api/admin/secrets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update secret');

      setEditDialogOpen(false);
      setFormData({
        key: '',
        value: '',
        category: 'other',
        environment: 'all',
        description: '',
      });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update secret');
    }
  };

  // 秘密情報の削除
  const handleDelete = async (key: string) => {
    if (!confirm(`本当に "${key}" を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/secrets?key=${key}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete secret');

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete secret');
    }
  };

  // ローテーション
  const handleRotate = async (key: string) => {
    const newValue = prompt(`"${key}" の新しい値を入力してください:`);
    if (!newValue) return;

    try {
      const response = await fetch('/api/admin/secrets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: newValue, action: 'rotate' }),
      });

      if (!response.ok) throw new Error('Failed to rotate secret');

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate secret');
    }
  };

  const toggleShowValue = (key: string) => {
    setShowValues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, any> = {
      api_key: 'primary',
      database: 'secondary',
      auth: 'error',
      email: 'info',
      payment: 'warning',
      other: 'default',
    };
    return colors[category] || 'default';
  };

  if (status === 'loading' || loading) {
    return (
      <AdminLayoutEnhanced title="秘密情報管理">
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </AdminLayoutEnhanced>
    );
  }

  const isSuperAdmin = (session?.user as any)?.role === 'super_admin';

  return (
    <AdminLayoutEnhanced title="秘密情報管理">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* ヘッダー */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography
              variant="h4"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <LockIcon />
              秘密情報管理
            </Typography>
            <Typography variant="body2" color="text.secondary">
              環境変数と秘密鍵をAES-256暗号化で安全に管理
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            秘密情報を追加
          </Button>
        </Box>

        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* タブ */}
        <Paper sx={{ mb: 2 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label="秘密情報一覧" icon={<KeyIcon />} iconPosition="start" />
            <Tab label="統計・監査" icon={<TimelineIcon />} iconPosition="start" />
          </Tabs>
        </Paper>

        {/* 秘密情報一覧タブ */}
        {tabValue === 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>キー</TableCell>
                  <TableCell>値</TableCell>
                  <TableCell>カテゴリー</TableCell>
                  <TableCell>環境</TableCell>
                  <TableCell align="center">アクション</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(secrets).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {key}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {showValues[key] ? value : '••••••••'}
                        </Typography>
                        <IconButton size="small" onClick={() => toggleShowValue(key)}>
                          {showValues[key] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          key.includes('DATABASE')
                            ? 'database'
                            : key.includes('API')
                              ? 'api_key'
                              : key.includes('AUTH') || key.includes('SECRET')
                                ? 'auth'
                                : key.includes('SMTP') || key.includes('EMAIL')
                                  ? 'email'
                                  : 'other'
                        }
                        size="small"
                        color={getCategoryColor(
                          key.includes('DATABASE')
                            ? 'database'
                            : key.includes('API')
                              ? 'api_key'
                              : key.includes('AUTH') || key.includes('SECRET')
                                ? 'auth'
                                : key.includes('SMTP') || key.includes('EMAIL')
                                  ? 'email'
                                  : 'other'
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label="all" size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="編集">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setFormData({
                              key,
                              value: '',
                              category: 'other',
                              environment: 'all',
                              description: '',
                            });
                            setEditDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ローテーション">
                        <IconButton size="small" onClick={() => handleRotate(key)}>
                          <RotateIcon />
                        </IconButton>
                      </Tooltip>
                      {isSuperAdmin && (
                        <Tooltip title="削除">
                          <IconButton size="small" color="error" onClick={() => handleDelete(key)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* 統計・監査タブ */}
        {tabValue === 1 && statistics && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 統計カード */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 2,
              }}
            >
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <StorageIcon color="primary" />
                    <Typography variant="h6">総秘密情報数</Typography>
                  </Box>
                  <Typography variant="h3">{statistics.totalSecrets}</Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <SecurityIcon color="success" />
                    <Typography variant="h6">暗号化済み</Typography>
                  </Box>
                  <Typography variant="h3">{statistics.encryptedSecrets}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {statistics.totalSecrets > 0
                      ? `${Math.round((statistics.encryptedSecrets / statistics.totalSecrets) * 100)}%`
                      : '0%'}
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <RotateIcon color="warning" />
                    <Typography variant="h6">ローテーション必要</Typography>
                  </Box>
                  <Typography variant="h3">{statistics.rotationDue?.length || 0}</Typography>
                </CardContent>
              </Card>
            </Box>

            {/* カテゴリー別統計 */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                カテゴリー別分布
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {Object.entries(statistics.byCategory).map(([category, count]) => (
                  <Chip
                    key={category}
                    label={`${category}: ${count}`}
                    color={getCategoryColor(category)}
                  />
                ))}
              </Box>
            </Paper>

            {/* 最近のアクセス */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                最近のアクセスログ
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>キー</TableCell>
                      <TableCell>アクション</TableCell>
                      <TableCell>ユーザー</TableCell>
                      <TableCell>時刻</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statistics.recentAccess?.slice(0, 10).map((log, index) => (
                      <TableRow key={index}>
                        <TableCell>{log.key}</TableCell>
                        <TableCell>
                          <Chip
                            label={log.action}
                            size="small"
                            color={
                              log.action === 'read'
                                ? 'info'
                                : log.action === 'write'
                                  ? 'success'
                                  : log.action === 'delete'
                                    ? 'error'
                                    : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>{log.userId}</TableCell>
                        <TableCell>{new Date(log.timestamp).toLocaleString('ja-JP')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}

        {/* 追加ダイアログ */}
        <Dialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>秘密情報を追加</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="キー"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="値"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                fullWidth
                required
                type="password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => {
                          const input = document.querySelector(
                            'input[type="password"]'
                          ) as HTMLInputElement;
                          if (input) {
                            input.type = input.type === 'password' ? 'text' : 'password';
                          }
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl fullWidth>
                <InputLabel>カテゴリー</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="カテゴリー"
                >
                  <MenuItem value="api_key">APIキー</MenuItem>
                  <MenuItem value="database">データベース</MenuItem>
                  <MenuItem value="auth">認証</MenuItem>
                  <MenuItem value="email">メール</MenuItem>
                  <MenuItem value="payment">決済</MenuItem>
                  <MenuItem value="other">その他</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>環境</InputLabel>
                <Select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  label="環境"
                >
                  <MenuItem value="all">すべて</MenuItem>
                  <MenuItem value="development">開発</MenuItem>
                  <MenuItem value="staging">ステージング</MenuItem>
                  <MenuItem value="production">本番</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="説明（オプション）"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleAdd} variant="contained">
              追加
            </Button>
          </DialogActions>
        </Dialog>

        {/* 編集ダイアログ */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>秘密情報を更新</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField label="キー" value={formData.key} disabled fullWidth />
              <TextField
                label="新しい値"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                fullWidth
                required
                type="password"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleUpdate} variant="contained">
              更新
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AdminLayoutEnhanced>
  );
}
