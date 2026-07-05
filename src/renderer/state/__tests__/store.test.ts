import { DEFAULT_HIDE_ELEMENTS } from '../../../shared/constants';
import type { AppSettings, KeyboardProfile } from '../../../shared/types';
import { initialState, reducer } from '../store';

const settings: AppSettings = {
  hotkey: { modifiers: ['Alt'], key: '`' },
  menuRevealKey: 'Alt',
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
  it('keeps drag/drop runtime-only on config load unless center lock is enabled', () => {
    const runtimeDragState = {
      ...initialState,
      ui: { ...initialState.ui, isDragDropMode: true },
    };
    const dragState = reducer(initialState, {
      type: 'SET_CONFIG',
      settings: { ...settings, lockWindowCenter: false },
      profile,
    });
    const preservedDragState = reducer(runtimeDragState, {
      type: 'SET_CONFIG',
      settings: { ...settings, lockWindowCenter: false },
      profile,
    });
    const lockState = reducer(runtimeDragState, {
      type: 'SET_CONFIG',
      settings: { ...settings, lockWindowCenter: true },
      profile,
    });

    expect(dragState.ui.isDragDropMode).toBe(false);
    expect(preservedDragState.ui.isDragDropMode).toBe(true);
    expect(lockState.ui.isDragDropMode).toBe(false);
  });

  it('turns off drag/drop mode when lock center is enabled', () => {
    const loaded = reducer(
      { ...initialState, ui: { ...initialState.ui, isDragDropMode: true } },
      { type: 'SET_CONFIG', settings, profile },
    );
    const locked = reducer(loaded, {
      type: 'UPDATE_SETTINGS',
      settings: { lockWindowCenter: true },
    });

    expect(locked.settings?.lockWindowCenter).toBe(true);
    expect(locked.ui.isDragDropMode).toBe(false);
  });

  it('turns off lock center when drag/drop mode is enabled', () => {
    const loaded = reducer(initialState, {
      type: 'SET_CONFIG',
      settings: { ...settings, lockWindowCenter: true },
      profile,
    });
    const dragDrop = reducer(loaded, {
      type: 'SET_DRAG_DROP_MODE',
      enabled: true,
    });

    expect(dragDrop.ui.isDragDropMode).toBe(true);
    expect(dragDrop.settings?.lockWindowCenter).toBe(false);
    expect(dragDrop.ui.isConfigDirty).toBe(true);
  });

  it('does not turn on center lock when drag/drop mode is disabled', () => {
    const loaded = reducer(
      {
        ...initialState,
        ui: { ...initialState.ui, isDragDropMode: true },
      },
      {
        type: 'SET_CONFIG',
        settings: { ...settings, lockWindowCenter: false },
        profile,
      },
    );
    const dragDrop = reducer(loaded, {
      type: 'SET_DRAG_DROP_MODE',
      enabled: false,
    });

    expect(dragDrop.ui.isDragDropMode).toBe(false);
    expect(dragDrop.settings?.lockWindowCenter).toBe(false);
  });

  it('preserves the selected modern style when only language changes', () => {
    const loaded = reducer(initialState, {
      type: 'SET_CONFIG',
      settings: { ...settings, customStyle: 'modern' },
      profile,
    });
    const languageChanged = reducer(loaded, {
      type: 'UPDATE_SETTINGS',
      settings: { language: 'en' },
    });

    expect(languageChanged.settings?.language).toBe('en');
    expect(languageChanged.settings?.customStyle).toBe('modern');
  });

  it('swaps configured keys when a key is moved onto another configured key', () => {
    const loaded = reducer(initialState, { type: 'SET_CONFIG', settings, profile });
    const moved = reducer(loaded, {
      type: 'MOVE_KEY',
      source: { tabId: '1', keyId: 'Q' },
      target: { tabId: '1', keyId: 'W' },
    });

    expect(moved.profile?.keys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tabId: '1', id: 'Q', label: 'Beta' }),
        expect.objectContaining({ tabId: '1', id: 'W', label: 'Alpha' }),
      ]),
    );
    expect(moved.ui.isConfigDirty).toBe(true);
  });

  it('swaps tab labels and key ownership when a tab is moved onto another tab', () => {
    const loaded = reducer(
      {
        ...initialState,
        ui: { ...initialState.ui, activeTabId: '1' },
      },
      { type: 'SET_CONFIG', settings, profile },
    );
    const moved = reducer(loaded, {
      type: 'MOVE_TAB',
      sourceTabId: '1',
      targetTabId: '2',
    });

    expect(moved.profile?.tabs).toEqual([
      { id: '1', label: 'Two' },
      { id: '2', label: 'One' },
    ]);
    expect(moved.profile?.keys).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tabId: '2', id: 'Q', label: 'Alpha' }),
        expect.objectContaining({ tabId: '1', id: 'Q', label: 'Gamma' }),
      ]),
    );
    expect(moved.ui.activeTabId).toBe('2');
    expect(moved.ui.isConfigDirty).toBe(true);
  });
});
