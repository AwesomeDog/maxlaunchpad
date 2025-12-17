import { contextBridge, ipcRenderer } from 'electron';

import { IPC_CHANNELS } from '../shared/ipcChannels';
import type { AppSettings, InstalledApp, KeyboardProfile, KeyConfig } from '../shared/types';

const api = {
  // Config operations
  loadConfig: () =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_LOAD) as Promise<{
      settings: AppSettings;
      profile: KeyboardProfile;
    }>,
  saveSettings: (settings: AppSettings) =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SAVE_SETTINGS, settings),
  saveProfile: (profile: KeyboardProfile, filePath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SAVE_PROFILE, profile, filePath),
  openProfileDialog: () =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_OPEN_PROFILE_DIALOG) as Promise<{
      canceled: boolean;
      filePath?: string;
    }>,
  saveAsDialog: () =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SAVE_AS_DIALOG) as Promise<{
      canceled: boolean;
      filePath?: string;
    }>,

  // Launcher
  launchProgram: (key: KeyConfig) => ipcRenderer.invoke(IPC_CHANNELS.LAUNCHER_RUN, key),

  // Icons
  getIcon: (keyConfig: KeyConfig) =>
    ipcRenderer.invoke(IPC_CHANNELS.ICON_GET, keyConfig) as Promise<{ dataUrl: string | null }>,

  // Window controls
  setDragDropMode: (enabled: boolean) =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_SET_DRAG_DROP_MODE, enabled),
  hideWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_HIDE),

  // Window events (main -> renderer)
  onWindowShown: (callback: () => void): (() => void) => {
    const listener = () => callback();
    ipcRenderer.on(IPC_CHANNELS.WINDOW_SHOWN, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.WINDOW_SHOWN, listener);
    };
  },

  // Tools
  openPath: (path: string, options?: { showInFolder?: boolean }) =>
    ipcRenderer.invoke(IPC_CHANNELS.TOOLS_OPEN_PATH, path, options),

  // App info
  getAppInfo: () =>
    ipcRenderer.invoke(IPC_CHANNELS.APP_GET_INFO) as Promise<{
      name: string;
      version: string;
      gitCommitId: string;
    }>,

  // Exit application
  exitApp: () => ipcRenderer.invoke(IPC_CHANNELS.APP_EXIT),

  // Custom styles
  listStyles: () => ipcRenderer.invoke(IPC_CHANNELS.STYLES_LIST) as Promise<{ styles: string[] }>,
  loadStyleContent: (styleName: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.STYLES_LOAD, styleName) as Promise<{ content: string | null }>,

  // Dialog (also logs errors)
  showErrorDialog: (title: string, content: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.DIALOG_SHOW_ERROR, title, content),

  // Shortcut parsing (Windows .lnk)
  parseShortcut: (filePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SHORTCUT_PARSE, filePath) as Promise<{
      filePath: string;
      arguments?: string;
      workingDirectory?: string;
      description?: string;
    } | null>,

  // Installed apps list
  listInstalledApps: () =>
    ipcRenderer.invoke(IPC_CHANNELS.APPS_LIST) as Promise<{
      apps: InstalledApp[];
    }>,
};

export type ElectronAPI = typeof api;

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

contextBridge.exposeInMainWorld('electronAPI', api);
