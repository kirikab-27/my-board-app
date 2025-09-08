'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Backup as BackupIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminLayoutEnhanced } from '@/components/admin/AdminLayoutEnhanced';
import type { AdminSystemSettings } from '@/types/admin';

/**
 * 管理者システム設定ページ
 * Issue #46 Phase 3: システム設定・運用機能実装
 */
export default function AdminSettingsPage() {
  const { session, isLoading, hasAccess } = useAdminAuth({
    requiredLevel: ['admin'], // 管理者のみ
  });

  const [settings, setSettings] = useState<AdminSystemSettings | null>(null);
  const [, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [ipDialog, setIpDialog] = useState(false);

  // ダミー設定データ（Phase 3実装用）
  useEffect(() => {
    if (!hasAccess) return;

    setLoading(true);

    setTimeout(() => {
      const dummySettings: AdminSystemSettings = {
        security: {
          adminSessionTimeout: 30,
          maxLoginAttempts: 5,
          ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8', '203.0.113.1'],
          twoFactorRequired: false,
        },
        moderation: {
          autoModerationEnabled: true,
          spamDetectionLevel: 'medium',
          autoDeleteThreshold: 5,
          reportThreshold: 3,
        },
        notifications: {
          emailAlerts: true,
          slackWebhook: 'https://hooks.slack.com/services/...',
          criticalAlerts: true,
        },
        maintenance: {
          lastBackup: new Date('2025-09-03T02:00:00'),
          backupFrequency: 'daily',
          systemHealthCheck: true,
        },
      };

      setSettings(dummySettings);
      setLoading(false);
    }, 800);
  }, [hasAccess]);

  const handleSaveSettings = async () => {
    setSaving(true);

    // 実装予定: API呼び出し・設定保存・監査ログ記録
    console.log('システム設定保存:', {
      settings,
      adminId: session?.user?.id,
    });

    setTimeout(() => {
      setSaving(false);
    }, 2000);
  };

  const handleAddIP = () => {
    if (settings && newIP.trim()) {
      setSettings({
        ...settings,
        security: {
          ...settings.security,
          ipWhitelist: [...settings.security.ipWhitelist, newIP.trim()],
        },
      });
      setNewIP('');
      setIpDialog(false);
    }
  };

  const handleRemoveIP = (ip: string) => {
    if (settings) {
      setSettings({
        ...settings,
        security: {
          ...settings.security,
          ipWhitelist: settings.security.ipWhitelist.filter((item) => item !== ip),
        },
      });
    }
  };

  if (isLoading || !hasAccess) {
    return (
      <AdminLayoutEnhanced title="システム設定">
        <Box display="flex" justifyContent="center" mt={4}>
          <Alert severity="warning">
            管理者権限が必要です。adminロールでログインしてください。
          </Alert>
        </Box>
      </AdminLayoutEnhanced>
    );
  }

  if (!settings) {
    return (
      <AdminLayoutEnhanced title="システム設定">
        <Alert severity="error">設定データの取得に失敗しました</Alert>
      </AdminLayoutEnhanced>
    );
  }

  return (
    <AdminLayoutEnhanced title="システム設定">
      <Container maxWidth="lg">
        {/* ヘッダー */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <SettingsIcon color="primary" />
            システム設定・運用管理
          </Typography>

          <Alert severity="warning" sx={{ mb: 2 }}>
            🔒 管理者専用機能: 設定変更はシステム全体に影響します。慎重に操作してください。
          </Alert>
        </Box>

        <Grid container spacing={3}>
          {/* セキュリティ設定 */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardHeader title="セキュリティ設定" avatar={<SecurityIcon color="error" />} />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="セッションタイムアウト（分）"
                    type="number"
                    value={settings.security.adminSessionTimeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          adminSessionTimeout: parseInt(e.target.value),
                        },
                      })
                    }
                    fullWidth
                  />

                  <TextField
                    label="最大ログイン試行回数"
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: {
                          ...settings.security,
                          maxLoginAttempts: parseInt(e.target.value),
                        },
                      })
                    }
                    fullWidth
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.twoFactorRequired}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            security: {
                              ...settings.security,
                              twoFactorRequired: e.target.checked,
                            },
                          })
                        }
                      />
                    }
                    label="2段階認証必須"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* IP制限設定 */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardHeader
                title="IP制限設定"
                action={
                  <Button startIcon={<AddIcon />} onClick={() => setIpDialog(true)}>
                    IP追加
                  </Button>
                }
              />
              <CardContent>
                <List dense>
                  {settings.security.ipWhitelist.map((ip, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={ip} secondary={`許可IP ${index + 1}`} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleRemoveIP(ip)} size="small">
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* システム状態 */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardHeader title="システム状態・運用" avatar={<BackupIcon color="info" />} />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="success.main">
                        正常
                      </Typography>
                      <Typography variant="caption">システム状態</Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6">
                        {settings.maintenance.lastBackup.toLocaleDateString('ja-JP')}
                      </Typography>
                      <Typography variant="caption">最終バックアップ</Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Chip
                        label={settings.maintenance.backupFrequency === 'daily' ? '毎日' : '毎週'}
                        color="primary"
                      />
                      <Typography variant="caption" display="block">
                        バックアップ頻度
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 保存ボタン */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? '保存中...' : '設定を保存'}
          </Button>
        </Box>

        {/* IP追加ダイアログ */}
        <Dialog open={ipDialog} onClose={() => setIpDialog(false)}>
          <DialogTitle>許可IP追加</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="IPアドレス・CIDR"
              fullWidth
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
              placeholder="192.168.1.0/24 または 203.0.113.1"
              helperText="個別IP または CIDR記法で入力"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIpDialog(false)}>キャンセル</Button>
            <Button onClick={handleAddIP} variant="contained">
              追加
            </Button>
          </DialogActions>
        </Dialog>

        {/* 開発ステータス */}
        <Alert severity="info" sx={{ mt: 3 }}>
          🚧 Phase 3実装中: システム設定UI完成・実際の設定保存・バックアップ機能は次のPhase予定
        </Alert>
      </Container>
    </AdminLayoutEnhanced>
  );
}
