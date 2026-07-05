import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DEFAULT_HIDE_ELEMENTS } from '../../../shared/constants';
import type { AppSettings, KeyboardProfile } from '../../../shared/types';
import i18n from '../../i18n';
import { AppStateProvider, useAppState, useDispatch } from '../../state/store';
import { useConfigSync } from '../useConfigSync';

// Mock electronAPI
const mockSaveSettings = jest.fn();
const mockSaveProfile = jest.fn();

beforeAll(() => {
  (
    window as unknown as {
      electronAPI: { saveSettings: typeof mockSaveSettings; saveProfile: typeof mockSaveProfile };
    }
  ).electronAPI = {
    saveSettings: mockSaveSettings,
    saveProfile: mockSaveProfile,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// Test component that allows us to control state and observe behavior
function _TestComponent({
  onStateChange,
}: {
  onStateChange?: (
    state: ReturnType<typeof useAppState>,
    dispatch: ReturnType<typeof useDispatch>,
  ) => void;
}) {
  const state = useAppState();
  const dispatch = useDispatch();

  useConfigSync();

  React.useEffect(() => {
    onStateChange?.(state, dispatch);
  }, [state, dispatch, onStateChange]);

  return null;
}
void _TestComponent;

const mockSettings: AppSettings = {
  activeProfilePath: '/path/to/profile.yaml',
  hotkey: { modifiers: ['Command', 'Shift'], key: 'Space' },
  activeTabOnShow: 'lastUsed',
  lockWindowCenter: false,
  launchOnStartup: false,
  startInTray: false,
  theme: 'system',
  language: 'zh-CN',
  customStyle: 'default',
  windowSize: { width: 1000, height: 600 },
  hideElements: { ...DEFAULT_HIDE_ELEMENTS },
};

const mockProfile: KeyboardProfile = {
  tabs: [{ id: '1', label: 'Tab 1' }],
  keys: [],
};

function createDeferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

describe('useConfigSync', () => {
  it('should not save on first render', () => {
    renderHook(() => useConfigSync(), {
      wrapper: AppStateProvider,
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockSaveSettings).not.toHaveBeenCalled();
    expect(mockSaveProfile).not.toHaveBeenCalled();
  });

  it('should not save when isConfigDirty is false', () => {
    let capturedDispatch: ReturnType<typeof useDispatch>;

    const { rerender } = renderHook(
      () => {
        const dispatch = useDispatch();
        capturedDispatch = dispatch;
        useConfigSync();
      },
      { wrapper: AppStateProvider },
    );

    // Set config but don't mark as dirty
    act(() => {
      capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
    });

    rerender();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockSaveSettings).not.toHaveBeenCalled();
    expect(mockSaveProfile).not.toHaveBeenCalled();
  });

  it('does not drive i18next from persisted settings language', async () => {
    const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage');
    let capturedDispatch: ReturnType<typeof useDispatch>;

    const { rerender } = renderHook(
      () => {
        const dispatch = useDispatch();
        capturedDispatch = dispatch;
        useConfigSync();
      },
      { wrapper: AppStateProvider },
    );

    act(() => {
      capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
    });
    rerender();

    await act(async () => {
      await i18n.changeLanguage('en');
    });
    changeLanguageSpy.mockClear();
    rerender();

    expect(changeLanguageSpy).not.toHaveBeenCalled();
  });

  it('should not save when settings is null', () => {
    let capturedDispatch: ReturnType<typeof useDispatch>;

    const { rerender } = renderHook(
      () => {
        const dispatch = useDispatch();
        capturedDispatch = dispatch;
        useConfigSync();
      },
      { wrapper: AppStateProvider },
    );

    // Mark as dirty but settings is null
    act(() => {
      capturedDispatch!({ type: 'SET_CONFIG_DIRTY', dirty: true });
    });

    rerender();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockSaveSettings).not.toHaveBeenCalled();
    expect(mockSaveProfile).not.toHaveBeenCalled();
  });

  it('should save after 1 second when config is dirty', async () => {
    let capturedDispatch: ReturnType<typeof useDispatch>;

    mockSaveSettings.mockResolvedValue(undefined);
    mockSaveProfile.mockResolvedValue(undefined);

    const { rerender } = renderHook(
      () => {
        const dispatch = useDispatch();
        capturedDispatch = dispatch;
        useConfigSync();
      },
      { wrapper: AppStateProvider },
    );

    // First set config
    act(() => {
      capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
    });

    rerender();

    // Then update settings (which marks as dirty)
    act(() => {
      capturedDispatch!({ type: 'UPDATE_SETTINGS', settings: { theme: 'dark' } });
    });

    rerender();

    // Advance timer by 999ms - should not save yet
    act(() => {
      jest.advanceTimersByTime(999);
    });

    expect(mockSaveSettings).not.toHaveBeenCalled();

    // Advance timer by 1ms more - should trigger save
    await act(async () => {
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(mockSaveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        activeProfilePath: '/path/to/profile.yaml',
        theme: 'dark',
      }),
    );
    expect(mockSaveProfile).toHaveBeenCalledWith(mockProfile, '/path/to/profile.yaml');
  });

  it('should debounce multiple changes', async () => {
    let capturedDispatch: ReturnType<typeof useDispatch>;

    mockSaveSettings.mockResolvedValue(undefined);
    mockSaveProfile.mockResolvedValue(undefined);

    const { rerender } = renderHook(
      () => {
        const dispatch = useDispatch();
        capturedDispatch = dispatch;
        useConfigSync();
      },
      { wrapper: AppStateProvider },
    );

    // Set initial config
    act(() => {
      capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
    });

    rerender();

    // Make first change
    act(() => {
      capturedDispatch!({ type: 'UPDATE_SETTINGS', settings: { theme: 'dark' } });
    });

    rerender();

    // Wait 500ms
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Make second change (should reset timer)
    act(() => {
      capturedDispatch!({ type: 'UPDATE_SETTINGS', settings: { theme: 'dark' } });
    });

    rerender();

    // Wait another 500ms - total 1000ms from first change but only 500ms from second
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should not have saved yet
    expect(mockSaveSettings).not.toHaveBeenCalled();

    // Wait remaining 500ms
    await act(async () => {
      jest.advanceTimersByTime(500);
      await Promise.resolve();
    });

    // Now should have saved once with final state
    expect(mockSaveSettings).toHaveBeenCalledTimes(1);
    expect(mockSaveProfile).toHaveBeenCalledTimes(1);
  });

  it('should set error on save failure', async () => {
    let capturedDispatch: ReturnType<typeof useDispatch>;
    let capturedState: ReturnType<typeof useAppState>;

    mockSaveSettings.mockRejectedValue(new Error('Save failed'));

    const { rerender } = renderHook(
      () => {
        const state = useAppState();
        const dispatch = useDispatch();
        capturedState = state;
        capturedDispatch = dispatch;
        useConfigSync();
      },
      { wrapper: AppStateProvider },
    );

    // Set config and mark dirty
    act(() => {
      capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
    });

    rerender();

    act(() => {
      capturedDispatch!({ type: 'UPDATE_SETTINGS', settings: { theme: 'dark' } });
    });

    rerender();

    // Trigger save
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve(); // Extra tick for error handling
    });

    rerender();

    await waitFor(() => {
      expect(capturedState!.ui.error).toBe(i18n.t('errors.failedToSaveConfiguration'));
    });
  });

  it('should clear dirty flag on successful save', async () => {
    let capturedDispatch: ReturnType<typeof useDispatch>;
    let capturedState: ReturnType<typeof useAppState>;

    mockSaveSettings.mockResolvedValue(undefined);
    mockSaveProfile.mockResolvedValue(undefined);

    const { rerender } = renderHook(
      () => {
        const state = useAppState();
        const dispatch = useDispatch();
        capturedState = state;
        capturedDispatch = dispatch;
        useConfigSync();
      },
      { wrapper: AppStateProvider },
    );

    // Set config and mark dirty
    act(() => {
      capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
    });

    rerender();

    act(() => {
      capturedDispatch!({ type: 'UPDATE_SETTINGS', settings: { theme: 'dark' } });
    });

    rerender();

    expect(capturedState!.ui.isConfigDirty).toBe(true);

    // Trigger save
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    rerender();

    await waitFor(() => {
      expect(capturedState!.ui.isConfigDirty).toBe(false);
    });
  });

  it('keeps dirty and saves the latest edit when an older save finishes late', async () => {
    let capturedDispatch: ReturnType<typeof useDispatch>;
    let capturedState: ReturnType<typeof useAppState>;
    const firstSettingsSave = createDeferred<void>();

    mockSaveSettings.mockImplementationOnce(() => firstSettingsSave.promise);
    mockSaveSettings.mockResolvedValue(undefined);
    mockSaveProfile.mockResolvedValue(undefined);

    const { rerender } = renderHook(
      () => {
        const state = useAppState();
        const dispatch = useDispatch();
        capturedState = state;
        capturedDispatch = dispatch;
        useConfigSync();
      },
      { wrapper: AppStateProvider },
    );

    act(() => {
      capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
    });
    rerender();

    act(() => {
      capturedDispatch!({ type: 'UPDATE_SETTINGS', settings: { theme: 'dark' } });
    });
    rerender();

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(mockSaveSettings).toHaveBeenCalledTimes(1);
    expect(mockSaveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ theme: 'dark', customStyle: 'default' }),
    );

    act(() => {
      capturedDispatch!({ type: 'UPDATE_SETTINGS', settings: { customStyle: 'modern' } });
    });
    rerender();

    await act(async () => {
      firstSettingsSave.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    rerender();

    expect(capturedState!.ui.isConfigDirty).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });
    rerender();

    await waitFor(() => {
      expect(capturedState!.ui.isConfigDirty).toBe(false);
    });
    expect(mockSaveSettings).toHaveBeenCalledTimes(2);
    expect(mockSaveSettings).toHaveBeenLastCalledWith(
      expect.objectContaining({ theme: 'dark', customStyle: 'modern' }),
    );
    expect(mockSaveProfile).toHaveBeenCalledTimes(2);
  });

  it('should cleanup timer on unmount', () => {
    let capturedDispatch: ReturnType<typeof useDispatch>;

    const { rerender, unmount } = renderHook(
      () => {
        const dispatch = useDispatch();
        capturedDispatch = dispatch;
        useConfigSync();
      },
      { wrapper: AppStateProvider },
    );

    // Set config and mark dirty
    act(() => {
      capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
    });

    rerender();

    act(() => {
      capturedDispatch!({ type: 'UPDATE_SETTINGS', settings: { theme: 'dark' } });
    });

    rerender();

    // Unmount before timer fires
    unmount();

    // Advance timer
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Should not have saved because timer was cleared
    expect(mockSaveSettings).not.toHaveBeenCalled();
    expect(mockSaveProfile).not.toHaveBeenCalled();
  });
});
