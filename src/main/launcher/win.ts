import { spawn } from 'child_process';

import { KeyConfig } from '../../shared/types';
import { escapePS } from '../utils/powershell';
import { execCommand, parseArguments } from './common';

/**
 * Launch a program as admin using PowerShell Start-Process -Verb RunAs.
 * Uses a simple spawn without detached mode to ensure UAC works correctly.
 */
function launchAsAdmin(filePath: string, args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const escapedFilePath = escapePS(filePath);
    let psCommand = `Start-Process -FilePath '${escapedFilePath}' -Verb RunAs`;
    if (args.length > 0) {
      const escapedArgs = args.map((arg) => escapePS(arg)).join("','");
      psCommand = `Start-Process -FilePath '${escapedFilePath}' -ArgumentList '${escapedArgs}' -Verb RunAs`;
    }
    if (cwd) {
      psCommand += ` -WorkingDirectory '${escapePS(cwd)}'`;
    }

    const proc = spawn('powershell', ['-NoProfile', '-Command', psCommand], {
      stdio: 'ignore',
      windowsHide: true,
    });

    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0 || code === null) {
        resolve();
      } else {
        reject(new Error(`PowerShell exited with code ${code}`));
      }
    });
  });
}

export async function launch(keyConfig: KeyConfig): Promise<void> {
  const args = keyConfig.arguments ? parseArguments(keyConfig.arguments) : [];
  const cwd = keyConfig.workingDirectory || undefined;

  if (keyConfig.runAsAdmin) {
    await launchAsAdmin(keyConfig.filePath, args, cwd);
  } else {
    // On Windows, Node's spawn() automatically quotes arguments that contain spaces,
    // so passing filePath as a plain argument here is safe even for paths like
    // "C:\\Program Files\\...". We intentionally do not add extra quoting ourselves
    // to avoid double-quoting and keep escaping rules centralized in spawn().
    await execCommand('cmd', ['/c', 'start', '', keyConfig.filePath, ...args], { cwd });
  }
}
