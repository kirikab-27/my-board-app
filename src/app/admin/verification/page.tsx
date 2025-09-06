'use client';

import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Send as SendIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminAuth } from '@/hooks/useAdminAuth';

/**
 * 管理者検証コード生成ページ
 * Issue #50: 検証コードシステムの完成
 */
export default function AdminVerificationPage() {
  const { session, isLoading, hasAccess } = useAdminAuth({
    requiredLevel: ['admin']
  });

  // フォーム状態
  const [email, setEmail] = useState('');
  const [verificationType, setVerificationType] = useState<string>('admin_registration');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  // 検証コード生成処理
  const handleGenerateCode = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setGeneratedCode(null);

    try {
      const response = await fetch('/api/admin/verification/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          type: verificationType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '検証コードの生成に失敗しました');
      }

      setGeneratedCode(data.code);
      setSuccess(`検証コードを生成し、${email}にメールを送信しました`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // クリップボードにコピー
  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setSuccess('検証コードをクリップボードにコピーしました');
    }
  };

  if (isLoading || !hasAccess) {
    return (
      <AdminLayout title="検証コード管理">
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="検証コード管理">
      <Container maxWidth="md">
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" />
          検証コード管理
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            検証コード生成
          </Typography>
          
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleGenerateCode(); }}>
            <TextField
              fullWidth
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
              disabled={loading}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>検証タイプ</InputLabel>
              <Select
                value={verificationType}
                onChange={(e) => setVerificationType(e.target.value)}
                label="検証タイプ"
                disabled={loading}
              >
                <MenuItem value="admin_registration">管理者登録</MenuItem>
                <MenuItem value="password_reset">パスワードリセット</MenuItem>
                <MenuItem value="2fa">2要素認証</MenuItem>
                <MenuItem value="email_verification">メール認証</MenuItem>
              </Select>
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
              disabled={loading || !email}
              fullWidth
            >
              {loading ? '生成中...' : '検証コード生成・送信'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}

          {generatedCode && (
            <Card sx={{ mt: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  生成された検証コード
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h3" component="span" sx={{ fontFamily: 'monospace', letterSpacing: 2 }}>
                    {generatedCode}
                  </Typography>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<CopyIcon />}
                    onClick={handleCopyCode}
                    size="small"
                  >
                    コピー
                  </Button>
                </Box>
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  有効期限: 15分間
                </Typography>
              </CardContent>
            </Card>
          )}
        </Paper>

        <Alert severity="info">
          <Typography variant="subtitle2" gutterBottom>
            使用方法
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>管理者登録: 新規管理者を招待する際に使用</li>
            <li>パスワードリセット: ユーザーのパスワード再設定時に使用</li>
            <li>2要素認証: ログイン時の追加認証として使用</li>
            <li>メール認証: メールアドレスの確認時に使用</li>
          </ul>
        </Alert>
      </Container>
    </AdminLayout>
  );
}