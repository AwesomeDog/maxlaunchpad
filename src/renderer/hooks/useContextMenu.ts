import React, { useCallback, useState } from 'react';

import type { KeyConfig } from '../../shared/types';
import type { ContextMenuItem } from '../components/common/ContextMenu';
import { useAppState, useDispatch } from '../state/store';
import { useCloseOnWindowHide } from './useCloseOnWindowHide';

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
}

export function useContextMenu() {
  const state = useAppState();
  const dispatch = useDispatch();

  const [menuState, setMenuState] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    items: [],
  });

  const closeMenu = useCallback(() => {
    setMenuState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  useCloseOnWindowHide(closeMenu);

  const openKeyContextMenu = useCallback(
    (e: React.MouseEvent, tabId: string, keyId: string, keyConfig: KeyConfig | undefined) => {
      e.preventDefault();
      e.stopPropagation();

      const hasConfig = !!keyConfig?.filePath;
      const hasClipboard = !!state.ui.clipboardKey;

      const items: ContextMenuItem[] = [
        {
          label: 'Edit',
          onClick: () => {
            const configToEdit: KeyConfig = keyConfig ?? {
              tabId,
              id: keyId,
              label: '',
              filePath: '',
            };
            dispatch({ type: 'OPEN_EDIT_KEY_MODAL', key: configToEdit });
          },
        },
        { label: '', onClick: () => {}, separator: true },
        {
          label: 'Copy',
          onClick: () => {
            if (keyConfig) {
              dispatch({ type: 'SET_CLIPBOARD', key: keyConfig });
            }
          },
          disabled: !hasConfig,
        },
        {
          label: 'Cut',
          onClick: () => {
            if (keyConfig) {
              dispatch({ type: 'SET_CLIPBOARD', key: keyConfig });
              dispatch({ type: 'DELETE_KEY', tabId, keyId });
            }
          },
          disabled: !hasConfig,
        },
        {
          label: 'Paste',
          onClick: () => {
            if (state.ui.clipboardKey) {
              const pastedKey: KeyConfig = {
                ...state.ui.clipboardKey,
                tabId,
                id: keyId,
              };
              dispatch({ type: 'UPDATE_KEY', key: pastedKey });
            }
          },
          disabled: !hasClipboard,
        },
        { label: '', onClick: () => {}, separator: true },
        {
          label: 'Delete',
          onClick: () => {
            dispatch({ type: 'DELETE_KEY', tabId, keyId });
          },
          disabled: !hasConfig,
        },
        { label: '', onClick: () => {}, separator: true },
        {
          label: 'Open File Location',
          onClick: () => {
            if (keyConfig?.filePath) {
              void window.electronAPI.openPath(keyConfig.filePath, { showInFolder: true });
            }
          },
          disabled: !hasConfig,
        },
      ];

      setMenuState({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        items,
      });
    },
    [state.ui.clipboardKey, dispatch],
  );

  const openTabContextMenu = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const items: ContextMenuItem[] = [
        {
          label: 'Edit',
          onClick: () => {
            dispatch({ type: 'OPEN_EDIT_TAB_MODAL', tabId });
          },
        },
      ];

      setMenuState({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        items,
      });
    },
    [dispatch],
  );

  return {
    menuState,
    closeMenu,
    openKeyContextMenu,
    openTabContextMenu,
  };
}
