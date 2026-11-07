/**
 * The transferred payload identifies the source key on drop. The store's
 * `ui.dragKey` only drives drag feedback and tab switching because browsers
 * do not expose getData() until drop.
 */

import type { KeyLocation } from './store';

/** Custom MIME type used to mark a drag as an internal key drag. */
export const KEY_DRAG_MIME = 'application/x-maxlaunchpad-key';

export function serializeKeyDragPayload(source: KeyLocation): string {
  return JSON.stringify({ tabId: source.tabId, keyId: source.keyId });
}

/** Invalid or unrelated drag data is ignored. */
export function parseKeyDragPayload(raw: string | undefined | null): KeyLocation | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<KeyLocation> | null;
    if (parsed && typeof parsed.tabId === 'string' && typeof parsed.keyId === 'string') {
      return { tabId: parsed.tabId, keyId: parsed.keyId };
    }
  } catch {
    /* Not our payload - ignore */
  }
  return null;
}
