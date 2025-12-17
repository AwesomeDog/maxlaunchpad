import { KeyConfig } from '../../shared/types';
import { isUrl } from '../../shared/utils';
import {
  execCommand,
  isCommandInPath,
  isExecutableFile,
  looksLikePath,
  parseArguments,
} from './common';

/**
 * Unix platform configuration for shared launch logic
 */
export interface UnixPlatformConfig {
  /** Command to open URLs and files with default handler (e.g., 'open' on macOS, 'xdg-open' on Linux) */
  openCommand: string;
  /** Handle platform-specific file types before generic logic */
  handleSpecialTypes?: (filePath: string, args: string[], cwd?: string) => Promise<boolean>;
  /** Platform-specific command execution tweaks */
  execTweaks?: (filePath: string) => { shell?: boolean };
}

/**
 * Shared Unix launch logic for macOS and Linux
 * Handles: URLs, PATH commands, executable files, and fallback to open command
 */
export async function launchUnix(keyConfig: KeyConfig, config: UnixPlatformConfig): Promise<void> {
  const { filePath } = keyConfig;
  const args = keyConfig.arguments ? parseArguments(keyConfig.arguments) : [];
  const cwd = keyConfig.workingDirectory || undefined;

  // 1. URL → open command
  if (isUrl(filePath)) {
    await execCommand(config.openCommand, [filePath], { cwd });
    return;
  }

  // 2. Platform-specific types (e.g., .app on macOS, .desktop on Linux)
  if (config.handleSpecialTypes) {
    const handled = await config.handleSpecialTypes(filePath, args, cwd);
    if (handled) return;
  }

  // 3. Executable command in PATH → execute directly
  if (isCommandInPath(filePath)) {
    const tweaks = config.execTweaks?.(filePath) ?? {};
    await execCommand(filePath, args, { cwd, ...tweaks });
    return;
  }

  // 4. Path to executable file → execute directly
  if (looksLikePath(filePath) && isExecutableFile(filePath)) {
    await execCommand(filePath, args, { cwd });
    return;
  }

  // 5. Path to non-executable file → open with default handler
  if (looksLikePath(filePath)) {
    await execCommand(config.openCommand, [filePath, ...args], { cwd });
    return;
  }

  // 6. Fallback: try open command
  await execCommand(config.openCommand, [filePath, ...args], { cwd });
}
