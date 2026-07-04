import { readFileSync } from 'node:fs';
import path from 'node:path';

function readProjectFile(...segments: string[]): string {
  return readFileSync(path.join(process.cwd(), ...segments), 'utf8');
}

describe('window hidden cleanup contract', () => {
  it('wires a main-process window hidden event through preload to renderer cleanup hooks', () => {
    const ipcChannels = readProjectFile('src', 'shared', 'ipcChannels.ts');
    const preload = readProjectFile('src', 'preload', 'index.ts');
    const windowModule = readProjectFile('src', 'main', 'window.ts');
    const closeHook = readProjectFile('src', 'renderer', 'hooks', 'useCloseOnWindowHide.ts');
    const app = readProjectFile('src', 'renderer', 'App.tsx');

    expect(ipcChannels).toContain("WINDOW_HIDDEN: 'window:hidden'");
    expect(preload).toContain('onWindowHidden');
    expect(windowModule).toContain('notifyWindowHidden');
    expect(windowModule).toContain('IPC_CHANNELS.WINDOW_HIDDEN');
    expect(closeHook).toContain('window.electronAPI.onWindowHidden(close)');
    expect(app).toContain("dispatch({ type: 'CLOSE_MODAL' })");
  });
});
