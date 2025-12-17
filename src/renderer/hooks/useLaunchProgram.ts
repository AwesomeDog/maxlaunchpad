import { useCallback } from 'react';

import type { KeyConfig } from '../../shared/types';
import { isWindowsUwpApp } from '../../shared/utils';
import { useAppState } from '../state/store';

interface UseLaunchProgramOptions {
  /** If true, hide the window after successful launch (unless in drag-drop mode) */
  hideWindowOnSuccess?: boolean;
}

/**
 * Hook that provides a function to launch programs with error handling.
 * When launch fails, displays a native OS error dialog.
 */
export function useLaunchProgram(options?: UseLaunchProgramOptions) {
  const { hideWindowOnSuccess = false } = options ?? {};
  const isDragDropMode = useAppState().ui.isDragDropMode;

  return useCallback(
    async (keyConfig: KeyConfig) => {
      // Check for UWP app + runAsAdmin combination (not supported by Windows)
      if (keyConfig.runAsAdmin && isWindowsUwpApp(keyConfig.filePath)) {
        void window.electronAPI.showErrorDialog(
          'Not Supported',
          'UWP apps do not support running as administrator. This is a Windows limitation.\n\nPlease disable "Run as Admin" for this shortcut.',
        );
        return;
      }

      try {
        await window.electronAPI.launchProgram(keyConfig);
        // Don't hide window in drag-drop mode
        if (hideWindowOnSuccess && !isDragDropMode) {
          void window.electronAPI.hideWindow();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const title = 'Launch Failed';
        const content = `Failed to launch "${keyConfig.label || keyConfig.filePath}":\n\n${errorMessage}`;

        void window.electronAPI.showErrorDialog(title, content);
      }
    },
    [hideWindowOnSuccess, isDragDropMode],
  );
}
