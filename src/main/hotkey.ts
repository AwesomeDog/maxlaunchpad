import { dialog, globalShortcut } from 'electron';

import { HotkeyConfig } from '../shared/types';
import log from './logger';
import { IS_MAC } from './platform';
import { getMainWindow, hideMainWindow, showMainWindow } from './window';

function toAcceleratorModifier(modifier: string): string {
  if (modifier === 'Win') {
    return IS_MAC ? 'Command' : 'Super';
  }
  return modifier;
}

export function registerGlobalHotkey(config: HotkeyConfig): void {
  globalShortcut.unregisterAll();

  const acceleratorModifiers = config.modifiers.map(toAcceleratorModifier);
  const accelerator = [...acceleratorModifiers, config.key].join('+');

  const success = globalShortcut.register(accelerator, () => {
    const win = getMainWindow();
    if (!win || !win.isVisible()) {
      showMainWindow();
    } else {
      hideMainWindow();
    }
  });

  if (success) {
    log.info('Global hotkey registered', { scope: 'hotkey', accelerator });
  } else {
    log.error('Failed to register global hotkey', { scope: 'hotkey', accelerator });
    dialog.showErrorBox(
      'Hotkey Registration Failed',
      `Could not register "${accelerator}". It may be in use by another application.`,
    );
  }
}

export function unregisterGlobalHotkeys(): void {
  globalShortcut.unregisterAll();
  log.debug('All global hotkeys unregistered', { scope: 'hotkey' });
}
