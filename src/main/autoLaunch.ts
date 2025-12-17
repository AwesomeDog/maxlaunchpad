import { app } from 'electron';

import log from './logger';
import { IS_LINUX } from './platform';

// Linux uses auto-launch library
let autoLauncher: import('auto-launch') | null = null;

async function getAutoLauncher(): Promise<import('auto-launch')> {
  if (!autoLauncher) {
    const AutoLaunch = (await import('auto-launch')).default;
    autoLauncher = new AutoLaunch({
      name: app.getName(),
      path: app.getPath('exe'),
    });
  }
  return autoLauncher;
}

export async function configureAutoLaunch(enabled: boolean): Promise<void> {
  if (!app.isPackaged) {
    log.info('Auto-launch skipped in development mode', { scope: 'autoLaunch' });
    return;
  }

  try {
    if (IS_LINUX) {
      // Linux: use auto-launch library
      const launcher = await getAutoLauncher();
      const isEnabled = await launcher.isEnabled();

      if (enabled && !isEnabled) {
        await launcher.enable();
        log.info('Auto-launch enabled (Linux)', { scope: 'autoLaunch' });
      } else if (!enabled && isEnabled) {
        await launcher.disable();
        log.info('Auto-launch disabled (Linux)', { scope: 'autoLaunch' });
      }
    } else {
      // macOS / Windows: use Electron's built-in API
      const settings = app.getLoginItemSettings();

      if (enabled && !settings.openAtLogin) {
        app.setLoginItemSettings({ openAtLogin: true });
        log.info('Auto-launch enabled (native)', { scope: 'autoLaunch' });
      } else if (!enabled && settings.openAtLogin) {
        app.setLoginItemSettings({ openAtLogin: false });
        log.info('Auto-launch disabled (native)', { scope: 'autoLaunch' });
      }
    }
  } catch (error) {
    log.error('Failed to configure auto-launch', { scope: 'autoLaunch', error });
  }
}
