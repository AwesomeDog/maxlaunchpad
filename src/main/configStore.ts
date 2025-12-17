import { dialog } from 'electron';
import fs from 'fs';
import { dump, JSON_SCHEMA, load } from 'js-yaml';
import path from 'path';

import { DEFAULT_MODIFIER } from '../shared/constants';
import { PartialAppSettingsSchema, PartialKeyboardProfileSchema } from '../shared/schemas';
import { AppSettings, KeyboardProfile } from '../shared/types';
import { formatTimestamp, normalizeProfile } from '../shared/utils';
import log from './logger';
import {
  APP_CONFIG_DIR,
  BACKUP_DIR_PATH,
  DEFAULT_PROFILE_PATH,
  ensureDir,
  RESOURCES_DIR,
  SETTINGS_FILE_PATH,
  STYLES_DIR_PATH,
} from './paths';
import { IS_MAC, IS_WINDOWS } from './platform';

const TEMPLATE_DIR = path.join(RESOURCES_DIR, 'config-templates');
const KEYBOARD_SAMPLES_DIR = path.join(TEMPLATE_DIR, 'keyboard-samples');

let configDirInitialized = false;

function getPlatformKeyboardTemplate(): string {
  if (IS_MAC) {
    return 'keyboard.mac.yaml';
  } else if (IS_WINDOWS) {
    return 'keyboard.win.yaml';
  } else {
    return 'keyboard.ubuntu.yaml';
  }
}

function ensureConfigDir(): void {
  if (configDirInitialized) return;

  ensureDir(APP_CONFIG_DIR);

  const copiedFiles: string[] = [];

  for (const relPath of fs.readdirSync(TEMPLATE_DIR, { recursive: true, encoding: 'utf8' })) {
    const srcPath = path.join(TEMPLATE_DIR, relPath);
    if (fs.statSync(srcPath).isDirectory()) continue;

    const destPath = path.join(APP_CONFIG_DIR, relPath);
    if (!fs.existsSync(destPath)) {
      ensureDir(path.dirname(destPath));
      fs.copyFileSync(srcPath, destPath);
      copiedFiles.push(relPath);
    }
  }

  // Handle platform-specific keyboard profile
  if (!fs.existsSync(DEFAULT_PROFILE_PATH)) {
    const platformTemplate = getPlatformKeyboardTemplate();
    const srcPath = path.join(KEYBOARD_SAMPLES_DIR, platformTemplate);
    fs.copyFileSync(srcPath, DEFAULT_PROFILE_PATH);
    copiedFiles.push(`${platformTemplate} -> keyboard.yaml`);
  }

  if (copiedFiles.length > 0) {
    log.info('Copied missing config files from templates', {
      scope: 'configStore',
      copiedFiles,
    });
  }

  configDirInitialized = true;
}

export function loadSettings(): AppSettings {
  ensureConfigDir();
  const defaults: AppSettings = {
    hotkey: { modifiers: [DEFAULT_MODIFIER], key: '`' },
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
      const raw = load(fs.readFileSync(SETTINGS_FILE_PATH, 'utf8'), {
        schema: JSON_SCHEMA,
      });
      const data = PartialAppSettingsSchema.parse(raw);
      const merged = { ...defaults, ...data };
      log.debug('Settings loaded', { scope: 'configStore', path: SETTINGS_FILE_PATH });
      return merged;
    }
  } catch (error) {
    log.error('Failed to load settings', { scope: 'configStore', error });
    try {
      const content = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
      createBackup(SETTINGS_FILE_PATH, content, 'corrupted');
    } catch {
      /* ignore backup failure */
    }
  }
  return defaults;
}

export function saveSettings(settings: AppSettings): void {
  ensureConfigDir();
  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, dump(settings), 'utf8');
    log.debug('Settings saved', { scope: 'configStore', path: SETTINGS_FILE_PATH });
  } catch (error) {
    log.error('Failed to save settings', { scope: 'configStore', error });
    throw error;
  }
}

export function loadProfile(filePath?: string): KeyboardProfile {
  ensureConfigDir();
  const targetPath = filePath ?? DEFAULT_PROFILE_PATH;
  const fallback: KeyboardProfile = { tabs: [], keys: [] };

  try {
    if (fs.existsSync(targetPath)) {
      const raw = load(fs.readFileSync(targetPath, 'utf8'), { schema: JSON_SCHEMA });
      const loaded = PartialKeyboardProfileSchema.parse(raw);
      const profile = normalizeProfile({
        tabs: loaded.tabs ?? [],
        keys: loaded.keys ?? [],
      });
      log.debug('Profile loaded', {
        scope: 'configStore',
        path: targetPath,
        tabCount: profile.tabs.length,
        keyCount: profile.keys.length,
      });
      return profile;
    }
  } catch (error) {
    log.error('Failed to load profile', { scope: 'configStore', filePath: targetPath, error });
    try {
      const content = fs.readFileSync(targetPath, 'utf8');
      createBackup(targetPath, content, 'corrupted');
    } catch {
      /* ignore backup failure */
    }

    dialog
      .showMessageBox({
        type: 'error',
        title: 'Failed to Load Keyboard Profile',
        message: `Failed to load profile ${targetPath}.\nA backup of the corrupted file was saved to:\n${BACKUP_DIR_PATH}`,
      })
      .catch(() => {
        /* ignore dialog failure */
      });
  }
  return normalizeProfile(fallback);
}

function createBackup(filePath: string, content: string, tag = 'backup'): void {
  ensureDir(BACKUP_DIR_PATH);
  const basename = path.basename(filePath, '.yaml');
  const timestamp = formatTimestamp(new Date());
  const backupPath = path.join(BACKUP_DIR_PATH, `${basename}.${tag}-${timestamp}.yaml`);
  fs.writeFileSync(backupPath, content, 'utf8');
  log.debug('Backup created', { scope: 'configStore', backupPath, tag });
}

export function saveProfile(profile: KeyboardProfile, filePath?: string): void {
  ensureConfigDir();
  const targetPath = filePath ?? DEFAULT_PROFILE_PATH;
  const normalizedProfile = normalizeProfile(profile);
  const newContent = dump(normalizedProfile);

  if (fs.existsSync(targetPath)) {
    const oldContent = fs.readFileSync(targetPath, 'utf8');

    if (oldContent !== newContent) {
      createBackup(targetPath, oldContent);
    }
  }

  fs.writeFileSync(targetPath, newContent, 'utf8');
  log.debug('Profile saved', { scope: 'configStore', path: targetPath });
}

export function listCustomStyles(): string[] {
  try {
    if (!fs.existsSync(STYLES_DIR_PATH)) {
      return [];
    }
    return fs
      .readdirSync(STYLES_DIR_PATH)
      .filter((f) => f.endsWith('.css'))
      .map((f) => f.replace(/\.css$/, ''));
  } catch (error) {
    log.error('Failed to list custom styles', { scope: 'configStore', error });
    return [];
  }
}

export function loadCustomStyleContent(styleName: string): string | null {
  try {
    // Security: only allow valid style names (alphanumeric, hyphen, underscore)
    if (!/^[\w-]+$/.test(styleName)) {
      log.warn('Invalid style name rejected', { scope: 'configStore', styleName });
      return null;
    }

    const stylePath = path.join(STYLES_DIR_PATH, `${styleName}.css`);
    if (fs.existsSync(stylePath)) {
      return fs.readFileSync(stylePath, 'utf8');
    }
  } catch (error) {
    log.error('Failed to load custom style content', { scope: 'configStore', styleName, error });
  }
  return null;
}
