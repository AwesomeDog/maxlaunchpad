import { IPC_CHANNELS } from '../../shared/ipcChannels';

const mockIpcHandlers = new Map<string, (...args: unknown[]) => unknown>();
const mockSetDragDropMode = jest.fn();
const mockSetLockWindowCenter = jest.fn();
const mockSetWindowAutoHideSuspended = jest.fn();
const mockHideMainWindow = jest.fn();
const mockMinimizeMainWindow = jest.fn();
const mockResizeMainWindowByHeightDelta = jest.fn();

jest.mock('electron', () => ({
  app: {
    exit: jest.fn(),
    getName: jest.fn(() => 'MaxLaunchpad'),
    getPath: jest.fn(() => 'C:\\Users\\test\\AppData\\Roaming'),
    getVersion: jest.fn(() => '1.0.0'),
  },
  dialog: {
    showMessageBox: jest.fn(),
    showOpenDialog: jest.fn(),
    showSaveDialog: jest.fn(),
  },
  ipcMain: {
    handle: jest.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      mockIpcHandlers.set(channel, handler);
    }),
  },
  shell: {
    openPath: jest.fn(),
    readShortcutLink: jest.fn(),
    showItemInFolder: jest.fn(),
  },
}));

jest.mock('../window', () => ({
  getMainWindow: jest.fn(),
  hideMainWindow: mockHideMainWindow,
  minimizeMainWindow: mockMinimizeMainWindow,
  resizeMainWindowByHeightDelta: mockResizeMainWindowByHeightDelta,
  setDragDropMode: mockSetDragDropMode,
  setLockWindowCenter: mockSetLockWindowCenter,
  setWindowAutoHideSuspended: mockSetWindowAutoHideSuspended,
}));

jest.mock('../appList', () => ({ listInstalledApps: jest.fn() }));
jest.mock('../autoLaunch', () => ({ configureAutoLaunch: jest.fn() }));
jest.mock('../configStore', () => ({
  listCustomStyles: jest.fn(() => []),
  loadCustomStyleContent: jest.fn(() => ''),
  loadProfile: jest.fn(() => ({ tabs: [], keys: [] })),
  loadSettings: jest.fn(() => ({
    activeProfilePath: 'profile.yaml',
    hotkey: { modifiers: ['Alt'], key: '`' },
    lockWindowCenter: false,
    launchOnStartup: false,
  })),
  saveProfile: jest.fn(),
  saveSettings: jest.fn(),
}));
jest.mock('../hotkey', () => ({ registerGlobalHotkey: jest.fn() }));
jest.mock('../iconService', () => ({ getIcon: jest.fn() }));
jest.mock('../launcher', () => ({ launchProgram: jest.fn() }));
jest.mock('../logger', () => ({ error: jest.fn() }));

describe('registerIpcHandlers', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockIpcHandlers.clear();
    const { registerIpcHandlers } = await import('../ipcHandlers');
    registerIpcHandlers();
  });

  it('rejects non-boolean window mode IPC payloads', () => {
    const dragDropHandler = mockIpcHandlers.get(IPC_CHANNELS.WINDOW_SET_DRAG_DROP_MODE);
    const lockCenterHandler = mockIpcHandlers.get(IPC_CHANNELS.WINDOW_SET_LOCK_WINDOW_CENTER);

    expect(dragDropHandler).toBeDefined();
    expect(lockCenterHandler).toBeDefined();
    expect(() => dragDropHandler!(undefined, 'true')).toThrow('Expected boolean');
    expect(() => lockCenterHandler!(undefined, 1)).toThrow('Expected boolean');
    expect(mockSetDragDropMode).not.toHaveBeenCalled();
    expect(mockSetLockWindowCenter).not.toHaveBeenCalled();
  });

  it('accepts strict boolean window mode IPC payloads', () => {
    const dragDropHandler = mockIpcHandlers.get(IPC_CHANNELS.WINDOW_SET_DRAG_DROP_MODE);
    const lockCenterHandler = mockIpcHandlers.get(IPC_CHANNELS.WINDOW_SET_LOCK_WINDOW_CENTER);

    dragDropHandler!(undefined, true);
    lockCenterHandler!(undefined, false);

    expect(mockSetDragDropMode).toHaveBeenCalledWith(true);
    expect(mockSetLockWindowCenter).toHaveBeenCalledWith(false);
  });

  it('rejects non-boolean auto-hide suspension IPC payloads', () => {
    const autoHideHandler = mockIpcHandlers.get(IPC_CHANNELS.WINDOW_SET_AUTO_HIDE_SUSPENDED);

    expect(autoHideHandler).toBeDefined();
    expect(() => autoHideHandler!(undefined, 'true')).toThrow('Expected boolean');
    expect(mockSetWindowAutoHideSuspended).not.toHaveBeenCalled();
  });

  it('accepts strict boolean auto-hide suspension IPC payloads', () => {
    const autoHideHandler = mockIpcHandlers.get(IPC_CHANNELS.WINDOW_SET_AUTO_HIDE_SUSPENDED);

    autoHideHandler!(undefined, true);

    expect(mockSetWindowAutoHideSuspended).toHaveBeenCalledWith(true);
  });
});
