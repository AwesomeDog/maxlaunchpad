import { readFileSync } from 'node:fs';
import path from 'node:path';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { DEFAULT_HIDE_ELEMENTS } from '../../../../shared/constants';
import type { AppSettings, KeyboardProfile } from '../../../../shared/types';
import i18n from '../../../i18n';
import { TopBar } from '../TopBar';

const dispatchMock = jest.fn();
let mockConfigRevision = 0;
let mockIsDragDropMode = false;

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
      isDragDropMode: mockIsDragDropMode,
      isMenuRevealKeyPressed: false,
      isConfigDirty: false,
      configRevision: mockConfigRevision,
      isLoading: false,
      error: null,
      modal: { type: 'none' },
      clipboardKey: null,
    },
  }),
  useDispatch: () => dispatchMock,
}));

jest.mock('../../../hooks/useClickOutside', () => ({
  useClickOutside: jest.fn(),
}));

jest.mock('../../../hooks/useCloseOnWindowHide', () => ({
  useCloseOnWindowHide: jest.fn(),
}));

jest.mock('../SearchBox', () => ({
  SearchBox: () => <div data-testid="search-box" />,
}));

describe('TopBar window controls', () => {
  const minimizeWindow = jest.fn();
  const hideWindow = jest.fn();
  const setDragDropMode = jest.fn();
  const setLockWindowCenter = jest.fn();

  beforeEach(() => {
    mockConfigRevision = 0;
    mockIsDragDropMode = false;
    settings.hideElements = { ...DEFAULT_HIDE_ELEMENTS };
    settings.menuRevealKey = 'Alt';
    settings.lockWindowCenter = true;
    settings.language = 'zh-CN';
    void i18n.changeLanguage('zh-CN');
    minimizeWindow.mockClear();
    hideWindow.mockClear();
    setDragDropMode.mockClear();
    setLockWindowCenter.mockClear();
    dispatchMock.mockClear();
    window.electronAPI = {
      ...window.electronAPI,
      minimizeWindow,
      hideWindow,
      setDragDropMode,
      setLockWindowCenter,
    };
  });

  it('renders custom minimize and close controls for the frameless titlebar', () => {
    render(<TopBar />);

    expect(screen.getByRole('button', { name: '最小化窗口' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '关闭窗口' })).toBeInTheDocument();
  });

  it('routes custom window controls through Electron IPC', () => {
    render(<TopBar />);

    fireEvent.click(screen.getByRole('button', { name: '最小化窗口' }));
    fireEvent.click(screen.getByRole('button', { name: '关闭窗口' }));

    expect(minimizeWindow).toHaveBeenCalledTimes(1);
    expect(hideWindow).toHaveBeenCalledTimes(1);
  });

  it('clears dirty config with the revision captured before a menu flush', async () => {
    mockConfigRevision = 7;
    const saveSettings = jest.fn().mockResolvedValue(undefined);
    const saveProfile = jest.fn().mockResolvedValue(undefined);
    const saveAsDialog = jest.fn().mockResolvedValue({ canceled: true });
    window.electronAPI = {
      ...window.electronAPI,
      minimizeWindow,
      hideWindow,
      saveSettings,
      saveProfile,
      saveAsDialog,
    };

    render(<TopBar />);

    fireEvent.click(screen.getByText('文件'));
    fireEvent.click(screen.getByText('另存为...'));

    await waitFor(() => {
      expect(saveSettings).toHaveBeenCalledWith(settings);
      expect(saveProfile).toHaveBeenCalledWith(profile, settings.activeProfilePath);
    });
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'SET_CONFIG_DIRTY',
      dirty: false,
      revision: 7,
    });
  });

  it('turns off center lock when enabling drag-drop mode', () => {
    settings.lockWindowCenter = true;

    render(<TopBar />);

    fireEvent.click(screen.getByText('视图'));
    fireEvent.click(screen.getByText('拖放模式'));

    expect(dispatchMock).toHaveBeenCalledWith({ type: 'SET_DRAG_DROP_MODE', enabled: true });
    expect(setLockWindowCenter).toHaveBeenCalledWith(false);
    expect(setDragDropMode).toHaveBeenCalledWith(true);
  });

  it('turns off drag-drop mode when enabling center lock', () => {
    settings.lockWindowCenter = false;
    mockIsDragDropMode = true;

    render(<TopBar />);

    fireEvent.click(screen.getByText('视图'));
    fireEvent.click(screen.getByText('锁定窗口居中'));

    expect(dispatchMock).toHaveBeenCalledWith({ type: 'SET_DRAG_DROP_MODE', enabled: false });
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'UPDATE_SETTINGS',
      settings: { lockWindowCenter: true },
    });
    expect(setDragDropMode).toHaveBeenCalledWith(false);
    expect(setLockWindowCenter).toHaveBeenCalledWith(true);
  });

  it('pins custom window controls to the visible right edge of the titlebar', () => {
    const css = readFileSync(
      path.join(process.cwd(), 'src', 'renderer', 'styles', 'global.css'),
      'utf8',
    ).replace(/\r\n/g, '\n');

    expect(css).toContain(`.main-menu {
  position: relative;`);
    expect(css).toContain('padding-right: 100px;');
    expect(css).toContain(`.window-controls {
  position: absolute;`);
    expect(css).toContain('z-index: 1;');
    expect(css).toContain('right: 10px;');
  });

  it('keeps hidden-menu animation from wrapping menu labels vertically', () => {
    const css = readFileSync(
      path.join(process.cwd(), 'src', 'renderer', 'styles', 'global.css'),
      'utf8',
    ).replace(/\r\n/g, '\n');

    expect(css).toContain(`.topbar-menu-items.menu-items-hidden {
  max-width: 0;
  overflow: hidden;`);
    expect(css).toContain(`.menu-item {
  flex: 0 0 auto;`);
    expect(css).toContain('white-space: nowrap;');
  });

  it('keeps search and window controls visible when only menu items are hidden', () => {
    settings.hideElements = { ...DEFAULT_HIDE_ELEMENTS, menu: true };

    const { container } = render(<TopBar />);

    expect(container.querySelector('.topbar-menu-items.menu-items-hidden')).toBeInTheDocument();
    expect(screen.getByTestId('search-box')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '最小化窗口' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '关闭窗口' })).toBeInTheDocument();
  });

  it('labels the hidden menu reveal key from settings', () => {
    settings.menuRevealKey = 'Win';

    render(<TopBar />);

    fireEvent.click(screen.getByText('视图'));
    fireEvent.mouseEnter(screen.getByText('隐藏元素'));

    expect(screen.getByText('菜单栏（按 Win 临时显示）')).toBeInTheDocument();
  });
});
