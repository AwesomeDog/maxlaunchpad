import React, { createContext, ReactNode, useContext, useReducer } from 'react';

import type { AppSettings, KeyboardProfile, KeyConfig } from '../../shared/types';

// ============ State Types ============

// Discriminated union for modal state - ensures type safety and prevents invalid states
type ModalState =
  | { type: 'none' }
  | { type: 'editKey'; key: KeyConfig }
  | { type: 'editTab'; tabId: string }
  | { type: 'hotkeySettings' }
  | { type: 'options' }
  | { type: 'about' };

export interface KeyMoveLocation {
  tabId: string;
  keyId: string;
}

export interface AppState {
  // Persisted config (loaded from files)
  settings: AppSettings | null;
  profile: KeyboardProfile | null;

  // Ephemeral UI state (not persisted)
  ui: {
    activeTabId: string;
    searchQuery: string;
    isDragDropMode: boolean; // Runtime only, resets on restart
    isMenuRevealKeyPressed: boolean; // Configured menu reveal key is pressed
    isConfigDirty: boolean;
    isLoading: boolean;
    error: string | null;
    modal: ModalState; // Discriminated union for modal state
    clipboardKey: KeyConfig | null; // Internal clipboard for Copy/Cut/Paste (not system clipboard)
  };
}

// ============ Actions ============

export type Action =
  // Config actions
  | { type: 'SET_CONFIG'; settings: AppSettings; profile: KeyboardProfile }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<AppSettings> }
  | { type: 'UPDATE_KEY'; key: KeyConfig }
  | { type: 'MOVE_KEY'; source: KeyMoveLocation; target: KeyMoveLocation }
  | { type: 'DELETE_KEY'; tabId: string; keyId: string }
  | { type: 'MOVE_TAB'; sourceTabId: string; targetTabId: string }
  | { type: 'UPDATE_TAB'; tabId: string; label: string }
  // UI actions
  | { type: 'SET_ACTIVE_TAB'; tabId: string }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_DRAG_DROP_MODE'; enabled: boolean }
  | { type: 'SET_MENU_REVEAL_KEY_PRESSED'; pressed: boolean }
  | { type: 'SET_CONFIG_DIRTY'; dirty: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'OPEN_EDIT_KEY_MODAL'; key: KeyConfig }
  | { type: 'OPEN_EDIT_TAB_MODAL'; tabId: string }
  | { type: 'OPEN_HOTKEY_SETTINGS_MODAL' }
  | { type: 'OPEN_OPTIONS_MODAL' }
  | { type: 'OPEN_ABOUT_MODAL' }
  | { type: 'CLOSE_MODAL' }
  // Internal clipboard actions (Copy/Cut/Paste - does NOT use system clipboard)
  | { type: 'SET_CLIPBOARD'; key: KeyConfig | null };

// ============ Initial State ============

export const initialState: AppState = {
  settings: null,
  profile: null,
  ui: {
    activeTabId: '1',
    searchQuery: '',
    isDragDropMode: false,
    isMenuRevealKeyPressed: false,
    isConfigDirty: false,
    isLoading: true,
    error: null,
    modal: { type: 'none' },
    clipboardKey: null,
  },
};

