import { app, BrowserWindow, dialog, Menu } from 'electron';

import { configureAutoLaunch } from './autoLaunch';
import { loadSettings } from './configStore';
import { registerGlobalHotkey, unregisterGlobalHotkeys } from './hotkey';
import { initIconService } from './iconService';
import { registerIpcHandlers } from './ipcHandlers';
import log from './logger';
import { IS_MAC } from './platform';
import { createTray, destroyTray } from './tray';
import { createMainWindow, getMainWindow, setLockWindowCenter, showMainWindow } from './window';

// eslint-disable-next-line @typescript-eslint/no-require-imports
if (require('electron-squirrel-startup')) {
  app.quit();
}

function initializeApp(): void {
  if (!app.requestSingleInstanceLock()) {
    log.info('Another instance is running, quitting...');
    app.quit();
    return;
  }

  app.on('second-instance', () => {
    const win = getMainWindow();
    if (win) {
      if (!win.isVisible()) {
        showMainWindow();
      } else {
        win.focus();
      }
    }
  });

  // Electron's type definitions override NodeJS.Process and only expose "loaded" event
  // Use type assertion to access standard Node.js process events
  const nodeProcess = process as unknown as NodeJS.EventEmitter;

  nodeProcess.on('uncaughtException', (error: Error) => {
    log.error('Uncaught exception:', error);
    dialog.showErrorBox('Uncaught Exception', error.stack || error.message);
  });

  nodeProcess.on('unhandledRejection', (reason: unknown) => {
    log.error('Unhandled rejection:', reason);
    dialog.showErrorBox(
      'Unhandled Rejection',
      reason instanceof Error ? reason.stack || reason.message : String(reason),
    );
  });

  app.whenReady().then(async () => {
    try {
      log.info('App ready');

      Menu.setApplicationMenu(null);

      const settings = loadSettings();

      await configureAutoLaunch(settings.launchOnStartup);

      registerIpcHandlers();

      registerGlobalHotkey(settings.hotkey);

      createTray();

      const win = createMainWindow();

      if (settings.lockWindowCenter) {
        setLockWindowCenter(true);
      }

      if (!settings.startInTray) {
        win.show();
      }

      initIconService();

      // Open DevTools in development (disabled by default)
      // if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
      //   win.webContents.openDevTools();
      // }
    } catch (error) {
      log.error('Failed to initialize app', error);
      dialog.showErrorBox(
        'Initialization Error',
        error instanceof Error ? error.stack || error.message : String(error),
      );
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      showMainWindow();
    }
  });

  app.on('window-all-closed', () => {
    if (!IS_MAC) {
      app.quit();
    }
  });

  app.on('will-quit', () => {
    unregisterGlobalHotkeys();
    destroyTray();
    log.info('App quitting');
  });
}

initializeApp();
