import { readdir, readFile } from 'fs/promises';
import os from 'os';
import { join } from 'path';

import type { InstalledApp } from '../../shared/types';

function getDesktopDirs(): string[] {
  const home = os.homedir();
  return [
    '/usr/share/applications',
    '/usr/local/share/applications',
    join(home, '.local/share/applications'),
    '/var/lib/flatpak/exports/share/applications',
    join(home, '.local/share/flatpak/exports/share/applications'),
    '/var/lib/snapd/desktop/applications',
  ];
}

/** Parse .desktop file, return app name or null if should be skipped */
function parseDesktopName(content: string): string | null {
  const lines = content.split('\n');
  let inDesktopEntry = false;
  let name = '';
  let hasExec = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '[Desktop Entry]') {
      inDesktopEntry = true;
      continue;
    }

    // Stop at next section
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      if (inDesktopEntry) break;
      continue;
    }

    if (!inDesktopEntry) continue;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (!match) continue;

    const [, key, value] = match;

    switch (key) {
      case 'Name':
        if (!name) name = value;
        break;
      case 'Exec':
        hasExec = true;
        break;
      case 'NoDisplay':
      case 'Hidden':
        if (value.toLowerCase() === 'true') return null;
        break;
    }
  }

  return name && hasExec ? name : null;
}

export async function listLinuxApps(): Promise<InstalledApp[]> {
  const results: InstalledApp[] = [];
  const seen = new Set<string>();
  const desktopDirs = getDesktopDirs();

  for (const dir of desktopDirs) {
    try {
      const entries = await readdir(dir);
      for (const entry of entries) {
        if (!entry.endsWith('.desktop')) continue;

        // Skip duplicates (same .desktop filename)
        if (seen.has(entry)) continue;
        seen.add(entry);

        try {
          const filePath = join(dir, entry);
          const content = await readFile(filePath, 'utf-8');
          const name = parseDesktopName(content);

          if (name) {
            results.push({ label: name, filePath });
          }
        } catch {
          // Skip unreadable files
        }
      }
    } catch {
      // Directory may not exist, ignore
    }
  }

  results.sort((a, b) => a.label.localeCompare(b.label));
  return results;
}
