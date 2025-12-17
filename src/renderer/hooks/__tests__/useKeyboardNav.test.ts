import { act, renderHook } from '@testing-library/react';

import type { AppSettings, KeyboardProfile, KeyConfig } from '../../../shared/types';
import { AppStateProvider, useAppState, useDispatch } from '../../state/store';
import { useKeyboardNav } from '../useKeyboardNav';

// Mock useLaunchProgram
const mockLaunchProgram = jest.fn();
jest.mock('../useLaunchProgram', () => ({
  useLaunchProgram: () => mockLaunchProgram,
}));

// Mock electronAPI
const mockHideWindow = jest.fn();

beforeAll(() => {
  const win = window as unknown as { electronAPI?: { hideWindow?: typeof mockHideWindow } };
  win.electronAPI = {
    ...(win.electronAPI || {}),
    hideWindow: mockHideWindow,
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

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

const mockFunctionKey: KeyConfig = {
  tabId: 'F',
  id: 'F1',
  label: 'Test F1',
  filePath: '/path/to/app1',
};

const mockLetterKey: KeyConfig = {
  tabId: '1',
  id: 'Q',
  label: 'Test Q',
  filePath: '/path/to/app2',
};

const mockProfile: KeyboardProfile = {
  tabs: [
    { id: '1', label: 'Tab 1' },
    { id: '2', label: 'Tab 2' },
  ],
  keys: [mockFunctionKey, mockLetterKey],
};

// Helper to create keyboard event
function createKeyboardEvent(key: string, options: Partial<KeyboardEventInit> = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    ...options,
  });
}

// Helper to create wheel event
function createWheelEvent(deltaY: number, target: Element): WheelEvent {
  const event = new WheelEvent('wheel', {
    deltaY,
    bubbles: true,
  });
  Object.defineProperty(event, 'target', { value: target, writable: false });
  return event;
}

describe('useKeyboardNav', () => {
  describe('Number key navigation', () => {
    it('should switch tab when pressing number keys 1-0', () => {
      let capturedState: ReturnType<typeof useAppState>;
      let capturedDispatch: ReturnType<typeof useDispatch>;

      renderHook(
        () => {
          const state = useAppState();
          const dispatch = useDispatch();
          capturedState = state;
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      // Set initial config
      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
      });

      // Press '2' key
      act(() => {
        window.dispatchEvent(createKeyboardEvent('2'));
      });

      expect(capturedState!.ui.activeTabId).toBe('2');

      // Press '5' key
      act(() => {
        window.dispatchEvent(createKeyboardEvent('5'));
      });

      expect(capturedState!.ui.activeTabId).toBe('5');
    });
  });

  describe('Arrow key navigation', () => {
    it('should navigate to next tab with ArrowRight', () => {
      let capturedState: ReturnType<typeof useAppState>;
      let capturedDispatch: ReturnType<typeof useDispatch>;

      renderHook(
        () => {
          const state = useAppState();
          const dispatch = useDispatch();
          capturedState = state;
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
      });

      // Initial tab is '1'
      expect(capturedState!.ui.activeTabId).toBe('1');

      act(() => {
        window.dispatchEvent(createKeyboardEvent('ArrowRight'));
      });

      expect(capturedState!.ui.activeTabId).toBe('2');
    });

    it('should navigate to previous tab with ArrowLeft', () => {
      let capturedState: ReturnType<typeof useAppState>;
      let capturedDispatch: ReturnType<typeof useDispatch>;

      renderHook(
        () => {
          const state = useAppState();
          const dispatch = useDispatch();
          capturedState = state;
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
        capturedDispatch!({ type: 'SET_ACTIVE_TAB', tabId: '3' });
      });

      act(() => {
        window.dispatchEvent(createKeyboardEvent('ArrowLeft'));
      });

      expect(capturedState!.ui.activeTabId).toBe('2');
    });

    it('should not navigate past first tab with ArrowLeft', () => {
      let capturedState: ReturnType<typeof useAppState>;
      let capturedDispatch: ReturnType<typeof useDispatch>;

      renderHook(
        () => {
          const state = useAppState();
          const dispatch = useDispatch();
          capturedState = state;
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
      });

      // Already at tab '1'
      act(() => {
        window.dispatchEvent(createKeyboardEvent('ArrowLeft'));
      });

      expect(capturedState!.ui.activeTabId).toBe('1');
    });

    it('should not navigate past last tab with ArrowRight', () => {
      let capturedState: ReturnType<typeof useAppState>;
      let capturedDispatch: ReturnType<typeof useDispatch>;

      renderHook(
        () => {
          const state = useAppState();
          const dispatch = useDispatch();
          capturedState = state;
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
        capturedDispatch!({ type: 'SET_ACTIVE_TAB', tabId: '0' }); // Last tab
      });

      act(() => {
        window.dispatchEvent(createKeyboardEvent('ArrowRight'));
      });

      expect(capturedState!.ui.activeTabId).toBe('0');
    });
  });

  describe('Escape key', () => {
    it('should close modal when modal is open', () => {
      let capturedState: ReturnType<typeof useAppState>;
      let capturedDispatch: ReturnType<typeof useDispatch>;

      renderHook(
        () => {
          const state = useAppState();
          const dispatch = useDispatch();
          capturedState = state;
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
        capturedDispatch!({ type: 'OPEN_ABOUT_MODAL' });
      });

      expect(capturedState!.ui.modal.type).toBe('about');

      act(() => {
        window.dispatchEvent(createKeyboardEvent('Escape'));
      });

      expect(capturedState!.ui.modal.type).toBe('none');
      expect(mockHideWindow).not.toHaveBeenCalled();
    });

    it('should hide window when no modal is open', () => {
      let capturedDispatch: ReturnType<typeof useDispatch>;

      renderHook(
        () => {
          const dispatch = useDispatch();
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
      });

      act(() => {
        window.dispatchEvent(createKeyboardEvent('Escape'));
      });

      expect(mockHideWindow).toHaveBeenCalled();
    });
  });

  describe('Ctrl/Cmd+F search focus', () => {
    it('should focus search input on Ctrl+F', () => {
      let capturedDispatch: ReturnType<typeof useDispatch>;

      // Create mock search input
      const searchInput = document.createElement('input');
      searchInput.id = 'search-input';
      document.body.appendChild(searchInput);
      const focusSpy = jest.spyOn(searchInput, 'focus');

      renderHook(
        () => {
          const dispatch = useDispatch();
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
      });

      act(() => {
        window.dispatchEvent(createKeyboardEvent('f', { ctrlKey: true }));
      });

      expect(focusSpy).toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(searchInput);
    });

    it('should focus search input on Cmd+F (macOS)', () => {
      let capturedDispatch: ReturnType<typeof useDispatch>;

      const searchInput = document.createElement('input');
      searchInput.id = 'search-input';
      document.body.appendChild(searchInput);
      const focusSpy = jest.spyOn(searchInput, 'focus');

      renderHook(
        () => {
          const dispatch = useDispatch();
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
      });

      act(() => {
        window.dispatchEvent(createKeyboardEvent('f', { metaKey: true }));
      });

      expect(focusSpy).toHaveBeenCalled();

      document.body.removeChild(searchInput);
    });
  });

  describe('Function key launch', () => {
    it('should launch program when pressing F1-F10', () => {
      let capturedDispatch: ReturnType<typeof useDispatch>;

      renderHook(
        () => {
          const dispatch = useDispatch();
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
      });

      act(() => {
        window.dispatchEvent(createKeyboardEvent('F1'));
      });

      expect(mockLaunchProgram).toHaveBeenCalledWith(mockFunctionKey);
    });

    it('should not launch if function key is not configured', () => {
      let capturedDispatch: ReturnType<typeof useDispatch>;

      renderHook(
        () => {
          const dispatch = useDispatch();
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
      });

      act(() => {
        window.dispatchEvent(createKeyboardEvent('F5')); // Not configured
      });

      expect(mockLaunchProgram).not.toHaveBeenCalled();
    });
  });

  describe('Letter key launch', () => {
    it('should launch program when pressing letter keys on current tab', () => {
      let capturedDispatch: ReturnType<typeof useDispatch>;

      renderHook(
        () => {
          const dispatch = useDispatch();
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
      });

      // Press 'Q' on tab '1'
      act(() => {
        window.dispatchEvent(createKeyboardEvent('q')); // lowercase
      });

      expect(mockLaunchProgram).toHaveBeenCalledWith(mockLetterKey);
    });

    it('should handle uppercase letter keys', () => {
      let capturedDispatch: ReturnType<typeof useDispatch>;

      renderHook(
        () => {
          const dispatch = useDispatch();
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
      });

      act(() => {
        window.dispatchEvent(createKeyboardEvent('Q')); // uppercase
      });

      expect(mockLaunchProgram).toHaveBeenCalledWith(mockLetterKey);
    });

    it('should not launch if letter key is not configured on current tab', () => {
      let capturedDispatch: ReturnType<typeof useDispatch>;

      renderHook(
        () => {
          const dispatch = useDispatch();
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
        capturedDispatch!({ type: 'SET_ACTIVE_TAB', tabId: '2' }); // Switch to tab 2
      });

      act(() => {
        window.dispatchEvent(createKeyboardEvent('Q'));
      });

      expect(mockLaunchProgram).not.toHaveBeenCalled();
    });
  });

  describe('Input field handling', () => {
    it('should not handle keys when focus is in input field', () => {
      let capturedState: ReturnType<typeof useAppState>;
      let capturedDispatch: ReturnType<typeof useDispatch>;

      renderHook(
        () => {
          const state = useAppState();
          const dispatch = useDispatch();
          capturedState = state;
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
      });

      // Create input and simulate keydown with input as target
      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', { key: '2', bubbles: true });
      Object.defineProperty(event, 'target', { value: input, writable: false });

      act(() => {
        window.dispatchEvent(event);
      });

      // Tab should not change
      expect(capturedState!.ui.activeTabId).toBe('1');

      document.body.removeChild(input);
    });

    it('should not handle keys when focus is in textarea', () => {
      let capturedState: ReturnType<typeof useAppState>;
      let capturedDispatch: ReturnType<typeof useDispatch>;

      renderHook(
        () => {
          const state = useAppState();
          const dispatch = useDispatch();
          capturedState = state;
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
      });

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const event = new KeyboardEvent('keydown', { key: '2', bubbles: true });
      Object.defineProperty(event, 'target', { value: textarea, writable: false });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(capturedState!.ui.activeTabId).toBe('1');

      document.body.removeChild(textarea);
    });
  });

  describe('Mouse wheel navigation', () => {
    it('should navigate tabs with mouse wheel over keyboard zone', () => {
      let capturedState: ReturnType<typeof useAppState>;
      let capturedDispatch: ReturnType<typeof useDispatch>;

      // Create keyboard zone element
      const keyboardZone = document.createElement('div');
      keyboardZone.className = 'keyboard-zone';
      document.body.appendChild(keyboardZone);

      renderHook(
        () => {
          const state = useAppState();
          const dispatch = useDispatch();
          capturedState = state;
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
      });

      // Scroll down (positive deltaY) should go to next tab
      act(() => {
        const wheelEvent = createWheelEvent(100, keyboardZone);
        window.dispatchEvent(wheelEvent);
      });

      expect(capturedState!.ui.activeTabId).toBe('2');

      document.body.removeChild(keyboardZone);
    });

    it('should navigate to previous tab with scroll up', () => {
      let capturedState: ReturnType<typeof useAppState>;
      let capturedDispatch: ReturnType<typeof useDispatch>;

      const keyboardZone = document.createElement('div');
      keyboardZone.className = 'keyboard-zone';
      document.body.appendChild(keyboardZone);

      renderHook(
        () => {
          const state = useAppState();
          const dispatch = useDispatch();
          capturedState = state;
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
        capturedDispatch!({ type: 'SET_ACTIVE_TAB', tabId: '3' });
      });

      // Scroll up (negative deltaY) should go to previous tab
      act(() => {
        const wheelEvent = createWheelEvent(-100, keyboardZone);
        window.dispatchEvent(wheelEvent);
      });

      expect(capturedState!.ui.activeTabId).toBe('2');

      document.body.removeChild(keyboardZone);
    });

    it('should not navigate with wheel when not over keyboard zone', () => {
      let capturedState: ReturnType<typeof useAppState>;
      let capturedDispatch: ReturnType<typeof useDispatch>;

      const keyboardZone = document.createElement('div');
      keyboardZone.className = 'keyboard-zone';
      document.body.appendChild(keyboardZone);

      const otherElement = document.createElement('div');
      document.body.appendChild(otherElement);

      renderHook(
        () => {
          const state = useAppState();
          const dispatch = useDispatch();
          capturedState = state;
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
      });

      act(() => {
        const wheelEvent = createWheelEvent(100, otherElement);
        window.dispatchEvent(wheelEvent);
      });

      expect(capturedState!.ui.activeTabId).toBe('1');

      document.body.removeChild(keyboardZone);
      document.body.removeChild(otherElement);
    });

    it('should not navigate with wheel when modal is open', () => {
      let capturedState: ReturnType<typeof useAppState>;
      let capturedDispatch: ReturnType<typeof useDispatch>;

      const keyboardZone = document.createElement('div');
      keyboardZone.className = 'keyboard-zone';
      document.body.appendChild(keyboardZone);

      renderHook(
        () => {
          const state = useAppState();
          const dispatch = useDispatch();
          capturedState = state;
          capturedDispatch = dispatch;
          useKeyboardNav();
        },
        { wrapper: AppStateProvider },
      );

      act(() => {
        capturedDispatch!({ type: 'SET_CONFIG', settings: mockSettings, profile: mockProfile });
        capturedDispatch!({ type: 'OPEN_ABOUT_MODAL' });
      });

      act(() => {
        const wheelEvent = createWheelEvent(100, keyboardZone);
        window.dispatchEvent(wheelEvent);
      });

      expect(capturedState!.ui.activeTabId).toBe('1');

      document.body.removeChild(keyboardZone);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useKeyboardNav(), {
        wrapper: AppStateProvider,
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });
});
