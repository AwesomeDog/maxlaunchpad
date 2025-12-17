import { useEffect } from 'react';

import { useAppState } from '../state/store';

/**
 * Hook for theme management
 * - Applies 'dark-mode' class to document root based on settings
 * - Supports 'light', 'dark', and 'system' themes
 * - System theme follows OS preference in real-time
 */
export function useTheme() {
  const state = useAppState();
  const theme = state.settings?.theme;

  useEffect(() => {
    const root = document.documentElement;

    function applyTheme(isDark: boolean) {
      root.classList.toggle('dark-mode', isDark);
    }

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(media.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    }

    applyTheme(theme === 'dark');
  }, [theme]);
}
