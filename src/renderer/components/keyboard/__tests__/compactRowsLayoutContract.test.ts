import { readFileSync } from 'node:fs';
import path from 'node:path';

function readProjectFile(...segments: string[]): string {
  return readFileSync(path.join(process.cwd(), ...segments), 'utf8').replace(/\r\n/g, '\n');
}

describe('compact hidden row layout contract', () => {
  it('marks partially hidden letter rows with compact layout classes', () => {
    const virtualKeyboard = readProjectFile(
      'src',
      'renderer',
      'components',
      'keyboard',
      'VirtualKeyboard.tsx',
    );

    expect(virtualKeyboard).toContain('letter-rows-compact');
    expect(virtualKeyboard).toContain('visible-letter-rows-${visibleRowCount}');
    expect(virtualKeyboard).not.toContain(
      'gridTemplateRows: `repeat(${visibleRowCount || 1}, 1fr)`',
    );
  });

  it('keeps F row stable while visible letter rows remain fluid', () => {
    const css = readProjectFile('src', 'renderer', 'styles', 'global.css');

    expect(css).toContain('overflow: hidden;');
    expect(css).toContain('.keyboard-zone.letter-rows-compact {');
    expect(css).toContain('var(--keyboard-f-row-height, var(--keyboard-f-row-fallback-height))');
    expect(css).toContain('--keyboard-letter-row-fallback-height: clamp(88px, 7vw, 180px);');
    expect(css).toContain('.tabbed-keyboard-panel.letter-rows-compact {');
    expect(css).toContain('grid-template-rows: 40px minmax(0, 1fr);');
    expect(css).toContain('padding-bottom: 0;');
    expect(css).toContain('.letter-keys-row.visible-letter-rows-2 {');
    expect(css).toContain('grid-template-rows: repeat(2, minmax(0, 1fr));');
    expect(css).toContain('.letter-keys-row.visible-letter-rows-1 {');
    expect(css).toContain('grid-template-rows: minmax(0, 1fr);');
    expect(css).not.toContain(
      'height: var(--keyboard-letter-row-height, var(--keyboard-letter-row-fallback-height));',
    );
    expect(css).not.toContain(
      'min-height: var(--keyboard-letter-row-height, var(--keyboard-letter-row-fallback-height));',
    );
  });
});
