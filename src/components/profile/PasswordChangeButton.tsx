'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, CircularProgress } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

export function PasswordChangeButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      router.push('/profile/password');
    }, 100);
  };

  return (
    <Button
      onClick={handleClick}
      variant="outlined"
      startIcon={!isLoading ? <LockIcon /> : null}
      disabled={isLoading}
    >
      {isLoading ? (
        <CircularProgress size={24} />
      ) : (
        'パスワード変更'
      )}
    </Button>
  );
}