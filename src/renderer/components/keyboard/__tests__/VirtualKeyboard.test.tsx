import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';

import { DEFAULT_HIDE_ELEMENTS } from '../../../../shared/constants';
import type { AppSettings, KeyboardProfile, KeyConfig } from '../../../../shared/types';
import { TAB_HOVER_SWITCH_DELAY_MS } from '../../../hooks/useTabHoverSwitch';
import { AppStateProvider, useAppState, useDispatch } from '../../../state/store';
import { VirtualKeyboard } from '../VirtualKeyboard';
import { createDataTransfer } from './dragTestUtils';

// The icon hook pulls in ESM-only avatar packages Jest cannot transform
jest.mock('../../../hooks/useIcon', () => ({ useIcon: () => null }));
// Launching an app needs the Electron IPC layer, which is irrelevant here
jest.mock('../../../hooks/useLaunchProgram', () => ({ useLaunchProgram: () => jest.fn() }));

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

const profile: KeyboardProfile = {
  tabs: [
    { id: '1', label: 'One' },
    { id: '2', label: 'Two' },
  ],
  keys: [
    { tabId: '1', id: 'Q', label: 'Tab1App', filePath: '/apps/one.exe' },
    { tabId: '2', id: 'Q', label: 'Tab2App', filePath: '/apps/two.exe' },
  ],
};

function Harness() {
  const state = useAppState();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({ type: 'SET_CONFIG', settings, profile });
    dispatch({ type: 'SET_DRAG_DROP_MODE', enabled: true });
  }, [dispatch]);

  // The keyboard needs a loaded profile, which the effect above provides
  if (!state.settings || !state.profile) return null;

  return (
    <>
      <VirtualKeyboard />
      <output data-testid="active-tab">{state.ui.activeTabId}</output>
      <output data-testid="keys">{JSON.stringify(state.profile?.keys ?? [])}</output>
    </>
  );
}

function renderKeyboard() {
  render(
    <AppStateProvider>
      <Harness />
    </AppStateProvider>,
  );
}

/** Tab number buttons, in keyboard order (1-9, 0) */
function tabButtons(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.num-key-btn'));
}

/** Letter keys of the visible tab, in keyboard order */
function letterKeys(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.letter-keys-row .key-btn'));
}

function storedKeys(): KeyConfig[] {
  return JSON.parse(screen.getByTestId('keys').textContent || '[]');
}

describe('dragging a key onto another tab', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('switches tabs when the dragged key rests on a tab number, then drops on the new tab', () => {
    renderKeyboard();
    const dataTransfer = createDataTransfer();

    // Start dragging "Tab1App" from tab 1
    fireEvent.dragStart(letterKeys()[0], { dataTransfer });

    // Rest on tab 2 long enough for the switch to happen
    fireEvent.dragEnter(tabButtons()[1], { dataTransfer });
    expect(tabButtons()[1]).toHaveClass('drag-target');
    act(() => {
      jest.advanceTimersByTime(TAB_HOVER_SWITCH_DELAY_MS - 1);
    });
    expect(screen.getByTestId('active-tab')).toHaveTextContent('1');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.getByTestId('active-tab')).toHaveTextContent('2');
    expect(screen.getByText('Tab2App')).toBeInTheDocument();

    // Drop it onto the empty "W" slot of tab 2
    fireEvent.drop(letterKeys()[1], { dataTransfer });

    expect(storedKeys()).toEqual([
      { tabId: '2', id: 'Q', label: 'Tab2App', filePath: '/apps/two.exe' },
      { tabId: '2', id: 'W', label: 'Tab1App', filePath: '/apps/one.exe' },
    ]);
  });

  it('does not switch tabs when the pointer leaves the tab number too early', () => {
    renderKeyboard();
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(letterKeys()[0], { dataTransfer });
    fireEvent.dragEnter(tabButtons()[1], { dataTransfer });
    act(() => {
      jest.advanceTimersByTime(TAB_HOVER_SWITCH_DELAY_MS / 2);
    });
    fireEvent.dragLeave(tabButtons()[1], { dataTransfer });
    act(() => {
      jest.advanceTimersByTime(TAB_HOVER_SWITCH_DELAY_MS);
    });

    expect(screen.getByTestId('active-tab')).toHaveTextContent('1');
  });

  it('ignores tab numbers when no key is being dragged', () => {
    renderKeyboard();

    fireEvent.dragEnter(tabButtons()[1], { dataTransfer: createDataTransfer() });
    act(() => {
      jest.advanceTimersByTime(TAB_HOVER_SWITCH_DELAY_MS * 2);
    });

    expect(screen.getByTestId('active-tab')).toHaveTextContent('1');
  });

  it('does not mark the dragged key as a drop target, on any tab', () => {
    renderKeyboard();
    const dataTransfer = createDataTransfer();
    const zone = () => document.querySelector<HTMLElement>('.keyboard-zone')!;

    fireEvent.dragStart(letterKeys()[0], { dataTransfer });
    // While a key drag runs the keyboard suppresses the hover look the browser keeps on
    // the drag source element (it would otherwise stick to that position on other tabs)
    expect(zone()).toHaveClass('key-drag-active');

    // The pointer starts inside the dragged key, so that key receives dragOver itself
    fireEvent.dragOver(letterKeys()[0], { dataTransfer });
    expect(letterKeys()[0]).toHaveClass('dragging');
    expect(letterKeys()[0]).not.toHaveClass('drag-over');

    // Switch tabs while the drag is still running
    fireEvent.dragEnter(tabButtons()[1], { dataTransfer });
    act(() => {
      jest.advanceTimersByTime(TAB_HOVER_SWITCH_DELAY_MS);
    });

    // The same position on the new tab must not inherit highlight from the old one
    expect(screen.getByText('Tab2App')).toBeInTheDocument();
    expect(letterKeys()[0]).not.toHaveClass('drag-over');
    expect(letterKeys()[0]).not.toHaveClass('dragging');

    fireEvent.dragEnd(letterKeys()[0], { dataTransfer });
    expect(zone()).not.toHaveClass('key-drag-active');
  });

  it('only cancels the drag when the key is released on a tab number', () => {
    renderKeyboard();
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(letterKeys()[0], { dataTransfer });
    fireEvent.dragEnter(tabButtons()[1], { dataTransfer });
    fireEvent.dragOver(tabButtons()[1], { dataTransfer });
    fireEvent.drop(tabButtons()[1], { dataTransfer });
    fireEvent.dragEnd(letterKeys()[0], { dataTransfer });

    // Neither the tab switches nor the key moves anywhere
    expect(screen.getByTestId('active-tab')).toHaveTextContent('1');
    expect(storedKeys()).toEqual(profile.keys);
  });

  it('clears the drag state when the drag ends without a drop', () => {
    renderKeyboard();
    const dataTransfer = createDataTransfer();
    const source = letterKeys()[0];

    fireEvent.dragStart(source, { dataTransfer });
    expect(source).toHaveClass('dragging');

    // Released outside the window (or cancelled with Esc): no drop event at all
    fireEvent.dragEnd(source, { dataTransfer });
    expect(source).not.toHaveClass('dragging');

    // A file dragged in afterwards must still configure a key, not move one
    fireEvent.drop(letterKeys()[1], {
      dataTransfer: { files: [{ path: '/apps/late.exe' }], getData: () => '' },
    });

    expect(storedKeys()).toEqual([
      ...profile.keys,
      {
        tabId: '1',
        id: 'W',
        label: 'late',
        filePath: '/apps/late.exe',
        description: '/apps/late.exe',
      },
    ]);
  });
});
