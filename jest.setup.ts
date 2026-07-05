import '@testing-library/jest-dom';

import './src/renderer/i18n';

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: {
    getIcon: jest.fn().mockResolvedValue({ dataUrl: 'data:image/png;base64,mock' }),
    parseShortcut: jest.fn().mockResolvedValue(null),
    onWindowHidden: jest.fn().mockReturnValue(jest.fn()),
    setWindowAutoHideSuspended: jest.fn(),
  },
  writable: true,
});
