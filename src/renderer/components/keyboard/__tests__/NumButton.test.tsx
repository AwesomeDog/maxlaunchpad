import { fireEvent, render, screen } from '@testing-library/react';

import { NumButton } from '../NumButton';

function dispatchPointerEvent(
  target: Document | Element | Window,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  init: MouseEventInit,
) {
  fireEvent(target, new MouseEvent(type, { bubbles: true, cancelable: true, ...init }));
}

describe('NumButton', () => {
  it('switches tabs immediately on ordinary click', () => {
    const onClick = jest.fn();

    render(
      <NumButton
        keyId="1"
        label="Main"
        isSelected={false}
        onClick={onClick}
        onContextMenu={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /1 Main/ }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('suppresses tab switch after movement cancels a pending tab move', () => {
    const onClick = jest.fn();
    const onMoveTab = jest.fn();

    render(
      <NumButton
        keyId="1"
        label="Main"
        isSelected={false}
        onClick={onClick}
        onContextMenu={jest.fn()}
        onMoveTab={onMoveTab}
      />,
    );

    const button = screen.getByRole('button', { name: /1 Main/ });
    dispatchPointerEvent(button, 'pointerdown', { button: 0, clientX: 0, clientY: 0 });
    dispatchPointerEvent(document, 'pointermove', { clientX: 16, clientY: 0 });
    dispatchPointerEvent(document, 'pointerup', { clientX: 16, clientY: 0 });
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
    expect(onMoveTab).not.toHaveBeenCalled();
  });
});
