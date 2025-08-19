import type { Metadata } from 'next';
import ClientThemeProvider from '@/components/ThemeProvider';
import { SessionProvider } from '@/components/SessionProvider';

export const metadata: Metadata = {
  title: '掲示板アプリ',
  description: 'オープンな掲示板システム',
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
          <SessionProvider>{children}</SessionProvider>
        </ClientThemeProvider>
      </body>
    </html>
  );
}
