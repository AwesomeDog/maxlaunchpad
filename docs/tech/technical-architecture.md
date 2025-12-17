# MaxLaunchpad Technical Architecture

> **Stack**: Electron + React + TypeScript + functional components + hooks  
> **Goal**: A simple implementation, a single source of truth, and no over-engineering

---

## 1. Architecture Overview

MaxLaunchpad is a single-window Electron desktop app with a virtual keyboard UI for launching programs.

### 1.1 Three Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Main Process (Electron)                  │
│  - App lifecycle, window management, global hotkey          │
│  - Config I/O (YAML), program launching                     │
│  - Icon extraction & disk caching                           │
│  - System tray, logging                                     │
└─────────────────────────────────────────────────────────────┘
                              ↕ IPC
┌─────────────────────────────────────────────────────────────┐
│                    Preload (Bridge)                         │
│  - Exposes typed window.electronAPI to renderer             │
│  - All native operations go through this API                │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    Renderer (React)                         │
│  - Virtual keyboard UI, modals, settings                    │
│  - Functional components and hooks only                       │
│  - Single unified state store (Context + useReducer)        │
│  - Icon memory cache & fallback generation (useIcon hook)   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow Principles

**Single Source of Truth**:

- **On disk**: `settings.yaml` (app settings) and keyboard profile files (`keyboard.yaml`, etc.)
- **In memory**: `AppState` in renderer holds loaded config + ephemeral UI state
- **No duplication**: Config values are read from files → loaded into state → saved back to files

**State Categories**:

| Category         | Location               | Persisted | Examples                                               |
|------------------|------------------------|-----------|--------------------------------------------------------|
| App Settings     | `settings.yaml`        | Yes       | hotkey, theme, activeProfilePath                       |
| Keyboard Profile | `*.yaml` profile files | Yes       | tabs, keys                                             |
| UI State         | Renderer `AppState.ui` | No        | activeTabId, searchQuery, isDragDropMode, clipboardKey |
| Icon Cache       | Memory & Disk          | -         | -                                                      |

---

## 2. Project Structure

```
src/
├── main/                    # Electron main process
│   ├── main.ts              # Entry point, lifecycle
│   ├── window.ts            # BrowserWindow management
│   ├── hotkey.ts            # Global hotkey registration
│   ├── paths.ts             # Application config & resource paths
│   ├── configStore.ts       # YAML config read/write
│   ├── launcher.ts          # Program launching (+ platform variants)
│   ├── iconService.ts       # Icon extraction & disk caching
│   ├── tray.ts              # System tray
│   ├── ipcHandlers.ts       # IPC channel handlers
│   ├── autoLaunch.ts        # Auto-launch on startup (uses auto-launch library)
│   └── logger.ts            # Logging with electron-log
│
├── preload/
│   └── index.ts             # Bridge API (contextBridge)
│
├── renderer/
│   ├── index.tsx            # React entry
│   ├── App.tsx              # Root component
│   ├── state/
│   │   ├── store.ts         # Context + useReducer store
│   │   └── selectors.ts     # Derived data selectors
│   ├── hooks/
│   │   ├── useConfigSync.ts # Auto-save with debounce
│   │   ├── useErrorDialog.ts     # Error dialog handling
│   │   ├── useKeyboardNav.ts# Keyboard shortcuts
│   │   ├── useTheme.ts      # Theme management
│   │   ├── useCustomStyle.ts# Custom style loading
│   │   ├── useWindowBehavior.ts
│   │   ├── useWindowTitle.ts# Window title management (auto-updates based on state)
│   │   ├── useIcon.ts       # Icon loading with memory cache & fallback
│   │   ├── useLaunchProgram.ts # Program launching with native error dialog
│   │   └── useContextMenu.ts# Context menu for keys and tabs
│   ├── components/
│   │   ├── layout/          # TopBar, SearchBox
│   │   ├── keyboard/        # VirtualKeyboard, FunctionKeyRow, TabRow, KeyButton, NumButton
│   │   ├── modals/          # EditKeyModal, EditTabModal, HotkeySettingsModal, OptionsModal, AboutModal
│   │   └── common/          # Modal wrapper
│   └── styles/
│       └── global.css
│
└── shared/
    ├── types.ts             # Shared TypeScript types
    ├── ipcChannels.ts       # IPC channel constants
    └── constants.ts         # Keyboard layout & shared key constants
```

---

## 3. Tech Stack Summary

| Technology                            | Usage                                                   |
|---------------------------------------|---------------------------------------------------------|
| Electron                              | Framework                                               |
| React (functional components)         | UI                                                      |
| TypeScript                            | Language                                                |
| Context + useReducer                  | State                                                   |
| js-yaml                               | Config (with `JSON_SCHEMA` for security)                |
| zod                                   | Runtime config validation & sanitization                |
| Electron Forge + Webpack              | Build                                                   |
| auto-launch                           | Auto-launch                                             |
| electron-log                          | Logging                                                 |
| @floating-ui/react                    | Dropdown/context menu positioning & collision detection |
| @dicebear/core + @dicebear/collection | Icon fallback (Initials style)                          |

---

## 4. Shared Types & Constants

### 4.1 Shared Types (`src/shared/types.ts`)

```ts
// Key configuration (function keys or letter keys)
export interface KeyConfig {
    tabId: string;              // '1'-'9', '0' for letter keys, 'F' for function keys
    id: string;                 // Key ID: 'Q'-'P', 'A'-';', 'Z'-'/', 'F1'-'F10'
    label: string;              // Display text
    filePath: string;           // Program path (required)
    arguments?: string;         // Command line arguments
    workingDirectory?: string;  // Working directory
    description?: string;       // Tooltip text
    runAsAdmin?: boolean;       // Windows only
    iconPath?: string;          // Custom icon path (local file path or HTTP/HTTPS URL)
}

// Tab configuration (number keys 1-0)
export interface TabConfig {
    id: string;                 // '1'-'9', '0'
    label: string;              // Display name (can be empty string)
}

// Keyboard profile (stored in keyboard.yaml or other profile files)
export interface KeyboardProfile {
    tabs: TabConfig[];
    keys: KeyConfig[];          // Can be empty array
}

// Hotkey configuration
export interface HotkeyConfig {
    modifiers: string[];        // 'Ctrl', 'Alt', 'Shift', 'Win' (Win/Linux) or 'Control', 'Option', 'Shift', 'Command' (macOS)
    key: string;                // Main key
}

// App settings (stored in settings.yaml)
// **Note**: All properties are required. Defaults are set in `configStore.ts:loadSettings()`.
export interface AppSettings {
    hotkey: HotkeyConfig;
    activeTabOnShow: 'lastUsed' | string;  // 'lastUsed' or tab ID '1'-'0'
    activeProfilePath: string;             // Absolute path to active keyboard profile
    lockWindowCenter: boolean;
    launchOnStartup: boolean;
    startInTray: boolean;
    theme: 'light' | 'dark' | 'system';
    customStyle: string;                   // Style name without ".css", default 'default'
}
```

### 4.2 Shared Keyboard Layout Constants (`src/shared/constants.ts`)

The physical keyboard layout and the logical key identifiers used across the app are defined once in
`src/shared/constants.ts`. This keeps the virtual keyboard UI, keyboard navigation hook, and configuration data aligned
on a single source of truth.

```ts
// Application name (used in window title, etc.)
export const APP_NAME = 'MaxLaunchpad';

export const FUNCTION_KEYS = [
    'F1', 'F2', 'F3', 'F4', 'F5',
    'F6', 'F7', 'F8', 'F9', 'F10',
] as const;

export const NUM_KEYS = [
    '1', '2', '3', '4', '5',
    '6', '7', '8', '9', '0',
] as const;

export const LETTER_KEYS_LAYOUT = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'],
] as const;

export const LETTER_KEYS = LETTER_KEYS_LAYOUT.flat();

export type FunctionKeyId = (typeof FUNCTION_KEYS)[number];
export type NumKeyId = (typeof NUM_KEYS)[number];
export type LetterKeyId = (typeof LETTER_KEYS)[number];
```

---

## 5. Main Process

### 5.1 `paths.ts` - Application Paths

