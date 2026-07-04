import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { normalizeLanguage } from '../i18n';
import { useAppState, useDispatch } from '../state/store';

export function useConfigSync() {
  const { i18n, t } = useTranslation();
  const state = useAppState();
  const dispatch = useDispatch();
  const isFirstRender = useRef(true);
  const configuredLanguage = normalizeLanguage(state.settings?.language);

  useEffect(() => {
    if (!state.settings || i18n.resolvedLanguage === configuredLanguage) {
      return;
    }

    void i18n.changeLanguage(configuredLanguage);
  }, [configuredLanguage, i18n, state.settings]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!state.ui.isConfigDirty || !state.settings || !state.profile) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        await window.electronAPI.saveSettings(state.settings!);
        await window.electronAPI.saveProfile(state.profile!, state.settings!.activeProfilePath);
        dispatch({ type: 'SET_CONFIG_DIRTY', dirty: false });
      } catch {
        dispatch({ type: 'SET_ERROR', error: t('errors.failedToSaveConfiguration') });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [state.settings, state.profile, state.ui.isConfigDirty, dispatch, t]);
}
