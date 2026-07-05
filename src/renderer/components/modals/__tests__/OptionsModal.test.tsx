import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { DEFAULT_HIDE_ELEMENTS } from '../../../../shared/constants';
import type { AppSettings, KeyboardProfile } from '../../../../shared/types';
import i18n from '../../../i18n';
import { OptionsModal } from '../OptionsModal';

const dispatchMock = jest.fn();

const settings: AppSettings = {
  hotkey: { modifiers: ['Alt'], key: '`' },
  menuRevealKey: 'Alt',
  activeTabOnShow: 'lastUsed',
  activeProfilePath: 'C:\\Users\\hcy\\.config\\MaxLaunchpad\\keyboard.yaml',
  lockWindowCenter: true,
  launchOnStartup: true,
  startInTray: false,
  theme: 'dark',
  language: 'zh-CN',
  customStyle: 'modern',
  windowSize: { width: 1000, height: 600 },
  hideElements: { ...DEFAULT_HIDE_ELEMENTS },
};

const profile: KeyboardProfile = {
  tabs: [],
  keys: [],
};

jest.mock('../../../state/store', () => ({
  useAppState: () => ({
    settings,
    profile,
    ui: {
      activeTabId: '1',
      searchQuery: '',
      isDragDropMode: false,
      isMenuRevealKeyPressed: false,
      isConfigDirty: false,
      configRevision: 0,
      isLoading: false,
      error: null,
      modal: { type: 'options' },
      clipboardKey: null,
    },
  }),
  useDispatch: () => dispatchMock,
}));

describe('OptionsModal', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
    settings.language = 'zh-CN';
    void i18n.changeLanguage('zh-CN');
    settings.theme = 'dark';
    settings.customStyle = 'modern';
    window.electronAPI = {
      ...window.electronAPI,
      listStyles: jest.fn(() => new Promise(() => undefined)),
      setWindowAutoHideSuspended: jest.fn(),
    };
  });

  it('keeps the language selector in the upstream options order', () => {
    const { container } = render(<OptionsModal />);

    const labels = Array.from(container.querySelectorAll('.modal-row > label')).map((label) =>
      label.textContent?.trim(),
    );

    expect(labels.indexOf('语言:')).toBeGreaterThanOrEqual(0);
    expect(labels.indexOf('主题:')).toBeGreaterThanOrEqual(0);
    expect(labels.indexOf('自定义样式:')).toBeGreaterThanOrEqual(0);
    expect(labels.indexOf('主题:')).toBeLessThan(labels.indexOf('自定义样式:'));
    expect(labels.indexOf('自定义样式:')).toBeLessThan(labels.indexOf('语言:'));
  });

  it('dispatches a language settings update from the language dropdown', async () => {
    const { container } = render(<OptionsModal />);

    const languageRow = screen.getByText('语言:').closest('.modal-row');
    const languageSelect = languageRow?.querySelector('select');

    expect(container.querySelector('.segmented-control')).not.toBeInTheDocument();
    expect(languageSelect).toBeInTheDocument();

    fireEvent.change(languageSelect!, { target: { value: 'en' } });

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'UPDATE_SETTINGS',
      settings: { language: 'en' },
    });
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveTextContent('Options');
      expect(screen.getByText('Language:')).toBeInTheDocument();
    });
  });

  it('uses self-language option labels independent of current UI language', async () => {
    const { rerender } = render(<OptionsModal />);

    let languageRow = screen.getByText('语言:').closest('.modal-row');
    let languageSelect = languageRow?.querySelector('select') as HTMLSelectElement;

    expect(Array.from(languageSelect.options).map((option) => option.textContent)).toEqual([
      '中文',
      'English',
    ]);

    await act(async () => {
      await i18n.changeLanguage('en');
    });
    settings.language = 'en';
    rerender(<OptionsModal />);

    languageRow = screen.getByText('Language:').closest('.modal-row');
    languageSelect = languageRow?.querySelector('select') as HTMLSelectElement;

    expect(Array.from(languageSelect.options).map((option) => option.textContent)).toEqual([
      '中文',
      'English',
    ]);
  });

  it('keeps the upstream i18next language when persisted settings are stale', async () => {
    settings.language = 'zh-CN';
    await act(async () => {
      await i18n.changeLanguage('en');
    });

    render(<OptionsModal />);

    const languageRow = screen.getByText('Language:').closest('.modal-row');
    const languageSelect = languageRow?.querySelector('select') as HTMLSelectElement;

    expect(languageSelect.value).toBe('en');
    expect(Array.from(languageSelect.options).map((option) => option.textContent)).toEqual([
      '中文',
      'English',
    ]);
  });

  it('uses the detected i18next language when settings omit language', async () => {
    settings.language = undefined;
    await act(async () => {
      await i18n.changeLanguage('en');
    });

    render(<OptionsModal />);

    const languageRow = screen.getByText('Language:').closest('.modal-row');
    const languageSelect = languageRow?.querySelector('select') as HTMLSelectElement;

    expect(languageSelect.value).toBe('en');
  });

  it('does not duplicate language updates when native select events repeat', () => {
    const { container } = render(<OptionsModal />);
    const languageRow = screen.getByText('语言:').closest('.modal-row');
    const languageSelect = languageRow?.querySelector('select') as HTMLSelectElement;
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      'value',
    )?.set;

    expect(valueSetter).toBeDefined();

    act(() => {
      valueSetter!.call(languageSelect, 'en');
      languageSelect.dispatchEvent(new Event('change', { bubbles: true }));
      languageSelect.dispatchEvent(new Event('blur', { bubbles: true }));
    });

    expect(container.querySelector('.segmented-control')).not.toBeInTheDocument();
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'UPDATE_SETTINGS',
      settings: { language: 'en' },
    });
    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toHaveTextContent('Options');
    expect(screen.getByText('Language:')).toBeInTheDocument();
  });
});
