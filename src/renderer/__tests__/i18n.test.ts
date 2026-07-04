import { LANGUAGE_OPTIONS, normalizeLanguage } from '../i18n';
import en from '../i18n/en.json';
import zhCN from '../i18n/zh-CN.json';

describe('i18n', () => {
  it('exposes language choices for the options dropdown', () => {
    expect(LANGUAGE_OPTIONS).toEqual([
      { value: 'zh-CN', label: '中文' },
      { value: 'en', label: 'English' },
    ]);
  });

  it('normalizes legacy Chinese config values to the upstream resource key', () => {
    expect(normalizeLanguage('zh')).toBe('zh-CN');
    expect(normalizeLanguage('zh-CN')).toBe('zh-CN');
    expect(normalizeLanguage('en')).toBe('en');
    expect(normalizeLanguage(undefined)).toBe('en');
    expect(normalizeLanguage('de' as never)).toBe('en');
  });

  it('covers context menu, options, and hotkey modal labels in both resources', () => {
    expect(zhCN.contextMenu.openFileLocation).toBe('打开文件位置');
    expect(zhCN.modals.options.language).toBe('语言');
    expect(zhCN.modals.hotkeySettings.currentHotkey).toBe('当前快捷键：');
    expect(zhCN.modals.hotkeySettings.launchpadSectionTitle).toBe('唤出界面快捷键');
    expect(zhCN.modals.hotkeySettings.menuRevealSectionTitle).toBe('呼出菜单快捷键');
    expect(zhCN.menu.hideMenuBar).toContain('{{key}}');
    expect(zhCN.menu.openConfigFolders).toBe('打开我的配置文件夹');

    expect(en.contextMenu.openFileLocation).toBe('Open File Location');
    expect(en.modals.options.language).toBe('Language');
    expect(en.modals.hotkeySettings.currentHotkey).toBe('Current Hotkey:');
    expect(en.modals.hotkeySettings.launchpadSectionTitle).toBe('Show Launchpad Hotkey');
    expect(en.modals.hotkeySettings.menuRevealSectionTitle).toBe('Reveal Menu Hotkey');
    expect(en.menu.hideMenuBar).toContain('{{key}}');
    expect(en.menu.openConfigFolders).toBe('Open My Config Folders');
  });
});
