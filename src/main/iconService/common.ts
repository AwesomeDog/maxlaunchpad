import fs from 'fs';
import path from 'path';

import log from '../logger';
import { CACHE_DIR_PATH } from '../paths';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.icns'];

export function isImageFile(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
export const CLEANUP_DELAY = 10 * 60 * 1000; // 10 minutes after startup

let isCleanupScheduled = false;

function runCleanup(): void {
  try {
    if (!fs.existsSync(CACHE_DIR_PATH)) return;

    const now = Date.now();
    const cacheFiles = fs.readdirSync(CACHE_DIR_PATH);
    let deletedCount = 0;

    for (const file of cacheFiles) {
      if (!file.endsWith('.png')) continue;

      const filePath = path.join(CACHE_DIR_PATH, file);
      try {
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs >= CACHE_TTL) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      } catch {
        // Ignore individual file errors
      }
    }

    if (deletedCount > 0) {
      log.info(`Cleaned ${deletedCount} expired icon caches`, { scope: 'iconService' });
    }
  } catch (error) {
    log.error('Failed to cleanup icon cache', { scope: 'iconService', error });
  }
}

export function initIconService(): void {
  if (isCleanupScheduled) return;
  isCleanupScheduled = true;

  setTimeout(runCleanup, CLEANUP_DELAY);

  log.debug('Icon cache cleanup scheduled (once after 10min)', { scope: 'iconService' });
}
