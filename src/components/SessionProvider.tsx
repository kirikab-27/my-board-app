'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      // セッション自動更新設定
      refetchInterval={5 * 60} // 5分ごとに自動でセッション更新
      refetchOnWindowFocus={true} // ウィンドウフォーカス時にセッション更新
    >
      {children}
    </NextAuthSessionProvider>
  );
}