import {
  AppSettingsSchema,
  HotkeyConfigSchema,
  KeyboardProfileSchema,
  KeyConfigSchema,
  PartialAppSettingsSchema,
  PartialKeyboardProfileSchema,
  TabConfigSchema,
} from '../schemas';

describe('KeyConfigSchema', () => {
  it('should validate a complete key config', () => {
    const validKey = {
      tabId: '1',
      id: 'Q',
      label: 'VS Code',
      filePath: '/Applications/Visual Studio Code.app',
      arguments: '--new-window',
      workingDirectory: '/Users/test',
      description: 'Open VS Code',
      runAsAdmin: false,
      iconPath: '/path/to/icon.png',
    };
    const result = KeyConfigSchema.safeParse(validKey);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validKey);
    }
  });

  it('should validate a minimal key config (only required fields)', () => {
    const minimalKey = {
      tabId: '1',
      id: 'Q',
      label: 'App',
      filePath: '/path/to/app',
    };
    const result = KeyConfigSchema.safeParse(minimalKey);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(minimalKey);
    }
  });

  it('should reject key config missing required fields', () => {
    const invalidCases = [
      { id: 'Q', label: 'App', filePath: '/path' }, // missing tabId
      { tabId: '1', label: 'App', filePath: '/path' }, // missing id
      { tabId: '1', id: 'Q', filePath: '/path' }, // missing label
      { tabId: '1', id: 'Q', label: 'App' }, // missing filePath
    ];

    invalidCases.forEach((invalidKey) => {
      const result = KeyConfigSchema.safeParse(invalidKey);
      expect(result.success).toBe(false);
    });
  });

  it('should strip unknown properties', () => {
    const keyWithExtra = {
      tabId: '1',
      id: 'Q',
      label: 'App',
      filePath: '/path',
      unknownField: 'should be stripped',
    };
    const result = KeyConfigSchema.safeParse(keyWithExtra);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('unknownField');
    }
  });

  it('should reject invalid types', () => {
    const invalidTypes = {
      tabId: 123, // should be string
      id: 'Q',
      label: 'App',
      filePath: '/path',
    };
    const result = KeyConfigSchema.safeParse(invalidTypes);
    expect(result.success).toBe(false);
  });

  it('should accept runAsAdmin as boolean', () => {
    const keyWithAdmin = {
      tabId: '1',
      id: 'Q',
      label: 'Admin App',
      filePath: '/path',
      runAsAdmin: true,
    };
    const result = KeyConfigSchema.safeParse(keyWithAdmin);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.runAsAdmin).toBe(true);
    }
  });
});

describe('TabConfigSchema', () => {
  it('should validate a valid tab config', () => {
    const validTab = { id: '1', label: 'Work' };
    const result = TabConfigSchema.safeParse(validTab);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validTab);
    }
  });

  it('should validate tab with empty label', () => {
    const tabEmptyLabel = { id: '1', label: '' };
    const result = TabConfigSchema.safeParse(tabEmptyLabel);
    expect(result.success).toBe(true);
  });

  it('should reject tab missing id', () => {
    const result = TabConfigSchema.safeParse({ label: 'Work' });
    expect(result.success).toBe(false);
  });

  it('should reject tab missing label', () => {
    const result = TabConfigSchema.safeParse({ id: '1' });
    expect(result.success).toBe(false);
  });

  it('should strip unknown properties', () => {
    const tabWithExtra = { id: '1', label: 'Work', extra: 'field' };
    const result = TabConfigSchema.safeParse(tabWithExtra);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('extra');
    }
  });
});

describe('KeyboardProfileSchema', () => {
  it('should validate a complete profile', () => {
    const validProfile = {
      tabs: [
        { id: '1', label: 'Apps' },
        { id: '2', label: 'Tools' },
      ],
      keys: [
        { tabId: '1', id: 'Q', label: 'VS Code', filePath: '/path/to/vscode' },
        { tabId: '2', id: 'W', label: 'Terminal', filePath: '/path/to/terminal' },
      ],
    };
    const result = KeyboardProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tabs).toHaveLength(2);
      expect(result.data.keys).toHaveLength(2);
    }
  });

  it('should validate empty profile', () => {
    const emptyProfile = { tabs: [], keys: [] };
    const result = KeyboardProfileSchema.safeParse(emptyProfile);
    expect(result.success).toBe(true);
  });

  it('should reject profile missing tabs', () => {
    const result = KeyboardProfileSchema.safeParse({ keys: [] });
    expect(result.success).toBe(false);
  });

  it('should reject profile missing keys', () => {
    const result = KeyboardProfileSchema.safeParse({ tabs: [] });
    expect(result.success).toBe(false);
  });

  it('should reject profile with invalid tab', () => {
    const invalidProfile = {
      tabs: [{ id: '1' }], // missing label
      keys: [],
    };
    const result = KeyboardProfileSchema.safeParse(invalidProfile);
    expect(result.success).toBe(false);
  });

  it('should reject profile with invalid key', () => {
    const invalidProfile = {
      tabs: [],
      keys: [{ tabId: '1', id: 'Q' }], // missing label and filePath
    };
    const result = KeyboardProfileSchema.safeParse(invalidProfile);
    expect(result.success).toBe(false);
  });
});

