import { readFileSync } from 'node:fs';
import path from 'node:path';

function readProjectFile(...segments: string[]): string {
  return readFileSync(path.join(process.cwd(), ...segments), 'utf8').replace(/\r\n/g, '\n');
}

describe('keyboard label sizing contract', () => {
  it('does not size individual key or tab labels from their text length', () => {
    const keyButton = readProjectFile('src', 'renderer', 'components', 'keyboard', 'KeyButton.tsx');
    const numButton = readProjectFile('src', 'renderer', 'components', 'keyboard', 'NumButton.tsx');

    expect(keyButton).not.toContain('getKeyButtonLabelStyle');
    expect(keyButton).not.toContain('--key-btn-label-font-size');
    expect(numButton).not.toContain('getTabButtonLabelStyle');
    expect(numButton).not.toContain('--tab-btn-label-font-size');
  });

  it('keeps tab label sizing larger than key label sizing in the base stylesheet', () => {
    const css = readProjectFile('src', 'renderer', 'styles', 'global.css');

    expect(css).toContain('--key-button-label-font-size: clamp(11px, 11.5cqw, 15px);');
    expect(css).toContain('--tab-button-label-font-size: clamp(12px, 12cqw, 16px);');
  });

  it('keeps tab shortcut markers on the left while vertically centered with tab labels', () => {
    const css = readProjectFile('src', 'renderer', 'styles', 'global.css');

    expect(css).toContain(`.key-btn-key {
  position: absolute;
  top: 3px;
  left: 3px;`);
    expect(css).toContain(`.num-key-number {
  position: absolute;
  top: 50%;
  left: 3px;`);
    expect(css).toContain('transform: translateY(-50%);');
  });

  it('moves and scales button content for icon-only and text-only hidden states', () => {
    const css = readProjectFile('src', 'renderer', 'styles', 'global.css');

    expect(css).toContain('.key-btn.text-only .key-btn-text-slot {');
    expect(css).toContain('transform: translateY(-50%) scale(1.1);');
    expect(css).toContain('.key-btn.icon-only .key-btn-icon-slot {');
    expect(css).toContain('transform: translateY(-50%) scale(1.16);');
  });
});
