'use client';

import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  IconButton,
  Snackbar,
  Typography,
  useTheme,
  useMediaQuery,
  Slide,
  Fade
} from '@mui/material';
import {
  GetApp as InstallIcon,
  Close as CloseIcon,
  PhoneAndroid as MobileIcon,
  Computer as DesktopIcon
} from '@mui/icons-material';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

interface PWAInstallPromptProps {
  variant?: 'banner' | 'snackbar';
  autoShow?: boolean;
  sessionKey?: string;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  variant = 'banner',
  autoShow = true,
  sessionKey = 'pwa-install-prompt-dismissed'
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installing, setInstalling] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // PWAインストールプロンプトのイベントリスナー
    const handleBeforeInstallPrompt = (e: Event) => {
      // デフォルトブラウザプロンプトを防ぐ
      e.preventDefault();
      
      const installEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(installEvent);
      
      // セッション内で既に閉じられていないかチェック
      const dismissed = sessionStorage.getItem(sessionKey);
      if (!dismissed && autoShow) {
        setShowPrompt(true);
      }
    };

    // アプリがすでにインストールされているかチェック
    const handleAppInstalled = () => {
      console.log('✅ PWA App installed successfully');
      setDeferredPrompt(null);
      setShowPrompt(false);
      setInstalling(false);
      
      // インストール成功通知を表示する場合はここで実装
    };

    // イベントリスナーを追加
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // クリーンアップ
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [autoShow, sessionKey]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setInstalling(true);
    
    try {
      // インストールプロンプトを表示
      await deferredPrompt.prompt();
      
      // ユーザーの選択結果を待つ
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`PWA install outcome: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted PWA installation');
      } else {
        console.log('❌ User dismissed PWA installation');
      }
      
      // プロンプト状態をリセット
      setDeferredPrompt(null);
      setShowPrompt(false);
      
    } catch (error) {
      console.error('❌ PWA installation error:', error);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // セッション内で再表示を防ぐ
    sessionStorage.setItem(sessionKey, 'true');
  };

  const getBrowserName = (): string => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return 'Chrome';
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('safari')) return 'Safari';
    if (userAgent.includes('edge')) return 'Edge';
    return 'ブラウザ';
  };

  // プロンプトを表示する条件をチェック
  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  const InstallContent = () => (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {isMobile ? <MobileIcon color="primary" /> : <DesktopIcon color="primary" />}
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          My Board App をインストール
        </Typography>
      </Box>
      
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        {isMobile ? 
          'ホーム画面に追加して、アプリのようにすばやくアクセスできます。' :
          'デスクトップにインストールして、アプリのようにすばやくアクセスできます。'
        }
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<InstallIcon />}
          onClick={handleInstallClick}
          disabled={installing}
          size="small"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          {installing ? 'インストール中...' : 'インストール'}
        </Button>
        
        <Button
          variant="text"
          size="small"
          onClick={handleDismiss}
          sx={{ 
            color: 'text.secondary',
            textTransform: 'none'
          }}
        >
          後で
        </Button>
      </Box>
    </>
  );

  if (variant === 'snackbar') {
    return (
      <Snackbar
        open={showPrompt}
        anchorOrigin={{ 
          vertical: 'bottom', 
          horizontal: isMobile ? 'center' : 'left' 
        }}
        sx={{ 
          bottom: { xs: 16, sm: 24 },
          left: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 'auto' }
        }}
      >
        <Alert 
          severity="info"
          sx={{ 
            width: '100%',
            maxWidth: 400,
            borderRadius: 2,
            boxShadow: theme.shadows[8]
          }}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleDismiss}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          <InstallContent />
        </Alert>
      </Snackbar>
    );
  }

  // Banner variant (default)
  return (
    <Slide direction="down" in={showPrompt} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          top: { xs: 60, sm: 70 }, // ヘッダー下に配置
          left: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: theme.zIndex.snackbar - 1,
          maxWidth: { sm: 500, md: 600 },
          mx: 'auto'
        }}
      >
        <Fade in={showPrompt}>
          <Alert
            severity="info"
            sx={{
              borderRadius: 3,
              boxShadow: theme.shadows[12],
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper',
              '& .MuiAlert-icon': {
                color: 'primary.main'
              }
            }}
            action={
              <IconButton
                size="small"
                aria-label="close"
                onClick={handleDismiss}
                sx={{ color: 'text.secondary' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            <InstallContent />
          </Alert>
        </Fade>
      </Box>
    </Slide>
  );
};

export default PWAInstallPrompt;