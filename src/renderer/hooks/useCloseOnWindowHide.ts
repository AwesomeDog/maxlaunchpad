import { useEffect } from 'react';

export function useCloseOnWindowHide(close: () => void) {
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        close();
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const unsubscribeWindowHidden = window.electronAPI.onWindowHidden(close);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unsubscribeWindowHidden();
    };
  }, [close]);
}
