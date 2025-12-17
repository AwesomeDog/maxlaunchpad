import { useEffect } from 'react';

import { APP_NAME } from '../../shared/constants';
import { useAppState } from '../state/store';

export function useWindowTitle() {
  const state = useAppState();
  const profilePath = state.settings?.activeProfilePath;
  const isDirty = state.ui.isConfigDirty;

  useEffect(() => {
    if (!profilePath) return;

    const baseTitle = `${APP_NAME} - ${profilePath}`;
    document.title = isDirty ? `${baseTitle} *` : baseTitle;
  }, [profilePath, isDirty]);
}
