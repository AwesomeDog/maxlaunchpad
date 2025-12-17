import { initials } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';
import { useEffect, useMemo, useState } from 'react';

import type { KeyConfig } from '../../shared/types';
import { getBasename, getCacheKey, isHttpUrl } from '../../shared/utils';

// Global memory cache to avoid unnecessary IPC calls during the same session
const iconCache = new Map<string, string>();

function generateFallbackIcon(filePath: string): string {
  const basename = getBasename(filePath) || 'App';
  const avatar = createAvatar(initials, { seed: basename });
  return avatar.toDataUri();
}

/**
 * Resolves the icon logic for HTTP URLs synchronously.
 * Handles the special case of fetching Google Favicons for raw URLs.
 */
function resolveHttpIcon(keyConfig: KeyConfig): string | null {
  const { filePath, iconPath } = keyConfig;
  const targetPath = iconPath || filePath;

  if (isHttpUrl(targetPath)) {
    // If no custom icon path is provided and the file path itself is a URL,
    // try to fetch the favicon from Google's service.
    if (!iconPath && isHttpUrl(filePath)) {
      try {
        const url = new URL(filePath);
        const domain = url.hostname || url.host || filePath;
        return `https://www.google.com/s2/favicons?sz=96&domain_url=${encodeURIComponent(domain)}`;
      } catch {
        return targetPath;
      }
    }
    // Otherwise use the provided icon path or the file path directly
    return targetPath;
  }
  return null;
}

/**
 * Hook to load an icon for a given key config.
 * Supports both local file paths and remote URLs (HTTP/HTTPS).
 * Returns a dataURL string (either real icon or fallback), or null while loading.
 */
export function useIcon(keyConfig: KeyConfig | undefined): string | null {
  // Memoize cache key to stabilize dependencies where possible
  const cacheKey = useMemo(() => (keyConfig ? getCacheKey(keyConfig) : null), [keyConfig]);

  const [icon, setIcon] = useState<string | null>(() => {
    if (!cacheKey) return null;
    return iconCache.get(cacheKey) ?? null;
  });

  useEffect(() => {
    if (!keyConfig || !cacheKey) {
      setIcon(null);
      return;
    }

    // 1. Memory Cache Hit
    if (iconCache.has(cacheKey)) {
      setIcon(iconCache.get(cacheKey)!);
      return;
    }

    // 2. HTTP URL Handling (Synchronous)
    const httpIcon = resolveHttpIcon(keyConfig);
    if (httpIcon) {
      iconCache.set(cacheKey, httpIcon);
      setIcon(httpIcon);
      return;
    }

    // 3. Local File Handling (Asynchronous)
    let isMounted = true;
    setIcon(null); // Reset icon while loading

    const fetchIcon = async () => {
      try {
        const { dataUrl } = await window.electronAPI.getIcon(keyConfig);
        if (!isMounted) return;

        const finalIcon = dataUrl ?? generateFallbackIcon(keyConfig.filePath);
        iconCache.set(cacheKey, finalIcon);
        setIcon(finalIcon);
      } catch {
        if (!isMounted) return;
        const fallback = generateFallbackIcon(keyConfig.filePath);
        iconCache.set(cacheKey, fallback);
        setIcon(fallback);
      }
    };

    void fetchIcon();

    return () => {
      isMounted = false;
    };
  }, [cacheKey, keyConfig]);

  return icon;
}
