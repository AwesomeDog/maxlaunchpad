import fs from 'fs';
import path from 'path';

import type { InstalledApp } from '../../shared/types';
import log from '../logger';
import { CACHE_DIR_PATH, ensureDir } from '../paths';
import { IS_LINUX, IS_MAC, IS_WINDOWS } from '../platform';
import { listLinuxApps } from './linux';
import { listMacApps } from './mac';
import { listWindowsApps } from './win';

const CACHE_FILE_PATH = path.join(CACHE_DIR_PATH, 'installed-apps.json');

let refreshInProgress = false;

async function scanInstalledApps(): Promise<InstalledApp[]> {
  if (IS_MAC) {
    return listMacApps();
  } else if (IS_WINDOWS) {
    return listWindowsApps();
  } else if (IS_LINUX) {
    return listLinuxApps();
  }
  return [];
}

function readCache(): InstalledApp[] | null {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const data = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
      return JSON.parse(data) as InstalledApp[];
    }
  } catch (error) {
    log.warn('Failed to read apps cache', { scope: 'appList', error });
  }
  return null;
}

function writeCache(apps: InstalledApp[]): void {
  try {
    ensureDir(CACHE_DIR_PATH);
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(apps, null, 2), 'utf-8');
  } catch (error) {
    log.warn('Failed to write apps cache', { scope: 'appList', error });
  }
}

async function refreshCacheInBackground(): Promise<void> {
  if (refreshInProgress) {
    return;
  }

  refreshInProgress = true;

  try {
    const apps = await scanInstalledApps();
    writeCache(apps);
  } catch (error) {
    log.warn('Background refresh failed', { scope: 'appList', error });
  } finally {
    refreshInProgress = false;
  }
}

export async function listInstalledApps(): Promise<InstalledApp[]> {
  const cached = readCache();

  if (cached) {
    // Return cached data immediately, refresh in background
    void refreshCacheInBackground();
    return cached;
  }

  const apps = await scanInstalledApps();
  writeCache(apps);
  return apps;
}
