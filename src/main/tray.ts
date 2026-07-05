import { app, Menu, nativeImage, Tray } from 'electron';
import path from 'path';

import { APP_NAME } from '../shared/constants';
import { getTrayI18n } from '../shared/trayI18n';
import type { AppLanguage } from '../shared/types';
import log from './logger';
import { IS_MAC } from './platform';
import { showMainWindow } from './window';

let tray: Tray | null = null;
let trayLanguage: AppLanguage | undefined;

function getTrayIconPath(): string {
  const iconName = IS_MAC ? 'iconTemplate.png' : 'icon.png';

  if (app.isPackaged) {
    return path.join(process.resourcesPath, iconName);
  }
  return path.join(app.getAppPath(), 'out/icons', iconName);
}

function buildTrayMenu(language: AppLanguage | undefined): Electron.Menu {
  const text = getTrayI18n(language);

  return Menu.buildFromTemplate([
    {
      label: text.show,
      click: () => {
        showMainWindow();
      },
    },
    { type: 'separator' },
    {
      label: text.exit,
      click: () => {
        app.exit();
      },
    },
  ]);
}

export function refreshTrayMenu(language: AppLanguage | undefined): void {
  trayLanguage = language;
  if (!tray) {
    return;
  }
  tray.setContextMenu(buildTrayMenu(trayLanguage));
}

export function createTray(language?: AppLanguage): void {
  if (tray) {
    refreshTrayMenu(language);
    log.debug('Tray already exists', { scope: 'tray' });
    return;
  }

  const iconPath = getTrayIconPath();

  try {
    let icon = nativeImage.createFromPath(iconPath);

    if (icon.isEmpty()) {
      log.warn(`Failed to load tray icon from: ${iconPath}`, { scope: 'tray' });
      icon = nativeImage.createEmpty();
    }

    icon = icon.resize({ width: 16, height: 16 });
    if (IS_MAC) {
      icon.setTemplateImage(true);
    }

    tray = new Tray(icon);

    tray.setToolTip(APP_NAME);
    refreshTrayMenu(language);

    tray.on('click', () => {
      showMainWindow();
    });

    log.info('System tray created', { scope: 'tray' });
  } catch (error) {
    log.error('Failed to create tray', { scope: 'tray', error });
  }
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
    log.debug('System tray destroyed', { scope: 'tray' });
  }
}
