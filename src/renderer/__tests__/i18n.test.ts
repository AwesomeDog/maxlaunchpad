import en from '../i18n/en.json';
import zhCN from '../i18n/zh-CN.json';

describe('i18n', () => {
  it('covers context menu, options, and hotkey modal labels in both resources', () => {
    expect(zhCN.contextMenu.openFileLocation).toBe('打开文件位置');
    expect(zhCN.modals.options.language).toBe('语言');
    expect(zhCN.modals.hotkeySettings.currentHotkey).toBe('当前快捷键：');
    expect(zhCN.menu.openConfigFolders).toBe('打开我的配置文件夹');

    expect(en.contextMenu.openFileLocation).toBe('Open File Location');
    expect(en.modals.options.language).toBe('Language');
    expect(en.modals.hotkeySettings.currentHotkey).toBe('Current Hotkey:');
    expect(en.menu.openConfigFolders).toBe('Open My Config Folders');
  });
});
