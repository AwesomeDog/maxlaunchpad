import { app, NativeImage, nativeImage } from 'electron';
import fs from 'fs';
import path from 'path';

import type { KeyConfig } from '../../shared/types';

export async function extractIcon(keyConfig: KeyConfig): Promise<NativeImage | null> {
  const strategies = getExtractionStrategies(keyConfig);

  for (const strategy of strategies) {
    const icon = await strategy();
    if (icon) return icon;
  }

  return null;
}

function getExtractionStrategies(keyConfig: KeyConfig): Array<() => Promise<NativeImage | null>> {
  const targetPath = keyConfig.iconPath || keyConfig.filePath;

  return [() => extractFromDesktopEntry(targetPath), () => getSystemIcon(targetPath)];
}

async function getSystemIcon(targetPath: string): Promise<NativeImage | null> {
  try {
    return await app.getFileIcon(targetPath, { size: 'large' });
  } catch {
    return null;
  }
}

async function extractFromDesktopEntry(executablePath: string): Promise<NativeImage | null> {
  try {
    const iconName = resolveIconName(executablePath);
    if (!iconName) return null;

    if (path.isAbsolute(iconName)) {
      return loadIconFromPath(iconName);
    }

    return findIconInThemes(iconName) || findIconInPixmaps(iconName);
  } catch {
    return null;
  }
}

function loadIconFromPath(iconPath: string): NativeImage | null {
  if (!fs.existsSync(iconPath)) return null;
  const icon = nativeImage.createFromPath(iconPath);
  return icon.isEmpty() ? null : icon;
}

const THEMES = [
  'Yaru',
  'Adwaita',
  'gnome',
  'hicolor',
  'ubuntu-mono-dark',
  'ubuntu-mono-light',
  'Humanity',
];
const SIZES = [
  '512x512',
  '256x256',
  '192x192',
  '128x128',
  '96x96',
  '64x64',
  '48x48',
  '32x32',
  '24x24',
  '16x16',
  'scalable',
  'symbolic',
];
const EXTENSIONS = ['.png', '.svg', '.xpm', '.ico'];
const DESKTOP_DIR = '/usr/share/applications';

function getIconBaseDirs(): string[] {
  const home = process.env.HOME || '';
  const xdgDataDirs = (process.env.XDG_DATA_DIRS || '').split(path.delimiter).filter(Boolean);

  const searchRoots = [
    path.join(home, '.local/share'),
    ...xdgDataDirs,
    '/usr/share',
    '/usr/local/share',
    '/var/lib/flatpak/exports/share',
    path.join(home, '.local/share/flatpak/exports/share'),
    '/var/lib/snapd/desktop',
  ];

  const iconDirs = new Set<string>();
  iconDirs.add(path.join(home, '.icons'));

  for (const root of searchRoots) {
    iconDirs.add(path.join(root, 'icons'));
  }

  return Array.from(iconDirs).filter((dir) => fs.existsSync(dir));
}

function resolveIconName(executablePath: string): string | null {
  if (executablePath.endsWith('.desktop') && fs.existsSync(executablePath)) {
    const name = parseIconFromDesktopFile(executablePath);
    if (name) return name;
  }

  const execName = path.basename(executablePath);

  if (fs.existsSync(DESKTOP_DIR)) {
    try {
      const files = fs.readdirSync(DESKTOP_DIR);
      for (const file of files) {
        if (!file.endsWith('.desktop')) continue;

        const content = fs.readFileSync(path.join(DESKTOP_DIR, file), 'utf-8');
        const execMatch = content.match(/^Exec\s*=\s*(.+)$/m);
        if (execMatch && execMatch[1].includes(execName)) {
          const iconMatch = content.match(/^Icon\s*=\s*(.+)$/m);
          if (iconMatch) return iconMatch[1].trim();
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  return execName.toLowerCase();
}

function parseIconFromDesktopFile(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/^Icon\s*=\s*(.+)$/m);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

function stripExtension(iconName: string): string {
  const ext = path.extname(iconName);
  if (ext && EXTENSIONS.includes(ext)) {
    return iconName.substring(0, iconName.length - ext.length);
  }
  return iconName;
}

function findIconInThemes(iconName: string): NativeImage | null {
  const baseDirs = getIconBaseDirs();
  const searchName = stripExtension(iconName);
  const namesToTry = [searchName];

  if (!searchName.endsWith('-symbolic')) {
    namesToTry.push(`${searchName}-symbolic`);
  }

  for (const baseDir of baseDirs) {
    for (const theme of THEMES) {
      for (const size of SIZES) {
        for (const name of namesToTry) {
          for (const ext of EXTENSIONS) {
            const icon = loadIconFromPath(path.join(baseDir, theme, size, 'apps', `${name}${ext}`));
            if (icon) return icon;
          }
        }
      }
    }
  }

  return null;
}

function findIconInPixmaps(iconName: string): NativeImage | null {
  const pixmapDirs = [
    '/usr/share/pixmaps',
    path.join(process.env.HOME || '', '.local/share/pixmaps'),
  ];
  const searchName = stripExtension(iconName);

  for (const pixmapDir of pixmapDirs) {
    if (!fs.existsSync(pixmapDir)) continue;

    for (const ext of EXTENSIONS) {
      const icon = loadIconFromPath(path.join(pixmapDir, `${searchName}${ext}`));
      if (icon) return icon;
    }
  }

  return null;
}
