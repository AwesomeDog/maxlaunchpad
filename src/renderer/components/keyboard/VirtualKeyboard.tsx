import type { ReactElement } from 'react';

import { FUNCTION_KEYS, LETTER_KEYS_LAYOUT, NUM_KEYS } from '../../../shared/constants';
import type { KeyConfig } from '../../../shared/types';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useLaunchProgram } from '../../hooks/useLaunchProgram';
import { selectKeyConfig, selectMatchingKeys, selectTabLabel } from '../../state/selectors';
import { useAppState, useDispatch } from '../../state/store';
import { ContextMenu } from '../common/ContextMenu';
import { KeyButton } from './KeyButton';
import { NumButton } from './NumButton';

// Letter keys rows derived from layout
const [LETTER_KEYS_ROW1, LETTER_KEYS_ROW2, LETTER_KEYS_ROW3] = LETTER_KEYS_LAYOUT;

export function VirtualKeyboard(): ReactElement {
  const state = useAppState();
  const dispatch = useDispatch();
  const { menuState, closeMenu, openKeyContextMenu, openTabContextMenu } = useContextMenu();
  const launchProgram = useLaunchProgram({ hideWindowOnSuccess: true });

  // After loading, settings is guaranteed to be non-null
  const settings = state.settings!;

  const hideElements = settings.hideElements;

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

  // Check if a key should be hidden due to being empty
  const isEmptyButtonHidden = (keyConfig: KeyConfig | undefined): boolean => {
    if (!hideElements.emptyButtons) return false;
    return !keyConfig?.filePath;
  };

  const handleKeyClick = (keyConfig: KeyConfig | undefined) => {
    if (keyConfig?.filePath) {
      void launchProgram(keyConfig);
    }
  };

  const handleTabClick = (tabId: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', tabId });
  };

  // Calculate visible row count for grid styling
  const visibleRowCount = [!hideElements.row1, !hideElements.row2, !hideElements.row3].filter(
    Boolean
  ).length;

  // Helper to render letter keys for a row
  const renderLetterRow = (keys: readonly string[]) =>
    keys.map((keyId) => {
      const keyConfig = selectKeyConfig(state, state.ui.activeTabId, keyId);
      return (
        <KeyButton
          key={keyId}
          keyId={keyId}
          tabId={state.ui.activeTabId}
          keyConfig={keyConfig}
          isHidden={!isKeyVisible(keyConfig) || isEmptyButtonHidden(keyConfig)}
          hideIcon={hideElements.buttonIcons}
          hideText={hideElements.buttonText}
          onClick={() => handleKeyClick(keyConfig)}
          onContextMenu={(e) => openKeyContextMenu(e, state.ui.activeTabId, keyId, keyConfig)}
        />
      );
    });

  return (
    <div className={`keyboard-zone${hideElements.rowF ? ' f-row-hidden' : ''}`}>
      {/* F1-F10 function keys (global) */}
      {!hideElements.rowF && (
        <div className="keyboard-row f-keys-row">
          {FUNCTION_KEYS.map((keyId) => {
            const keyConfig = selectKeyConfig(state, 'F', keyId);
            return (
              <KeyButton
                key={keyId}
                keyId={keyId}
                tabId="F"
                keyConfig={keyConfig}
                isHidden={!isKeyVisible(keyConfig) || isEmptyButtonHidden(keyConfig)}
                hideIcon={hideElements.buttonIcons}
                hideText={hideElements.buttonText}
                onClick={() => handleKeyClick(keyConfig)}
                onContextMenu={(e) => openKeyContextMenu(e, 'F', keyId, keyConfig)}
              />
            );
          })}
        </div>
      )}

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

      {/* Letter/symbol keys (30 keys per tab, split into 3 rows) */}
      <div
        className="keyboard-row letter-keys-row"
        style={
          visibleRowCount < 3
            ? { gridTemplateRows: `repeat(${visibleRowCount || 1}, 1fr)` }
            : undefined
        }
      >
        {!hideElements.row1 && renderLetterRow(LETTER_KEYS_ROW1)}
        {!hideElements.row2 && renderLetterRow(LETTER_KEYS_ROW2)}
        {!hideElements.row3 && renderLetterRow(LETTER_KEYS_ROW3)}
      </div>

      {/* Context Menu */}
      {menuState.isOpen && (
        <ContextMenu items={menuState.items} position={menuState.position} onClose={closeMenu} />
      )}
    </div>
  );
}
