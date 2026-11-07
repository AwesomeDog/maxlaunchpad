import { cleanup, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';

import { DEFAULT_HIDE_ELEMENTS } from '../../../../shared/constants';
import type { AppSettings, KeyConfig } from '../../../../shared/types';
import { KEY_DRAG_MIME, serializeKeyDragPayload } from '../../../state/keyDrag';
import { AppStateProvider, useAppState, useDispatch } from '../../../state/store';
import { KeyButton } from '../KeyButton';
import { createDataTransfer } from './dragTestUtils';

// The icon hook pulls in ESM-only avatar packages that Jest cannot transform
jest.mock('../../../hooks/useIcon', () => ({ useIcon: () => null }));

const settings: AppSettings = {
  activeProfilePath: '/path/to/profile.yaml',
  hotkey: { modifiers: ['Alt'], key: '`' },
  activeTabOnShow: 'lastUsed',
  lockWindowCenter: false,
  launchOnStartup: false,
  startInTray: false,
  theme: 'system',
  customStyle: 'default',
  windowSize: { width: 1000, height: 600 },
  hideElements: { ...DEFAULT_HIDE_ELEMENTS },
};

const noop = () => undefined;

function Harness({ keys, isDragDropMode }: { keys: KeyConfig[]; isDragDropMode: boolean }) {
  const state = useAppState();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({ type: 'SET_CONFIG', settings, profile: { tabs: [{ id: '1', label: '' }], keys } });
  }, [dispatch, keys]);

  useEffect(() => {
    dispatch({ type: 'SET_DRAG_DROP_MODE', enabled: isDragDropMode });
  }, [dispatch, isDragDropMode]);

  const findKey = (keyId: string) =>
    state.profile?.keys.find((item) => item.tabId === '1' && item.id === keyId);

  return (
    <>
      <KeyButton keyId="Q" tabId="1" keyConfig={findKey('Q')} onClick={noop} onContextMenu={noop} />
      <KeyButton keyId="W" tabId="1" keyConfig={findKey('W')} onClick={noop} onContextMenu={noop} />
      <output data-testid="keys">{JSON.stringify(state.profile?.keys ?? [])}</output>
      <output data-testid="drag-key">{JSON.stringify(state.ui.dragKey)}</output>
    </>
  );
}

function storedKeys(): KeyConfig[] {
  return JSON.parse(screen.getByTestId('keys').textContent || '[]');
}

/** jsdom lacks DragEvent, so modifier flags must be attached to the plain Event manually. */
function fireDragEvent(
  element: HTMLElement,
  eventName: 'dragStart' | 'dragOver' | 'drop' | 'dragEnd',
  dataTransfer: ReturnType<typeof createDataTransfer>,
  modifiers: Pick<DragEventInit, 'ctrlKey' | 'metaKey'> = {},
) {
  const event = createEvent[eventName](element, { dataTransfer });
  Object.defineProperties(event, {
    ctrlKey: { value: modifiers.ctrlKey ?? false },
    metaKey: { value: modifiers.metaKey ?? false },
  });
  fireEvent(element, event);
  return event;
}

function renderKeyboard(keys: KeyConfig[], isDragDropMode: boolean) {
  render(
    <AppStateProvider>
      <Harness keys={keys} isDragDropMode={isDragDropMode} />
    </AppStateProvider>,
  );
  const [source, target] = screen.getAllByRole('button');
  return { source, target };
}

