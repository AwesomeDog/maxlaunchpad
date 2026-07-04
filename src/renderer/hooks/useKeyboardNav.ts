import { useCallback, useEffect } from 'react';

import {
  DEFAULT_MENU_REVEAL_KEY,
  FUNCTION_KEYS,
  LETTER_KEYS,
  NUM_KEYS,
} from '../../shared/constants';
import type { MenuRevealKey } from '../../shared/types';
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
 * - Configured reveal key: Temporarily show hidden menu
 */
export function useKeyboardNav() {
  const state = useAppState();
  const dispatch = useDispatch();
  const launchProgram = useLaunchProgram({ hideWindowOnSuccess: true });

  // Check if menu is hidden (needs the configured reveal key to show)
  // Note: settings may be null during loading, but this hook runs after loading completes
  const isMenuHidden = state.settings?.hideElements.menu === true;
  const menuRevealKey = state.settings?.menuRevealKey ?? DEFAULT_MENU_REVEAL_KEY;

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

  // Configured modifier key handling for showing hidden menu
  useEffect(() => {
    if (!isMenuHidden) {
      if (state.ui.isMenuRevealKeyPressed) {
        dispatch({ type: 'SET_MENU_REVEAL_KEY_PRESSED', pressed: false });
      }
      return;
    }

    const matchesMenuRevealKey = (event: KeyboardEvent) =>
      getMenuRevealKeyFromKeyboardEvent(event) === menuRevealKey;

    function handleKeyDown(e: KeyboardEvent) {
      if (matchesMenuRevealKey(e)) {
        dispatch({ type: 'SET_MENU_REVEAL_KEY_PRESSED', pressed: true });
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (matchesMenuRevealKey(e)) {
        dispatch({ type: 'SET_MENU_REVEAL_KEY_PRESSED', pressed: false });
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMenuHidden, menuRevealKey, state.ui.isMenuRevealKeyPressed, dispatch]);
}

function getMenuRevealKeyFromKeyboardEvent(event: KeyboardEvent): MenuRevealKey | null {
  if (event.key === 'Control' || event.code === 'ControlLeft' || event.code === 'ControlRight') {
    return 'Ctrl';
  }
  if (event.key === 'Shift' || event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
    return 'Shift';
  }
  if (event.key === 'Alt' || event.code === 'AltLeft' || event.code === 'AltRight') {
    return 'Alt';
  }
  if (
    event.key === 'Meta' ||
    event.key === 'OS' ||
    event.code === 'MetaLeft' ||
    event.code === 'MetaRight'
  ) {
    return 'Win';
  }
  return null;
}
