'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Alert,
  Box,
  Typography,
  Container,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function VerifiedPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }

    // 5秒後に自動でログインページへリダイレクト
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, searchParams]);

  const handleLoginNow = () => {
    router.push('/login');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Card sx={{ maxWidth: 500, width: '100%', mx: 'auto' }}>
        <CardHeader sx={{ textAlign: 'center', pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <CheckCircleIcon 
              sx={{ 
                fontSize: 64, 
                color: 'success.main',
                animation: 'pulse 2s infinite'
              }} 
            />
          </Box>
          <Typography variant="h5" component="h1" gutterBottom>
            メール認証完了
          </Typography>
        </CardHeader>
        
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'center' }}>
            <Alert severity="success" sx={{ textAlign: 'left' }}>
              <Typography variant="h6" gutterBottom>
                🎉 認証が完了しました！
              </Typography>
              {email && (
                <Typography variant="body2" color="text.secondary">
                  {email} の認証が正常に完了しました。
                </Typography>
              )}
            </Alert>

            <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="body1" gutterBottom>
                アカウントが有効化されました。これで掲示板の全ての機能をご利用いただけます：
              </Typography>
              <Box sx={{ textAlign: 'left', mt: 2 }}>
                <Typography variant="body2" color="text.secondary" component="div">
                  ✅ 投稿の作成・編集・削除<br />
                  ✅ いいね機能<br />
                  ✅ 投稿検索・並び替え<br />
                  ✅ プロフィール管理
                </Typography>
              </Box>
            </Box>

            <Alert severity="info">
              <Typography variant="body2">
                ウェルカムメールもお送りしております。メールボックスをご確認ください。
              </Typography>
            </Alert>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleLoginNow}
              sx={{ py: 1.5 }}
            >
              ログインする
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                {countdown}秒後に自動でログインページへ移動します
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}