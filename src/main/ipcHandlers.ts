import { app, dialog, ipcMain, shell } from 'electron';
import os from 'os';
import path from 'path';

import { IPC_CHANNELS } from '../shared/ipcChannels';
import { AppSettingsSchema, KeyboardProfileSchema } from '../shared/schemas';
import { listInstalledApps } from './appList';
import { configureAutoLaunch } from './autoLaunch';
import {
  listCustomStyles,
  loadCustomStyleContent,
  loadProfile,
  loadSettings,
  saveProfile,
  saveSettings,
} from './configStore';
import { registerGlobalHotkey } from './hotkey';
import { getIcon } from './iconService';
import { launchProgram } from './launcher';
import log from './logger';
import { APP_CONFIG_DIR } from './paths';
import { IS_WINDOWS } from './platform';
import { getMainWindow, hideMainWindow, setDragDropMode, setLockWindowCenter } from './window';

function resolveSpecialPath(targetPath: string): string {
  // Handle app-specific special paths
  if (targetPath === 'myapp:configdir') {
    return APP_CONFIG_DIR;
  }

  // Handle Windows shell: paths
  if (IS_WINDOWS) {
    if (targetPath === 'shell:programs') {
      return path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    }
    if (targetPath === 'shell:common programs') {
      return path.join(
        process.env.ALLUSERSPROFILE || 'C:\\ProgramData',
        'Microsoft',
        'Windows',
        'Start Menu',
        'Programs',
      );
    }
  }

  // Expand ~ to home directory (works on all platforms)
  if (targetPath.startsWith('~/')) {
    return path.join(os.homedir(), targetPath.slice(2));
  }

  return targetPath;
}

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.CONFIG_LOAD, async () => {
    try {
      const settings = loadSettings();
      const profile = loadProfile(settings.activeProfilePath);

      return { settings, profile };
    } catch (error) {
      log.error('Failed to load config', { scope: 'ipcHandlers', error });
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_SAVE_SETTINGS, async (_, settings) => {
    try {
      const validatedSettings = AppSettingsSchema.parse(settings);
      const oldSettings = loadSettings();

      saveSettings(validatedSettings);

      const hotkeyChanged =
        oldSettings.hotkey.key !== validatedSettings.hotkey.key ||
        JSON.stringify(oldSettings.hotkey.modifiers) !==
          JSON.stringify(validatedSettings.hotkey.modifiers);
      if (hotkeyChanged) {
        registerGlobalHotkey(validatedSettings.hotkey);
      }

      if (oldSettings.launchOnStartup !== validatedSettings.launchOnStartup) {
        await configureAutoLaunch(validatedSettings.launchOnStartup);
      }

      if (oldSettings.lockWindowCenter !== validatedSettings.lockWindowCenter) {
        setLockWindowCenter(validatedSettings.lockWindowCenter);
      }

      return { success: true };
    } catch (error) {
      log.error('Failed to save settings', { scope: 'ipcHandlers', error });
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_SAVE_PROFILE, async (_, profile, filePath) => {
    try {
      const validatedProfile = KeyboardProfileSchema.parse(profile);
      saveProfile(validatedProfile, filePath);
      return { success: true };
    } catch (error) {
      log.error('Failed to save profile', { scope: 'ipcHandlers', error });
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_OPEN_PROFILE_DIALOG, async () => {
    const result = await dialog.showOpenDialog({
      title: 'Open Keyboard Profile',
      filters: [{ name: 'YAML', extensions: ['yaml', 'yml'] }],
      properties: ['openFile', 'showHiddenFiles'],
    });
    if (result.canceled) return { canceled: true };
    return { canceled: false, filePath: result.filePaths[0] };
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_SAVE_AS_DIALOG, async () => {
    const result = await dialog.showSaveDialog({
      title: 'Save Keyboard Profile As',
      filters: [{ name: 'YAML', extensions: ['yaml', 'yml'] }],
      properties: ['showHiddenFiles'],
    });
    if (result.canceled) return { canceled: true };
    return { canceled: false, filePath: result.filePath };
  });

  ipcMain.handle(IPC_CHANNELS.LAUNCHER_RUN, async (_, keyConfig) => {
    await launchProgram(keyConfig);
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.ICON_GET, async (_, keyConfig) => {
    try {
      const dataUrl = await getIcon(keyConfig);
      return { dataUrl };
    } catch (error) {
      log.error('Failed to get icon', { scope: 'ipcHandlers', keyConfig, error });
      return { dataUrl: null };
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_SET_DRAG_DROP_MODE, (_, enabled) => {
    setDragDropMode(enabled);
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_HIDE, () => {
    hideMainWindow();
  });

  ipcMain.handle(
    IPC_CHANNELS.TOOLS_OPEN_PATH,
    async (_, targetPath: string, options?: { showInFolder?: boolean }) => {
      if (options?.showInFolder) {
        shell.showItemInFolder(targetPath);
      } else {
        const resolvedPath = resolveSpecialPath(targetPath);
        await shell.openPath(resolvedPath);
      }
    },
  );

  ipcMain.handle(IPC_CHANNELS.APP_GET_INFO, () => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      gitCommitId: process.env.GIT_COMMIT_ID ?? 'dev',
    };
  });

  ipcMain.handle(IPC_CHANNELS.APP_EXIT, () => {
    app.exit();
  });

  ipcMain.handle(IPC_CHANNELS.STYLES_LIST, () => {
    return { styles: listCustomStyles() };
  });

  ipcMain.handle(IPC_CHANNELS.STYLES_LOAD, (_, styleName: string) => {
    const content = loadCustomStyleContent(styleName);
    return { content };
  });

  ipcMain.handle(IPC_CHANNELS.DIALOG_SHOW_ERROR, async (_, title: string, content: string) => {
    log.error(content, { scope: 'renderer', title });

    const win = getMainWindow();
    if (!win) {
      log.error('Cannot show error dialog: no main window', { scope: 'ipcHandlers' });
      return;
    }
    await dialog.showMessageBox(win, {
      type: 'error',
      title,
      message: content,
      buttons: ['OK'],
    });
  });

  ipcMain.handle(IPC_CHANNELS.SHORTCUT_PARSE, (_, filePath: string) => {
    if (!IS_WINDOWS || !filePath.toLowerCase().endsWith('.lnk')) {
      return null;
    }

    try {
      const shortcutDetails = shell.readShortcutLink(filePath);
      return {
        filePath: shortcutDetails.target,
        arguments: shortcutDetails.args || undefined,
        workingDirectory: shortcutDetails.cwd || undefined,
        description: filePath,
      };
    } catch (error) {
      log.error('Failed to parse shortcut', { scope: 'ipcHandlers', filePath, error });
      return null;
    }
  });

  ipcMain.handle(IPC_CHANNELS.APPS_LIST, async () => {
    try {
      const apps = await listInstalledApps();
      return { apps };
    } catch (error) {
      log.error('Failed to list apps', { scope: 'ipcHandlers', error });
      return { apps: [] };
    }
  });
}
