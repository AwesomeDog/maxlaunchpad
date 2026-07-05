import { getTrayI18n, normalizeTrayLanguage } from '../trayI18n';

describe('trayI18n', () => {
  it('localizes tray context menu labels', () => {
    expect(getTrayI18n('zh-CN')).toEqual({
      show: '显示',
      exit: '退出',
    });
    expect(getTrayI18n('en')).toEqual({
      show: 'Show',
      exit: 'Exit',
    });
  });

  it('normalizes legacy Chinese config values to the upstream resource key', () => {
    expect(normalizeTrayLanguage('zh')).toBe('zh-CN');
    expect(normalizeTrayLanguage('zh-CN')).toBe('zh-CN');
    expect(normalizeTrayLanguage('en')).toBe('en');
    expect(normalizeTrayLanguage(undefined)).toBe('en');
    expect(normalizeTrayLanguage('de' as never)).toBe('en');
  });
});