describe('KeyButton drag & drop', () => {
  const notepad: KeyConfig = {
    tabId: '1',
    id: 'Q',
    label: 'Notepad',
    filePath: '/apps/notepad.exe',
  };

  it('makes configured keys draggable only in drag & drop mode', () => {
    const { source, target } = renderKeyboard([notepad], false);

    expect(source).toHaveAttribute('draggable', 'false');
    expect(target).toHaveAttribute('draggable', 'false');

    const dataTransfer = createDataTransfer();
    const event = fireDragEvent(source, 'dragStart', dataTransfer);
    expect(event.defaultPrevented).toBe(true);
    expect(dataTransfer.setData).not.toHaveBeenCalled();
    expect(screen.getByTestId('drag-key')).toHaveTextContent('null');

    cleanup();

    const second = renderKeyboard([notepad], true);
    expect(second.source).toHaveAttribute('draggable', 'true');
    // Empty keys are drop targets but cannot be dragged themselves
    expect(second.target).toHaveAttribute('draggable', 'false');
  });

  it('moves a dragged key onto an empty slot using the transferred data', () => {
    const { source, target } = renderKeyboard([notepad], true);
    const dataTransfer = createDataTransfer();

    fireDragEvent(source, 'dragStart', dataTransfer);
    expect(source).toHaveClass('dragging');
    expect(dataTransfer.effectAllowed).toBe('copyMove');
    expect(dataTransfer.setData).toHaveBeenCalledWith(
      KEY_DRAG_MIME,
      JSON.stringify({ tabId: '1', keyId: 'Q' }),
    );

    fireDragEvent(target, 'dragOver', dataTransfer);
    expect(target).toHaveClass('drag-over');
    expect(dataTransfer.dropEffect).toBe('move');
    // Browsers do not expose getData() until drop.
    expect(dataTransfer.getData).not.toHaveBeenCalled();

    fireDragEvent(target, 'drop', dataTransfer);
    expect(dataTransfer.getData).toHaveBeenCalledWith(KEY_DRAG_MIME);
    expect(source).not.toHaveClass('dragging');
    expect(target).not.toHaveClass('drag-over');
    expect(storedKeys()).toEqual([{ ...notepad, id: 'W' }]);

    fireDragEvent(source, 'dragEnd', dataTransfer);
    expect(storedKeys()).toEqual([{ ...notepad, id: 'W' }]);
  });

  it.each([
    ['Ctrl', { ctrlKey: true }],
    ['Cmd', { metaKey: true }],
  ] as const)('copies instead of moving when %s is held on drop', (_name, modifiers) => {
    const { source, target } = renderKeyboard([notepad], true);
    const dataTransfer = createDataTransfer();

    fireDragEvent(source, 'dragStart', dataTransfer);
    fireDragEvent(target, 'dragOver', dataTransfer, modifiers);
    expect(dataTransfer.dropEffect).toBe('copy');

    fireDragEvent(target, 'drop', dataTransfer, modifiers);
    fireDragEvent(source, 'dragEnd', dataTransfer);

    expect(storedKeys()).toEqual([notepad, { ...notepad, id: 'W' }]);
  });

  it('swaps the two keys when dropped onto an occupied slot', () => {
    const calculator: KeyConfig = {
      tabId: '1',
      id: 'W',
      label: 'Calculator',
      filePath: '/apps/calc.exe',
    };
    const { source, target } = renderKeyboard([notepad, calculator], true);
    const dataTransfer = createDataTransfer();

    fireDragEvent(source, 'dragStart', dataTransfer);
    fireDragEvent(target, 'drop', dataTransfer);
    fireDragEvent(source, 'dragEnd', dataTransfer);

    expect(storedKeys()).toEqual([
      { ...calculator, id: 'Q' },
      { ...notepad, id: 'W' },
    ]);
  });

  it('moves the transferred key even when no drag feedback is active', () => {
    const { source, target } = renderKeyboard([notepad], true);
    const dataTransfer = createDataTransfer();
    dataTransfer.setData(KEY_DRAG_MIME, serializeKeyDragPayload({ tabId: '1', keyId: 'Q' }));

    expect(source).not.toHaveClass('dragging');
    fireDragEvent(target, 'drop', dataTransfer);

    expect(storedKeys()).toEqual([{ ...notepad, id: 'W' }]);
  });

  it('uses the transferred source when it differs from the drag feedback', () => {
    const calculator: KeyConfig = {
      tabId: '1',
      id: 'W',
      label: 'Calculator',
      filePath: '/apps/calc.exe',
    };
    const { source, target } = renderKeyboard([notepad, calculator], true);
    const dataTransfer = createDataTransfer();

    fireDragEvent(source, 'dragStart', dataTransfer);
    dataTransfer.setData(KEY_DRAG_MIME, serializeKeyDragPayload({ tabId: '1', keyId: 'W' }));
    fireDragEvent(source, 'drop', dataTransfer, { ctrlKey: true });

    expect(storedKeys()).toEqual([{ ...calculator, id: 'Q' }, calculator]);
    expect(source).not.toHaveClass('dragging');
    expect(target).not.toHaveClass('drag-over');
  });

  it.each(['', 'not JSON', '{"tabId":"1"}'])('ignores invalid transferred data: %p', (raw) => {
    const { source, target } = renderKeyboard([notepad], true);
    const dataTransfer = createDataTransfer();

    fireDragEvent(source, 'dragStart', dataTransfer);
    dataTransfer.setData(KEY_DRAG_MIME, raw);
    fireDragEvent(target, 'drop', dataTransfer);

    expect(storedKeys()).toEqual([notepad]);
    expect(source).not.toHaveClass('dragging');
    expect(screen.getByTestId('drag-key')).toHaveTextContent('null');
  });

  it('ignores unreadable transferred data and clears the drag feedback', () => {
    const { source, target } = renderKeyboard([notepad], true);
    const dataTransfer = createDataTransfer();

    fireDragEvent(source, 'dragStart', dataTransfer);
    dataTransfer.getData.mockImplementation(() => {
      throw new Error('Drag data is unavailable');
    });
    fireDragEvent(target, 'drop', dataTransfer);

    expect(storedKeys()).toEqual([notepad]);
    expect(source).not.toHaveClass('dragging');
  });

  it.each([false, true])(
    'configures a key from an external file with drag & drop mode set to %s',
    (isDragDropMode) => {
      const { target } = renderKeyboard([], isDragDropMode);
      const dataTransfer = createDataTransfer();
      dataTransfer.files.push({ path: '/apps/dropped.exe' });

      fireDragEvent(target, 'drop', dataTransfer);

      expect(storedKeys()).toEqual([
        {
          tabId: '1',
          id: 'W',
          label: 'dropped',
          filePath: '/apps/dropped.exe',
          description: '/apps/dropped.exe',
        },
      ]);
    },
  );

  it('does not let stale drag feedback override an external file drop', () => {
    const { source, target } = renderKeyboard([notepad], true);
    fireDragEvent(source, 'dragStart', createDataTransfer());

    const dataTransfer = createDataTransfer();
    dataTransfer.files.push({ path: '/apps/dropped.exe' });
    fireDragEvent(target, 'drop', dataTransfer);

    expect(storedKeys()).toEqual([
      notepad,
      {
        tabId: '1',
        id: 'W',
        label: 'dropped',
        filePath: '/apps/dropped.exe',
        description: '/apps/dropped.exe',
      },
    ]);
    expect(source).not.toHaveClass('dragging');
  });
});
