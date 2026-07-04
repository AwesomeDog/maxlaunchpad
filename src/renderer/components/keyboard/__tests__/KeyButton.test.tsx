import { fireEvent, render, screen } from '@testing-library/react';
import { act, type ComponentProps } from 'react';

import type { KeyConfig } from '../../../../shared/types';
import { AppStateProvider } from '../../../state/store';
import { KeyButton } from '../KeyButton';

let mockIconDataUrl: string | null = null;

jest.mock('../../../hooks/useIcon', () => ({
  useIcon: () => mockIconDataUrl,
}));

function renderKeyButton(overrides: Partial<ComponentProps<typeof KeyButton>> = {}) {
  const keyConfig: KeyConfig = {
    tabId: '1',
    id: 'Q',
    label: 'Demo',
    filePath: 'C:\\Demo.exe',
  };
  const onClick = jest.fn();
  const onEdit = jest.fn();

  render(
    <AppStateProvider>
      <KeyButton
        keyId="Q"
        tabId="1"
        keyConfig={keyConfig}
        onClick={onClick}
        onEdit={onEdit}
        onContextMenu={jest.fn()}
        {...overrides}
      />
    </AppStateProvider>,
  );

  return {
    button: screen.getByTitle('Demo'),
    onClick,
    onEdit,
  };
}

describe('KeyButton', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockIconDataUrl = null;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('keeps single click launch delayed only long enough to distinguish double click', () => {
    const { button, onClick, onEdit } = renderKeyButton();

    fireEvent.click(button, { detail: 1 });
    expect(onClick).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(220);
    });

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('opens editing on double click and cancels the pending launch click', () => {
    const { button, onClick, onEdit } = renderKeyButton();

    fireEvent.click(button, { detail: 1 });
    fireEvent.doubleClick(button, { detail: 2 });

    act(() => {
      jest.advanceTimersByTime(220);
    });

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('marks text-only layout when button icons are hidden', () => {
    const { button } = renderKeyButton({ hideIcon: true });

    expect(button).toHaveClass('icons-hidden');
    expect(button).toHaveClass('text-only');
    expect(screen.getByText('Demo').closest('.key-btn-text-slot')).not.toHaveClass(
      'content-hidden',
    );
  });

  it('marks icon-only layout when button text is hidden', () => {
    mockIconDataUrl = 'data:image/png;base64,abc';

    const { button } = renderKeyButton({ hideText: true });

    expect(button).toHaveClass('text-hidden');
    expect(button).toHaveClass('icon-only');
    expect(button.querySelector('.key-btn-icon-slot')).not.toHaveClass('content-hidden');
    expect(screen.getByText('Demo').closest('.key-btn-text-slot')).toHaveClass('content-hidden');
  });
});