// ============ Reducer ============

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_CONFIG':
      return {
        ...state,
        settings: action.settings,
        profile: action.profile,
        ui: {
          ...state.ui,
          isDragDropMode: !action.settings.lockWindowCenter,
          isLoading: false,
          isConfigDirty: false,
        },
      };

    case 'UPDATE_SETTINGS': {
      const nextSettings = state.settings ? { ...state.settings, ...action.settings } : null;
      return {
        ...state,
        settings: nextSettings,
        ui: {
          ...state.ui,
          isDragDropMode:
            action.settings.lockWindowCenter === undefined
              ? state.ui.isDragDropMode
              : !action.settings.lockWindowCenter,
          isConfigDirty: true,
        },
      };
    }

    case 'UPDATE_KEY': {
      if (!state.profile) return state;
      const keys = state.profile.keys;
      const idx = keys.findIndex(
        (keyConfig) => keyConfig.tabId === action.key.tabId && keyConfig.id === action.key.id,
      );
      const newKeys =
        idx >= 0
          ? [...keys.slice(0, idx), action.key, ...keys.slice(idx + 1)]
          : [...keys, action.key];
      return {
        ...state,
        profile: { ...state.profile, keys: newKeys },
        ui: { ...state.ui, isConfigDirty: true },
      };
    }

    case 'MOVE_KEY': {
      if (!state.profile) return state;
      const { source, target } = action;
      if (source.tabId === target.tabId && source.keyId === target.keyId) return state;

      const sourceKey = state.profile.keys.find(
        (keyConfig) => keyConfig.tabId === source.tabId && keyConfig.id === source.keyId,
      );
      if (!sourceKey) return state;

      const targetKey = state.profile.keys.find(
        (keyConfig) => keyConfig.tabId === target.tabId && keyConfig.id === target.keyId,
      );
      const movedSource: KeyConfig = { ...sourceKey, tabId: target.tabId, id: target.keyId };
      const movedTarget: KeyConfig | null = targetKey
        ? { ...targetKey, tabId: source.tabId, id: source.keyId }
        : null;
      const keys = state.profile.keys.filter((keyConfig) => {
        const isSource = keyConfig.tabId === source.tabId && keyConfig.id === source.keyId;
        const isTarget = keyConfig.tabId === target.tabId && keyConfig.id === target.keyId;
        return !isSource && !isTarget;
      });

      keys.push(movedSource);
      if (movedTarget) keys.push(movedTarget);

      return {
        ...state,
        profile: { ...state.profile, keys },
        ui: { ...state.ui, isConfigDirty: true },
      };
    }

    case 'DELETE_KEY': {
      if (!state.profile) return state;
      const keys = state.profile.keys.filter(
        (keyConfig) => !(keyConfig.tabId === action.tabId && keyConfig.id === action.keyId),
      );
      return {
        ...state,
        profile: { ...state.profile, keys },
        ui: { ...state.ui, isConfigDirty: true },
      };
    }

    case 'MOVE_TAB': {
      if (!state.profile) return state;
      const { sourceTabId, targetTabId } = action;
      if (sourceTabId === targetTabId) return state;

      const sourceTab = state.profile.tabs.find((tab) => tab.id === sourceTabId);
      const targetTab = state.profile.tabs.find((tab) => tab.id === targetTabId);
      if (!sourceTab || !targetTab) return state;

      const tabs = state.profile.tabs.map((tab) => {
        if (tab.id === sourceTabId) return { ...tab, label: targetTab.label ?? '' };
        if (tab.id === targetTabId) return { ...tab, label: sourceTab.label ?? '' };
        return tab;
      });
      const keys = state.profile.keys.map((keyConfig) => {
        if (keyConfig.tabId === sourceTabId) return { ...keyConfig, tabId: targetTabId };
        if (keyConfig.tabId === targetTabId) return { ...keyConfig, tabId: sourceTabId };
        return keyConfig;
      });
      const activeTabId =
        state.ui.activeTabId === sourceTabId
          ? targetTabId
          : state.ui.activeTabId === targetTabId
            ? sourceTabId
            : state.ui.activeTabId;

      return {
        ...state,
        profile: { ...state.profile, tabs, keys },
        ui: { ...state.ui, activeTabId, isConfigDirty: true },
      };
    }

    case 'UPDATE_TAB': {
      if (!state.profile) return state;
      const tabs = state.profile.tabs.map((tab) =>
        tab.id === action.tabId ? { ...tab, label: action.label } : tab,
      );
      return {
        ...state,
        profile: { ...state.profile, tabs },
        ui: { ...state.ui, isConfigDirty: true },
      };
    }

    case 'SET_ACTIVE_TAB':
      return { ...state, ui: { ...state.ui, activeTabId: action.tabId } };

    case 'SET_SEARCH_QUERY':
      return { ...state, ui: { ...state.ui, searchQuery: action.query } };

    case 'SET_DRAG_DROP_MODE':
      return { ...state, ui: { ...state.ui, isDragDropMode: action.enabled } };

    case 'SET_MENU_REVEAL_KEY_PRESSED':
      return { ...state, ui: { ...state.ui, isMenuRevealKeyPressed: action.pressed } };

    case 'SET_CONFIG_DIRTY':
      return { ...state, ui: { ...state.ui, isConfigDirty: action.dirty } };

    case 'SET_ERROR':
      return { ...state, ui: { ...state.ui, error: action.error } };

    case 'OPEN_EDIT_KEY_MODAL':
      return {
        ...state,
        ui: { ...state.ui, modal: { type: 'editKey', key: action.key } },
      };

    case 'OPEN_EDIT_TAB_MODAL':
      return {
        ...state,
        ui: { ...state.ui, modal: { type: 'editTab', tabId: action.tabId } },
      };

    case 'OPEN_HOTKEY_SETTINGS_MODAL':
      return {
        ...state,
        ui: { ...state.ui, modal: { type: 'hotkeySettings' } },
      };

    case 'OPEN_OPTIONS_MODAL':
      return {
        ...state,
        ui: { ...state.ui, modal: { type: 'options' } },
      };

    case 'OPEN_ABOUT_MODAL':
      return {
        ...state,
        ui: { ...state.ui, modal: { type: 'about' } },
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        ui: { ...state.ui, modal: { type: 'none' } },
      };

    case 'SET_CLIPBOARD':
      return {
        ...state,
        ui: { ...state.ui, clipboardKey: action.key },
      };

    default:
      return state;
  }
}

// ============ Context ============

const StateContext = createContext<AppState | null>(null);
const DispatchContext = createContext<React.Dispatch<Action> | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState(): AppState {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

export function useDispatch(): React.Dispatch<Action> {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error('useDispatch must be used within AppStateProvider');
  return ctx;
}
