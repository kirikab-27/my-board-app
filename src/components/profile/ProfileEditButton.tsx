'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

export function ProfileEditButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      router.push('/profile/edit');
    }, 100);
  };

  return (
    <Button
      onClick={handleClick}
      variant="contained"
      startIcon={!isLoading ? <EditIcon /> : null}
      disabled={isLoading}
    >
      {isLoading ? (
        <CircularProgress size={24} color="inherit" />
      ) : (
        'プロフィール編集'
      )}
    </Button>
  );
}