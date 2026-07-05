import { readFileSync } from 'node:fs';
import path from 'node:path';

function readProjectFile(...segments: string[]): string {
  return readFileSync(path.join(process.cwd(), ...segments), 'utf8');
}

describe('menu reveal state contract', () => {
  it('renders hidden menu state from the configured reveal-key state field', () => {
    const app = readProjectFile('src', 'renderer', 'App.tsx');
    const topBar = readProjectFile('src', 'renderer', 'components', 'layout', 'TopBar.tsx');

    expect(app).toContain('state.ui.isMenuRevealKeyPressed');
    expect(topBar).toContain('state.ui.isMenuRevealKeyPressed');
    expect(app).not.toContain('state.ui.isAltPressed');
    expect(topBar).not.toContain('state.ui.isAltPressed');
  });
});
