import { DEFAULT_HIDE_ELEMENTS } from '../../../shared/constants';
import type { AppSettings, KeyboardProfile } from '../../../shared/types';
import { initialState, reducer } from '../store';

const settings: AppSettings = {
  hotkey: { modifiers: ['Alt'], key: '`' },
  activeTabOnShow: 'lastUsed',
  activeProfilePath: 'C:\\tmp\\keyboard.yaml',
  lockWindowCenter: false,
  launchOnStartup: false,
  startInTray: false,
  theme: 'system',
  language: 'zh-CN',
  customStyle: 'default',
  windowSize: { width: 1000, height: 600 },
  hideElements: { ...DEFAULT_HIDE_ELEMENTS },
};

const profile: KeyboardProfile = {
  tabs: [
    { id: '1', label: 'One' },
    { id: '2', label: 'Two' },
  ],
  keys: [
    { tabId: '1', id: 'Q', label: 'Alpha', filePath: 'C:\\Alpha.exe' },
    { tabId: '1', id: 'W', label: 'Beta', filePath: 'C:\\Beta.exe' },
    { tabId: '2', id: 'Q', label: 'Gamma', filePath: 'C:\\Gamma.exe' },
  ],
};

describe('store reducer', () => {
  it('derives the required drag/center mode from lockWindowCenter on config load', () => {
    const dragState = reducer(initialState, {
      type: 'SET_CONFIG',
      settings: { ...settings, lockWindowCenter: false },
      profile,
    });
    const lockState = reducer(initialState, {
      type: 'SET_CONFIG',
      settings: { ...settings, lockWindowCenter: true },
      profile,
    });

    expect(dragState.ui.isDragDropMode).toBe(true);
    expect(lockState.ui.isDragDropMode).toBe(false);
  });

  it('keeps lock center and drag mode mutually exclusive when settings change', () => {
    const loaded = reducer(initialState, { type: 'SET_CONFIG', settings, profile });
    const locked = reducer(loaded, {
      type: 'UPDATE_SETTINGS',
      settings: { lockWindowCenter: true },
    });

    expect(locked.settings?.lockWindowCenter).toBe(true);
    expect(locked.ui.isDragDropMode).toBe(false);
  });
});
