import { Box, Skeleton, Stack, Container, Grid } from '@mui/material';

export default function Loading() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Stack spacing={4}>
        {/* ヘッダー */}
        <Box>
          <Skeleton variant="text" width={300} height={48} />
          <Skeleton variant="text" width={200} height={24} sx={{ mt: 1 }} />
        </Box>
        
        {/* カードグリッド */}
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton 
                variant="rectangular" 
                width="100%" 
                height={180} 
                sx={{ borderRadius: 2 }}
                animation="wave"
              />
            </Grid>
          ))}
        </Grid>
        
        {/* アクションボタン */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Skeleton variant="rectangular" width={150} height={48} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={150} height={48} sx={{ borderRadius: 1 }} />
        </Box>
      </Stack>
    </Container>
  );
}