import type { ReactElement } from 'react';

import { FUNCTION_KEYS, LETTER_KEYS, NUM_KEYS } from '../../../shared/constants';
import type { KeyConfig } from '../../../shared/types';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useLaunchProgram } from '../../hooks/useLaunchProgram';
import { selectKeyConfig, selectMatchingKeys, selectTabLabel } from '../../state/selectors';
import { useAppState, useDispatch } from '../../state/store';
import { ContextMenu } from '../common/ContextMenu';
import { KeyButton } from './KeyButton';
import { NumButton } from './NumButton';

export function VirtualKeyboard(): ReactElement {
  const state = useAppState();
  const dispatch = useDispatch();
  const { menuState, closeMenu, openKeyContextMenu, openTabContextMenu } = useContextMenu();
  const launchProgram = useLaunchProgram({ hideWindowOnSuccess: true });

  const hasSearchQuery = state.ui.searchQuery.trim().length > 0;
  const matchingKeys = selectMatchingKeys(state);

  const isKeyVisible = (keyConfig: KeyConfig | undefined): boolean => {
    if (!hasSearchQuery) return true;
    if (!keyConfig) return false;
    return matchingKeys.some((k) => k.tabId === keyConfig.tabId && k.id === keyConfig.id);
  };

  const isTabVisible = (tabId: string): boolean => {
    if (!hasSearchQuery) return true;
    return matchingKeys.some((k) => k.tabId === tabId);
  };

  const handleKeyClick = (keyConfig: KeyConfig | undefined) => {
    if (keyConfig?.filePath) {
      void launchProgram(keyConfig);
    }
  };

  const handleTabClick = (tabId: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', tabId });
  };

  return (
    <div className="keyboard-zone">
      {/* F1-F10 function keys (global) */}
      <div className="keyboard-row f-keys-row">
        {FUNCTION_KEYS.map((keyId) => {
          const keyConfig = selectKeyConfig(state, 'F', keyId);
          return (
            <KeyButton
              key={keyId}
              keyId={keyId}
              tabId="F"
              keyConfig={keyConfig}
              isHidden={!isKeyVisible(keyConfig)}
              onClick={() => handleKeyClick(keyConfig)}
              onContextMenu={(e) => openKeyContextMenu(e, 'F', keyId, keyConfig)}
            />
          );
        })}
      </div>

      {/* 1-0 tab selector row */}
      <div className="keyboard-row num-keys-row">
        {NUM_KEYS.map((keyId) => {
          const label = selectTabLabel(state, keyId) || '';
          return (
            <NumButton
              key={keyId}
              keyId={keyId}
              label={label}
              isSelected={state.ui.activeTabId === keyId}
              isHidden={!isTabVisible(keyId)}
              onClick={() => handleTabClick(keyId)}
              onContextMenu={(e) => openTabContextMenu(e, keyId)}
            />
          );
        })}
      </div>

      {/* Letter/symbol keys (30 keys per tab, in single container with grid layout) */}
      <div className="keyboard-row letter-keys-row">
        {LETTER_KEYS.map((keyId) => {
          const keyConfig = selectKeyConfig(state, state.ui.activeTabId, keyId);
          return (
            <KeyButton
              key={keyId}
              keyId={keyId}
              tabId={state.ui.activeTabId}
              keyConfig={keyConfig}
              isHidden={!isKeyVisible(keyConfig)}
              onClick={() => handleKeyClick(keyConfig)}
              onContextMenu={(e) => openKeyContextMenu(e, state.ui.activeTabId, keyId, keyConfig)}
            />
          );
        })}
      </div>

      {/* Context Menu */}
      {menuState.isOpen && (
        <ContextMenu items={menuState.items} position={menuState.position} onClose={closeMenu} />
      )}
    </div>
  );
}
