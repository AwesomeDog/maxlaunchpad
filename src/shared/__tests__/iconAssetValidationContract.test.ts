import { readFileSync } from 'node:fs';
import path from 'node:path';

function readProjectFile(...segments: string[]): string {
  return readFileSync(path.join(process.cwd(), ...segments), 'utf8');
}

describe('icon asset validation contract', () => {
  it('validates generated icon signatures, dimensions, and freshness before skipping', () => {
    const script = readProjectFile('scripts', 'generate-icons.js');

    expect(script).toContain('validateGeneratedIcons()');
    expect(script).toContain('isRequiredIconFresh');
    expect(script).toContain("type: 'png'");
    expect(script).toContain("type: 'ico'");
    expect(script).toContain("type: 'icns'");
    expect(script).toContain('validatePngDimensions');
    expect(script).not.toContain('return requiredIcons.every((icon) => fs.existsSync(icon));');
  });

  it('keeps Forge package validation stronger than non-empty file checks', () => {
    const forgeConfig = readProjectFile('forge.config.ts');

    expect(forgeConfig).toContain('validateIconAsset');
    expect(forgeConfig).toContain('assertPngDimensions');
    expect(forgeConfig).toContain('assertIcoHeader');
    expect(forgeConfig).toContain('assertIcnsHeader');
    expect(forgeConfig).not.toContain('fs.statSync(resolvedIconPath).size === 0');
  });
});
