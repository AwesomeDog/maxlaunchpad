import { app, BrowserWindow, screen } from 'electron';

import { APP_NAME } from '../shared/constants';
import { IPC_CHANNELS } from '../shared/ipcChannels';
import type { WindowSize } from '../shared/types';
import {
  normalizeWindowSizeToWorkArea,
  shouldAllowWindowMovement,
  shouldAllowWindowResize,
} from '../shared/windowBehavior';
import { loadSettings, saveSettings } from './configStore';
import log from './logger';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow: BrowserWindow | null = null;
let isLockWindowCenter = false;
let isDragDropMode = false;
let nativeDialogDepth = 0;
let preferredWindowSize: WindowSize | null = null;

export function createMainWindow(): BrowserWindow {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }

  // Load saved window size from settings
  const settings = loadSettings();
  isLockWindowCenter = settings.lockWindowCenter;
  isDragDropMode = !settings.lockWindowCenter;

  const currentDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  preferredWindowSize = normalizeWindowSizeToWorkArea(
    settings.windowSize,
    currentDisplay.workArea,
    {
      resetWorkAreaFill: settings.lockWindowCenter,
    },
  );
  if (!isSameWindowSize(settings.windowSize, preferredWindowSize)) {
    saveSettings({ ...settings, windowSize: preferredWindowSize });
  }

  mainWindow = new BrowserWindow({
    width: preferredWindowSize.width,
    height: preferredWindowSize.height,
    center: true,
    resizable: true,
    frame: true,
    alwaysOnTop: true,
    show: false,
    title: APP_NAME,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false, // Disable background throttling for faster hotkey response
    },
  });

  // macOS: show on current virtual desktop when invoked via hotkey
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  void mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  mainWindow.on('blur', () => {
    if (nativeDialogDepth > 0) {
      return;
    }
    if (!isDragDropMode && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
    }
  });

  mainWindow.on('close', (event) => {
    event.preventDefault();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('minimize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      notifyWindowHidden(mainWindow);
    }
  });

  mainWindow.on('hide', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      notifyWindowHidden(mainWindow);
    }
  });

  // Notify renderer when window is resized (saving handled by useConfigSync with debounce)
  mainWindow.on('resize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const [width, height] = mainWindow.getSize();
      const currentDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
      const normalizedSize = normalizeWindowSizeToWorkArea(
        { width, height },
        currentDisplay.workArea,
        { resetWorkAreaFill: isLockWindowCenter },
      );

      if (!isSameWindowSize({ width, height }, normalizedSize)) {
        if (isLockWindowCenter) {
          preferredWindowSize = normalizedSize;
          mainWindow.webContents.send(
            IPC_CHANNELS.WINDOW_RESIZED,
            normalizedSize.width,
            normalizedSize.height,
          );
        }
        return;
      }

      preferredWindowSize = { width, height };
      mainWindow.webContents.send(IPC_CHANNELS.WINDOW_RESIZED, width, height);
    }
  });

  mainWindow.on('will-move', (event) => {
    if (!shouldAllowWindowMovement({ lockWindowCenter: isLockWindowCenter, isDragDropMode })) {
      event.preventDefault();
    }
  });

  mainWindow.on('will-resize', (event) => {
    if (!shouldAllowWindowResize({ lockWindowCenter: isLockWindowCenter, isDragDropMode })) {
      event.preventDefault();
    }
  });

  applyWindowInteractionPolicy(mainWindow);

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }
  return null;
}

function placeWindowOnCursorDisplay(win: BrowserWindow): void {
  try {
    win.center();
  } catch (error) {
    log.error('Failed to center window', { scope: 'window', error });
  }
}

function restoreConfiguredSizeForShow(win: BrowserWindow): void {
  const currentDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  preferredWindowSize = normalizeWindowSizeToWorkArea(
    preferredWindowSize,
    currentDisplay.workArea,
    { resetWorkAreaFill: isLockWindowCenter },
  );
  if (!preferredWindowSize) {
    return;
  }

  const [currentWidth, currentHeight] = win.getSize();
  if (currentWidth === preferredWindowSize.width && currentHeight === preferredWindowSize.height) {
    return;
  }

  try {
    if (win.isFullScreen()) {
      win.setFullScreen(false);
    }
    if (win.isMaximized()) {
      win.unmaximize();
    }
    win.setSize(preferredWindowSize.width, preferredWindowSize.height);
  } catch (error) {
    log.error('Failed to restore window size', {
      scope: 'window',
      size: preferredWindowSize,
      error,
    });
  }
}

function isSameWindowSize(a: WindowSize, b: WindowSize): boolean {
  return (
    Math.round(a.width) === Math.round(b.width) && Math.round(a.height) === Math.round(b.height)
  );
}

function applyWindowInteractionPolicy(win: BrowserWindow): void {
  const state = { lockWindowCenter: isLockWindowCenter, isDragDropMode };
  win.setMovable(shouldAllowWindowMovement(state));
  win.setResizable(shouldAllowWindowResize(state));
  win.setAlwaysOnTop(isLockWindowCenter);
  win.setVisibleOnAllWorkspaces(isLockWindowCenter, { visibleOnFullScreen: isLockWindowCenter });
}

function notifyWindowHidden(win: BrowserWindow): void {
  if (!win.webContents.isDestroyed()) {
    win.webContents.send(IPC_CHANNELS.WINDOW_HIDDEN);
  }
}

export function showMainWindow(): void {
  const win = getMainWindow() ?? createMainWindow();

  if (isLockWindowCenter) {
    restoreConfiguredSizeForShow(win);
    placeWindowOnCursorDisplay(win);
  }

  // In drag-drop mode, use app.focus to force switch to the window's desktop (macOS only)
  if (isDragDropMode) {
    app.focus({ steal: true });
  }

  win.show();
  win.focus();

  // Notify renderer that window is shown (for activeTabOnShow feature)
  win.webContents.send(IPC_CHANNELS.WINDOW_SHOWN);
}

export function hideMainWindow(): void {
  const win = getMainWindow();
  if (win) {
    win.hide();
  }
}

export async function keepMainWindowVisibleDuringNativeDialog<T>(
  task: () => Promise<T>,
): Promise<T> {
  nativeDialogDepth += 1;
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.show();
  }

  try {
    return await task();
  } finally {
    nativeDialogDepth = Math.max(0, nativeDialogDepth - 1);
  }
}

export function setLockWindowCenter(enabled: boolean): void {
  isLockWindowCenter = enabled;
  isDragDropMode = !enabled;
  const win = getMainWindow();
  if (win) {
    if (enabled) {
      restoreConfiguredSizeForShow(win);
      placeWindowOnCursorDisplay(win);
    }
    applyWindowInteractionPolicy(win);
  }
}

export function setDragDropMode(enabled: boolean): void {
  isDragDropMode = enabled;
  isLockWindowCenter = !enabled;
  const win = getMainWindow();
  if (win) {
    if (isLockWindowCenter) {
      placeWindowOnCursorDisplay(win);
    }
    applyWindowInteractionPolicy(win);
  }
}
