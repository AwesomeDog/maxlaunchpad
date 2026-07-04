import { readFileSync } from 'node:fs';
import path from 'node:path';

function readProjectFile(...segments: string[]): string {
  return readFileSync(path.join(process.cwd(), ...segments), 'utf8');
}

describe('edit key workflow contract', () => {
  it('places file/folder actions above the label row', () => {
    const modal = readProjectFile('src', 'renderer', 'components', 'modals', 'EditKeyModal.tsx');

    expect(modal).toContain('modal-row modal-row-quick-select');
    expect(modal).toContain('className="modal-field app-picker-field"');
    expect(modal).toContain('modal-row modal-row-file-actions');
    expect(modal).toContain('className="file-picker-actions"');
    expect(modal).toContain('modal-row modal-row-path');
    expect(modal).toContain('className="path-picker-input"');
    expect(modal).not.toContain('className="path-picker-actions"');
    expect(modal.indexOf('modal-row modal-row-file-actions')).toBeLessThan(
      modal.indexOf('value={label}'),
    );
  });

  it('keeps icon browse inline on the right side of the icon path input', () => {
    const modal = readProjectFile('src', 'renderer', 'components', 'modals', 'EditKeyModal.tsx');

    expect(modal).toContain('className="path-picker icon-path-picker"');
    expect(modal).toContain('className="path-picker-input"');
    expect(modal).toContain('iconInputRef.current?.click()');
    expect(modal).not.toContain('<div className="path-picker-actions">');
  });

  it('fills working directory from selected or dropped file paths', () => {
    const modal = readProjectFile('src', 'renderer', 'components', 'modals', 'EditKeyModal.tsx');

    expect(modal).toContain('getParentDirectory');
    expect(modal).toContain('setWorkingDirectory(getParentDirectory(app.filePath))');
    expect(modal).toContain('getParentDirectory(shortcutInfo.filePath)');
    expect(modal).toContain("kind === 'folder' ? selectedPath : getParentDirectory(selectedPath)");
  });
});
