const browserWindowMock = jest.fn();
const getCursorScreenPointMock = jest.fn(() => ({ x: 5000, y: 100 }));
const getDisplayNearestPointMock = jest.fn(() => ({
  id: 2,
  scaleFactor: 1.5,
  workArea: { x: 0, y: 0, width: 1920, height: 1080 },
}));
const getPrimaryDisplayMock = jest.fn(() => ({
  id: 1,
  scaleFactor: 1,
  workArea: { x: 4000, y: 0, width: 1920, height: 1080 },
}));
const loadUrlMock = jest.fn();
const onMock = jest.fn();
const setMovableMock = jest.fn();
const setResizableMock = jest.fn();
const setAlwaysOnTopMock = jest.fn();
const setVisibleOnAllWorkspacesMock = jest.fn();
const isDestroyedMock = jest.fn(() => false);
const centerMock = jest.fn();
const focusMock = jest.fn();
const getBoundsMock = jest.fn(() => ({ x: 120, y: 140, width: 720, height: 480 }));
const getSizeMock = jest.fn(() => [720, 480]);
const isFullScreenMock = jest.fn(() => false);
const isMaximizedMock = jest.fn(() => false);
const setBoundsMock = jest.fn();
const setFullScreenMock = jest.fn();
const setSizeMock = jest.fn();
const hideMock = jest.fn();
const showMock = jest.fn();
const unmaximizeMock = jest.fn();
const webContentsSendMock = jest.fn();

jest.mock('electron', () => ({
  app: {
    focus: jest.fn(),
  },
  BrowserWindow: browserWindowMock,
  screen: {
    getCursorScreenPoint: getCursorScreenPointMock,
    getDisplayNearestPoint: getDisplayNearestPointMock,
    getPrimaryDisplay: getPrimaryDisplayMock,
  },
}));

jest.mock('../configStore', () => ({
  loadSettings: jest.fn(() => ({
    windowSize: {
      width: 720,
      height: 480,
    },
    lockWindowCenter: true,
  })),
  saveSettings: jest.fn(),
}));

jest.mock('../logger', () => ({
  error: jest.fn(),
}));

