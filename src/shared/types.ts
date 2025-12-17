// Key configuration (function keys or letter keys)
export interface KeyConfig {
  tabId: string; // '1'-'9', '0' for letter keys, 'F' for function keys
  id: string; // Key ID: 'Q'-'P', 'A'-';', 'Z'-'/', 'F1'-'F10'
  label: string; // Display text
  filePath: string; // Program path (required)
  arguments?: string; // Command line arguments
  workingDirectory?: string; // Working directory
  description?: string; // Tooltip text
  runAsAdmin?: boolean; // Windows only
  iconPath?: string; // Custom icon path
}

// Installed app from system (for autofill)
export interface InstalledApp {
  label: string;
  filePath: string;
}

// Tab configuration (number keys 1-0)
export interface TabConfig {
  id: string; // '1'-'9', '0'
  label: string; // Display name (can be empty string)
}

// Keyboard profile (stored in keyboard.yaml or other profile files)
export interface KeyboardProfile {
  tabs: TabConfig[];
  keys: KeyConfig[]; // Can be empty array
}

// Hotkey configuration
export interface HotkeyConfig {
  modifiers: string[]; // 'Ctrl', 'Alt', 'Shift', 'Win' (Win/Linux) or 'Control', 'Option', 'Shift', 'Command' (macOS)
  key: string; // Main key
}

// App settings (stored in settings.yaml)
export interface AppSettings {
  hotkey: HotkeyConfig;
  activeTabOnShow: 'lastUsed' | string; // 'lastUsed' or tab ID '1'-'0'
  activeProfilePath: string; // Absolute path to active keyboard profile
  lockWindowCenter: boolean;
  launchOnStartup: boolean;
  startInTray: boolean;
  theme: 'light' | 'dark' | 'system';
  customStyle: string; // Style name without ".css", default 'default'
}
