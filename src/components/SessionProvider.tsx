'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      // Phase 4: セッション更新頻度最適化
      refetchInterval={10 * 60} // 10分ごとに変更（5分→10分）負荷軽減
      refetchOnWindowFocus={false} // フォーカス時の自動更新を無効化（不要な更新を削減）
    >
      {children}
    </NextAuthSessionProvider>
  );
}