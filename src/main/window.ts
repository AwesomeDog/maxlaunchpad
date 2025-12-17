import { app, BrowserWindow, screen } from 'electron';

import { APP_NAME } from '../shared/constants';
import { IPC_CHANNELS } from '../shared/ipcChannels';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const WINDOW_WIDTH = 1000;
const WINDOW_HEIGHT = 600;

let mainWindow: BrowserWindow | null = null;
let isLockWindowCenter = false;
let isDragDropMode = false;

// Cache for screen position calculation optimization
let lastDisplayId: number | null = null;
let lastPosition: { x: number; y: number } | null = null;

export function createMainWindow(): BrowserWindow {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }

  // Initialize screen listeners on first window creation (after app is ready)
  initScreenListeners();

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    resizable: false,
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
    if (!isDragDropMode && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
    }
  });

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }
  return null;
}

function placeWindowOnCursorDisplay(win: BrowserWindow): void {
  const cursorPoint = screen.getCursorScreenPoint();
  const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);

  if (lastDisplayId === currentDisplay.id && lastPosition) {
    win.setPosition(lastPosition.x, lastPosition.y);
    return;
  }

  const { x, y, width, height } = currentDisplay.workArea;
  const windowBounds = win.getBounds();
  const newX = Math.round(x + (width - windowBounds.width) / 2);
  const newY = Math.round(y + (height - windowBounds.height) / 2);

  lastDisplayId = currentDisplay.id;
  lastPosition = { x: newX, y: newY };

  win.setPosition(newX, newY);
}

let screenListenersInitialized = false;

function initScreenListeners(): void {
  if (screenListenersInitialized) return;
  screenListenersInitialized = true;

  screen.on('display-added', () => {
    lastDisplayId = null;
    lastPosition = null;
  });
  screen.on('display-removed', () => {
    lastDisplayId = null;
    lastPosition = null;
  });
  screen.on('display-metrics-changed', () => {
    lastDisplayId = null;
    lastPosition = null;
  });
}

export function showMainWindow(): void {
  const win = getMainWindow() ?? createMainWindow();

  placeWindowOnCursorDisplay(win);

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

export function setLockWindowCenter(enabled: boolean): void {
  isLockWindowCenter = enabled;
  const win = getMainWindow();
  if (win) {
    if (enabled) {
      placeWindowOnCursorDisplay(win);
    }
    // Window is movable if drag-drop mode is on OR lock-center is off
    win.setMovable(isDragDropMode || !enabled);
  }
}

export function setDragDropMode(enabled: boolean): void {
  isDragDropMode = enabled;
  const win = getMainWindow();
  if (win) {
    win.setMovable(enabled || !isLockWindowCenter);
    win.setAlwaysOnTop(!enabled);
    // In drag-drop mode, show window only on current workspace to prevent it from following when switching desktops
    win.setVisibleOnAllWorkspaces(!enabled, { visibleOnFullScreen: !enabled });
  }
}