```ts
import path from 'path';
import os from 'os';

// Base config directory: ~/.config/MaxLaunchpad/
export const APP_CONFIG_DIR = path.join(os.homedir(), '.config', 'MaxLaunchpad');

// Settings file
export const SETTINGS_FILE_PATH = path.join(APP_CONFIG_DIR, 'settings.yaml');

// Default keyboard profile
export const DEFAULT_PROFILE_PATH = path.join(APP_CONFIG_DIR, 'keyboard.yaml');

// Subdirectories
export const CACHE_DIR_PATH = path.join(APP_CONFIG_DIR, 'caches');
export const LOG_DIR_PATH = path.join(APP_CONFIG_DIR, 'logs');
export const BACKUP_DIR_PATH = path.join(APP_CONFIG_DIR, 'backups');
export const STYLES_DIR_PATH = path.join(APP_CONFIG_DIR, 'styles');

// Log file
export const LOG_FILE_PATH = path.join(LOG_DIR_PATH, 'maxlaunchpad.log');

// Resources directory (bundled with app)
export const RESOURCES_DIR = path.join(__dirname, '../../resources');
```

### 5.2 `logger.ts` - Logging

```ts
import log from 'electron-log';
import {app} from 'electron';
import {LOG_FILE_PATH} from './paths';

const logPath = LOG_FILE_PATH;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

log.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

log.transports.file.resolvePathFn = () => logPath;
log.transports.file.level = isDev ? 'debug' : 'info';
log.transports.file.maxSize = 5 * 1024 * 1024;

export default log;
```

### 5.3 `configStore.ts` - Configuration Management

Configuration files are parsed and saved with security and validation:

- **YAML parsing**: Uses `yaml.JSON_SCHEMA` to prevent arbitrary type instantiation
- **Schema validation**: Zod schemas validate structure and strip unknown fields

```ts
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import {AppSettings, KeyboardProfile} from '../shared/types';
import {NUM_KEYS, FUNCTION_KEYS, LETTER_KEYS} from '../shared/constants';
import log from './logger';
import {
    APP_CONFIG_DIR,
    SETTINGS_FILE_PATH,
    DEFAULT_PROFILE_PATH,
    BACKUP_DIR_PATH,
    STYLES_DIR_PATH,
    RESOURCES_DIR,
} from './paths';

const TEMPLATE_DIR = path.join(RESOURCES_DIR, 'config-templates');

// Ensure config directory exists, copy templates if empty
function ensureConfigDir(): void {
    if (!fs.existsSync(APP_CONFIG_DIR)) {
        fs.mkdirSync(APP_CONFIG_DIR, {recursive: true});
    }

    // Bootstrap: copy templates if config dir is empty (excluding logs)
    const entries = fs.readdirSync(APP_CONFIG_DIR).filter(n => n !== 'logs');
    if (entries.length === 0 && fs.existsSync(TEMPLATE_DIR)) {
        copyDirRecursive(TEMPLATE_DIR, APP_CONFIG_DIR);
    }
}

function copyDirRecursive(src: string, dest: string): void {
    fs.mkdirSync(dest, {recursive: true});
    for (const entry of fs.readdirSync(src, {withFileTypes: true})) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Load settings
// All defaults are set here - downstream code should not provide fallback values
export function loadSettings(): AppSettings {
    ensureConfigDir();
    const defaults: AppSettings = {
        hotkey: {modifiers: ['Alt'], key: '`'},
        activeTabOnShow: 'lastUsed',
        activeProfilePath: DEFAULT_PROFILE_PATH,
        lockWindowCenter: true,
        launchOnStartup: true,
        startInTray: false,
        theme: 'system',
        customStyle: 'default',
    };

    try {
        if (fs.existsSync(SETTINGS_FILE_PATH)) {
            const data = yaml.load(fs.readFileSync(SETTINGS_FILE_PATH, 'utf8')) as Partial<AppSettings>;
            return {...defaults, ...data};
        }
    } catch (error) {
        log.error(error, {scope: 'configStore:loadSettings'});
    }
    return defaults;
}

// Save settings
export function saveSettings(settings: AppSettings): void {
    ensureConfigDir();
    try {
        fs.writeFileSync(SETTINGS_FILE_PATH, yaml.dump(settings), 'utf8');
    } catch (error) {
        log.error(error, {scope: 'configStore:saveSettings'});
    }
}

// Load keyboard profile
export function loadProfile(filePath?: string): KeyboardProfile {
    ensureConfigDir();
    const targetPath = filePath ?? DEFAULT_PROFILE_PATH;
    const fallback: KeyboardProfile = {tabs: [], keys: []};

    try {
        if (fs.existsSync(targetPath)) {
            const loaded = yaml.load(fs.readFileSync(targetPath, 'utf8')) as Partial<KeyboardProfile>;
            return {
                tabs: loaded.tabs ?? [],
                keys: loaded.keys ?? [],
            };
        }
    } catch (error) {
        log.error(error, {scope: 'configStore:loadProfile', filePath: targetPath});
    }
    return fallback;
}

// Save keyboard profile with smart backup
export function saveProfile(profile: KeyboardProfile, filePath?: string): void {
    ensureConfigDir();
    const targetPath = filePath ?? DEFAULT_PROFILE_PATH;

    // Smart backup: only if content changed
    if (fs.existsSync(targetPath)) {
        const oldContent = fs.readFileSync(targetPath, 'utf8');
        const newContent = yaml.dump(normalizeProfile(profile));

        if (oldContent !== newContent) {
            createBackup(targetPath, oldContent);
        }
    }

    fs.writeFileSync(targetPath, yaml.dump(normalizeProfile(profile)), 'utf8');
}

function normalizeProfile(profile: KeyboardProfile): KeyboardProfile {
    // 1. Ensure all tabs exist (1-9, 0) and sort them according to NUM_KEYS order
    const existingTabsMap = new Map(profile.tabs.map(t => [t.id, t]));
    const sortedTabs = NUM_KEYS.map(id => {
        return existingTabsMap.get(id) ?? {id, label: ''};
    });

    // 2. Filter and sort keys
    const keys = profile.keys;
    const dedupedKeys = new Map<string, typeof keys[number]>();

    // Dedup logic
    for (const key of keys) {
        // Basic validation: ignore only if all meaningful properties are empty
        const hasContent = key.label || key.filePath || key.arguments || key.workingDirectory || key.description || key.iconPath || key.runAsAdmin;
        if (!hasContent) continue;

        const mapKey = `${key.tabId}|${key.id}`;
        dedupedKeys.set(mapKey, key);
    }

    // Sort keys: F-keys first, then tabs 1-0. Within tab: by LETTER_KEYS order
    const sortedKeys = Array.from(dedupedKeys.values()).sort((a, b) => {
        // Compare Tab IDs
        if (a.tabId !== b.tabId) {
            // Handle Function keys (F) vs Number keys (1-0)
            if (a.tabId === 'F') return -1;
            if (b.tabId === 'F') return 1;

            const idxA = NUM_KEYS.indexOf(a.tabId as any);
            const idxB = NUM_KEYS.indexOf(b.tabId as any);
            // If invalid tab ID, put at end
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
        }

        // Same Tab ID, compare Key IDs
        if (a.tabId === 'F') {
            const idxA = FUNCTION_KEYS.indexOf(a.id as any);
            const idxB = FUNCTION_KEYS.indexOf(b.id as any);
            return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        } else {
            const idxA = LETTER_KEYS.indexOf(a.id as any);
            const idxB = LETTER_KEYS.indexOf(b.id as any);
            return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        }
    });

    return {tabs: sortedTabs, keys: sortedKeys};
}

function createBackup(filePath: string, content: string, tag = 'backup'): void {
    fs.mkdirSync(BACKUP_DIR_PATH, {recursive: true});
    const basename = path.basename(filePath, '.yaml');
    const timestamp = formatTimestamp(new Date());
    const backupPath = path.join(BACKUP_DIR_PATH, `${basename}.${tag}-${timestamp}.yaml`);
    fs.writeFileSync(backupPath, content, 'utf8');
}

function formatTimestamp(date: Date): string {
    return date.toISOString().replace(/[-:T]/g, '').slice(0, 14);
}

// List available custom styles from styles directory
export function listCustomStyles(): string[] {
    try {
        if (!fs.existsSync(STYLES_DIR_PATH)) {
            return [];
        }
        return fs.readdirSync(STYLES_DIR_PATH)
            .filter(f => f.endsWith('.css'))
            .map(f => f.replace(/\.css$/, ''));
    } catch (error) {
        log.error(error, {scope: 'configStore:listCustomStyles'});
        return [];
    }
}

// Load custom style CSS content
export function loadCustomStyleContent(styleName: string): string | null {
    try {
        const stylePath = path.join(STYLES_DIR_PATH, `${styleName}.css`);
        if (fs.existsSync(stylePath)) {
            return fs.readFileSync(stylePath, 'utf8');
        }
    } catch (error) {
        log.error(error, {scope: 'configStore:loadCustomStyleContent', styleName});
    }
    return null;
}
```

### 5.4 `window.ts` - Window Management

```ts
import {BrowserWindow, screen} from 'electron';
import path from 'path';

