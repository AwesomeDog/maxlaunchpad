import { renderHook, waitFor } from '@testing-library/react';

import { DEFAULT_FOLDER_ICON_URL } from '../../../shared/constants';
import type { KeyConfig } from '../../../shared/types';
import { useIcon } from '../useIcon';

jest.mock('@dicebear/collection', () => ({ initials: {} }));
jest.mock('@dicebear/core', () => ({
  createAvatar: jest.fn(() => ({ toDataUri: () => 'data:image/svg+xml,fallback' })),
}));

const mockGetIcon = jest.fn();

describe('useIcon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.electronAPI = {
      ...window.electronAPI,
      getIcon: mockGetIcon,
    };
  });

  it('uses inline data URL icons without requesting a local file icon', async () => {
    const folderKey: KeyConfig = {
      tabId: '1',
      id: 'Q',
      label: 'Projects',
      filePath: 'C:\\Users\\test\\Projects',
      iconPath: DEFAULT_FOLDER_ICON_URL,
    };

    const { result } = renderHook(() => useIcon(folderKey));

    await waitFor(() => {
      expect(result.current).toBe(DEFAULT_FOLDER_ICON_URL);
    });
    expect(mockGetIcon).not.toHaveBeenCalled();
  });
});
