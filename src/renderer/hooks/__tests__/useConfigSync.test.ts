import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import type { AppSettings, KeyboardProfile } from '../../../shared/types';
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
  customStyle: 'default',
};

const mockProfile: KeyboardProfile = {
  tabs: [{ id: '1', label: 'Tab 1' }],
  keys: [],
};

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
      expect(capturedState!.ui.error).toBe('Failed to save configuration');
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
