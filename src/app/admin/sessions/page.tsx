'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Devices,
  Computer,
  Smartphone,
  Tablet,
  DeviceUnknown,
  LocationOn,
  Warning,
  Block,
  Logout,
  Security,
  Refresh,
} from '@mui/icons-material';
import { AdminLayoutEnhanced } from '@/components/admin/AdminLayoutEnhanced';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * セッション管理ページ
 * Issue #54: セキュアセッション管理システム
 */
export default function SessionManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    sessionId?: string;
    all?: boolean;
  }>({ open: false });

  // 権限チェック
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/login?callbackUrl=/admin/sessions');
      return;
    }

    const userRole = (session.user as any).role;
    if (!['admin', 'moderator'].includes(userRole)) {
      router.push('/dashboard?error=insufficient-permissions');
      return;
    }
  }, [session, status, router]);

  // セッション一覧取得
  useEffect(() => {
    if (session?.user) {
      fetchSessions();
    }
  }, [session]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/sessions');
      if (!response.ok) {
        throw new Error('セッション情報の取得に失敗しました');
      }
      const data = await response.json();
      setSessions(data.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // セッション無効化
  const handleInvalidateSession = async () => {
    if (!deleteDialog.sessionId && !deleteDialog.all) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: deleteDialog.sessionId,
          all: deleteDialog.all,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'セッション無効化に失敗しました');
      }

      setSuccess(data.message);
      setDeleteDialog({ open: false });

      // 全セッション無効化の場合はログアウト
      if (deleteDialog.all) {
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        fetchSessions();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // デバイスアイコン取得
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop':
        return <Computer />;
      case 'mobile':
        return <Smartphone />;
      case 'tablet':
        return <Tablet />;
      default:
        return <DeviceUnknown />;
    }
  };

  // デバイスタイプのラベル取得
  const getDeviceLabel = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop':
        return 'デスクトップ';
      case 'mobile':
        return 'モバイル';
      case 'tablet':
        return 'タブレット';
      default:
        return '不明';
    }
  };

  if (status === 'loading') {
    return (
      <AdminLayoutEnhanced title="セッション管理">
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </AdminLayoutEnhanced>
    );
  }

  if (!session?.user || !['admin', 'moderator'].includes((session.user as any).role)) {
    return null;
  }

  return (
    <AdminLayoutEnhanced title="セッション管理">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* ヘッダー */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <Devices sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4">セッション管理</Typography>
                <Typography variant="body2" color="text.secondary">
                  ログイン中のデバイスとセッションを管理
                </Typography>
              </Box>
            </Box>
            <Box>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Logout />}
                onClick={() => setDeleteDialog({ open: true, all: true })}
                disabled={loading}
              >
                すべてのデバイスからログアウト
              </Button>
              <IconButton onClick={fetchSessions} disabled={loading} sx={{ ml: 1 }}>
                <Refresh />
              </IconButton>
            </Box>
          </Box>
        </Paper>

        {/* エラー・成功メッセージ */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* セッション統計 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" color="primary">
                {sessions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                アクティブセッション
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {sessions.filter((s) => s.securityFlags?.suspicious).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                不審なセッション
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {sessions.filter((s) => s.twoFactorVerified).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                2FA検証済み
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* セッション一覧 */}
        {loading ? (
          <Box display="flex" justifyContent="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : sessions.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">アクティブなセッションがありません</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sessions.map((sessionItem) => (
              <Card
                key={sessionItem.id}
                sx={{
                  borderLeft: sessionItem.isCurrent ? '4px solid' : 'none',
                  borderLeftColor: 'primary.main',
                  opacity: sessionItem.securityFlags?.blocked ? 0.6 : 1,
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center">
                      <Box sx={{ mr: 2 }}>
                        {sessionItem.securityFlags?.suspicious ? (
                          <Badge badgeContent={<Warning />} color="warning">
                            {getDeviceIcon(sessionItem.deviceInfo.deviceType)}
                          </Badge>
                        ) : (
                          getDeviceIcon(sessionItem.deviceInfo.deviceType)
                        )}
                      </Box>
                      <Box>
                        <Typography variant="h6">
                          {sessionItem.deviceInfo.browser} - {sessionItem.deviceInfo.os}
                          {sessionItem.isCurrent && (
                            <Chip
                              label="現在のセッション"
                              size="small"
                              color="primary"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={2} mt={1}>
                          <Chip
                            icon={<Devices />}
                            label={getDeviceLabel(sessionItem.deviceInfo.deviceType)}
                            size="small"
                            variant="outlined"
                          />
                          <Typography variant="body2" color="text.secondary">
                            IP: {sessionItem.deviceInfo.ipAddress}
                          </Typography>
                          {sessionItem.location?.city && (
                            <Typography variant="body2" color="text.secondary">
                              <LocationOn fontSize="small" sx={{ verticalAlign: 'middle' }} />
                              {sessionItem.location.city}, {sessionItem.location.country}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>

                    <Box textAlign="right">
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        {sessionItem.twoFactorVerified && (
                          <Tooltip title="2FA検証済み">
                            <Chip icon={<Security />} label="2FA" size="small" color="success" />
                          </Tooltip>
                        )}
                        {sessionItem.securityFlags?.suspicious && (
                          <Tooltip title={sessionItem.securityFlags.suspiciousReason}>
                            <Chip icon={<Warning />} label="不審" size="small" color="warning" />
                          </Tooltip>
                        )}
                        {sessionItem.securityFlags?.blocked && (
                          <Chip icon={<Block />} label="ブロック済み" size="small" color="error" />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        最終アクティビティ:{' '}
                        {format(new Date(sessionItem.lastActivity), 'yyyy/MM/dd HH:mm', {
                          locale: ja,
                        })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        有効期限:{' '}
                        {format(new Date(sessionItem.expiresAt), 'yyyy/MM/dd HH:mm', {
                          locale: ja,
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                {!sessionItem.isCurrent && (
                  <CardActions sx={{ justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Logout />}
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          sessionId: sessionItem.id,
                        })
                      }
                      disabled={loading || sessionItem.securityFlags?.blocked}
                    >
                      ログアウト
                    </Button>
                  </CardActions>
                )}
              </Card>
            ))}
          </Box>
        )}

        {/* 削除確認ダイアログ */}
        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false })}>
          <DialogTitle>
            {deleteDialog.all ? 'すべてのセッションを終了' : 'セッションを終了'}
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning">
              {deleteDialog.all
                ? 'すべてのデバイスからログアウトされます。再度ログインが必要になります。'
                : 'このデバイスからログアウトされます。'}
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false })}>キャンセル</Button>
            <Button onClick={handleInvalidateSession} color="error" variant="contained">
              {deleteDialog.all ? 'すべて終了' : '終了'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AdminLayoutEnhanced>
  );
}
