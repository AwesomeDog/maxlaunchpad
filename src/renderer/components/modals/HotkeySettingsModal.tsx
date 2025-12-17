import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  CODE_TO_ACCELERATOR,
  DEFAULT_MODIFIER,
  IGNORED_KEYS,
  MODIFIER_KEYS,
  NUM_KEYS,
} from '../../../shared/constants';
import { normalizeModifiers } from '../../../shared/utils';
import { IS_LINUX, IS_MAC } from '../../platform';
import { useAppState, useDispatch } from '../../state/store';
import { Modal } from '../common/Modal';

export function HotkeySettingsModal(): ReactElement {
  const state = useAppState();
  const dispatch = useDispatch();

  const modifierKeysWithLabels = useMemo(
    () =>
      MODIFIER_KEYS.map((mod) => ({
        id: mod.id,
        label: IS_MAC ? mod.macLabel : mod.winLabel,
      })),
    [],
  );

  const [modifiers, setModifiers] = useState<string[]>(() =>
    normalizeModifiers(state.settings?.hotkey.modifiers ?? [DEFAULT_MODIFIER]),
  );
  const [mainKey, setMainKey] = useState<string>(state.settings?.hotkey.key ?? '`');
  const [activeTabOnShow, setActiveTabOnShow] = useState<string>(
    state.settings?.activeTabOnShow ?? 'lastUsed',
  );
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (state.settings) {
      const normalized = normalizeModifiers(state.settings.hotkey.modifiers);
      setModifiers(normalized);
      setMainKey(state.settings.hotkey.key);
      setActiveTabOnShow(state.settings.activeTabOnShow);

      const original = state.settings.hotkey.modifiers;
      if (normalized.length !== original.length || !normalized.every((m, i) => m === original[i])) {
        dispatch({
          type: 'UPDATE_SETTINGS',
          settings: {
            hotkey: { modifiers: normalized, key: state.settings.hotkey.key },
          },
        });
      }
    }
  }, [state.settings, dispatch]);

  const handleModifierChange = (modifierId: string, checked: boolean) => {
    const newModifiers = checked
      ? [...modifiers, modifierId]
      : modifiers.filter((m) => m !== modifierId);
    setModifiers(newModifiers);

    dispatch({
      type: 'UPDATE_SETTINGS',
      settings: {
        hotkey: { modifiers: newModifiers, key: mainKey },
      },
    });
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault();

      // Ignore modifier and lock keys
      if (IGNORED_KEYS.has(e.key)) {
        return;
      }

      // Map key code to Electron Accelerator format
      const key = CODE_TO_ACCELERATOR[e.code] ?? e.key;

      setMainKey(key);
      setIsRecording(false);

      dispatch({
        type: 'UPDATE_SETTINGS',
        settings: {
          hotkey: { modifiers, key },
        },
      });
    },
    [modifiers, dispatch],
  );

  const handleActiveTabOnShowChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setActiveTabOnShow(value);

    dispatch({
      type: 'UPDATE_SETTINGS',
      settings: { activeTabOnShow: value },
    });
  };

  return (
    <Modal title="Hotkey Settings">
      <div className="modal-row">
        <label>Modifier Keys:</label>
        <div className="modifier-keys">
          {modifierKeysWithLabels.map((mod) => (
            <label key={mod.id}>
              <input
                type="checkbox"
                checked={modifiers.includes(mod.id)}
                onChange={(e) => handleModifierChange(mod.id, e.target.checked)}
              />
              {mod.label}
            </label>
          ))}
        </div>
      </div>

      <div className="modal-row">
        <label>Key:</label>
        <input
          type="text"
          value={isRecording ? 'Press a key...' : mainKey}
          onFocus={() => setIsRecording(true)}
          onBlur={() => setIsRecording(false)}
          onKeyDown={handleKeyDown}
          readOnly
          placeholder="Click to record"
          style={
            isRecording
              ? {
                  backgroundColor: 'var(--selected-background-color)',
                  borderColor: '#1976d2',
                  outline: 'none',
                }
              : undefined
          }
        />
      </div>

      <div className="modal-row">
        <label>Active Tab on Show:</label>
        <select value={activeTabOnShow} onChange={handleActiveTabOnShowChange}>
          <option value="lastUsed">Last Used</option>
          {NUM_KEYS.map((key) => (
            <option key={key} value={key}>
              Tab {key}
            </option>
          ))}
        </select>
      </div>

      <div className="modal-row modal-row-highlight">
        <span style={{ fontWeight: 'bold' }}>Current Hotkey:</span>
        <span style={{ fontFamily: 'monospace', fontSize: '1.1em' }}>
          {modifiers.length > 0
            ? modifiers
                .map((m) => {
                  const def = modifierKeysWithLabels.find((mod) => mod.id === m);
                  return def ? def.label : m;
                })
                .join('+') + '+'
            : ''}
          {mainKey}
        </span>
      </div>

      <div
        className="modal-row-highlight"
        style={{ marginTop: '1em', fontSize: '0.85em', lineHeight: '1.5' }}
      >
        <p style={{ margin: 0 }}>
          💡 We recommend trying the hotkey before customizing.
          {IS_LINUX && (
            <span style={{ display: 'block', marginTop: '0.5em' }}>
              🐧 On Linux, global hotkeys may require additional setup due to system restrictions.
              Please refer to your desktop environment's manual for keyboard shortcut configuration.
            </span>
          )}
        </p>
      </div>

      <div className="modal-actions">
        <button onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>Close</button>
      </div>
    </Modal>
  );
}
