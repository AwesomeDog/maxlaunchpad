import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { hideWindowOnSuccess = false } = options ?? {};
  const isDragDropMode = useAppState().ui.isDragDropMode;

  return useCallback(
    async (keyConfig: KeyConfig) => {
      // Check for UWP app + runAsAdmin combination (not supported by Windows)
      if (keyConfig.runAsAdmin && isWindowsUwpApp(keyConfig.filePath)) {
        void window.electronAPI.showErrorDialog(
          t('errors.notSupportedTitle'),
          t('errors.uwpRunAsAdminUnsupported'),
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
        const errorMessage = error instanceof Error ? error.message : t('errors.unknownError');
        const title = t('errors.launchFailedTitle');
        const content = t('errors.launchFailedMessage', {
          target: keyConfig.label || keyConfig.filePath,
          message: errorMessage,
        });

        void window.electronAPI.showErrorDialog(title, content);
      }
    },
    [hideWindowOnSuccess, isDragDropMode, t],
  );
}