const WINDOW_WIDTH = 1000;
const WINDOW_HEIGHT = 600;

let mainWindow: BrowserWindow | null = null;
let isLockWindowCenter = false;
let isDragDropMode = false;

export function createMainWindow(): BrowserWindow {
    if (mainWindow) return mainWindow;

    mainWindow = new BrowserWindow({
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        resizable: false,
        frame: true,
        alwaysOnTop: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    // Auto-hide on blur (unless drag-drop mode is enabled)
    mainWindow.on('blur', () => {
        if (!isDragDropMode && mainWindow) {
            mainWindow.hide();
        }
    });

    // Close button minimizes to tray
    mainWindow.on('close', (event) => {
        event.preventDefault();
        mainWindow?.hide();
    });

    return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
    return mainWindow;
}

export function showMainWindow(): void {
    const win = getMainWindow() ?? createMainWindow();
    if (isLockWindowCenter) {
        win.center();
    }
    win.show();
    win.focus();
}

export function hideMainWindow(): void {
    mainWindow?.hide();
}

export function setLockWindowCenter(enabled: boolean): void {
    isLockWindowCenter = enabled;
    if (enabled && mainWindow) {
        mainWindow.center();
        mainWindow.setMovable(false);
    } else if (mainWindow) {
        mainWindow.setMovable(true);
    }
}

export function setDragDropMode(enabled: boolean): void {
    isDragDropMode = enabled;
    if (mainWindow) {
        // When Drag & Drop Mode is enabled:
        // - Make window movable (overrides Lock Window Center)
        // - Disable always-on-top so user can drag files from behind
        // When disabled, restore both settings
        mainWindow.setMovable(enabled || !isLockWindowCenter);
        mainWindow.setAlwaysOnTop(!enabled);
    }
}
```

### 5.5 `hotkey.ts` - Global Hotkey

```ts
import {globalShortcut} from 'electron';
import {HotkeyConfig} from '../shared/types';
import {showMainWindow, hideMainWindow, getMainWindow} from './window';
import log from './logger';

export function registerGlobalHotkey(config: HotkeyConfig): void {
    globalShortcut.unregisterAll();

    const accelerator = [...config.modifiers, config.key].join('+');

    const success = globalShortcut.register(accelerator, () => {
        const win = getMainWindow();
        if (!win || !win.isVisible()) {
            showMainWindow();
        } else {
            hideMainWindow();
        }
    });

    if (!success) {
        log.error('Failed to register hotkey', {accelerator});
    }
}

export function unregisterGlobalHotkeys(): void {
    globalShortcut.unregisterAll();
}
```

### 5.6 `launcher.ts` - Program Launching

Omitted

### 5.7 `iconService.ts` - Icon Resolution (Main Process)

```ts
import {app, nativeImage, NativeImage} from 'electron';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import log from './logger';
import {CACHE_DIR_PATH} from './paths';
import type {KeyConfig} from '../shared/types';

const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const CLEANUP_DELAY = 10 * 60 * 1000; // 10 minutes after startup

let cleanupScheduled = false;

/**
 * Run expired cache cleanup (executes only once per process)
 */
function runCleanup(): void {
    try {
        if (!fs.existsSync(CACHE_DIR_PATH)) return;

        const now = Date.now();
        const files = fs.readdirSync(CACHE_DIR_PATH);
        let deletedCount = 0;

        for (const file of files) {
            if (!file.endsWith('.png')) continue;

            const filePath = path.join(CACHE_DIR_PATH, file);
            try {
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs >= CACHE_TTL) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            } catch {
                // Ignore individual file errors
            }
        }

        if (deletedCount > 0) {
            log.info(`Cleaned ${deletedCount} expired icon caches`, {scope: 'iconService'});
        }
    } catch (error) {
        log.error(error, {scope: 'iconService:cleanup'});
    }
}

/**
 * Initialize icon service
 * - Schedules a one-time cleanup 10 minutes after startup
 */
export function initIconService(): void {
    if (cleanupScheduled) return;
    cleanupScheduled = true;

    setTimeout(runCleanup, CLEANUP_DELAY);

    log.debug('Icon cache cleanup scheduled (once after 10min)', {scope: 'iconService'});
}

/**
 * Get icon for a key config
 * - Returns cached icon if exists (no expiration check)
 * - Extracts and caches icon if not cached
 * - Cache key: MD5 hash of `${filePath}|${arguments}|${iconPath}`
 */
export async function getIcon(keyConfig: KeyConfig): Promise<string | null> {
    const {filePath, arguments: args, iconPath} = keyConfig;

    // Use custom iconPath if specified
    const targetPath = iconPath || filePath;

    // Generate cache key using filePath + arguments + iconPath
    const cacheSource = `${filePath}|${args ?? ''}|${iconPath ?? ''}`;
    const cacheKey = crypto.createHash('md5').update(cacheSource).digest('hex');
    const cachePath = path.join(CACHE_DIR_PATH, `${cacheKey}.png`);

    // Return cached icon if exists (no TTL check - cleanup handles expiration)
    if (fs.existsSync(cachePath)) {
        const icon = nativeImage.createFromPath(cachePath);
        if (!icon.isEmpty()) {
            return icon.toDataURL();
        }
    }

    // Extract icon using native APIs
    try {
        let icon: NativeImage;

        if (process.platform === 'darwin' && targetPath.endsWith('.app')) {
            icon = await nativeImage.createThumbnailFromPath(targetPath, {width: 256, height: 256});
        } else {
            icon = await app.getFileIcon(targetPath, {size: 'large'});
        }

        if (!icon.isEmpty()) {
            // Cache to disk for persistence across app restarts
            fs.mkdirSync(CACHE_DIR_PATH, {recursive: true});
            fs.writeFileSync(cachePath, icon.toPNG());
            return icon.toDataURL();
        }
    } catch (error) {
        log.error(error, {scope: 'iconService', targetPath});
    }

    return null;
}
```

### 5.8 `tray.ts` - System Tray

```ts
import {Tray, Menu, nativeImage} from 'electron';
import {showMainWindow} from './window';
import {app} from 'electron';
import path from 'path';

let tray: Tray | null = null;

export function createTray(): void {
    const iconPath = path.join(__dirname, '../../resources/icon.png');
    tray = new Tray(nativeImage.createFromPath(iconPath));

    const contextMenu = Menu.buildFromTemplate([
        {label: 'Show', click: showMainWindow},
        {type: 'separator'},
        {label: 'Exit', click: () => app.exit()},
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('click', showMainWindow);
}
```

### 5.9 `ipcHandlers.ts` - IPC Handlers

IPC channels are defined in `src/shared/ipcChannels.ts` as a single source of truth. The design minimizes channel count
by:

- Merging `lockWindowCenter` handling into `config:saveSettings` (detects changes and applies automatically)
- Merging `showItemInFolder` into `tools:openPath` via `{ showInFolder: true }` option
- Merging error logging into `dialog:showError` (logs before showing dialog)

```ts
import {ipcMain, dialog, shell, app} from 'electron';
import {
    loadSettings,
    saveSettings,
    loadProfile,
    saveProfile,
    listCustomStyles,
    loadCustomStyleContent
} from './configStore';
import {launchProgram} from './launcher';
import {getIcon} from './iconService';
import {setDragDropMode, setLockWindowCenter, hideMainWindow, getMainWindow} from './window';
import {registerGlobalHotkey} from './hotkey';
import {configureAutoLaunch} from './autoLaunch';
import log from './logger';

export function registerIpcHandlers(): void {
    // Load all config (also applies initial lockWindowCenter)
    ipcMain.handle('config:load', async () => {
        const settings = loadSettings();
        const profile = loadProfile(settings.activeProfilePath);

        // Apply initial lockWindowCenter setting
        if (settings.lockWindowCenter) {
            setLockWindowCenter(true);
        }

        return {settings, profile};
    });

    // Save settings (handles all side effects: hotkey, autoLaunch, lockWindowCenter)
    ipcMain.handle('config:saveSettings', async (_, settings) => {
        const oldSettings = loadSettings();
        saveSettings(settings);

        registerGlobalHotkey(settings.hotkey);

        if (oldSettings.launchOnStartup !== settings.launchOnStartup) {
            await configureAutoLaunch(settings.launchOnStartup);
        }

        if (oldSettings.lockWindowCenter !== settings.lockWindowCenter) {
            setLockWindowCenter(settings.lockWindowCenter);
        }

        return {success: true};
    });

    // Save profile
    ipcMain.handle('config:saveProfile', async (_, profile, filePath) => {
        saveProfile(profile, filePath);
        return {success: true};
    });

    // Open profile file dialog
    ipcMain.handle('config:openProfileDialog', async () => {
        const result = await dialog.showOpenDialog({
            filters: [{name: 'YAML', extensions: ['yaml', 'yml']}],
            properties: ['openFile', 'showHiddenFiles'],
        });
        if (result.canceled) return {canceled: true};
        return {canceled: false, filePath: result.filePaths[0]};
    });

    // Save As dialog
    ipcMain.handle('config:saveAsDialog', async () => {
        const result = await dialog.showSaveDialog({
            filters: [{name: 'YAML', extensions: ['yaml', 'yml']}],
        });
        if (result.canceled) return {canceled: true};
        return {canceled: false, filePath: result.filePath};
    });

    // Launch program
    ipcMain.handle('launcher:run', async (_, keyConfig) => {
        await launchProgram(keyConfig);
        return {success: true};
    });

    // Get icon
    ipcMain.handle('icon:get', async (_, keyConfig) => {
        const dataUrl = await getIcon(keyConfig);
        return {dataUrl};
    });

    // Window controls
    ipcMain.handle('window:setDragDropMode', (_, enabled) => {
        setDragDropMode(enabled);
    });

    ipcMain.handle('window:hide', () => {
        hideMainWindow();
    });

    // Tools - open path or show item in folder
    ipcMain.handle('tools:openPath', async (_, targetPath, options?: { showInFolder?: boolean }) => {
        if (options?.showInFolder) {
            shell.showItemInFolder(targetPath);
        } else {
            await shell.openPath(targetPath);
        }
    });

    // App info (for About dialog)
    ipcMain.handle('app:getInfo', () => {
        return {
            name: app.getName(),
            version: app.getVersion(),
            gitCommitId: process.env.GIT_COMMIT_ID ?? 'dev',
        };
    });

    // Exit application
    ipcMain.handle('app:exit', () => {
        app.exit();
    });

    // Custom styles
    ipcMain.handle('styles:list', () => {
        return {styles: listCustomStyles()};
    });

    ipcMain.handle('styles:load', (_, styleName: string) => {
        const content = loadCustomStyleContent(styleName);
        return {content};
    });

    // Show native error dialog (also logs the error)
    ipcMain.handle('dialog:showError', async (_, title: string, content: string) => {
        log.error(content, {scope: 'renderer', title});

        const win = getMainWindow();
        await dialog.showMessageBox(win!, {
            type: 'error',
            title,
            message: content,
            buttons: ['OK'],
        });
    });
}
```

### 5.10 `main.ts` - Entry Point

```ts
import {app} from 'electron';
import {createMainWindow, getMainWindow} from './window';
import {registerIpcHandlers} from './ipcHandlers';
import {registerGlobalHotkey, unregisterGlobalHotkeys} from './hotkey';
import {loadSettings} from './configStore';
import {createTray} from './tray';
import {configureAutoLaunch} from './autoLaunch';
import {initIconService} from './iconService';
import log from './logger';

function initializeApp(): void {
    // Single instance lock
    if (!app.requestSingleInstanceLock()) {
        app.quit();
        return;
    }

    app.on('second-instance', () => {
        const win = getMainWindow();
        if (win) {
            if (!win.isVisible()) win.show();
            win.focus();
        }
    });

    // Global error handlers
    process.on('uncaughtException', (error) => {
        log.error(error, {scope: 'main:uncaughtException'});
    });

    process.on('unhandledRejection', (reason) => {
        log.error(reason, {scope: 'main:unhandledRejection'});
    });

    app.whenReady().then(async () => {
        log.info('App ready');

        const settings = loadSettings();

        // Configure auto-launch
        await configureAutoLaunch(settings.launchOnStartup ?? false);

        // Create window (show or hide based on startInTray)
        const win = createMainWindow();
        if (!settings.startInTray) {
            win.show();
        }

        createTray();
        registerIpcHandlers();
        registerGlobalHotkey(settings.hotkey);

        // Schedule icon cache cleanup (runs once, 10 minutes after startup)
        initIconService();
    });

    app.on('will-quit', () => {
        unregisterGlobalHotkeys();
    });
}

initializeApp();
```

---

## 6. Preload (`src/preload/index.ts`)

```ts
import {contextBridge, ipcRenderer} from 'electron';
import type {AppSettings, KeyboardProfile, KeyConfig} from '../shared/types';
import {IPC_CHANNELS} from '../shared/ipcChannels';

const api = {
    // Config
    loadConfig: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_LOAD) as Promise<{
        settings: AppSettings;
        profile: KeyboardProfile
    }>,
    saveSettings: (settings: AppSettings) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SAVE_SETTINGS, settings),
    saveProfile: (profile: KeyboardProfile, filePath?: string) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SAVE_PROFILE, profile, filePath),
    openProfileDialog: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_OPEN_PROFILE_DIALOG) as Promise<{
        canceled: boolean;
        filePath?: string
    }>,
    saveAsDialog: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SAVE_AS_DIALOG) as Promise<{
        canceled: boolean;
        filePath?: string
    }>,

    // Launcher
    launchProgram: (key: KeyConfig) => ipcRenderer.invoke(IPC_CHANNELS.LAUNCHER_RUN, key),

    // Icons
    getIcon: (keyConfig: KeyConfig) => ipcRenderer.invoke(IPC_CHANNELS.ICON_GET, keyConfig) as Promise<{
        dataUrl: string | null
    }>,

    // Window
    setDragDropMode: (enabled: boolean) => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_SET_DRAG_DROP_MODE, enabled),
    hideWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_HIDE),

    // Tools
    openPath: (path: string, options?: {
        showInFolder?: boolean
    }) => ipcRenderer.invoke(IPC_CHANNELS.TOOLS_OPEN_PATH, path, options),

    // App info
    getAppInfo: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_INFO) as Promise<{
        name: string;
        version: string;
        gitCommitId: string
    }>,

    // Exit application
    exitApp: () => ipcRenderer.invoke(IPC_CHANNELS.APP_EXIT),

    // Custom styles
    listStyles: () => ipcRenderer.invoke(IPC_CHANNELS.STYLES_LIST) as Promise<{ styles: string[] }>,
    loadStyleContent: (styleName: string) => ipcRenderer.invoke(IPC_CHANNELS.STYLES_LOAD, styleName) as Promise<{
        content: string | null
    }>,

    // Dialog (also logs errors)
    showErrorDialog: (title: string, content: string) => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_SHOW_ERROR, title, content),

    // Shortcut parsing (Windows .lnk)
    parseShortcut: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.SHORTCUT_PARSE, filePath) as Promise<{
        filePath: string;
        arguments?: string;
        workingDirectory?: string;
        description?: string;
    } | null>,
};

