import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';

import type { KeyConfig } from '../../../../shared/types';
import { AppStateProvider } from '../../../state/store';
import { KeyButton } from '../KeyButton';

let mockIconDataUrl: string | null = null;

jest.mock('../../../hooks/useIcon', () => ({
  useIcon: () => mockIconDataUrl,
}));

function dispatchPointerEvent(
  target: Document | Element | Window,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  init: MouseEventInit,
) {
  fireEvent(target, new MouseEvent(type, { bubbles: true, cancelable: true, ...init }));
}

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
    mockIconDataUrl = null;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('launches immediately on single click', () => {
    const { button, onClick, onEdit } = renderKeyButton();

    fireEvent.click(button, { detail: 1 });

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('suppresses launch after movement cancels a pending key move', () => {
    const onMoveKey = jest.fn();
    const { button, onClick } = renderKeyButton({ onMoveKey });

    dispatchPointerEvent(button, 'pointerdown', { button: 0, clientX: 0, clientY: 0 });
    dispatchPointerEvent(document, 'pointermove', { clientX: 16, clientY: 0 });
    dispatchPointerEvent(document, 'pointerup', { clientX: 16, clientY: 0 });
    fireEvent.click(button, { detail: 1 });

    expect(onClick).not.toHaveBeenCalled();
    expect(onMoveKey).not.toHaveBeenCalled();
  });

  it('opens editing on double click without scheduling delayed launch work', () => {
    const setTimeoutSpy = jest.spyOn(window, 'setTimeout');
    const { button, onClick, onEdit } = renderKeyButton();

    fireEvent.click(button, { detail: 1 });
    fireEvent.doubleClick(button, { detail: 2 });

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
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
