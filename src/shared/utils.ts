import { FUNCTION_KEYS, LETTER_KEYS, MODIFIER_KEYS, NUM_KEYS } from './constants';
import type { KeyboardProfile, KeyConfig } from './types';

export function getCacheKey(keyConfig: KeyConfig): string {
  const { filePath, arguments: args, iconPath } = keyConfig;
  return `${filePath}|${args ?? ''}|${iconPath ?? ''}`;
}

export function getBasename(filePath: string, ext?: string): string {
  const name = filePath.split(/[/\\]/).pop() || '';
  if (ext && name.endsWith(ext)) {
    return name.slice(0, -ext.length);
  }
  return name.replace(/\.[^.]+$/, '');
}

/**
 * Normalize a keyboard profile:
 * 1. Ensure all tabs (1-9, 0) exist and are sorted
 * 2. Deduplicate keys by tabId|id
 * 3. Sort keys: F-keys first, then tabs 1-0, within tab by LETTER_KEYS order
 */
export function normalizeProfile(profile: KeyboardProfile): KeyboardProfile {
  const existingTabsMap = new Map(profile.tabs.map((tab) => [tab.id, tab]));
  const sortedTabs = NUM_KEYS.map((id) => {
    return existingTabsMap.get(id) ?? { id, label: '' };
  });

  const keys = profile.keys;
  const dedupedKeys = new Map<string, (typeof keys)[number]>();

  for (const keyConfig of keys) {
    const hasContent =
      keyConfig.label ||
      keyConfig.filePath ||
      keyConfig.arguments ||
      keyConfig.workingDirectory ||
      keyConfig.description ||
      keyConfig.iconPath ||
      keyConfig.runAsAdmin;
    if (!hasContent) continue;

    const mapKey = `${keyConfig.tabId}|${keyConfig.id}`;
    dedupedKeys.set(mapKey, keyConfig);
  }

  const sortedKeys = Array.from(dedupedKeys.values()).sort((a, b) => {
    if (a.tabId !== b.tabId) {
      if (a.tabId === 'F') return -1;
      if (b.tabId === 'F') return 1;

      const idxA = NUM_KEYS.indexOf(a.tabId as (typeof NUM_KEYS)[number]);
      const idxB = NUM_KEYS.indexOf(b.tabId as (typeof NUM_KEYS)[number]);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    }

    if (a.tabId === 'F') {
      const idxA = FUNCTION_KEYS.indexOf(a.id as (typeof FUNCTION_KEYS)[number]);
      const idxB = FUNCTION_KEYS.indexOf(b.id as (typeof FUNCTION_KEYS)[number]);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    } else {
      const idxA = LETTER_KEYS.indexOf(a.id as (typeof LETTER_KEYS)[number]);
      const idxB = LETTER_KEYS.indexOf(b.id as (typeof LETTER_KEYS)[number]);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    }
  });

  return { tabs: sortedTabs, keys: sortedKeys };
}

export function formatTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:T]/g, '').slice(0, 14);
}

/**
 * Check if the string is an HTTP/HTTPS URL
 */
export function isHttpUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://');
}

/**
 * Check if the string is a URL (any scheme like http://, https://, file://, etc.)
 */
export function isUrl(str: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(str);
}

/**
 * Check if a file path represents a Windows UWP (packaged) app via shell:AppsFolder
 * UWP apps have format: shell:AppsFolder\PackageFamilyName!AppId
 */
export function isWindowsUwpApp(filePath: string): boolean {
  const match = filePath.match(/shell:AppsFolder\\(.+)$/i);
  if (!match) return false;
  // UWP apps contain '!' in their AppUserModelId
  return match[1].includes('!');
}

const VALID_MODIFIER_IDS = MODIFIER_KEYS.map((modifier) => modifier.id);

export function normalizeModifier(modifier: string): string | null {
  const normalized = modifier.toLowerCase();
  if (normalized === 'ctrl' || normalized === 'control') return 'Ctrl';
  if (normalized === 'alt' || normalized === 'option') return 'Alt';
  if (normalized === 'shift') return 'Shift';
  if (
    normalized === 'win' ||
    normalized === 'meta' ||
    normalized === 'command' ||
    normalized === 'super'
  )
    return 'Win';
  return null;
}

export function normalizeModifiers(modifiers: string[]): string[] {
  const normalized = new Set<string>();
  for (const modifier of modifiers) {
    const norm = normalizeModifier(modifier);
    if (norm) {
      normalized.add(norm);
    }
  }
  // Return in consistent order based on MODIFIER_KEYS
  return VALID_MODIFIER_IDS.filter((id) => normalized.has(id));
}
