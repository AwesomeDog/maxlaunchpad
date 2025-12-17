import { KeyConfig } from '../../shared/types';
import log from '../logger';
import { IS_MAC, IS_WINDOWS } from '../platform';
import { launch as launchLinux } from './linux';
import { launch as launchMac } from './mac';
import { launch as launchWin } from './win';

export async function launchProgram(key: KeyConfig): Promise<void> {
  try {
    if (IS_MAC) {
      await launchMac(key);
    } else if (IS_WINDOWS) {
      await launchWin(key);
    } else {
      await launchLinux(key);
    }

    log.info('Program launched', { scope: 'launcher', keyConfig: key });
  } catch (error) {
    log.error('Failed to launch program', { scope: 'launcher', keyConfig: key, error });
    throw error;
  }
}
