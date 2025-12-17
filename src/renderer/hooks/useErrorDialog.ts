import { useEffect } from 'react';

import { useAppState, useDispatch } from '../state/store';

export function useErrorDialog() {
  const state = useAppState();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!state.ui.error) {
      return;
    }

    window.electronAPI.showErrorDialog('Error', state.ui.error).then(() => {
      dispatch({ type: 'SET_ERROR', error: null });
    });
  }, [state.ui.error, dispatch]);
}
