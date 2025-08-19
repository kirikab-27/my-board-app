'use client';

import { CustomThemeProvider } from '@/providers/ThemeProvider';

interface ClientThemeProviderProps {
  children: React.ReactNode;
}

export default function ClientThemeProvider({ children }: ClientThemeProviderProps) {
  return (
    <CustomThemeProvider>
      {children}
    </CustomThemeProvider>
  );
}