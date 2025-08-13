import { Box, Skeleton, Stack, Container, Paper } from '@mui/material';

export default function Loading() {
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Stack spacing={3}>
          {/* アバターとタイトル */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Skeleton variant="circular" width={80} height={80} />
            <Box>
              <Skeleton variant="text" width={200} height={40} />
              <Skeleton variant="text" width={150} height={24} />
            </Box>
          </Box>
          
          {/* プロフィール情報 */}
          <Stack spacing={2}>
            <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 1 }} />
          </Stack>
          
          {/* ボタン */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}