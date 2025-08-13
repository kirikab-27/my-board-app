'use client';

import { Container, Typography, Paper, Box } from '@mui/material';
import { AuthGuard } from '@/components/auth/AuthGuardImproved';

export default function MembersOnlyPage() {
  return (
    <AuthGuard>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            会員限定ページ
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="body1" paragraph>
              このページは認証済みユーザーのみがアクセスできます。
            </Typography>
            
            <Typography variant="body1" paragraph>
              未認証の状態でアクセスした場合、ログインページにリダイレクトされ、
              ログイン成功後に自動的にこのページに戻ってきます。
            </Typography>
            
            <Typography variant="h6" sx={{ mt: 4 }}>
              会員限定コンテンツ
            </Typography>
            
            <Typography variant="body1">
              ここに会員限定のコンテンツが表示されます。
            </Typography>
          </Box>
        </Paper>
      </Container>
    </AuthGuard>
  );
}