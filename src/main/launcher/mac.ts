import { KeyConfig } from '../../shared/types';
import { execCommand } from './common';
import { launchUnix, UnixPlatformConfig } from './unixCommon';

const macConfig: UnixPlatformConfig = {
  openCommand: 'open',

  // Handle .app bundles with open -a
  async handleSpecialTypes(filePath, args, cwd) {
    if (filePath.endsWith('.app')) {
      const openArgs = ['-a', filePath];
      if (args.length > 0) {
        openArgs.push('--args', ...args);
      }
      await execCommand('open', openArgs, { cwd });
      return true;
    }
    return false;
  },

  // osascript needs shell: false to prevent argument mangling
  execTweaks(filePath) {
    if (filePath === 'osascript') {
      return { shell: false };
    }
    return {};
  },
};

export async function launch(keyConfig: KeyConfig): Promise<void> {
  await launchUnix(keyConfig, macConfig);
}
