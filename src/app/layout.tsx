import type { Metadata, Viewport } from 'next';
import ClientThemeProvider from '@/components/ThemeProvider';
import { SessionProvider } from '@/components/SessionProvider';
import { PWAInstallPrompt } from '@/components/ui/PWAInstallPrompt';

export const metadata: Metadata = {
  title: 'My Board App',
  description: '掲示板SNSアプリケーション - リアルタイム投稿・コメント・フォロー機能付き',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'My Board App',
  },
  icons: {
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1976d2',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientThemeProvider>
          <SessionProvider>
            {children}
            <PWAInstallPrompt variant="banner" />
          </SessionProvider>
        </ClientThemeProvider>
      </body>
    </html>
  );
}
