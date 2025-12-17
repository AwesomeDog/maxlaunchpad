import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

interface PSOptions {
  timeout?: number;
  maxBuffer?: number;
}

const DEFAULT_OPTIONS: PSOptions = {
  timeout: 15000,
  maxBuffer: 10 * 1024 * 1024,
};

/**
 * Execute PowerShell script and return stdout
 */
export async function runPowerShell(script: string, options?: PSOptions): Promise<string | null> {
  try {
    // Prepend UTF-8 output encoding to handle non-ASCII characters
    const wrappedScript = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ${script}`;
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', wrappedScript],
      { ...DEFAULT_OPTIONS, ...options, encoding: 'utf8' },
    );
    return stdout?.trim() || null;
  } catch {
    return null;
  }
}

export const escapePS = (str: string) => str.replace(/'/g, "''");
