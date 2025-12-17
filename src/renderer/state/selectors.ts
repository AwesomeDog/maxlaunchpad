import type { KeyConfig } from '../../shared/types';
import type { AppState } from './store';

function filterByQuery(keys: KeyConfig[], query: string): KeyConfig[] {
  if (!query) return keys;
  const lowerQuery = query.toLowerCase();
  return keys.filter(
    (keyConfig) =>
      keyConfig.label.toLowerCase().includes(lowerQuery) ||
      keyConfig.filePath.toLowerCase().includes(lowerQuery) ||
      keyConfig.id.toLowerCase().includes(lowerQuery) ||
      keyConfig.arguments?.toLowerCase().includes(lowerQuery) ||
      keyConfig.workingDirectory?.toLowerCase().includes(lowerQuery) ||
      keyConfig.description?.toLowerCase().includes(lowerQuery),
  );
}

export function selectMatchingKeys(state: AppState): KeyConfig[] {
  if (!state.profile || !state.ui.searchQuery.trim()) return [];
  return filterByQuery(state.profile.keys, state.ui.searchQuery);
}

export function selectTabLabel(state: AppState, tabId: string): string | undefined {
  return state.profile?.tabs.find((tab) => tab.id === tabId)?.label;
}

export function selectKeyConfig(
  state: AppState,
  tabId: string,
  keyId: string,
): KeyConfig | undefined {
  return state.profile?.keys.find(
    (keyConfig) => keyConfig.tabId === tabId && keyConfig.id === keyId,
  );
}
