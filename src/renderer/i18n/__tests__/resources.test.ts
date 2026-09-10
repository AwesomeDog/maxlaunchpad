import en from '../en.json';
import { languages } from '../languages';

function flatten(value: Record<string, unknown>, prefix = ''): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof child === 'object' && child !== null) {
      for (const [nestedPath, nestedValue] of flatten(child as Record<string, unknown>, path)) {
        result.set(nestedPath, nestedValue);
      }
    } else {
      result.set(path, String(child));
    }
  }
  return result;
}

function interpolationVariables(value: string): Set<string> {
  return new Set([...value.matchAll(/{{\s*([^}, ]+)/g)].map((match) => match[1]));
}

const translated = languages.filter(({ code }) => code !== 'en');

describe('translation resources', () => {
  it('registers English as the base locale', () => {
    expect(languages.map(({ code }) => code)).toContain('en');
    expect(translated.length).toBeGreaterThan(0);
  });

  it.each(translated)(
    'keeps every $code key and interpolation variable aligned with English',
    ({ resource }) => {
      const base = flatten(en);
      const locale = flatten(resource as Record<string, unknown>);

      expect([...locale.keys()].sort()).toEqual([...base.keys()].sort());
      for (const [key, value] of base) {
        expect(interpolationVariables(locale.get(key)!)).toEqual(interpolationVariables(value));
      }
    },
  );
});
