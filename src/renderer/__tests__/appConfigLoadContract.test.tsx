import { act, render, screen, waitFor } from '@testing-library/react';

import { DEFAULT_HIDE_ELEMENTS } from '../../shared/constants';
import type { AppSettings, KeyboardProfile } from '../../shared/types';
import { App } from '../App';
import i18n from '../i18n';

jest.mock('../hooks/useIcon', () => ({
  useIcon: () => null,
}));

const settings: AppSettings = {
  activeProfilePath: 'C:\\Users\\hcy\\.config\\MaxLaunchpad\\keyboard.yaml',
  hotkey: { modifiers: ['Alt'], key: '`' },
  activeTabOnShow: 'lastUsed',
  lockWindowCenter: false,
  launchOnStartup: false,
  startInTray: false,
  theme: 'system',
  language: 'zh-CN',
  customStyle: 'modern',
  windowSize: { width: 1000, height: 600 },
  hideElements: { ...DEFAULT_HIDE_ELEMENTS },
};

const profile: KeyboardProfile = {
  tabs: [{ id: '1', label: 'Main' }],
  keys: [],
};

describe('app config load contract', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh-CN');
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    window.electronAPI = {
      ...window.electronAPI,
      loadConfig: jest.fn().mockResolvedValue({ settings, profile }),
      saveSettings: jest.fn().mockResolvedValue(undefined),
      saveProfile: jest.fn().mockResolvedValue(undefined),
      listStyles: jest.fn().mockResolvedValue(['default', 'modern']),
      loadStyleContent: jest.fn().mockResolvedValue({ content: '.modern-style { color: red; }' }),
      showErrorDialog: jest.fn().mockResolvedValue(undefined),
      onWindowHidden: jest.fn().mockReturnValue(jest.fn()),
      onWindowShown: jest.fn().mockReturnValue(jest.fn()),
      onWindowResized: jest.fn().mockReturnValue(jest.fn()),
      hideWindow: jest.fn(),
      launchProgram: jest.fn().mockResolvedValue(undefined),
      getIcon: jest.fn().mockResolvedValue({ dataUrl: null }),
      parseShortcut: jest.fn().mockResolvedValue(null),
    };
  });

  it('does not reload persisted config or remove modern style when language changes', async () => {
    render(<App />);

    await waitFor(() => {
      expect(window.electronAPI.loadConfig).toHaveBeenCalledTimes(1);
      expect(screen.getByText('文件')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(document.getElementById('custom-style')).toHaveTextContent(
        '.modern-style { color: red; }',
      );
    });

    await act(async () => {
      await i18n.changeLanguage('en');
    });

    await waitFor(() => {
      expect(screen.getByText('File')).toBeInTheDocument();
    });

    expect(window.electronAPI.loadConfig).toHaveBeenCalledTimes(1);
    expect(document.getElementById('custom-style')).toHaveTextContent(
      '.modern-style { color: red; }',
    );
  });
});
