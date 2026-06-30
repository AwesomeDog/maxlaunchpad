import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppState, useDispatch } from '../state/store';

export function useErrorDialog() {
  const { t } = useTranslation();
  const state = useAppState();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!state.ui.error) {
      return;
    }

    window.electronAPI.showErrorDialog(t('errors.genericTitle'), state.ui.error).then(() => {
      dispatch({ type: 'SET_ERROR', error: null });
    });
  }, [state.ui.error, dispatch, t]);
}