export type ElectronAPI = typeof api;

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

contextBridge.exposeInMainWorld('electronAPI', api);
```

---

## 7. Renderer State Management

### 7.1 State Design (`src/renderer/state/store.ts`)

**Single store with clear separation**:

```tsx
import React, {createContext, useContext, useReducer, ReactNode} from 'react';
import type {AppSettings, KeyboardProfile, KeyConfig} from '../../shared/types';

// ============ State Types ============

// Discriminated union for modal state - ensures type safety and prevents invalid states
// e.g., impossible to have modal.type === 'editKey' with missing key data
type ModalState =
    | { type: 'none' }
    | { type: 'editKey'; key: KeyConfig }
    | { type: 'editTab'; tabId: string }
    | { type: 'hotkeySettings' }
    | { type: 'options' }
    | { type: 'about' };

interface AppState {
    // Persisted config (loaded from files)
    settings: AppSettings | null;
    profile: KeyboardProfile | null;

    // Ephemeral UI state (not persisted)
    ui: {
        activeTabId: string;
        searchQuery: string;
        isDragDropMode: boolean;      // Runtime only, resets on restart
        isConfigDirty: boolean;
        isLoading: boolean;
        error: string | null;
        modal: ModalState;            // Discriminated union replaces activeModal + editingKey + editingTabId
        clipboardKey: KeyConfig | null; // Internal clipboard for Copy/Cut/Paste (not system clipboard)
    };
}

// ============ Actions ============

