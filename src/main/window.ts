import { app, BrowserWindow, screen } from 'electron';

import { APP_NAME } from '../shared/constants';
import { IPC_CHANNELS } from '../shared/ipcChannels';
import type { WindowSize } from '../shared/types';
import {
  getCenteredWindowBounds,
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
let rendererModalAutoHideDepth = 0;
let preferredWindowSize: WindowSize | null = null;
let lastProgrammaticResizeSize: WindowSize | null = null;

function getCursorDisplayWorkArea() {
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
}

function suppressProgrammaticResizeNotifications(size?: WindowSize): void {
  if (size) {
    lastProgrammaticResizeSize = size;
  }
}

export function createMainWindow(): BrowserWindow {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }

  // Load saved window size from settings
  const settings = loadSettings();
  isLockWindowCenter = settings.lockWindowCenter;
  isDragDropMode = !settings.lockWindowCenter;

  const currentWorkArea = getCursorDisplayWorkArea();
  preferredWindowSize = normalizeWindowSizeToWorkArea(settings.windowSize, currentWorkArea, {
    resetWorkAreaFill: settings.lockWindowCenter,
  });
  if (!isSameWindowSize(settings.windowSize, preferredWindowSize)) {
    saveSettings({ ...settings, windowSize: preferredWindowSize });
  }

  mainWindow = new BrowserWindow({
    width: preferredWindowSize.width,
    height: preferredWindowSize.height,
    center: true,
    resizable: true,
    frame: false,
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
    if (nativeDialogDepth > 0 || rendererModalAutoHideDepth > 0) {
      return;
    }
    if (!isDragDropMode && mainWindow && !mainWindow.isDestroyed()) {
      notifyWindowHidden(mainWindow);
      mainWindow.hide();
    }
  });

  mainWindow.on('close', (event) => {
    event.preventDefault();
    if (mainWindow && !mainWindow.isDestroyed()) {
      notifyWindowHidden(mainWindow);
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
      const currentSize = { width, height };
      if (lastProgrammaticResizeSize && isSameWindowSize(currentSize, lastProgrammaticResizeSize)) {
        return;
      }
      lastProgrammaticResizeSize = null;

      const currentWorkArea = getCursorDisplayWorkArea();
      const normalizedSize = normalizeWindowSizeToWorkArea(currentSize, currentWorkArea, {
        resetWorkAreaFill: isLockWindowCenter,
      });

      if (!isSameWindowSize(currentSize, normalizedSize)) {
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

      preferredWindowSize = currentSize;
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
    const currentWorkArea = getCursorDisplayWorkArea();
    const [width, height] = win.getSize();
    const bounds = getCenteredWindowBounds({ width, height }, currentWorkArea);
    suppressProgrammaticResizeNotifications({ width: bounds.width, height: bounds.height });
    win.setBounds(bounds);
    preferredWindowSize = { width: bounds.width, height: bounds.height };
  } catch (error) {
    log.error('Failed to center window', { scope: 'window', error });
  }
}

function restoreConfiguredSizeForShow(win: BrowserWindow): void {
  const currentWorkArea = getCursorDisplayWorkArea();
  preferredWindowSize = normalizeWindowSizeToWorkArea(preferredWindowSize, currentWorkArea, {
    resetWorkAreaFill: isLockWindowCenter,
  });
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
    suppressProgrammaticResizeNotifications(preferredWindowSize);
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
    notifyWindowHidden(win);
    win.hide();
  }
}

export function minimizeMainWindow(): void {
  const win = getMainWindow();
  if (win) {
    win.minimize();
  }
}

export function resizeMainWindowByHeightDelta(delta: number): void {
  const win = getMainWindow();
  if (!win || !Number.isFinite(delta) || Math.abs(delta) < 1) {
    return;
  }

  const [width, height] = win.getSize();
  const currentWorkArea = getCursorDisplayWorkArea();
  const nextSize = normalizeWindowSizeToWorkArea(
    { width, height: height + Math.round(delta) },
    currentWorkArea,
  );

  if (isSameWindowSize({ width, height }, nextSize)) {
    return;
  }

  try {
    if (win.isFullScreen()) {
      win.setFullScreen(false);
    }
    if (win.isMaximized()) {
      win.unmaximize();
    }

    if (isLockWindowCenter) {
      win.setBounds(getCenteredWindowBounds(nextSize, currentWorkArea));
    } else {
      const bounds = win.getBounds();
      win.setBounds({ ...bounds, width: nextSize.width, height: nextSize.height });
    }
    preferredWindowSize = nextSize;
  } catch (error) {
    log.error('Failed to resize window for hidden rows', {
      scope: 'window',
      delta,
      size: nextSize,
      error,
    });
  }
}

export function setWindowAutoHideSuspended(suspended: boolean): void {
  rendererModalAutoHideDepth = Math.max(
    0,
    rendererModalAutoHideDepth + (suspended ? 1 : -1),
  );
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
