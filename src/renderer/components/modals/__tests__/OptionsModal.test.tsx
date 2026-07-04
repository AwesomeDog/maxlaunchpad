import { act, fireEvent, render, screen } from '@testing-library/react';

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

  it('places the language selector above the theme selector', () => {
    const { container } = render(<OptionsModal />);

    const labels = Array.from(container.querySelectorAll('.modal-row > label')).map((label) =>
      label.textContent?.trim(),
    );

    expect(labels.indexOf('语言:')).toBeGreaterThanOrEqual(0);
    expect(labels.indexOf('主题:')).toBeGreaterThanOrEqual(0);
    expect(labels.indexOf('语言:')).toBeLessThan(labels.indexOf('主题:'));
  });

  it('dispatches a language settings update from the language dropdown', () => {
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
    expect(screen.getByRole('dialog')).toHaveTextContent('Options');
    expect(screen.getByText('Language:')).toBeInTheDocument();
  });

  it('commits language changes from native select input/change/blur events', () => {
    jest.useFakeTimers();
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
      languageSelect.dispatchEvent(new Event('input', { bubbles: true }));
      languageSelect.dispatchEvent(new Event('change', { bubbles: true }));
      languageSelect.dispatchEvent(new Event('blur', { bubbles: true }));
      jest.runOnlyPendingTimers();
    });

    expect(container.querySelector('.segmented-control')).not.toBeInTheDocument();
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'UPDATE_SETTINGS',
      settings: { language: 'en' },
    });
    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toHaveTextContent('Options');
    expect(screen.getByText('Language:')).toBeInTheDocument();
    jest.useRealTimers();
  });
});
