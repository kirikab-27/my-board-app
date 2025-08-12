import { Box, CircularProgress, Typography, Skeleton, Stack } from '@mui/material';

export default function Loading() {
  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* ヘッダー部分のスケルトン */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
        </Box>
        
        {/* 検索バーのスケルトン */}
        <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
        
        {/* 投稿リストのスケルトン */}
        {[1, 2, 3].map((index) => (
          <Skeleton 
            key={index}
            variant="rectangular" 
            width="100%" 
            height={120} 
            sx={{ borderRadius: 2 }}
            animation="wave"
          />
        ))}
        
        {/* ローディングインジケーター */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={40} />
        </Box>
      </Stack>
    </Box>
  );
}