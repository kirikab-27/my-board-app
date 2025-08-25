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
      <head>
        {/* Phase 5: LCP Optimization - Critical Resource Preloading */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* Phase 5: Font Optimization - CSS with font-display: swap */}
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        
        {/* Phase 5: Material-UI Icons Preload */}
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons&display=swap"
          rel="stylesheet"
        />
        
        {/* Phase 5: DNS Prefetch for External Resources */}
        <link rel="dns-prefetch" href="//res.cloudinary.com" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* Phase 5: Critical CSS Optimization */}
        <style>{`
          /* Critical CSS for above-the-fold content */
          body { 
            margin: 0; 
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background-color: #fafafa;
          }
          
          /* AppBar critical styles */
          .MuiAppBar-root {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1100;
            background-color: #1976d2;
            height: 64px;
          }
          
          /* Loading skeleton critical styles */
          .loading-skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
          }
          
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </head>
      
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