type Action =
// Config actions
    | { type: 'SET_CONFIG'; settings: AppSettings; profile: KeyboardProfile }
    | { type: 'UPDATE_SETTINGS'; settings: Partial<AppSettings> }
    | { type: 'UPDATE_PROFILE'; profile: KeyboardProfile }
    | { type: 'UPDATE_KEY'; key: KeyConfig }
    | { type: 'DELETE_KEY'; tabId: string; keyId: string }
    | { type: 'UPDATE_TAB'; tabId: string; label: string }
    // UI actions
    | { type: 'SET_ACTIVE_TAB'; tabId: string }
    | { type: 'SET_SEARCH_QUERY'; query: string }
    | { type: 'SET_DRAG_DROP_MODE'; enabled: boolean }
    | { type: 'SET_CONFIG_DIRTY'; dirty: boolean }
    | { type: 'SET_LOADING'; loading: boolean }
    | { type: 'SET_ERROR'; error: string | null }
    | { type: 'OPEN_EDIT_KEY_MODAL'; key: KeyConfig }
    | { type: 'OPEN_EDIT_TAB_MODAL'; tabId: string }
    | { type: 'OPEN_HOTKEY_SETTINGS_MODAL' }
    | { type: 'OPEN_OPTIONS_MODAL' }
    | { type: 'OPEN_ABOUT_MODAL' }
    | { type: 'CLOSE_MODAL' }
    // Internal clipboard actions (Copy/Cut/Paste - does NOT use system clipboard)
    | { type: 'SET_CLIPBOARD'; key: KeyConfig | null };

// ============ Initial State ============

const initialState: AppState = {
    settings: null,
    profile: null,
    ui: {
        activeTabId: '1',
        searchQuery: '',
        isDragDropMode: false,
        isConfigDirty: false,
        isLoading: true,
        error: null,
        modal: {type: 'none'},
        clipboardKey: null,
    },
};

// ============ Reducer ============

function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_CONFIG':
            return {
                ...state,
                settings: action.settings,
                profile: action.profile,
                ui: {...state.ui, isLoading: false, isConfigDirty: false},
            };

        case 'UPDATE_SETTINGS':
            return {
                ...state,
                settings: state.settings ? {...state.settings, ...action.settings} : null,
                ui: {...state.ui, isConfigDirty: true},
            };

        case 'UPDATE_PROFILE':
            return {
                ...state,
                profile: action.profile,
                ui: {...state.ui, isConfigDirty: true},
            };

        case 'UPDATE_KEY': {
            if (!state.profile) return state;
            const keys = state.profile.keys;
            const idx = keys.findIndex(k => k.tabId === action.key.tabId && k.id === action.key.id);
            const newKeys = idx >= 0
                ? [...keys.slice(0, idx), action.key, ...keys.slice(idx + 1)]
                : [...keys, action.key];
            return {
                ...state,
                profile: {...state.profile, keys: newKeys},
                ui: {...state.ui, isConfigDirty: true},
            };
        }

        case 'DELETE_KEY': {
            if (!state.profile) return state;
            const keys = state.profile.keys.filter(
                k => !(k.tabId === action.tabId && k.id === action.keyId)
            );
            return {
                ...state,
                profile: {...state.profile, keys},
                ui: {...state.ui, isConfigDirty: true},
            };
        }

        case 'UPDATE_TAB': {
            if (!state.profile) return state;
            const tabs = state.profile.tabs.map(t =>
                t.id === action.tabId ? {...t, label: action.label} : t
            );
            return {
                ...state,
                profile: {...state.profile, tabs},
                ui: {...state.ui, isConfigDirty: true},
            };
        }

        case 'SET_ACTIVE_TAB':
            return {...state, ui: {...state.ui, activeTabId: action.tabId}};

        case 'SET_SEARCH_QUERY':
            return {...state, ui: {...state.ui, searchQuery: action.query}};

        case 'SET_DRAG_DROP_MODE':
            return {...state, ui: {...state.ui, isDragDropMode: action.enabled}};

        case 'SET_CONFIG_DIRTY':
            return {...state, ui: {...state.ui, isConfigDirty: action.dirty}};

        case 'SET_LOADING':
            return {...state, ui: {...state.ui, isLoading: action.loading}};

        case 'SET_ERROR':
            return {...state, ui: {...state.ui, error: action.error}};

        case 'OPEN_EDIT_KEY_MODAL':
            return {
                ...state,
                ui: {...state.ui, modal: {type: 'editKey', key: action.key}},
            };

        case 'OPEN_EDIT_TAB_MODAL':
            return {
                ...state,
                ui: {...state.ui, modal: {type: 'editTab', tabId: action.tabId}},
            };

        case 'OPEN_HOTKEY_SETTINGS_MODAL':
            return {
                ...state,
                ui: {...state.ui, modal: {type: 'hotkeySettings'}},
            };

        case 'OPEN_OPTIONS_MODAL':
            return {
                ...state,
                ui: {...state.ui, modal: {type: 'options'}},
            };

        case 'OPEN_ABOUT_MODAL':
            return {
                ...state,
                ui: {...state.ui, modal: {type: 'about'}},
            };

        case 'CLOSE_MODAL':
            return {
                ...state,
                ui: {...state.ui, modal: {type: 'none'}},
            };

        case 'SET_CLIPBOARD':
            return {
                ...state,
                ui: {...state.ui, clipboardKey: action.key},
            };

        default:
            return state;
    }
}

// ============ Context ============

const StateContext = createContext<AppState | null>(null);
const DispatchContext = createContext<React.Dispatch<Action> | null>(null);

export function AppStateProvider({children}: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>
                {children}
            </DispatchContext.Provider>
        </StateContext.Provider>
    );
}

export function useAppState() {
    const ctx = useContext(StateContext);
    if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
    return ctx;
}

export function useDispatch() {
    const ctx = useContext(DispatchContext);
    if (!ctx) throw new Error('useDispatch must be used within AppStateProvider');
    return ctx;
}
```

### 7.2 Selectors (`src/renderer/state/selectors.ts`)

Omitted for brevity

---

## 8. Renderer Hooks

### 8.1 `useConfigSync.ts` - Auto-save

```ts
import {useEffect, useRef} from 'react';
import {useAppState, useDispatch} from '../state/store';

