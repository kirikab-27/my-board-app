'use client';

// import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  AppBar,
  Toolbar,
} from '@mui/material';
import PostAddIcon from '@mui/icons-material/PostAdd';
import { AuthButton } from '@/components/auth/AuthButton';
import PostForm from '@/components/PostForm';

export default function CreatePostPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const handlePostCreated = () => {
    // PostFormからの投稿完了後の処理
    router.push('/board');
  };

  if (status === 'loading') {
    return (
      <>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              投稿作成
            </Typography>
            <AuthButton />
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}
          >
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  if (!session) {
    router.push('/login?callbackUrl=/board/create');
    return null;
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            投稿作成
          </Typography>
          <AuthButton />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <PostAddIcon color="primary" />
          <Typography variant="h4">新しい投稿を作成</Typography>
        </Box>

        <PostForm 
          onPostCreated={handlePostCreated}
          showTitle={true}
          showHashtags={true}
          showMedia={true}
          maxHashtags={10}
        />
      </Container>
    </>
  );
}
