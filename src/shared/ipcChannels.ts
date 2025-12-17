// IPC channel names - single source of truth for all IPC communication
export const IPC_CHANNELS = {
  // Config operations
  CONFIG_LOAD: 'config:load',
  CONFIG_SAVE_SETTINGS: 'config:saveSettings', // Also handles lockWindowCenter changes
  CONFIG_SAVE_PROFILE: 'config:saveProfile',
  CONFIG_OPEN_PROFILE_DIALOG: 'config:openProfileDialog',
  CONFIG_SAVE_AS_DIALOG: 'config:saveAsDialog',

  // Launcher
  LAUNCHER_RUN: 'launcher:run',

  // Icons
  ICON_GET: 'icon:get',

  // Window
  WINDOW_SET_DRAG_DROP_MODE: 'window:setDragDropMode',
  WINDOW_HIDE: 'window:hide',

  // Tools
  TOOLS_OPEN_PATH: 'tools:openPath', // Supports { showInFolder: true } option

  // App
  APP_GET_INFO: 'app:getInfo',
  APP_EXIT: 'app:exit',

  // Dialog (also logs errors)
  DIALOG_SHOW_ERROR: 'dialog:showError',

  // Custom styles
  STYLES_LIST: 'styles:list',
  STYLES_LOAD: 'styles:load',

  // Shortcut parsing (Windows .lnk)
  SHORTCUT_PARSE: 'shortcut:parse',

  // Installed apps list
  APPS_LIST: 'apps:list',

  // Window events (main -> renderer)
  WINDOW_SHOWN: 'window:shown',
} as const;
