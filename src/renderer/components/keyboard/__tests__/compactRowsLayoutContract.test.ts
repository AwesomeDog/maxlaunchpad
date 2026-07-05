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

  it('keeps legacy tab and letter-key spacing outside the modern style scope', () => {
    const css = readProjectFile('src', 'renderer', 'styles', 'global.css');

    expect(css).toContain(`.keyboard-zone {
  display: grid;
  grid-template-rows: minmax(48px, 0.6fr) minmax(0, 3fr);
  gap: var(--keyboard-gap);
  height: 100%;
  padding: 0 20px 20px;`);
    expect(css).toContain(`.num-keys-row {
  height: 40px;
  gap: 0;`);
    expect(css).toContain(`.letter-keys-row {
  grid-template-columns: 1fr;
  grid-template-rows: repeat(3, 1fr);
  gap: var(--keyboard-gap);
  padding: 12px;`);
    expect(css).toContain(`body.custom-style-modern .keyboard-zone {
  padding: 0;
}`);
    expect(css).toContain(`body.custom-style-modern .num-keys-row {
  gap: var(--keyboard-gap);
}`);
    expect(css).toContain(`body.custom-style-modern .letter-keys-row {
  padding: var(--keyboard-gap) 0 0;
}`);
  });
});
