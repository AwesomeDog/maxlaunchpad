import { useEffect } from 'react';

import { useAppState, useDispatch } from '../state/store';

/**
 * Hook for window show behavior
 * - Handles activeTabOnShow setting when window becomes visible
 * - If not 'lastUsed', switches to the specified tab
 *
 * Implementation note:
 * We listen to IPC WINDOW_SHOWN event from main process instead of DOM events because:
 * - visibilitychange: Not triggered by Electron's BrowserWindow.show()/hide()
 * - focus: Triggers on any focus gain (e.g., clicking window, switching from other apps),
 *   not just when window is explicitly shown via hotkey or tray
 */
export function useWindowBehavior() {
  const state = useAppState();
  const dispatch = useDispatch();

  useEffect(() => {
    return window.electronAPI.onWindowShown(() => {
      if (state.settings) {
        const activeTabOnShow = state.settings.activeTabOnShow;
        if (activeTabOnShow !== 'lastUsed') {
          dispatch({ type: 'SET_ACTIVE_TAB', tabId: activeTabOnShow });
        }
      }
    });
  }, [state.settings, dispatch]);
}
