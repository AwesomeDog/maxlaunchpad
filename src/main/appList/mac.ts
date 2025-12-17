import { readdir } from 'fs/promises';
import os from 'os';
import { basename, join } from 'path';

import type { InstalledApp } from '../../shared/types';

export async function listMacApps(): Promise<InstalledApp[]> {
  const appsDir = '/Applications';
  const userAppsDir = join(os.homedir(), 'Applications');

  const results: InstalledApp[] = [];

  for (const dir of [appsDir, userAppsDir]) {
    try {
      const entries = await readdir(dir);
      for (const entry of entries) {
        if (entry.endsWith('.app')) {
          const appName = basename(entry, '.app');
          const appPath = join(dir, entry);
          results.push({
            label: appName,
            filePath: appPath,
          });
        }
      }
    } catch {
      // Directory may not exist (e.g., ~/Applications), ignore
    }
  }

  // Sort by label
  results.sort((a, b) => a.label.localeCompare(b.label));

  return results;
}
