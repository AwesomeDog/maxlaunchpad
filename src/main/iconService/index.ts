import crypto from 'crypto';
import { app, NativeImage, nativeImage } from 'electron';
import fs from 'fs';
import path from 'path';

import type { KeyConfig } from '../../shared/types';
import { getCacheKey } from '../../shared/utils';
import log from '../logger';
import { CACHE_DIR_PATH, ensureDir } from '../paths';
import { IS_LINUX, IS_MAC, IS_WINDOWS } from '../platform';
import { initIconService, isImageFile } from './common';
import { extractIcon as extractLinux } from './linux';
import { extractIcon as extractMac } from './mac';
import { extractIcon as extractWin } from './win';

export { initIconService };

async function extractIcon(keyConfig: KeyConfig): Promise<NativeImage | null> {
  if (keyConfig.iconPath && isImageFile(keyConfig.iconPath)) {
    const icon = nativeImage.createFromPath(keyConfig.iconPath);
    if (!icon.isEmpty()) {
      return icon;
    }
  }

  if (IS_MAC) {
    return extractMac(keyConfig);
  }

  if (IS_WINDOWS) {
    return extractWin(keyConfig);
  }

  if (IS_LINUX) {
    return extractLinux(keyConfig);
  }

  // Fallback for unknown platform
  const targetPath = keyConfig.iconPath || keyConfig.filePath;
  return app.getFileIcon(targetPath, { size: 'large' });
}

export async function getIcon(keyConfig: KeyConfig): Promise<string | null> {
  const { filePath, iconPath } = keyConfig;
  const targetPath = iconPath || filePath;

  if (!targetPath || typeof targetPath !== 'string') {
    return null;
  }

  const cacheSource = getCacheKey(keyConfig);
  const cacheKey = crypto.createHash('md5').update(cacheSource).digest('hex');
  const cachePath = path.join(CACHE_DIR_PATH, `${cacheKey}.png`);

  // Return cached icon if exists (no TTL check - cleanup handles expiration)
  if (fs.existsSync(cachePath)) {
    try {
      const stats = fs.statSync(cachePath);
      if (stats.size > 0) {
        const icon = nativeImage.createFromPath(cachePath);
        if (!icon.isEmpty()) {
          return icon.toDataURL();
        }
      }
      // Delete invalid cache file so we can re-extract
      fs.unlinkSync(cachePath);
    } catch {
      // Cache file corrupted, delete and re-extract below
      try {
        fs.unlinkSync(cachePath);
      } catch {
        // Ignore deletion errors
      }
    }
  }

  try {
    const icon = await extractIcon(keyConfig);

    if (icon && !icon.isEmpty()) {
      const pngData = icon.toPNG();
      if (pngData.length > 0) {
        ensureDir(CACHE_DIR_PATH);
        fs.writeFileSync(cachePath, pngData);
        return icon.toDataURL();
      }
    }
  } catch (error) {
    log.error('Failed to extract icon', { scope: 'iconService', keyConfig: keyConfig, error });
  }

  return null;
}
