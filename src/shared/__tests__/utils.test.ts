import type { KeyboardProfile, KeyConfig } from '../types';
import { normalizeProfile } from '../utils';

describe('normalizeProfile', () => {
  describe('tabs normalization', () => {
    it('should create all 10 tabs (1-9, 0) when profile has no tabs', () => {
      const profile: KeyboardProfile = { tabs: [], keys: [] };
      const result = normalizeProfile(profile);

      expect(result.tabs).toHaveLength(10);
      expect(result.tabs.map((t) => t.id)).toEqual([
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '0',
      ]);
    });

    it('should preserve existing tab labels and fill missing tabs', () => {
      const profile: KeyboardProfile = {
        tabs: [
          { id: '1', label: 'Work' },
          { id: '5', label: 'Games' },
        ],
        keys: [],
      };
      const result = normalizeProfile(profile);

      expect(result.tabs).toHaveLength(10);
      expect(result.tabs[0]).toEqual({ id: '1', label: 'Work' });
      expect(result.tabs[4]).toEqual({ id: '5', label: 'Games' });
      expect(result.tabs[1]).toEqual({ id: '2', label: '' });
    });

    it('should sort tabs in NUM_KEYS order (1-9, 0)', () => {
      const profile: KeyboardProfile = {
        tabs: [
          { id: '0', label: 'Last' },
          { id: '3', label: 'Third' },
          { id: '1', label: 'First' },
        ],
        keys: [],
      };
      const result = normalizeProfile(profile);

      expect(result.tabs[0].id).toBe('1');
      expect(result.tabs[2].id).toBe('3');
      expect(result.tabs[9].id).toBe('0');
    });
  });

  describe('keys deduplication', () => {
    it('should remove keys with no content', () => {
      const profile: KeyboardProfile = {
        tabs: [],
        keys: [
          { tabId: '1', id: 'Q', label: '', filePath: '' },
          { tabId: '1', id: 'W', label: 'App', filePath: '/path/to/app' },
        ],
      };
      const result = normalizeProfile(profile);

      expect(result.keys).toHaveLength(1);
      expect(result.keys[0].id).toBe('W');
    });

    it('should keep keys with any content field set', () => {
      const baseKey = { tabId: '1', id: 'Q', label: '', filePath: '' };

      const testCases: Partial<KeyConfig>[] = [
        { label: 'Test' },
        { filePath: '/path' },
        { arguments: '--help' },
        { workingDirectory: '/home' },
        { description: 'Description' },
        { iconPath: '/icon.png' },
        { runAsAdmin: true },
      ];

      testCases.forEach((override, index) => {
        const profile: KeyboardProfile = {
          tabs: [],
          keys: [{ ...baseKey, id: String.fromCharCode(65 + index), ...override } as KeyConfig],
        };
        const result = normalizeProfile(profile);
        expect(result.keys).toHaveLength(1);
      });
    });

    it('should deduplicate keys by tabId|id, keeping last occurrence', () => {
      const profile: KeyboardProfile = {
        tabs: [],
        keys: [
          { tabId: '1', id: 'Q', label: 'First', filePath: '/first' },
          { tabId: '1', id: 'Q', label: 'Second', filePath: '/second' },
        ],
      };
      const result = normalizeProfile(profile);

      expect(result.keys).toHaveLength(1);
      expect(result.keys[0].label).toBe('Second');
      expect(result.keys[0].filePath).toBe('/second');
    });
  });

  describe('keys sorting', () => {
    it('should sort F-keys before tab keys', () => {
      const profile: KeyboardProfile = {
        tabs: [],
        keys: [
          { tabId: '1', id: 'Q', label: 'Tab Key', filePath: '/tab' },
          { tabId: 'F', id: 'F1', label: 'Function Key', filePath: '/func' },
        ],
      };
      const result = normalizeProfile(profile);

      expect(result.keys[0].tabId).toBe('F');
      expect(result.keys[1].tabId).toBe('1');
    });

    it('should sort tabs in NUM_KEYS order (1-9, 0)', () => {
      const profile: KeyboardProfile = {
        tabs: [],
        keys: [
          { tabId: '0', id: 'Q', label: 'Zero', filePath: '/zero' },
          { tabId: '5', id: 'Q', label: 'Five', filePath: '/five' },
          { tabId: '1', id: 'Q', label: 'One', filePath: '/one' },
        ],
      };
      const result = normalizeProfile(profile);

      expect(result.keys.map((k) => k.tabId)).toEqual(['1', '5', '0']);
    });

    it('should sort F-keys in FUNCTION_KEYS order (F1-F10)', () => {
      const profile: KeyboardProfile = {
        tabs: [],
        keys: [
          { tabId: 'F', id: 'F10', label: 'F10', filePath: '/f10' },
          { tabId: 'F', id: 'F1', label: 'F1', filePath: '/f1' },
          { tabId: 'F', id: 'F5', label: 'F5', filePath: '/f5' },
        ],
      };
      const result = normalizeProfile(profile);

      expect(result.keys.map((k) => k.id)).toEqual(['F1', 'F5', 'F10']);
    });

    it('should sort letter keys within same tab by LETTER_KEYS order', () => {
      const profile: KeyboardProfile = {
        tabs: [],
        keys: [
          { tabId: '1', id: 'Z', label: 'Z', filePath: '/z' },
          { tabId: '1', id: 'A', label: 'A', filePath: '/a' },
          { tabId: '1', id: 'Q', label: 'Q', filePath: '/q' },
        ],
      };
      const result = normalizeProfile(profile);

      // LETTER_KEYS order: Q-P, A-;, Z-/
      expect(result.keys.map((k) => k.id)).toEqual(['Q', 'A', 'Z']);
    });

    it('should handle unknown key IDs by placing them at the end', () => {
      const profile: KeyboardProfile = {
        tabs: [],
        keys: [
          { tabId: '1', id: 'UNKNOWN', label: 'Unknown', filePath: '/unknown' },
          { tabId: '1', id: 'Q', label: 'Q', filePath: '/q' },
        ],
      };
      const result = normalizeProfile(profile);

      expect(result.keys[0].id).toBe('Q');
      expect(result.keys[1].id).toBe('UNKNOWN');
    });

    it('should handle unknown tabId by placing them at the end', () => {
      const profile: KeyboardProfile = {
        tabs: [],
        keys: [
          { tabId: 'UNKNOWN', id: 'Q', label: 'Unknown Tab', filePath: '/unknown' },
          { tabId: '1', id: 'Q', label: 'Tab 1', filePath: '/tab1' },
        ],
      };
      const result = normalizeProfile(profile);

      expect(result.keys[0].tabId).toBe('1');
      expect(result.keys[1].tabId).toBe('UNKNOWN');
    });
  });

  describe('complete normalization', () => {
    it('should handle complex profile with mixed keys', () => {
      const profile: KeyboardProfile = {
        tabs: [
          { id: '2', label: 'Tools' },
          { id: '1', label: 'Apps' },
        ],
        keys: [
          { tabId: '2', id: 'W', label: 'Tool W', filePath: '/tool-w' },
          { tabId: 'F', id: 'F3', label: 'F3', filePath: '/f3' },
          { tabId: '1', id: 'A', label: 'App A', filePath: '/app-a' },
          { tabId: 'F', id: 'F1', label: 'F1', filePath: '/f1' },
          { tabId: '1', id: 'Q', label: 'App Q', filePath: '/app-q' },
          { tabId: '2', id: 'Q', label: 'Tool Q', filePath: '/tool-q' },
        ],
      };
      const result = normalizeProfile(profile);

      // Tabs should be sorted 1-9, 0
      expect(result.tabs[0]).toEqual({ id: '1', label: 'Apps' });
      expect(result.tabs[1]).toEqual({ id: '2', label: 'Tools' });
      expect(result.tabs).toHaveLength(10);

      // Keys should be sorted: F keys first (F1, F3), then tab 1 (Q, A), then tab 2 (Q, W)
      expect(result.keys.map((k) => `${k.tabId}:${k.id}`)).toEqual([
        'F:F1',
        'F:F3',
        '1:Q',
        '1:A',
        '2:Q',
        '2:W',
      ]);
    });

    it('should return empty keys array when all keys have no content', () => {
      const profile: KeyboardProfile = {
        tabs: [],
        keys: [
          { tabId: '1', id: 'Q', label: '', filePath: '' },
          { tabId: '1', id: 'W', label: '', filePath: '' },
        ],
      };
      const result = normalizeProfile(profile);

      expect(result.keys).toEqual([]);
    });
  });
});
