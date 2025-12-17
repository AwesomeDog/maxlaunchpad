import { useCallback, useEffect } from 'react';

import { FUNCTION_KEYS, LETTER_KEYS, NUM_KEYS } from '../../shared/constants';
import { useAppState, useDispatch } from '../state/store';
import { useLaunchProgram } from './useLaunchProgram';

/**
 * Hook for keyboard and mouse navigation
 * - Number keys 1-0: Direct tab switch
 * - Arrow keys: Tab navigation
 * - Escape: Close modal or hide window
 * - Ctrl/Cmd+F: Focus search
 * - F1-F10: Launch function keys
 * - Letter keys: Launch current tab keys
 * - Mouse wheel over keyboard: Tab navigation
 */
export function useKeyboardNav() {
  const state = useAppState();
  const dispatch = useDispatch();
  const launchProgram = useLaunchProgram({ hideWindowOnSuccess: true });

  const navigateTab = useCallback(
    (delta: 1 | -1) => {
      const currentIndex = NUM_KEYS.indexOf(state.ui.activeTabId as (typeof NUM_KEYS)[number]);
      const newIndex = currentIndex + delta;
      if (newIndex < 0 || newIndex >= NUM_KEYS.length) {
        return;
      }
      dispatch({ type: 'SET_ACTIVE_TAB', tabId: NUM_KEYS[newIndex] });
    },
    [state.ui.activeTabId, dispatch],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key;

      if (NUM_KEYS.includes(key as (typeof NUM_KEYS)[number])) {
        dispatch({ type: 'SET_ACTIVE_TAB', tabId: key });
        return;
      }

      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        e.preventDefault();
        navigateTab(key === 'ArrowRight' ? 1 : -1);
        return;
      }

      if (key === 'Escape') {
        if (state.ui.modal.type !== 'none') {
          dispatch({ type: 'CLOSE_MODAL' });
        } else {
          void window.electronAPI.hideWindow();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 'f') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
        return;
      }

      if (FUNCTION_KEYS.includes(key as (typeof FUNCTION_KEYS)[number])) {
        e.preventDefault();
        const keyConfig = state.profile?.keys.find((k) => k.tabId === 'F' && k.id === key);
        if (keyConfig) {
          void launchProgram(keyConfig);
        }
        return;
      }

      const upperKey = key.toUpperCase();
      if (LETTER_KEYS.includes(upperKey as (typeof LETTER_KEYS)[number])) {
        const keyConfig = state.profile?.keys.find(
          (k) => k.tabId === state.ui.activeTabId && k.id === upperKey,
        );
        if (keyConfig) {
          void launchProgram(keyConfig);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, dispatch, navigateTab, launchProgram]);

  useEffect(() => {
    function handleWheel(e: WheelEvent) {
      const keyboardZone = document.querySelector('.keyboard-zone');
      if (!keyboardZone || !keyboardZone.contains(e.target as Node)) {
        return;
      }

      if (state.ui.modal.type !== 'none') {
        return;
      }

      e.preventDefault();
      navigateTab(e.deltaY > 0 ? 1 : -1);
    }

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [state.ui.modal.type, navigateTab]);
}