describe('createMainWindow', () => {
  beforeEach(() => {
    jest.resetModules();
    (
      globalThis as typeof globalThis & { MAIN_WINDOW_WEBPACK_ENTRY: string }
    ).MAIN_WINDOW_WEBPACK_ENTRY = 'app://main';
    (
      globalThis as typeof globalThis & { MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string }
    ).MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY = 'app://preload';
    browserWindowMock.mockClear();
    getCursorScreenPointMock.mockClear();
    getDisplayNearestPointMock.mockClear();
    getPrimaryDisplayMock.mockClear();
    getCursorScreenPointMock.mockReturnValue({ x: 5000, y: 100 });
    getDisplayNearestPointMock.mockReturnValue({
      id: 2,
      scaleFactor: 1.5,
      workArea: { x: 0, y: 0, width: 1920, height: 1080 },
    });
    getPrimaryDisplayMock.mockReturnValue({
      id: 1,
      scaleFactor: 1,
      workArea: { x: 4000, y: 0, width: 1920, height: 1080 },
    });
    loadUrlMock.mockClear();
    onMock.mockClear();
    setMovableMock.mockClear();
    setResizableMock.mockClear();
    setAlwaysOnTopMock.mockClear();
    setVisibleOnAllWorkspacesMock.mockClear();
    isDestroyedMock.mockClear();
    centerMock.mockClear();
    focusMock.mockClear();
    getBoundsMock.mockClear();
    getSizeMock.mockClear();
    isFullScreenMock.mockClear();
    isMaximizedMock.mockClear();
    setBoundsMock.mockClear();
    setFullScreenMock.mockClear();
    setSizeMock.mockClear();
    hideMock.mockClear();
    showMock.mockClear();
    unmaximizeMock.mockClear();
    webContentsSendMock.mockClear();
    isDestroyedMock.mockReturnValue(false);
    browserWindowMock.mockImplementation(function BrowserWindow(this: unknown, options: unknown) {
      return {
        options,
        center: centerMock,
        focus: focusMock,
        getBounds: getBoundsMock,
        getSize: getSizeMock,
        isFullScreen: isFullScreenMock,
        isMaximized: isMaximizedMock,
        isDestroyed: isDestroyedMock,
        loadURL: loadUrlMock,
        on: onMock,
        setBounds: setBoundsMock,
        setFullScreen: setFullScreenMock,
        hide: hideMock,
        setMovable: setMovableMock,
        setResizable: setResizableMock,
        setAlwaysOnTop: setAlwaysOnTopMock,
        setSize: setSizeMock,
        setVisibleOnAllWorkspaces: setVisibleOnAllWorkspacesMock,
        show: showMock,
        unmaximize: unmaximizeMock,
        webContents: {
          isDestroyed: jest.fn(() => false),
          send: webContentsSendMock,
        },
      };
    });
  });

  it('uses the custom app chrome instead of the native window frame', async () => {
    const { createMainWindow } = await import('../window');

    createMainWindow();

    expect(browserWindowMock).toHaveBeenCalledWith(
      expect.objectContaining({
        frame: false,
        resizable: true,
      }),
    );
  });

  it('positions locked windows inside the active work area without relying on native center', async () => {
    const { createMainWindow, showMainWindow } = await import('../window');

    createMainWindow();
    showMainWindow();

    expect(setBoundsMock).toHaveBeenCalledWith({
      x: 600,
      y: 300,
      width: 720,
      height: 480,
    });
    expect(centerMock).not.toHaveBeenCalled();
    expect(getCursorScreenPointMock).toHaveBeenCalled();
    expect(getDisplayNearestPointMock).toHaveBeenCalled();
    expect(getPrimaryDisplayMock).not.toHaveBeenCalled();
  });

  it('uses Electron display work areas as DIP coordinates without scale-factor division', async () => {
    getDisplayNearestPointMock.mockReturnValue({
      id: 1,
      scaleFactor: 2,
      workArea: { x: 0, y: 0, width: 2048, height: 1080 },
    });
    const { createMainWindow, showMainWindow } = await import('../window');

    createMainWindow();
    showMainWindow();

    expect(setBoundsMock).toHaveBeenCalledWith({
      x: 664,
      y: 300,
      width: 720,
      height: 480,
    });
  });

  it('resizes hidden-row height deltas without changing the window width', async () => {
    const { createMainWindow, resizeMainWindowByHeightDelta } = await import('../window');

    createMainWindow();
    resizeMainWindowByHeightDelta(-120);

    expect(setBoundsMock).toHaveBeenCalledWith({
      x: 600,
      y: 360,
      width: 720,
      height: 360,
    });
  });

  it('reports hidden-row programmatic resizes so compact window sizes persist', async () => {
    const { IPC_CHANNELS } = await import('../../shared/ipcChannels');
    const { createMainWindow, resizeMainWindowByHeightDelta } = await import('../window');

    createMainWindow();
    const resizeHandler = onMock.mock.calls.find(([eventName]) => eventName === 'resize')?.[1] as
      | (() => void)
      | undefined;
    expect(resizeHandler).toBeDefined();

    resizeMainWindowByHeightDelta(-120);
    getSizeMock.mockReturnValue([720, 360]);
    resizeHandler!();

    expect(webContentsSendMock).toHaveBeenCalledWith(IPC_CHANNELS.WINDOW_RESIZED, 720, 360);

    getSizeMock.mockReturnValue([720, 500]);
    resizeHandler!();

    expect(webContentsSendMock).toHaveBeenCalledWith(IPC_CHANNELS.WINDOW_RESIZED, 720, 500);
  });

  it('keeps blur auto-hide suspended while renderer modals are mounted', async () => {
    const { createMainWindow, setWindowAutoHideSuspended } = await import('../window');

    createMainWindow();
    const blurHandler = onMock.mock.calls.find(([eventName]) => eventName === 'blur')?.[1] as
      | (() => void)
      | undefined;
    expect(blurHandler).toBeDefined();

    setWindowAutoHideSuspended(true);
    setWindowAutoHideSuspended(true);
    setWindowAutoHideSuspended(false);
    blurHandler!();

    expect(hideMock).not.toHaveBeenCalled();

    setWindowAutoHideSuspended(false);
    blurHandler!();

    expect(hideMock).toHaveBeenCalledTimes(1);
  });
});
