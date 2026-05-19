'use client';

import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
  useTheme,
} from 'next-themes';
import { useEffect } from 'react';

const THEME_COOKIE = 'gotovo-theme';

function ThemeCookieSync() {
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    const value = theme === 'system' ? (resolvedTheme ?? 'light') : (theme ?? 'light');
    // biome-ignore lint/suspicious/noDocumentCookie: theme cookie sync, no user content
    document.cookie = `${THEME_COOKIE}=${value};path=/;max-age=31536000;SameSite=Lax`;
  }, [theme, resolvedTheme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeCookieSync />
      {children}
    </NextThemesProvider>
  );
}
