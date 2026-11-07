import { DEFAULT_HIDE_ELEMENTS } from '../../../shared/constants';
import type { AppSettings, KeyboardProfile, KeyConfig } from '../../../shared/types';
import type { AppState } from '../store';
import { initialState, reducer } from '../store';

const settings: AppSettings = {
  activeProfilePath: '/path/to/profile.yaml',
  hotkey: { modifiers: ['Alt'], key: '`' },
  activeTabOnShow: 'lastUsed',
  lockWindowCenter: false,
  launchOnStartup: false,
  startInTray: false,
  theme: 'system',
  customStyle: 'default',
  windowSize: { width: 1000, height: 600 },
  hideElements: { ...DEFAULT_HIDE_ELEMENTS },
};

function stateWithKeys(keys: KeyConfig[]): AppState {
  const profile: KeyboardProfile = { tabs: [{ id: '1', label: '' }], keys };
  return reducer(initialState, { type: 'SET_CONFIG', settings, profile });
}

function key(tabId: string, id: string, label: string): KeyConfig {
  return { tabId, id, label, filePath: `/apps/${label}.exe` };
}

function findKey(state: AppState, tabId: string, keyId: string): KeyConfig | undefined {
  return state.profile?.keys.find((item) => item.tabId === tabId && item.id === keyId);
}

describe('reducer MOVE_KEY (drag & drop rearrangement)', () => {
  it('moves a key into an empty slot and marks the config dirty', () => {
    const state = stateWithKeys([key('1', 'Q', 'notepad')]);

    const next = reducer(state, {
      type: 'MOVE_KEY',
      from: { tabId: '1', keyId: 'Q' },
      to: { tabId: '1', keyId: 'W' },
    });

    expect(next.profile?.keys).toEqual([key('1', 'W', 'notepad')]);
    expect(next.ui.isConfigDirty).toBe(true);
  });

  it.each([
    ['moving', false],
    ['copying', true],
  ] as const)('preserves every configured field when %s across tabs', (_name, copy) => {
    const source: KeyConfig = {
      ...key('1', 'Q', 'editor'),
      arguments: '--profile "Work"',
      workingDirectory: '/projects/work',
      description: 'Open the work profile',
      runAsAdmin: true,
      iconPath: '/icons/editor.png',
    };
    const state = stateWithKeys([source]);

    const next = reducer(state, {
      type: 'MOVE_KEY',
      from: { tabId: '1', keyId: 'Q' },
      to: { tabId: '2', keyId: 'W' },
      copy,
    });

    expect(findKey(next, '2', 'W')).toEqual({ ...source, tabId: '2', id: 'W' });
    expect(findKey(next, '1', 'Q')).toEqual(copy ? source : undefined);
    expect(next.profile?.keys).toHaveLength(copy ? 2 : 1);
    expect(state.profile?.keys).toEqual([source]);
  });

  it('swaps two keys when the target slot is occupied', () => {
    const source: KeyConfig = {
      ...key('1', 'Q', 'notepad'),
      arguments: '--new-window',
      workingDirectory: '/notes',
      description: 'Edit notes',
      runAsAdmin: true,
      iconPath: '/icons/notepad.png',
    };
    const target: KeyConfig = {
      ...key('1', 'W', 'calc'),
      arguments: '--scientific',
      workingDirectory: '/calculations',
      description: 'Scientific calculator',
      runAsAdmin: false,
      iconPath: '/icons/calc.png',
    };
    const state = stateWithKeys([source, target]);

    const next = reducer(state, {
      type: 'MOVE_KEY',
      from: { tabId: '1', keyId: 'Q' },
      to: { tabId: '1', keyId: 'W' },
    });

    expect(findKey(next, '1', 'Q')).toEqual({ ...target, id: 'Q' });
    expect(findKey(next, '1', 'W')).toEqual({ ...source, id: 'W' });
    expect(next.profile?.keys).toHaveLength(2);
    expect(state.profile?.keys).toEqual([source, target]);
  });

  it('moves a key from the function row into a letter slot', () => {
    const state = stateWithKeys([key('F', 'F1', 'browser')]);

    const next = reducer(state, {
      type: 'MOVE_KEY',
      from: { tabId: 'F', keyId: 'F1' },
      to: { tabId: '1', keyId: 'Q' },
    });

    expect(next.profile?.keys).toEqual([key('1', 'Q', 'browser')]);
  });

  it('keeps the source key when copying onto an occupied slot', () => {
    const state = stateWithKeys([key('1', 'Q', 'notepad'), key('1', 'W', 'calc')]);

    const next = reducer(state, {
      type: 'MOVE_KEY',
      from: { tabId: '1', keyId: 'Q' },
      to: { tabId: '1', keyId: 'W' },
      copy: true,
    });

    expect(findKey(next, '1', 'Q')?.label).toBe('notepad');
    expect(findKey(next, '1', 'W')?.label).toBe('notepad');
    expect(next.profile?.keys).toHaveLength(2);
  });

  it('keeps the source key when copying into an empty slot', () => {
    const state = stateWithKeys([key('1', 'Q', 'notepad')]);

    const next = reducer(state, {
      type: 'MOVE_KEY',
      from: { tabId: '1', keyId: 'Q' },
      to: { tabId: '1', keyId: 'W' },
      copy: true,
    });

    expect(findKey(next, '1', 'Q')?.label).toBe('notepad');
    expect(findKey(next, '1', 'W')?.label).toBe('notepad');
    expect(next.profile?.keys).toHaveLength(2);
  });

  it('does nothing when dropping a key onto itself', () => {
    const state = stateWithKeys([key('1', 'Q', 'notepad')]);

    const next = reducer(state, {
      type: 'MOVE_KEY',
      from: { tabId: '1', keyId: 'Q' },
      to: { tabId: '1', keyId: 'Q' },
    });

    expect(next).toBe(state);
  });

  it('does nothing when the dragged slot has no configuration', () => {
    const state = stateWithKeys([key('1', 'W', 'calc')]);

    const next = reducer(state, {
      type: 'MOVE_KEY',
      from: { tabId: '1', keyId: 'Q' },
      to: { tabId: '1', keyId: 'W' },
    });

    expect(next).toBe(state);
  });

  it('does not mutate the previous state', () => {
    const state = stateWithKeys([key('1', 'Q', 'notepad')]);
    const before = JSON.parse(JSON.stringify(state.profile));

    reducer(state, {
      type: 'MOVE_KEY',
      from: { tabId: '1', keyId: 'Q' },
      to: { tabId: '1', keyId: 'W' },
    });

    expect(state.profile).toEqual(before);
  });
});

describe('reducer SET_KEY_DRAG (drag & drop rearrangement)', () => {
  it('records the dragged slot once and keeps the state when it is reported again', () => {
    const state = stateWithKeys([key('1', 'Q', 'notepad')]);
    const location = { tabId: '1', keyId: 'Q' };

    const dragging = reducer(state, { type: 'SET_KEY_DRAG', key: location });
    expect(dragging.ui.dragKey).toEqual(location);

    // A drop clears the drag, then `dragend` clears it again: no extra re-render
    const cleared = reducer(dragging, { type: 'SET_KEY_DRAG', key: null });
    expect(cleared.ui.dragKey).toBeNull();
    expect(reducer(cleared, { type: 'SET_KEY_DRAG', key: null })).toBe(cleared);
    expect(reducer(dragging, { type: 'SET_KEY_DRAG', key: { ...location } })).toBe(dragging);
  });
});
