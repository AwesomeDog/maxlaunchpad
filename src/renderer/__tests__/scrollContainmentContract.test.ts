import { readFileSync } from 'node:fs';
import path from 'node:path';

function readProjectFile(...segments: string[]): string {
  return readFileSync(path.join(process.cwd(), ...segments), 'utf8').replace(/\r\n/g, '\n');
}

function readCssBlock(css: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escapedSelector}\\s*\\{(?<body>[^}]*)\\}`).exec(css);
  return match?.groups?.body ?? '';
}

describe('window scroll containment contract', () => {
  it('prevents page-level scrollbars without disabling modal and list scrolling', () => {
    const css = readProjectFile('src', 'renderer', 'styles', 'global.css');
    const editKeyModal = readProjectFile(
      'src',
      'renderer',
      'components',
      'modals',
      'EditKeyModal.tsx',
    );

    const rootBlock = readCssBlock(css, 'html,\nbody,\n#root');
    const modalContentBlock = readCssBlock(css, '.modal-content');

    expect(rootBlock).toContain('overflow: hidden;');
    expect(modalContentBlock).toContain('max-height: 90vh;');
    expect(modalContentBlock).toContain('overflow-y: auto;');
    expect(editKeyModal).toContain("maxHeight: '200px'");
    expect(editKeyModal).toContain("overflowY: 'auto'");
  });
});