describe('HotkeyConfigSchema', () => {
  it('should validate a valid hotkey config', () => {
    const validHotkey = {
      modifiers: ['Command', 'Shift'],
      key: 'Space',
    };
    const result = HotkeyConfigSchema.safeParse(validHotkey);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validHotkey);
    }
  });

  it('should validate hotkey with empty modifiers', () => {
    const hotkeyNoModifiers = { modifiers: [], key: 'F12' };
    const result = HotkeyConfigSchema.safeParse(hotkeyNoModifiers);
    expect(result.success).toBe(true);
  });

  it('should reject hotkey missing modifiers', () => {
    const result = HotkeyConfigSchema.safeParse({ key: 'Space' });
    expect(result.success).toBe(false);
  });

  it('should reject hotkey missing key', () => {
    const result = HotkeyConfigSchema.safeParse({ modifiers: ['Command'] });
    expect(result.success).toBe(false);
  });

  it('should validate single modifier', () => {
    const singleModifier = { modifiers: ['Alt'], key: 'A' };
    const result = HotkeyConfigSchema.safeParse(singleModifier);
    expect(result.success).toBe(true);
  });
});

describe('AppSettingsSchema', () => {
  const validSettings = {
    hotkey: { modifiers: ['Command'], key: 'Space' },
    activeTabOnShow: '1',
    activeProfilePath: '/path/to/profile.yaml',
    lockWindowCenter: true,
    launchOnStartup: false,
    startInTray: true,
    theme: 'dark' as const,
    customStyle: '.key { color: red; }',
  };

  it('should validate complete settings', () => {
    const result = AppSettingsSchema.safeParse(validSettings);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validSettings);
    }
  });

  it('should validate all theme options', () => {
    const themes = ['light', 'dark', 'system'] as const;
    themes.forEach((theme) => {
      const settings = { ...validSettings, theme };
      const result = AppSettingsSchema.safeParse(settings);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid theme', () => {
    const invalidSettings = { ...validSettings, theme: 'invalid' };
    const result = AppSettingsSchema.safeParse(invalidSettings);
    expect(result.success).toBe(false);
  });

  it('should reject settings missing required fields', () => {
    const requiredFields = [
      'hotkey',
      'activeTabOnShow',
      'activeProfilePath',
      'lockWindowCenter',
      'launchOnStartup',
      'startInTray',
      'theme',
      'customStyle',
    ];

    requiredFields.forEach((field) => {
      const incomplete = { ...validSettings };
      delete (incomplete as Record<string, unknown>)[field];
      const result = AppSettingsSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });
  });

  it('should reject settings with invalid hotkey', () => {
    const invalidSettings = {
      ...validSettings,
      hotkey: { key: 'Space' }, // missing modifiers
    };
    const result = AppSettingsSchema.safeParse(invalidSettings);
    expect(result.success).toBe(false);
  });

  it('should strip unknown properties', () => {
    const settingsWithExtra = { ...validSettings, unknownField: 'value' };
    const result = AppSettingsSchema.safeParse(settingsWithExtra);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('unknownField');
    }
  });
});

describe('PartialAppSettingsSchema', () => {
  it('should validate empty object', () => {
    const result = PartialAppSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should validate partial settings', () => {
    const partial = {
      theme: 'dark',
      lockWindowCenter: true,
    };
    const result = PartialAppSettingsSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.theme).toBe('dark');
      expect(result.data.lockWindowCenter).toBe(true);
    }
  });

  it('should validate settings with only hotkey', () => {
    const partial = {
      hotkey: { modifiers: ['Control'], key: 'Space' },
    };
    const result = PartialAppSettingsSchema.safeParse(partial);
    expect(result.success).toBe(true);
  });

  it('should still reject invalid field types', () => {
    const invalid = { theme: 'invalid-theme' };
    const result = PartialAppSettingsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should strip unknown properties', () => {
    const partialWithExtra = { theme: 'light', extra: 'field' };
    const result = PartialAppSettingsSchema.safeParse(partialWithExtra);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('extra');
    }
  });
});

describe('PartialKeyboardProfileSchema', () => {
  it('should validate empty object', () => {
    const result = PartialKeyboardProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should validate profile with only tabs', () => {
    const partial = {
      tabs: [{ id: '1', label: 'Apps' }],
    };
    const result = PartialKeyboardProfileSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tabs).toHaveLength(1);
      expect(result.data.keys).toBeUndefined();
    }
  });

  it('should validate profile with only keys', () => {
    const partial = {
      keys: [{ tabId: '1', id: 'Q', label: 'App', filePath: '/path' }],
    };
    const result = PartialKeyboardProfileSchema.safeParse(partial);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keys).toHaveLength(1);
      expect(result.data.tabs).toBeUndefined();
    }
  });

  it('should validate complete partial profile', () => {
    const partial = {
      tabs: [{ id: '1', label: 'Apps' }],
      keys: [{ tabId: '1', id: 'Q', label: 'App', filePath: '/path' }],
    };
    const result = PartialKeyboardProfileSchema.safeParse(partial);
    expect(result.success).toBe(true);
  });

  it('should reject invalid tab in partial profile', () => {
    const invalid = {
      tabs: [{ id: '1' }], // missing label
    };
    const result = PartialKeyboardProfileSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject invalid key in partial profile', () => {
    const invalid = {
      keys: [{ tabId: '1' }], // missing required fields
    };
    const result = PartialKeyboardProfileSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should strip unknown properties', () => {
    const partialWithExtra = { extra: 'field' };
    const result = PartialKeyboardProfileSchema.safeParse(partialWithExtra);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('extra');
    }
  });
});
