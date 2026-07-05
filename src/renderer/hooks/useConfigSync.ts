import { useEffect, useRef } from 'react';

import i18n from '../i18n';
import { useAppState, useDispatch } from '../state/store';

export function useConfigSync() {
  const state = useAppState();
  const dispatch = useDispatch();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!state.ui.isConfigDirty || !state.settings || !state.profile) {
      return;
    }

    const configRevision = state.ui.configRevision;

    const timer = setTimeout(async () => {
      try {
        await window.electronAPI.saveSettings(state.settings!);
        await window.electronAPI.saveProfile(state.profile!, state.settings!.activeProfilePath);
        dispatch({ type: 'SET_CONFIG_DIRTY', dirty: false, revision: configRevision });
      } catch {
        dispatch({ type: 'SET_ERROR', error: i18n.t('errors.failedToSaveConfiguration') });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [state.settings, state.profile, state.ui.isConfigDirty, state.ui.configRevision, dispatch]);
}
