import { app } from 'electron';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { APP_NAME } from '../shared/constants';

const xdgConfigHome = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
export const APP_CONFIG_DIR = path.join(xdgConfigHome, APP_NAME);

export const SETTINGS_FILE_PATH = path.join(APP_CONFIG_DIR, 'settings.yaml');

export const DEFAULT_PROFILE_PATH = path.join(APP_CONFIG_DIR, 'keyboard.yaml');

export const CACHE_DIR_PATH = path.join(APP_CONFIG_DIR, 'caches');
export const LOG_DIR_PATH = path.join(APP_CONFIG_DIR, 'logs');
export const BACKUP_DIR_PATH = path.join(APP_CONFIG_DIR, 'backups');
export const STYLES_DIR_PATH = path.join(APP_CONFIG_DIR, 'styles');

export const LOG_FILE_PATH = path.join(LOG_DIR_PATH, 'maxlaunchpad.log');

// Resources directory (bundled with app)
// In development: __dirname points to .webpack/main, resources at ../../resources
// In production: extraResource files are in process.resourcesPath
function getResourcesDir(): string {
  if (app.isPackaged) {
    // In packaged app, extraResource files go to process.resourcesPath
    return process.resourcesPath;
  } else {
    // In development, relative to webpack output
    return path.join(__dirname, '../../resources');
  }
}

export const RESOURCES_DIR = getResourcesDir();

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}
