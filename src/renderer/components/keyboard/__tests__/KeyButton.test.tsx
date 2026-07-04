import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { act } from 'react';

import type { KeyConfig } from '../../../../shared/types';
import { AppStateProvider } from '../../../state/store';
import { KeyButton } from '../KeyButton';

jest.mock('../../../hooks/useIcon', () => ({
  useIcon: () => null,
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
});
