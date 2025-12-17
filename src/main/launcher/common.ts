import { spawn, spawnSync } from 'child_process';
import * as fs from 'fs';

import log from '../logger';

const commandCache = new Map<string, boolean>();

/**
 * Launch a command in detached mode with brief error detection.
 * Waits briefly to catch immediate spawn errors (e.g., file not found),
 * then detaches so GUI apps can run independently.
 */
export function execCommand(
  command: string,
  args: string[],
  options?: { cwd?: string; shell?: boolean },
): Promise<void> {
  return new Promise((resolve, reject) => {
    log.debug('execCommand spawn', { command, args, options });
    const proc = spawn(command, args, {
      ...options,
      detached: true,
      stdio: ['ignore', 'ignore', 'pipe'],
    });

    let stderr = '';
    let settled = false;

    const settle = (fn: () => void) => {
      if (!settled) {
        settled = true;
        fn();
      }
    };

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('error', (err) => {
      settle(() => reject(err));
    });

    // Brief timeout to catch immediate errors, then detach
    const timeout = setTimeout(() => {
      settle(() => {
        proc.stderr?.removeAllListeners();
        proc.unref();
        resolve();
      });
    }, 500);

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0 && code !== null) {
        settle(() => reject(new Error(stderr.trim() || `Command exited with code ${code}`)));
      } else {
        settle(() => resolve());
      }
    });
  });
}

/**
 * Check if the string looks like a file path (starts with /, ./, ../, ~/)
 */
export function looksLikePath(str: string): boolean {
  return (
    str.startsWith('/') || str.startsWith('./') || str.startsWith('../') || str.startsWith('~/')
  );
}

/**
 * Check if a command exists in PATH using `which`
 */
export function isCommandInPath(cmd: string): boolean {
  // Only allow valid command names: letters, digits, hyphen, underscore, dot
  if (!/^[\w][\w\-.]*$/.test(cmd) || cmd.length > 256) {
    return false;
  }

  if (commandCache.has(cmd)) {
    return commandCache.get(cmd)!;
  }

  const result = spawnSync('which', [cmd], {
    stdio: 'ignore',
    timeout: 1000,
  });
  const exists = result.status === 0;

  commandCache.set(cmd, exists);
  return exists;
}

/**
 * Check if a file path points to an executable file
 */
export function isExecutableFile(filePath: string): boolean {
  try {
    const stats = fs.statSync(filePath);
    // Check if it's a file and has execute permission (owner, group, or other)
    return stats.isFile() && (stats.mode & 0o111) !== 0;
  } catch {
    return false;
  }
}

/**
 * Parse a string of arguments into an array, respecting quotes
 */
export function parseArguments(argString: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (const char of argString) {
    if ((char === '"' || char === "'") && !inQuote) {
      inQuote = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuote) {
      inQuote = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuote) {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    args.push(current);
  }

  return args;
}
