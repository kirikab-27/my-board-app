'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Security,
  QrCode2,
  ContentCopy,
  Check,
  Warning,
  Refresh,
  Delete,
  LockOpen,
  Lock,
} from '@mui/icons-material';
import { AdminLayout } from '@/components/admin/AdminLayout';

/**
 * 2FA設定ページ
 * Issue #53: 2FA管理者ログインシステム
 */
export default function TwoFactorAuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [setupData, setSetupData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  // 権限チェック
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/login?callbackUrl=/admin/security/2fa');
      return;
    }

    const userRole = (session.user as any).role;
    if (!['admin', 'moderator'].includes(userRole)) {
      router.push('/dashboard?error=insufficient-permissions');
      return;
    }
  }, [session, status, router]);

  // 2FA状態確認
  useEffect(() => {
    if (session?.user) {
      check2FAStatus();
    }
  }, [session]);

  const check2FAStatus = async () => {
    try {
      const response = await fetch('/api/admin/2fa/status');
      if (response.ok) {
        const data = await response.json();
        setIs2FAEnabled(data.isEnabled);
      }
    } catch (error) {
      console.error('Failed to check 2FA status:', error);
    }
  };

  // 2FAセットアップ開始
  const startSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/2fa/setup');
      if (!response.ok) {
        throw new Error('セットアップの開始に失敗しました');
      }
      const data = await response.json();
      setSetupData(data.data);
      setActiveStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 2FA有効化
  const enable2FA = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationCode }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '2FA有効化に失敗しました');
      }

      setSuccess('2FAが正常に有効化されました');
      setIs2FAEnabled(true);
      setActiveStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 2FA無効化
  const disable2FA = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/2fa/disable', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('2FA無効化に失敗しました');
      }

      setSuccess('2FAが無効化されました');
      setIs2FAEnabled(false);
      setShowDisableDialog(false);
      setActiveStep(0);
      setSetupData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // クリップボードにコピー
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'loading') {
    return (
      <AdminLayout title="2段階認証設定">
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (!session?.user || !['admin', 'moderator'].includes((session.user as any).role)) {
    return null;
  }

  return (
    <AdminLayout title="2段階認証設定">
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {/* ヘッダー */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <Security sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4">2段階認証（2FA）</Typography>
                <Typography variant="body2" color="text.secondary">
                  アカウントのセキュリティを強化します
                </Typography>
              </Box>
            </Box>
            <Chip
              icon={is2FAEnabled ? <Lock /> : <LockOpen />}
              label={is2FAEnabled ? '有効' : '無効'}
              color={is2FAEnabled ? 'success' : 'default'}
              variant={is2FAEnabled ? 'filled' : 'outlined'}
            />
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

        {/* 2FA設定済みの場合 */}
        {is2FAEnabled && !setupData && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                2段階認証は有効です
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                あなたのアカウントは2段階認証で保護されています。
                ログイン時に認証アプリまたはバックアップコードが必要です。
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => setShowDisableDialog(true)}
              >
                2FAを無効化
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 2FA未設定の場合 */}
        {!is2FAEnabled && !setupData && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                2段階認証を設定
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                2段階認証を有効にすると、ログイン時にパスワードに加えて
                認証アプリからのコードが必要になります。
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Security />}
                onClick={startSetup}
                disabled={loading}
              >
                セットアップを開始
              </Button>
            </CardContent>
          </Card>
        )}

        {/* セットアップステッパー */}
        {setupData && (
          <Stepper activeStep={activeStep} orientation="vertical">
            <Step>
              <StepLabel>認証アプリの準備</StepLabel>
              <StepContent>
                <Typography paragraph>
                  スマートフォンに認証アプリ（Google Authenticator、Microsoft Authenticatorなど）を
                  インストールしてください。
                </Typography>
                <Button variant="contained" onClick={() => setActiveStep(1)}>
                  次へ
                </Button>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>QRコードをスキャン</StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  <Typography paragraph>
                    認証アプリでQRコードをスキャンしてください：
                  </Typography>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <img
                      src={setupData.qrCodeUrl}
                      alt="2FA QR Code"
                      style={{ maxWidth: '300px', border: '1px solid #ddd', padding: '10px' }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    QRコードをスキャンできない場合は、以下のキーを手動で入力してください：
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TextField
                      fullWidth
                      value={setupData.secret}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <IconButton onClick={() => copyToClipboard(setupData.secret)}>
                            {copied ? <Check color="success" /> : <ContentCopy />}
                          </IconButton>
                        ),
                      }}
                    />
                  </Box>
                </Box>
                <Button variant="contained" onClick={() => setActiveStep(2)}>
                  次へ
                </Button>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>認証コードを入力</StepLabel>
              <StepContent>
                <Typography paragraph>
                  認証アプリに表示される6桁のコードを入力してください：
                </Typography>
                <TextField
                  fullWidth
                  label="認証コード"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  sx={{ mb: 2 }}
                  inputProps={{ maxLength: 6 }}
                />
                <Box>
                  <Button
                    variant="contained"
                    onClick={enable2FA}
                    disabled={loading || verificationCode.length !== 6}
                  >
                    2FAを有効化
                  </Button>
                  <Button sx={{ ml: 1 }} onClick={() => setActiveStep(1)}>
                    戻る
                  </Button>
                </Box>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>バックアップコード</StepLabel>
              <StepContent>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  以下のバックアップコードを安全な場所に保管してください。
                  認証アプリにアクセスできない場合に使用できます。
                </Alert>
                <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                  <List dense>
                    {setupData.backupCodes.map((code: string, index: number) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Typography>{index + 1}.</Typography>
                        </ListItemIcon>
                        <ListItemText primary={code} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setActiveStep(0);
                      setSetupData(null);
                      setVerificationCode('');
                    }}
                  >
                    完了
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        )}

        {/* 無効化確認ダイアログ */}
        <Dialog open={showDisableDialog} onClose={() => setShowDisableDialog(false)}>
          <DialogTitle>2FAを無効化しますか？</DialogTitle>
          <DialogContent>
            <Alert severity="warning">
              2段階認証を無効化すると、アカウントのセキュリティレベルが低下します。
              本当に無効化しますか？
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDisableDialog(false)}>キャンセル</Button>
            <Button onClick={disable2FA} color="error" variant="contained">
              無効化する
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AdminLayout>
  );
}