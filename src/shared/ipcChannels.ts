// IPC channel names - single source of truth for all IPC communication
export const IPC_CHANNELS = {
  // Config operations
  CONFIG_LOAD: 'config:load',
  CONFIG_SAVE_SETTINGS: 'config:saveSettings', // Also handles lockWindowCenter changes
  CONFIG_SAVE_PROFILE: 'config:saveProfile',
  CONFIG_OPEN_PROFILE_DIALOG: 'config:openProfileDialog',
  CONFIG_SAVE_AS_DIALOG: 'config:saveAsDialog',

  // File/folder picking for key editing
  DIALOG_SELECT_FILE: 'dialog:selectFile',
  DIALOG_SELECT_FOLDER: 'dialog:selectFolder',

  // Launcher
  LAUNCHER_RUN: 'launcher:run',

  // Icons
  ICON_GET: 'icon:get',

  // Window
  WINDOW_SET_DRAG_DROP_MODE: 'window:setDragDropMode',
  WINDOW_SET_LOCK_WINDOW_CENTER: 'window:setLockWindowCenter',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_HIDE: 'window:hide',
  WINDOW_RESIZE_BY_HEIGHT_DELTA: 'window:resizeByHeightDelta',
  WINDOW_SET_AUTO_HIDE_SUSPENDED: 'window:setAutoHideSuspended',

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
  WINDOW_HIDDEN: 'window:hidden',
  WINDOW_RESIZED: 'window:resized',
} as const;
