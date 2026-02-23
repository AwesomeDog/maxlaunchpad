import { useEffect, useRef } from 'react';

import { useAppState, useDispatch } from '../state/store';

/**
 * Hook for window behavior
 * - Handles activeTabOnShow setting when window becomes visible
 * - Handles window resize to persist window size
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

  // Use ref to access latest settings in event callbacks without re-registering listeners
  const settingsRef = useRef(state.settings);
  settingsRef.current = state.settings;

  // Handle activeTabOnShow when window is shown
  useEffect(() => {
    return window.electronAPI.onWindowShown(() => {
      const settings = settingsRef.current;
      if (settings) {
        const activeTabOnShow = settings.activeTabOnShow;
        if (activeTabOnShow !== 'lastUsed') {
          dispatch({ type: 'SET_ACTIVE_TAB', tabId: activeTabOnShow });
        }
      }
    });
  }, [dispatch]);

  // Handle window resize to update settings (will be saved by useConfigSync)
  useEffect(() => {
    return window.electronAPI.onWindowResized((width, height) => {
      const settings = settingsRef.current;
      if (settings) {
        const currentSize = settings.windowSize;
        if (currentSize.width !== width || currentSize.height !== height) {
          dispatch({
            type: 'UPDATE_SETTINGS',
            settings: { windowSize: { width, height } },
          });
        }
      }
    });
  }, [dispatch]);
}
