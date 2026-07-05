import { act, renderHook, waitFor } from '@testing-library/react';

import type { AppSettings } from '../../../shared/types';
import i18n from '../../i18n';
import { useCustomStyle } from '../useCustomStyle';

const dispatchMock = jest.fn();
const loadStyleContentMock = jest.fn();

let settings: Pick<AppSettings, 'customStyle'> = {
  customStyle: 'modern',
};

jest.mock('../../state/store', () => ({
  useAppState: () => ({ settings }),
  useDispatch: () => dispatchMock,
}));

describe('useCustomStyle', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
    loadStyleContentMock.mockReset();
    settings = { customStyle: 'modern' };
    document.head.innerHTML = '';
    document.body.className = '';
    window.electronAPI = {
      ...window.electronAPI,
      loadStyleContent: loadStyleContentMock,
    };
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.body.className = '';
    jest.restoreAllMocks();
  });

  it('keeps the selected modern style mounted when only language changes', async () => {
    loadStyleContentMock.mockResolvedValue({ content: '.modern-style { color: red; }' });

    const { rerender } = renderHook(() => useCustomStyle());

    await waitFor(() => {
      expect(document.getElementById('custom-style')?.textContent).toBe(
        '.modern-style { color: red; }',
      );
    });

    await act(async () => {
      await i18n.changeLanguage('en');
    });
    rerender();

    expect(document.getElementById('custom-style')?.textContent).toBe(
      '.modern-style { color: red; }',
    );
    expect(loadStyleContentMock).toHaveBeenCalledTimes(1);
    expect(document.body).toHaveClass('custom-style-modern');
  });

  it('reloads custom CSS when the selected style actually changes', async () => {
    loadStyleContentMock
      .mockResolvedValueOnce({ content: '.modern-style { color: red; }' })
      .mockResolvedValueOnce({ content: '.default-style { color: blue; }' });

    const { rerender } = renderHook(() => useCustomStyle());

    await waitFor(() => {
      expect(document.getElementById('custom-style')?.textContent).toBe(
        '.modern-style { color: red; }',
      );
    });

    settings = { customStyle: 'default' };
    rerender();

    await waitFor(() => {
      expect(document.getElementById('custom-style')?.textContent).toBe(
        '.default-style { color: blue; }',
      );
    });
    expect(loadStyleContentMock).toHaveBeenCalledTimes(2);
    expect(document.body).toHaveClass('custom-style-default');
    expect(document.body).not.toHaveClass('custom-style-modern');
  });

  it('removes the custom style class when the hook unmounts', async () => {
    loadStyleContentMock.mockResolvedValue({ content: '.modern-style { color: red; }' });

    const { unmount } = renderHook(() => useCustomStyle());

    await waitFor(() => {
      expect(document.body).toHaveClass('custom-style-modern');
    });

    unmount();

    expect(document.body).not.toHaveClass('custom-style-modern');
  });
});
