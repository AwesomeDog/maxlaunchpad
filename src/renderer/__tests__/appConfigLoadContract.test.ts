import { readFileSync } from 'node:fs';
import path from 'node:path';

function readProjectFile(...segments: string[]): string {
  return readFileSync(path.join(process.cwd(), ...segments), 'utf8');
}

describe('app config load contract', () => {
  it('does not reload persisted config when the active language changes', () => {
    const app = readProjectFile('src', 'renderer', 'App.tsx');

    expect(app).toContain('window.electronAPI.loadConfig()');
    expect(app).toContain('}, [dispatch]);');
    expect(app).not.toContain('i18n.errors.loadConfigurationFailed]');
  });
});
