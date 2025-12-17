import '@testing-library/jest-dom';

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: {
    getIcon: jest.fn().mockResolvedValue({ dataUrl: 'data:image/png;base64,mock' }),
    parseShortcut: jest.fn().mockResolvedValue(null),
  },
  writable: true,
});