export function useConfigSync() {
    const state = useAppState();
    const dispatch = useDispatch();
    const isFirstRender = useRef(true);

    useEffect(() => {
        // Skip first render (initial load)
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (!state.ui.isConfigDirty || !state.settings || !state.profile) {
            return;
        }

        // Debounce save (1 second)
        const timer = setTimeout(async () => {
            try {
                await window.electronAPI.saveSettings(state.settings!);
                await window.electronAPI.saveProfile(state.profile!, state.settings!.activeProfilePath);
                dispatch({type: 'SET_CONFIG_DIRTY', dirty: false});
            } catch (error) {
                dispatch({type: 'SET_ERROR', error: 'Failed to save configuration'});
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [state.settings, state.profile, state.ui.isConfigDirty, dispatch]);
}
```

### 8.2 `useErrorDialog.ts` - Error Dialog Handling

This hook monitors error state and displays native system dialogs for errors. Native dialogs ensure visibility even when
the window auto-hides.

```ts
import {useEffect} from 'react';
import {useAppState, useDispatch} from '../state/store';

export function useErrorDialog() {
    const state = useAppState();
    const dispatch = useDispatch();

    useEffect(() => {
        if (!state.ui.error) {
            return;
        }

        // Show native system dialog for errors
        window.electronAPI.showErrorDialog('Error', state.ui.error).then(() => {
            // Clear error state after dialog is dismissed
            dispatch({type: 'SET_ERROR', error: null});
        });
    }, [state.ui.error, dispatch]);
}
```

### 8.3 `useKeyboardNav.ts` - Keyboard & Mouse Navigation

```ts
import {useEffect, useCallback} from 'react';
import {useAppState, useDispatch} from '../state/store';
import {FUNCTION_KEYS, NUM_KEYS, LETTER_KEYS} from '../../shared/constants';
import {useLaunchProgram} from './useLaunchProgram';

export function useKeyboardNav() {
    const state = useAppState();
    const dispatch = useDispatch();
    const {launchProgram} = useLaunchProgram();

    // Shared tab navigation logic (used by both arrow keys and mouse wheel)
    // Stops at boundaries instead of cycling
    const navigateTab = useCallback((delta: 1 | -1) => {
        const currentIndex = NUM_KEYS.indexOf(state.ui.activeTabId as (typeof NUM_KEYS)[number]);
        const newIndex = currentIndex + delta;
        if (newIndex < 0 || newIndex >= NUM_KEYS.length) {
            return; // Stop at boundaries
        }
        dispatch({type: 'SET_ACTIVE_TAB', tabId: NUM_KEYS[newIndex]});
    }, [state.ui.activeTabId, dispatch]);

    // Keyboard event handler
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            // Ignore if typing in input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const key = e.key;

            // Tab switching: 1-0
            if (NUM_KEYS.includes(key as (typeof NUM_KEYS)[number])) {
                dispatch({type: 'SET_ACTIVE_TAB', tabId: key});
                return;
            }

            // Arrow keys: tab navigation (stops at boundaries)
            if (key === 'ArrowLeft' || key === 'ArrowRight') {
                e.preventDefault();
                navigateTab(key === 'ArrowRight' ? 1 : -1);
                return;
            }

            // Escape: close modal or hide window
            if (key === 'Escape') {
                if (state.ui.modal.type !== 'none') {
                    dispatch({type: 'CLOSE_MODAL'});
                } else {
                    window.electronAPI.hideWindow();
                }
                return;
            }

            // Ctrl/Cmd+F: focus search
            if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === 'f') {
                e.preventDefault();
                document.getElementById('search-input')?.focus();
                return;
            }

            // F1-F10: launch function keys
            if (FUNCTION_KEYS.includes(key as (typeof FUNCTION_KEYS)[number])) {
                const keyConfig = state.profile?.keys.find(k => k.tabId === 'F' && k.id === key);
                if (keyConfig) {
                    launchProgram(keyConfig);
                }
                return;
            }

            // Letter keys: launch current tab keys (case-insensitive)
            const upperKey = key.toUpperCase();
            if (LETTER_KEYS.includes(upperKey as (typeof LETTER_KEYS)[number])) {
                const keyConfig = state.profile?.keys.find(
                    k => k.tabId === state.ui.activeTabId && k.id === upperKey
                );
                if (keyConfig) {
                    launchProgram(keyConfig);
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state, dispatch, navigateTab, launchProgram]);

    // Mouse wheel event handler for tab switching
    useEffect(() => {
        function handleWheel(e: WheelEvent) {
            // Only handle wheel events over the keyboard area
            const keyboardZone = document.querySelector('.keyboard-zone');
            if (!keyboardZone || !keyboardZone.contains(e.target as Node)) {
                return;
            }

            // Ignore if a modal is open
            if (state.ui.modal.type !== 'none') {
                return;
            }

            e.preventDefault();
            // Scroll down (positive deltaY) = next tab, scroll up (negative deltaY) = previous tab
            navigateTab(e.deltaY > 0 ? 1 : -1);
        }

        window.addEventListener('wheel', handleWheel, {passive: false});
        return () => window.removeEventListener('wheel', handleWheel);
    }, [state.ui.modal.type, navigateTab]);
}
```

### 8.4 `useTheme.ts` - Theme Management

```ts
import {useEffect} from 'react';
import {useAppState} from '../state/store';

export function useTheme() {
    const state = useAppState();
    const theme = state.settings?.theme ?? 'system';

    useEffect(() => {
        const root = document.documentElement;

        function applyTheme(isDark: boolean) {
            root.classList.toggle('dark-mode', isDark);
        }

        if (theme === 'system') {
            const media = window.matchMedia('(prefers-color-scheme: dark)');
            applyTheme(media.matches);

            const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
            media.addEventListener('change', handler);
            return () => media.removeEventListener('change', handler);
        }

        applyTheme(theme === 'dark');
    }, [theme]);
}
```

### 8.5 `useCustomStyle.ts` - Custom Style Loading

Loads and applies custom CSS from `~/.config/MaxLaunchpad/styles/` directory based on `settings.customStyle`.

```ts
import {useEffect, useRef} from 'react';
import {useAppState} from '../state/store';

const CUSTOM_STYLE_ID = 'custom-style';

export function useCustomStyle() {
    const state = useAppState();
    const customStyle = state.settings?.customStyle;
    const previousStyleRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        // Skip if style hasn't changed
        if (previousStyleRef.current === customStyle) {
            return;
        }
        previousStyleRef.current = customStyle;

        // Remove existing custom style element
        const existingStyle = document.getElementById(CUSTOM_STYLE_ID);
        if (existingStyle) {
            existingStyle.remove();
        }

        // If no custom style selected, we're done
        if (!customStyle) {
            return;
        }

        // Load and apply custom style
        async function loadStyle() {
            try {
                const {content} = await window.electronAPI.loadStyleContent(customStyle!);
                if (content) {
                    const styleElement = document.createElement('style');
                    styleElement.id = CUSTOM_STYLE_ID;
                    styleElement.textContent = content;
                    document.head.appendChild(styleElement);
                }
            } catch (error) {
                console.error('Failed to load custom style:', error);
            }
        }

        loadStyle();

        // Cleanup on unmount or style change
        return () => {
            const styleElement = document.getElementById(CUSTOM_STYLE_ID);
            if (styleElement) {
                styleElement.remove();
            }
        };
    }, [customStyle]);
}
```

### 8.6 `useWindowBehavior.ts` - Window Show Behavior

```ts
import {useEffect} from 'react';
import {useAppState, useDispatch} from '../state/store';

export function useWindowBehavior() {
    const state = useAppState();
    const dispatch = useDispatch();

    useEffect(() => {
        function handleVisibilityChange() {
            if (document.visibilityState === 'visible' && state.settings) {
                const activeTabOnShow = state.settings.activeTabOnShow;
                if (activeTabOnShow !== 'lastUsed') {
                    dispatch({type: 'SET_ACTIVE_TAB', tabId: activeTabOnShow});
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [state.settings, dispatch]);
}
```

### 8.7 `useWindowTitle.ts` - Window Title Management

This hook automatically updates the window title based on app state. The title is managed entirely in the renderer
process via `document.title`, avoiding IPC overhead.

```ts
import {useEffect} from 'react';
import {useAppState} from '../state/store';
import {APP_NAME} from '../../shared/constants';

/**
 * Hook that automatically updates window title based on app state.
 * - Shows profile path in title
 * - Adds * suffix when config is dirty (unsaved changes)
 */
export function useWindowTitle() {
    const state = useAppState();
    const profilePath = state.settings?.activeProfilePath;
    const isDirty = state.ui.isConfigDirty;

    useEffect(() => {
        if (!profilePath) return;

        const baseTitle = `${APP_NAME} - ${profilePath}`;
        document.title = isDirty ? `${baseTitle}*` : baseTitle;
    }, [profilePath, isDirty]);
}
```

### 8.8 `useIcon.ts` - Icon Loading with Memory Cache & Fallback

This hook handles icon loading with a renderer-side memory cache and automatic fallback generation. The two-layer
caching strategy:

1. **Renderer memory cache** (fastest): avoids IPC entirely on cache hit
2. **Main process disk cache**: persists across app restarts
3. **Fallback generation**: DiceBear Initials avatar when icon extraction fails

**Cache Key**: `${keyConfig.filePath}|${keyConfig.arguments ?? ''}|${keyConfig.iconPath ?? ''}`

This ensures unique caching for:

- Different file paths
- Same file path but different arguments (e.g., UWP/Store apps)
- Custom icon paths

```ts
import {useState, useEffect} from 'react';
import {createAvatar} from '@dicebear/core';
import {initials} from '@dicebear/collection';
import type {KeyConfig} from '../../shared/types';

// Renderer-side memory cache: cacheKey → dataURL
// Placed outside component to persist across re-renders and component instances
const iconCache = new Map<string, string>();

/**
 * Generate a fallback icon using DiceBear Initials style.
 * Uses the basename of the file path as the seed for consistent colors.
 */
function generateFallbackIcon(filePath: string): string {
    const basename = filePath.split(/[/\\]/).pop()?.replace(/\.[^.]+$/, '') ?? 'App';
    const avatar = createAvatar(initials, {seed: basename});
    return avatar.toDataUri();
}

/**
 * Generate a cache key for a KeyConfig
 * Uses filePath + arguments + iconPath as unique identifier
 */
function getCacheKey(keyConfig: KeyConfig): string {
    const {filePath, arguments: args, iconPath} = keyConfig;
    return `${filePath}|${args ?? ''}|${iconPath ?? ''}`;
}

/**
 * Hook to load an icon for a given key config.
 * Returns a dataURL string (either real icon or fallback), or null while loading.
 *
 * @param keyConfig - The key configuration (optional)
 * @returns dataURL string or null
 */
export function useIcon(keyConfig: KeyConfig | undefined): string | null {
    const [icon, setIcon] = useState<string | null>(() => {
        // Initialize from cache if available (synchronous)
        if (!keyConfig?.filePath) return null;
        const cacheKey = getCacheKey(keyConfig);
        return iconCache.get(cacheKey) ?? null;
    });

    useEffect(() => {
        if (!keyConfig?.filePath) {
            setIcon(null);
            return;
        }

        const cacheKey = getCacheKey(keyConfig);

        // Check cache first
        if (iconCache.has(cacheKey)) {
            setIcon(iconCache.get(cacheKey)!);
            return;
        }

        // Reset state to null while loading
        setIcon(null);

        // Fetch from main process (disk cache or extraction)
        let cancelled = false;

        (async () => {
            const {dataUrl} = await window.electronAPI.getIcon(keyConfig);
            if (cancelled) return;

            // Use extracted icon or generate fallback
            const finalIcon = dataUrl ?? generateFallbackIcon(keyConfig.filePath);

            // Cache in renderer memory for future use
            iconCache.set(cacheKey, finalIcon);
            setIcon(finalIcon);
        })();

        return () => {
            cancelled = true;
        };
    }, [keyConfig]);

    return icon;
}
```

### 8.9 `useLaunchProgram.ts` - Program Launching with Native Error Dialog

This hook provides a function to launch programs with error handling. Program launch failures display a **native OS
error dialog** via `dialog.showMessageBox`. This ensures the error is visible to the user even when the window
auto-hides after launching.

### 8.10 `useContextMenu.ts` - Context Menu for Keys and Tabs

Handles right-click context menus for function/letter keys and tab buttons.

---

## 9. Renderer Components

### 9.1 `common/Modal.tsx` - Base Modal Wrapper

Base modal wrapper component used by all modal dialogs.

```tsx
export function Modal({title, onClose, children, width = 400}: ModalProps): JSX.Element {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                style={{width}}
                onClick={(e) => e.stopPropagation()}
            >
                <h2>{title}</h2>
                {children}
            </div>
        </div>
    );
}
```

### 9.2 `common/ContextMenu.tsx` - Floating Context Menu

Renders a floating context menu at a specified position. Uses `@floating-ui/react` for positioning with flip/shift
middleware.

```tsx
export function ContextMenu({items, position, onClose}: ContextMenuProps): JSX.Element {
    return (
        <div className="context-menu" style={{left: position.x, top: position.y}}>
            {items.map((item, index) =>
                item.separator ? (
                    <div key={index} className="context-menu-separator"/>
                ) : (
                    <div
                        key={index}
                        className={`context-menu-item ${item.disabled ? 'disabled' : ''}`}
                        onClick={item.onClick}
                    >
                        {item.label}
                    </div>
                )
            )}
        </div>
    );
}
```

### 9.3 `layout/TopBar.tsx` - Main Menu Bar

Main application menu bar with dropdown menus. Implements **Sticky Menu** behavior: when a menu is already open,
hovering over other menu items automatically switches to that menu.

```tsx
export function TopBar(): JSX.Element {
    return (
        <div className="main-menu">
            {/* File menu */}
            <div className="menu-item">
                File
                <div className="dropdown-menu">
                    <div className="dropdown-item">New</div>
                    <div className="dropdown-item">Open...</div>
                    <div className="dropdown-item">Save As...</div>
                    <div className="context-menu-separator"/>
                    <div className="dropdown-item">Exit</div>
                </div>
            </div>

            {/* View menu */}
            <div className="menu-item">
                View
                <div className="dropdown-menu">
                    <div className="dropdown-item">
                        <span className="menu-check"></span>
                        Drag & Drop Mode
                    </div>
                    <div className="dropdown-item">
                        <span className="menu-check"></span>
                        Lock Window Center
                    </div>
                </div>
            </div>

            {/* Tools menu (platform-specific) */}
            <div className="menu-item">
                Tools
                <div className="dropdown-menu">
                    {/* Rendered based on platform */}
                </div>
            </div>

            {/* Settings menu */}
            <div className="menu-item">
                Settings
                <div className="dropdown-menu">
                    <div className="dropdown-item">Hotkey</div>
                    <div className="dropdown-item">Options</div>
                </div>
            </div>

            {/* Help menu */}
            <div className="menu-item">
                Help
                <div className="dropdown-menu">
                    <div className="dropdown-item">Documentation</div>
                    <div className="dropdown-item">About MaxLaunchpad</div>
                </div>
            </div>

            {/* Search box component */}
            <SearchBox/>
        </div>
    );
}
```

### 9.4 `layout/SearchBox.tsx` - Search Input

Search input field with clear button. Displays placeholder "Search (Ctrl+F)".

```tsx
export function SearchBox(): JSX.Element {
    return (
        <div className="menu-item menu-search">
            <input
                id="search-input"
                className="menu-search-input"
                placeholder="Search (Ctrl+F)"
            />
            {/* X button shown when query is non-empty */}
            <button className="search-clear-btn">×</button>
        </div>
    );
}
```

### 9.5 `keyboard/VirtualKeyboard.tsx` - Main Keyboard Container

Main keyboard container component. Renders function keys, tab selector row, and letter keys grid. Integrates ContextMenu
for right-click actions.

```tsx
export function VirtualKeyboard(): JSX.Element {
    return (
        <div className="keyboard-zone">
            {/* F1-F10 function keys (global) */}
            <div className="keyboard-row f-keys-row">
                {FUNCTION_KEYS.map(keyId => (
                    <KeyButton key={keyId} keyId={keyId} tabId="F" ... />
                    ))}
            </div>

            {/* 1-0 tab selector row */}
            <div className="keyboard-row num-keys-row">
                {NUM_KEYS.map(keyId => (
                    <NumButton key={keyId} keyId={keyId} ... />
                    ))}
            </div>

            {/* Letter/symbol keys (30 keys per tab) */}
            {LETTER_KEYS_LAYOUT.map((row, rowIndex) => (
                <div key={rowIndex} className="keyboard-row letter-keys-row">
                    {row.map(keyId => (
                        <KeyButton key={keyId} keyId={keyId} tabId={activeTabId} ... />
                        ))}
                </div>
            ))}

            {/* Context menu for right-click actions */}
            {contextMenu && <ContextMenu ... />}
                </div>
                );
            }
```

### 9.6 `keyboard/KeyButton.tsx` - Keyboard Button

Renders a single keyboard button for letter/function keys. Displays key ID, optional icon, and label. Supports
drag-and-drop file assignment.

```tsx
export function KeyButton({keyId, tabId, keyConfig, onClick, onContextMenu, isHidden}: KeyButtonProps): JSX.Element {
    return (
        <button
            className={`key-btn ${keyConfig ? 'has-icon' : ''} ${isHidden ? 'hidden' : ''}`}
            title={keyConfig ? `${keyConfig.label}${keyConfig.description ? ' - ' + keyConfig.description : ''}` : ''}
            onClick={onClick}
            onContextMenu={onContextMenu}
        >
            <span className="key-btn-key">{keyId}</span>
            {icon && <img className="key-btn-icon" src={icon} alt=""/>}
            {keyConfig?.label && <span className="key-btn-text">{keyConfig.label}</span>}
        </button>
    );
}
```

### 9.7 `keyboard/NumButton.tsx` - Tab Selector Button

Renders a numeric tab selector button (1-0 keys). Displays key ID and optional label.

```tsx
export function NumButton({keyId, label, isSelected, isHidden, onClick, onContextMenu}: NumButtonProps): JSX.Element {
    return (
        <button
            className={`key-btn num-key-btn ${isSelected ? 'selected' : ''} ${isHidden ? 'hidden' : ''}`}
            onClick={onClick}
            onContextMenu={onContextMenu}
        >
            <span className="key-btn-key">{keyId}</span>
            {label && <span className="key-btn-text">{label}</span>}
        </button>
    );
}
```

### 9.8 `modals/EditKeyModal.tsx` - Key Configuration Form

Form modal for editing a key binding. Uses `Modal` wrapper.

```tsx
export function EditKeyModal({keyConfig}: EditKeyModalProps): JSX.Element {
    return (
        <Modal title="Edit Key Configuration" width={500}>
            <div className="modal-row">
                <label>Label:</label>
                <input type="text"/>
            </div>

            <div className="modal-row">
                <label>File Path:</label>
                <input type="text"/>
            </div>

            <div className="modal-row">
                <label>Arguments:</label>
                <input type="text"/>
            </div>

            <div className="modal-row">
                <label>Working Directory:</label>
                <input type="text"/>
            </div>

            <div className="modal-row">
                <label>Description:</label>
                <textarea/>
            </div>

            {/* Windows only */}
            <div className="modal-row">
                <label>Run as Admin:</label>
                <input type="checkbox"/>
            </div>

            <div className="modal-row">
                <label>Icon Path:</label>
                <input type="text"/>
            </div>

            <div className="modal-actions">
                <button>Save</button>
                <button>Cancel</button>
            </div>
        </Modal>
    );
}
```

### 9.9 `modals/EditTabModal.tsx` - Tab Label Form

Simple form modal for editing a tab's display label. Uses `Modal` wrapper.

```tsx
export function EditTabModal({tabId}: EditTabModalProps): JSX.Element {
    return (
        <Modal title="Edit Tab Label" width={400}>
            <div className="modal-row">
                <label>Tab Label:</label>
                <input type="text"/>
            </div>

            <div className="modal-actions">
                <button>Save</button>
                <button>Cancel</button>
            </div>
        </Modal>
    );
}
```

### 9.10 `modals/HotkeySettingsModal.tsx` - Hotkey Configuration

Configuration modal for global hotkey settings. Uses `Modal` wrapper.

```tsx
export function HotkeySettingsModal(): JSX.Element {
    return (
        <Modal title="Hotkey Settings">
            <div className="modal-row">
                <label>Modifier Keys:</label>
                <div className="modifier-keys">
                    <label><input type="checkbox"/> Ctrl/Cmd</label>
                    <label><input type="checkbox"/> Alt/Option</label>
                    <label><input type="checkbox"/> Shift</label>
                    <label><input type="checkbox"/> Meta/Win</label>
                </div>
            </div>

            <div className="modal-row">
                <label>Key:</label>
                <input type="text" placeholder="Press a key"/>
            </div>

            <div className="modal-row">
                <label>Active Tab on Show:</label>
                <select>
                    <option value="lastUsed">Last Used</option>
                    <option value="1">1</option>
                    {/* ... 2-0 */}
                </select>
            </div>

            <div className="modal-row">
                <label>Current Hotkey:</label>
                <span>Alt + `</span>
            </div>

            <div className="modal-actions">
                <button>Close</button>
            </div>
        </Modal>
    );
}
```

### 9.11 `modals/OptionsModal.tsx` - Application Options

Application options/preferences modal. Uses `Modal` wrapper.

```tsx
export function OptionsModal(): JSX.Element {
    return (
        <Modal title="Options">
            <div className="modal-row">
                <label><input type="checkbox"/> Launch on Startup</label>
            </div>

            <div className="modal-row">
                <label><input type="checkbox"/> Start in Tray (Minimized)</label>
            </div>

            <div className="modal-row">
                <label>Theme:</label>
                <select>
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                </select>
            </div>

            <div className="modal-row">
                <label>Custom Style:</label>
                <select>
                    <option value="default">Default</option>
                    {/* Dynamically loaded from available styles */}
                </select>
            </div>

            <div className="modal-actions">
                <button>Close</button>
            </div>
        </Modal>
    );
}
```

### 9.12 `modals/AboutModal.tsx` - About Dialog

Displays application information modal. Uses `Modal` wrapper with 350px width.

```tsx
export function AboutModal(): JSX.Element {
    return (
        <Modal title="About MaxLaunchpad" width={350}>
            <div className="modal-row">
                <label>Application:</label>
                <span>{appInfo.name}</span>
            </div>

            <div className="modal-row">
                <label>Version:</label>
                <span>{appInfo.version}</span>
            </div>

            <div className="modal-row">
                <label>Git Commit:</label>
                <span>{appInfo.gitCommitId}</span>
            </div>

            <p className="about-description">{APP_DESCRIPTION}</p>

            <div className="modal-actions">
                <button>Close</button>
            </div>
        </Modal>
    );
}
```

---

## 10. CSS Themes (`src/renderer/styles/themes.css`)

```css
/* Light theme (default) */
:root {
    --background-color: #FAFAFA;
    --selected-background-color: #E3F2FD;
    --text-color: #212121;
}

/* Dark theme */
:root.dark-mode {
    --background-color: #121212;
    --selected-background-color: #1E3A5F;
    --text-color: #E0E0E0;
}
```

---

## 11. Build-time Git Commit ID Injection

The Git commit ID is injected at build time via environment variable `GIT_COMMIT_ID`. This enables the About dialog to
display the exact commit the app was built from.

### 11.1 Webpack Configuration

In `forge.config.ts` or webpack config, use `DefinePlugin` to inject the Git commit ID:

```ts
import {execSync} from 'child_process';
import webpack from 'webpack';

// Get current Git commit ID
function getGitCommitId(): string {
    try {
        return execSync('git rev-parse --short HEAD').toString().trim();
    } catch {
        return 'unknown';
    }
}

// In webpack plugins array:
new webpack.DefinePlugin({
    'process.env.GIT_COMMIT_ID': JSON.stringify(getGitCommitId()),
});
```

### 11.2 Usage in Main Process

The `app:getInfo` IPC handler reads `process.env.GIT_COMMIT_ID` which is replaced at build time:

```ts
ipcMain.handle('app:getInfo', () => {
    return {
        name: app.getName(),
        version: app.getVersion(),
        gitCommitId: process.env.GIT_COMMIT_ID ?? 'dev',
    };
});
```

### 11.3 Development vs Production

- **Development**: Returns `'dev'` as fallback when not built with DefinePlugin
- **Production**: Returns actual short commit hash (e.g., `'a1b2c3d'`)

---

## 12. Key Design Decisions

### Single Source of Truth

- **Settings**: `settings.yaml` → `state.settings` → save back to file
- **Profile**: `*.yaml` → `state.profile` → save back to file
- **Keyboard Layout**: `src/shared/constants.ts` → shared `FUNCTION_KEYS` / `NUM_KEYS` / `LETTER_KEYS` → consumed by
  hooks and components
- **UI State**: Only in `state.ui`, never persisted

### No Redundant State

- `activeProfilePath` lives only in `settings.yaml` and `state.settings`
- `lockWindowCenter` lives only in `settings.yaml` and `state.settings`
- `isDragDropMode` is runtime-only, lives in `state.ui`
- `clipboardKey` is runtime-only internal clipboard, lives in `state.ui` (does NOT use system clipboard)

### Simple IPC

- All IPC channels are simple request/response
- No complex event subscriptions or state sync
- Main process is the authority for file I/O

### Functional Everything

- No classes in renderer
- All components are functional with hooks
- Reducer is a pure function

---

## 13. Progressive Implementation Steps

### Phase 1: Skeleton App

1. Set up Electron Forge + TypeScript project
2. Implement `paths.ts` and `logger.ts`
3. Implement `main.ts` with single-instance lock
4. Create basic `BrowserWindow` in `window.ts`
5. Set up `preload/index.ts` with a simple ping function
6. Create `renderer/index.tsx` + `App.tsx` showing "Hello MaxLaunchpad"

### Phase 2: Config System

1. Implement `shared/types.ts` and `shared/constants.ts`
2. Implement `configStore.ts` (load/save settings and profiles)
3. Add IPC handlers for config operations in `ipcHandlers.ts`
4. Set up renderer state store (`store.ts`)
5. Load config on app mount, display JSON preview

### Phase 3: Virtual Keyboard UI

1. Implement `VirtualKeyboard.tsx`, `KeyButton.tsx`, `NumButton.tsx`
2. Wire keyboard layout to state and keyboard navigation
3. Implement `TopBar.tsx` with menus
4. Add `SearchBox.tsx`
5. Implement `selectors.ts` for filtered views

### Phase 4: Program Launch & Icons

1. Implement `launcher.ts` with platform variants
2. Add `launcher:run` IPC handler
3. Wire key clicks and keyboard shortcuts to launch
4. Implement `iconService.ts` with caching
5. Display icons on keys

### Phase 5: Config Editing & Auto-save

1. Implement `EditKeyModal.tsx` and `EditTabModal.tsx`
2. Add reducer actions for updating keys/tabs
3. Implement `useConfigSync.ts` with debounce
4. Add smart backup logic in `configStore.ts`
5. Add context menus for keys (Edit, Copy, Cut, Paste, Delete, Open File Location)
    - Copy/Cut/Paste use internal `clipboardKey` state, NOT system clipboard

### Phase 6: Settings & System Integration

1. Implement `tray.ts`
2. Implement `hotkey.ts` and `HotkeySettingsModal.tsx`
3. Implement `OptionsModal.tsx`
4. Add hotkey re-registration on settings change
5. Implement drag-and-drop on keys
6. Add "Drag & Drop Mode" toggle

### Phase 7: Polish

1. Implement `useTheme.ts` with system theme detection
2. Implement `useCustomStyle.ts` for custom CSS loading
3. Complete search functionality
4. Ensure all keyboard shortcuts work
5. Add proper error handling and logging throughout
