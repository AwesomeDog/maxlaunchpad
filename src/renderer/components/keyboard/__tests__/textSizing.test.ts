import { getKeyButtonLabelFontSize, getTabButtonLabelFontSize } from '../textSizing';

describe('textSizing', () => {
  it('keeps key labels at one shared size regardless of label length', () => {
    expect(getKeyButtonLabelFontSize('Terminal')).toBe(
      getKeyButtonLabelFontSize('Very Long Application Name'),
    );
    expect(getKeyButtonLabelFontSize('Terminal')).toBe(
      getKeyButtonLabelFontSize('超级长的应用程序名称'),
    );
  });

  it('keeps tab labels at one shared size regardless of label length', () => {
    expect(getTabButtonLabelFontSize('科研')).toBe(getTabButtonLabelFontSize('性能管理'));
    expect(getTabButtonLabelFontSize('科研')).toBe(getTabButtonLabelFontSize('Very Long Tab Name'));
  });

  it('uses a larger scale for tab labels than key labels', () => {
    expect(getTabButtonLabelFontSize('性能管理')).toBeGreaterThan(
      getKeyButtonLabelFontSize('性能管理'),
    );
  });
});
