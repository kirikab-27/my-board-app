'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { Security, Lock } from '@mui/icons-material';

/**
 * 2FA検証ページ（ログイン後）
 * Issue #53: 2FA管理者ログインシステム
 */
export default function TwoFactorVerificationPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBackupCode, setIsBackupCode] = useState(false);

  useEffect(() => {
    // セッション確認
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/login');
      return;
    }

    // 既に2FA検証済みの場合
    if ((session as any).twoFactorVerified) {
      router.push(callbackUrl);
    }
  }, [session, status, router, callbackUrl]);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '認証に失敗しました');
      }

      // セッション更新（2FA検証フラグを設定）
      await update({ twoFactorVerified: true });

      // 成功メッセージ表示後にリダイレクト
      if (data.isBackupCode) {
        setIsBackupCode(true);
        // 入力フィールドをクリア
        setCode('');
        // 2秒後にリダイレクト
        setTimeout(() => {
          router.push(callbackUrl);
        }, 2000);
      } else {
        // 通常の認証は即座にリダイレクト
        router.push(callbackUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  if (status === 'loading') {
    return (
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center" mt={10}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          {/* ヘッダー */}
          <Box textAlign="center" mb={3}>
            <Security sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              2段階認証
            </Typography>
            <Typography variant="body2" color="text.secondary">
              認証アプリに表示される6桁のコードを入力してください
            </Typography>
          </Box>

          {/* エラー表示 */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* バックアップコード使用通知 */}
          {isBackupCode && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              バックアップコードで認証されました。
              新しいバックアップコードの生成を検討してください。
            </Alert>
          )}

          {/* 認証コード入力 */}
          <TextField
            fullWidth
            label="認証コード"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
            placeholder="000000"
            sx={{ mb: 3 }}
            inputProps={{ 
              maxLength: 20, // バックアップコードも考慮
              style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.2rem' }
            }}
            autoFocus
            disabled={loading}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && code.length >= 6) {
                handleVerify();
              }
            }}
          />

          {/* ボタン */}
          <Box>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<Lock />}
              onClick={handleVerify}
              disabled={loading || code.length < 6 || isBackupCode}
              sx={{ mb: 2 }}
            >
              {loading ? '認証中...' : isBackupCode ? 'リダイレクト中...' : '認証する'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={handleLogout}
              disabled={loading}
            >
              ログアウト
            </Button>
          </Box>

          {/* ヘルプ */}
          <Box mt={3} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              認証アプリにアクセスできませんか？
            </Typography>
            <Typography variant="body2" color="text.secondary">
              バックアップコードを使用して認証できます
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}