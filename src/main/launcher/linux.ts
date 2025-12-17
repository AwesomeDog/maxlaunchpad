import { KeyConfig } from '../../shared/types';
import { getBasename } from '../../shared/utils';
import { execCommand } from './common';
import { launchUnix, UnixPlatformConfig } from './unixCommon';

const linuxConfig: UnixPlatformConfig = {
  openCommand: 'xdg-open',

  // Handle .desktop files with gtk-launch
  async handleSpecialTypes(filePath, _args, cwd) {
    if (filePath.endsWith('.desktop')) {
      const appName = getBasename(filePath, '.desktop');
      await execCommand('gtk-launch', [appName], { cwd });
      return true;
    }
    return false;
  },
};

export async function launch(keyConfig: KeyConfig): Promise<void> {
  await launchUnix(keyConfig, linuxConfig);
}
