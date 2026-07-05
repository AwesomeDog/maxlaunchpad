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
const LETTER_KEY_ROWS = [
  { id: 'row1', keys: LETTER_KEYS_ROW1 },
  { id: 'row2', keys: LETTER_KEYS_ROW2 },
  { id: 'row3', keys: LETTER_KEYS_ROW3 },
] as const;

export function VirtualKeyboard(): ReactElement {
  const state = useAppState();
  const dispatch = useDispatch();
  const { menuState, closeMenu, openKeyContextMenu, openTabContextMenu } = useContextMenu();
  const launchProgram = useLaunchProgram({ hideWindowOnSuccess: true });

  // After loading, settings is guaranteed to be non-null
  const settings = state.settings!;

  // In drag-drop mode, force emptyButtons visible for editing
  const hideElements = state.ui.isDragDropMode
    ? { ...settings.hideElements, emptyButtons: false }
    : settings.hideElements;

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

  const handleMoveKey = (
    source: { tabId: string; keyId: string },
    target: { tabId: string; keyId: string },
  ) => {
    dispatch({ type: 'MOVE_KEY', source, target });
  };

  const handleMoveTab = (sourceTabId: string, targetTabId: string) => {
    dispatch({ type: 'MOVE_TAB', sourceTabId, targetTabId });
  };

  const handleEditKey = (tabId: string, keyId: string, keyConfig: KeyConfig | undefined) => {
    dispatch({
      type: 'OPEN_EDIT_KEY_MODAL',
      key: keyConfig ?? {
        tabId,
        id: keyId,
        label: '',
        filePath: '',
      },
    });
  };

  // Calculate visible row count for grid styling
  const visibleRowCount = [!hideElements.row1, !hideElements.row2, !hideElements.row3].filter(
    Boolean,
  ).length;

  // Helper to render letter keys for a row
  const renderLetterRow = (row: (typeof LETTER_KEY_ROWS)[number]) => (
    <div key={row.id} className="letter-key-grid-row" data-layout-row={row.id}>
      {row.keys.map((keyId) => {
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
            onEdit={() => handleEditKey(state.ui.activeTabId, keyId, keyConfig)}
            onContextMenu={(e) => openKeyContextMenu(e, state.ui.activeTabId, keyId, keyConfig)}
            onMoveKey={handleMoveKey}
          />
        );
      })}
    </div>
  );

  const visibleLetterRows = LETTER_KEY_ROWS.filter((row) => !hideElements[row.id]);
  const shouldCompactLetterRows = visibleRowCount < LETTER_KEY_ROWS.length;
  const compactClass = shouldCompactLetterRows
    ? ` letter-rows-compact visible-letter-rows-${visibleRowCount}`
    : '';

  return (
    <div className={`keyboard-zone${hideElements.rowF ? ' f-row-hidden' : ''}${compactClass}`}>
      {/* F1-F10 function keys (global) */}
      {!hideElements.rowF && (
        <div className="keyboard-row f-keys-row" data-layout-row="rowF">
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
                onEdit={() => handleEditKey('F', keyId, keyConfig)}
                onContextMenu={(e) => openKeyContextMenu(e, 'F', keyId, keyConfig)}
                onMoveKey={handleMoveKey}
              />
            );
          })}
        </div>
      )}

      <div
        className={`tabbed-keyboard-panel${visibleRowCount === 0 ? ' letter-rows-hidden' : ''}${compactClass}`}
      >
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
                onMoveTab={handleMoveTab}
              />
            );
          })}
        </div>

        {/* Letter/symbol keys (30 keys per tab, split into 3 rows) */}
        <div
          className={`keyboard-row letter-keys-row${visibleRowCount === 0 ? ' rows-hidden' : ''}${compactClass}`}
        >
          {visibleLetterRows.map(renderLetterRow)}
        </div>
      </div>

      {/* Context Menu */}
      {menuState.isOpen && (
        <ContextMenu items={menuState.items} position={menuState.position} onClose={closeMenu} />
      )}
    </div>
  );
}
