import { app, Menu, nativeImage, Tray } from 'electron';
import path from 'path';

import { APP_NAME } from '../shared/constants';
import log from './logger';
import { IS_MAC } from './platform';
import { showMainWindow } from './window';

let tray: Tray | null = null;

function getTrayIconPath(): string {
  const iconName = IS_MAC ? 'iconTemplate.png' : 'icon.png';

  if (app.isPackaged) {
    return path.join(process.resourcesPath, iconName);
  }
  return path.join(app.getAppPath(), 'out/icons', iconName);
}

export function createTray(): void {
  if (tray) {
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

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show',
        click: () => {
          showMainWindow();
        },
      },
      { type: 'separator' },
      {
        label: 'Exit',
        click: () => {
          app.exit();
        },
      },
    ]);

    tray.setToolTip(APP_NAME);
    tray.setContextMenu(contextMenu);

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
