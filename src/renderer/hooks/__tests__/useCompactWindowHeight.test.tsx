import { act, render } from '@testing-library/react';

import { DEFAULT_HIDE_ELEMENTS } from '../../../shared/constants';
import type { HideElements } from '../../../shared/types';
import { useCompactWindowHeight } from '../useCompactWindowHeight';

let mockHideElements: HideElements = { ...DEFAULT_HIDE_ELEMENTS };
let mockCustomStyle: string | undefined;
const STARTUP_COMPACT_TEST_DELAY_MS = 120;

jest.mock('../../state/store', () => ({
  useAppState: () => ({
    settings: {
      hideElements: mockHideElements,
      customStyle: mockCustomStyle,
    },
  }),
}));

function TestComponent() {
  useCompactWindowHeight();
  return null;
}

function setRectHeight(element: Element | null, height: number): void {
  setRect(element, { top: 0, height });
}

function setRect(element: Element | null, rect: { top: number; height: number }): void {
  if (!element) {
    throw new Error('Missing element for layout test');
  }

  element.getBoundingClientRect = jest.fn(
    () =>
      ({
        x: 0,
        y: 0,
        top: rect.top,
        right: 0,
        bottom: rect.top + rect.height,
        left: 0,
        width: 100,
        height: rect.height,
        toJSON: () => undefined,
      }) as DOMRect,
  );
}

function readRootPx(name: string): number {
  return Number.parseFloat(document.documentElement.style.getPropertyValue(name));
}

async function flushMicrotasks(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('useCompactWindowHeight', () => {
  const resizeWindowByHeightDelta = jest.fn();
  let getComputedStyleSpy: jest.SpyInstance;
  let requestAnimationFrameSpy: jest.SpyInstance<number, [callback: FrameRequestCallback]>;
  let cancelAnimationFrameSpy: jest.SpyInstance<void, [handle: number]>;

  beforeEach(() => {
    mockHideElements = { ...DEFAULT_HIDE_ELEMENTS };
    mockCustomStyle = undefined;
    resizeWindowByHeightDelta.mockClear();
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 1 });
    window.electronAPI = {
      ...window.electronAPI,
      resizeWindowByHeightDelta,
    };

    document.body.innerHTML = `
      <div class="keyboard-zone">
        <div data-layout-row="rowF"></div>
        <div class="letter-keys-row">
          <div data-layout-row="row1"></div>
          <div data-layout-row="row2"></div>
          <div data-layout-row="row3"></div>
        </div>
      </div>
    `;
    setRectHeight(document.querySelector('[data-layout-row="rowF"]'), 100);
    setRectHeight(document.querySelector('[data-layout-row="row1"]'), 80);
    setRectHeight(document.querySelector('[data-layout-row="row2"]'), 80);
    setRectHeight(document.querySelector('[data-layout-row="row3"]'), 80);

    getComputedStyleSpy = jest.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
      const rowGap =
        element.classList.contains('keyboard-zone') || element.classList.contains('letter-keys-row')
          ? '14px'
          : '12px';
      const paddingTop = element.classList.contains('letter-keys-row') ? '14px' : '0px';
      const paddingBottom = element.classList.contains('app-container') ? '14px' : '0px';
      return {
        getPropertyValue: (name: string) => {
          if (element !== document.documentElement) return '';
          if (name === '--keyboard-f-row-flex') return '0.65';
          if (name === '--keyboard-panel-row-flex') return '3';
          return document.documentElement.style.getPropertyValue(name);
        },
        paddingTop,
        paddingBottom,
        rowGap,
      } as CSSStyleDeclaration;
    });
    requestAnimationFrameSpy = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    cancelAnimationFrameSpy = jest
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    getComputedStyleSpy.mockRestore();
    requestAnimationFrameSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
    document.documentElement.style.removeProperty('--keyboard-f-row-height');
    document.documentElement.style.removeProperty('--keyboard-letter-row-height');
    document.body.innerHTML = '';
  });

  it('publishes measured row heights as CSS variables for compact row layout', () => {
    render(<TestComponent />);

    expect(document.documentElement.style.getPropertyValue('--keyboard-f-row-height')).toBe(
      '100px',
    );
    expect(document.documentElement.style.getPropertyValue('--keyboard-letter-row-height')).toBe(
      '80px',
    );
  });

  it('uses key height when a compact row is smaller than its buttons', () => {
    document.body.innerHTML = `
      <div class="keyboard-zone">
        <div data-layout-row="rowF"><button class="key-btn"></button></div>
        <div class="letter-keys-row">
          <div data-layout-row="row1"><button class="key-btn"></button></div>
          <div data-layout-row="row2"><button class="key-btn"></button></div>
          <div data-layout-row="row3"><button class="key-btn"></button></div>
        </div>
      </div>
    `;
    setRectHeight(document.querySelector('[data-layout-row="rowF"]'), 48);
    setRectHeight(document.querySelector('[data-layout-row="rowF"] .key-btn'), 58);
    for (const rowKey of ['row1', 'row2', 'row3']) {
      setRectHeight(document.querySelector(`[data-layout-row="${rowKey}"]`), 48);
      setRectHeight(document.querySelector(`[data-layout-row="${rowKey}"] .key-btn`), 58);
    }

    render(<TestComponent />);

    expect(document.documentElement.style.getPropertyValue('--keyboard-f-row-height')).toBe('58px');
    expect(document.documentElement.style.getPropertyValue('--keyboard-letter-row-height')).toBe(
      '58px',
    );
  });

  it('keeps compact row height variables from shrinking after the window is shortened', () => {
    const { rerender } = render(<TestComponent />);

    act(() => {
      mockHideElements = { ...mockHideElements, row1: true };
      rerender(<TestComponent />);
    });

    setRectHeight(document.querySelector('[data-layout-row="rowF"]'), 40);
    setRectHeight(document.querySelector('[data-layout-row="row1"]'), 50);
    setRectHeight(document.querySelector('[data-layout-row="row2"]'), 50);
    setRectHeight(document.querySelector('[data-layout-row="row3"]'), 50);

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(document.documentElement.style.getPropertyValue('--keyboard-f-row-height')).toBe(
      '100px',
    );
    expect(document.documentElement.style.getPropertyValue('--keyboard-letter-row-height')).toBe(
      '80px',
    );
  });

  it('refreshes stale row height variables from the current full layout', () => {
    document.documentElement.style.setProperty('--keyboard-f-row-height', '140px');
    document.documentElement.style.setProperty('--keyboard-letter-row-height', '120px');

    render(<TestComponent />);

    expect(document.documentElement.style.getPropertyValue('--keyboard-f-row-height')).toBe(
      '100px',
    );
    expect(document.documentElement.style.getPropertyValue('--keyboard-letter-row-height')).toBe(
      '80px',
    );
  });

  it('compacts leftover startup bottom gap only once when starting with a hidden letter row', async () => {
    jest.useFakeTimers();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 620 });
    mockHideElements = { ...DEFAULT_HIDE_ELEMENTS, row1: true };
    document.body.innerHTML +=
      '<div class="app-container"><div class="tabbed-keyboard-panel"></div></div>';
    setRect(document.querySelector('.tabbed-keyboard-panel'), { top: 300, height: 200 });
    resizeWindowByHeightDelta.mockImplementationOnce((delta: number) => {
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: window.innerHeight + delta,
      });
    });

    render(<TestComponent />);

    act(() => {
      jest.advanceTimersByTime(6000);
    });
    await flushMicrotasks();
    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(resizeWindowByHeightDelta).toHaveBeenCalledWith(-106);
    expect(resizeWindowByHeightDelta).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('waits for the keyboard panel before counting startup compaction attempts', async () => {
    jest.useFakeTimers();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 });
    mockHideElements = { ...DEFAULT_HIDE_ELEMENTS, row1: true };

    render(<TestComponent />);

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(resizeWindowByHeightDelta).not.toHaveBeenCalled();

    document.body.innerHTML +=
      '<div class="app-container"><div class="tabbed-keyboard-panel"></div></div>';
    setRect(document.querySelector('.tabbed-keyboard-panel'), { top: 300, height: 200 });

    act(() => {
      jest.advanceTimersByTime(STARTUP_COMPACT_TEST_DELAY_MS);
    });
    await flushMicrotasks();

    expect(resizeWindowByHeightDelta).toHaveBeenCalledWith(-186);
    jest.useRealTimers();
  });

  it('waits for the selected custom style before counting startup compaction attempts', async () => {
    jest.useFakeTimers();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 });
    mockHideElements = { ...DEFAULT_HIDE_ELEMENTS, row1: true };
    mockCustomStyle = 'modern';
    document.body.innerHTML +=
      '<div class="app-container"><div class="tabbed-keyboard-panel"></div></div>';
    setRect(document.querySelector('.tabbed-keyboard-panel'), { top: 300, height: 200 });

    render(<TestComponent />);

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(resizeWindowByHeightDelta).not.toHaveBeenCalled();

    const styleElement = document.createElement('style');
    styleElement.id = 'custom-style';
    document.head.appendChild(styleElement);

    act(() => {
      jest.advanceTimersByTime(STARTUP_COMPACT_TEST_DELAY_MS);
    });
    await flushMicrotasks();

    expect(resizeWindowByHeightDelta).toHaveBeenCalledWith(-186);
    jest.useRealTimers();
  });

  it('retries startup compaction when the first compact layout measurement is not settled', async () => {
    jest.useFakeTimers();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 620 });
    mockHideElements = { ...DEFAULT_HIDE_ELEMENTS, row1: true };
    document.body.innerHTML +=
      '<div class="app-container"><div class="tabbed-keyboard-panel"></div></div>';

    let panelBottom = 620;
    const panel = document.querySelector('.tabbed-keyboard-panel');
    if (!panel) {
      throw new Error('Missing panel for layout test');
    }
    panel.getBoundingClientRect = jest.fn(
      () =>
        ({
          x: 0,
          y: 0,
          top: panelBottom - 200,
          right: 0,
          bottom: panelBottom,
          left: 0,
          width: 100,
          height: 200,
          toJSON: () => undefined,
        }) as DOMRect,
    );

    render(<TestComponent />);

    act(() => {
      jest.advanceTimersByTime(120);
    });

    expect(resizeWindowByHeightDelta).not.toHaveBeenCalled();

    panelBottom = 500;
    resizeWindowByHeightDelta.mockImplementationOnce((delta: number) => {
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: window.innerHeight + delta,
      });
    });
    act(() => {
      jest.advanceTimersByTime(6000);
    });
    await flushMicrotasks();
    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(resizeWindowByHeightDelta).toHaveBeenCalledWith(-106);
    expect(resizeWindowByHeightDelta).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('continues shrink-only startup compaction when the first resize lands above settled content', async () => {
    jest.useFakeTimers();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 });
    mockHideElements = { ...DEFAULT_HIDE_ELEMENTS, row1: true };
    document.body.innerHTML +=
      '<div class="app-container"><div class="tabbed-keyboard-panel"></div></div>';

    let panelBottom = 620;
    const panel = document.querySelector('.tabbed-keyboard-panel');
    if (!panel) {
      throw new Error('Missing panel for layout test');
    }
    panel.getBoundingClientRect = jest.fn(
      () =>
        ({
          x: 0,
          y: 0,
          top: panelBottom - 200,
          right: 0,
          bottom: panelBottom,
          left: 0,
          width: 100,
          height: 200,
          toJSON: () => undefined,
        }) as DOMRect,
    );
    resizeWindowByHeightDelta.mockImplementation((delta: number) => {
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: window.innerHeight + delta,
      });
      panelBottom = 500;
    });

    render(<TestComponent />);

    act(() => {
      jest.advanceTimersByTime(6000);
    });
    await flushMicrotasks();
    act(() => {
      jest.advanceTimersByTime(STARTUP_COMPACT_TEST_DELAY_MS);
    });
    await flushMicrotasks();
    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(resizeWindowByHeightDelta).toHaveBeenNthCalledWith(1, -66);
    expect(resizeWindowByHeightDelta).toHaveBeenNthCalledWith(2, -120);
    expect(resizeWindowByHeightDelta).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it('waits for the previous startup resize to affect the viewport before shrinking again', async () => {
    jest.useFakeTimers();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 });
    mockHideElements = { ...DEFAULT_HIDE_ELEMENTS, row1: true };
    document.body.innerHTML +=
      '<div class="app-container"><div class="tabbed-keyboard-panel"></div></div>';

    let panelBottom = 620;
    const panel = document.querySelector('.tabbed-keyboard-panel');
    if (!panel) {
      throw new Error('Missing panel for layout test');
    }
    panel.getBoundingClientRect = jest.fn(
      () =>
        ({
          x: 0,
          y: 0,
          top: panelBottom - 200,
          right: 0,
          bottom: panelBottom,
          left: 0,
          width: 100,
          height: 200,
          toJSON: () => undefined,
        }) as DOMRect,
    );

    render(<TestComponent />);

    act(() => {
      jest.advanceTimersByTime(6000);
    });
    await flushMicrotasks();

    expect(resizeWindowByHeightDelta).toHaveBeenCalledWith(-66);

    act(() => {
      jest.advanceTimersByTime(STARTUP_COMPACT_TEST_DELAY_MS * 3);
    });

    expect(resizeWindowByHeightDelta).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 634 });
    panelBottom = 500;

    act(() => {
      jest.advanceTimersByTime(STARTUP_COMPACT_TEST_DELAY_MS);
    });
    await flushMicrotasks();

    expect(resizeWindowByHeightDelta).toHaveBeenNthCalledWith(2, -120);
    expect(resizeWindowByHeightDelta).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it('never grows the window during startup compaction when F row is hidden', () => {
    jest.useFakeTimers();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 685 });
    mockHideElements = { ...DEFAULT_HIDE_ELEMENTS, rowF: true };
    document.body.innerHTML = `
      <div class="app-container">
        <div class="keyboard-zone f-row-hidden">
          <div class="tabbed-keyboard-panel"></div>
        </div>
      </div>
    `;
    setRect(document.querySelector('.tabbed-keyboard-panel'), { top: 120, height: 565 });

    render(<TestComponent />);

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(resizeWindowByHeightDelta).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('estimates full-layout row baselines when the app starts with a hidden letter row', () => {
    mockHideElements = { ...DEFAULT_HIDE_ELEMENTS, row1: true };
    document.body.innerHTML = `
      <div class="keyboard-zone letter-rows-compact visible-letter-rows-2">
        <div data-layout-row="rowF"></div>
        <div class="tabbed-keyboard-panel letter-rows-compact visible-letter-rows-2">
          <div class="keyboard-row num-keys-row"></div>
          <div class="letter-keys-row letter-rows-compact visible-letter-rows-2">
            <div data-layout-row="row2"></div>
            <div data-layout-row="row3"></div>
          </div>
        </div>
      </div>
    `;
    setRectHeight(document.querySelector('.keyboard-zone'), 373.33);
    setRectHeight(document.querySelector('[data-layout-row="rowF"]'), 78.67);
    setRectHeight(document.querySelector('.letter-keys-row'), 248.27);
    setRectHeight(document.querySelector('[data-layout-row="row2"]'), 110.13);
    setRectHeight(document.querySelector('[data-layout-row="row3"]'), 110.13);

    render(<TestComponent />);

    expect(readRootPx('--keyboard-f-row-height')).toBeCloseTo(66.08, 1);
    expect(readRootPx('--keyboard-letter-row-height')).toBeCloseTo(73.42, 1);
  });

  it('keeps hidden-startup row baselines stable after compact resize corrections', () => {
    mockHideElements = { ...DEFAULT_HIDE_ELEMENTS, row1: true };
    document.body.innerHTML = `
      <div class="keyboard-zone letter-rows-compact visible-letter-rows-2">
        <div data-layout-row="rowF"></div>
        <div class="tabbed-keyboard-panel letter-rows-compact visible-letter-rows-2">
          <div class="keyboard-row num-keys-row"></div>
          <div class="letter-keys-row letter-rows-compact visible-letter-rows-2">
            <div data-layout-row="row2"></div>
            <div data-layout-row="row3"></div>
          </div>
        </div>
      </div>
    `;
    setRectHeight(document.querySelector('.keyboard-zone'), 373.33);
    setRectHeight(document.querySelector('[data-layout-row="rowF"]'), 78.67);
    setRectHeight(document.querySelector('.num-keys-row'), 40);
    setRectHeight(document.querySelector('.letter-keys-row'), 248.27);
    setRectHeight(document.querySelector('[data-layout-row="row2"]'), 110.13);
    setRectHeight(document.querySelector('[data-layout-row="row3"]'), 110.13);

    render(<TestComponent />);

    const initialFunctionRowHeight = readRootPx('--keyboard-f-row-height');
    const initialLetterRowHeight = readRootPx('--keyboard-letter-row-height');
    setRectHeight(document.querySelector('.keyboard-zone'), 155.2);
    setRectHeight(document.querySelector('[data-layout-row="rowF"]'), 25.14);
    setRectHeight(document.querySelector('.letter-keys-row'), 50.7);
    setRectHeight(document.querySelector('[data-layout-row="row2"]'), 11.35);
    setRectHeight(document.querySelector('[data-layout-row="row3"]'), 11.35);

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(readRootPx('--keyboard-f-row-height')).toBeCloseTo(initialFunctionRowHeight, 2);
    expect(readRootPx('--keyboard-letter-row-height')).toBeCloseTo(initialLetterRowHeight, 2);
  });

  it('shrinks by the measured F-row height plus keyboard gap when F row is hidden', () => {
    const { rerender } = render(<TestComponent />);

    act(() => {
      mockHideElements = { ...mockHideElements, rowF: true };
      rerender(<TestComponent />);
    });

    expect(resizeWindowByHeightDelta).toHaveBeenCalledWith(-114);
  });

  it('shrinks by the measured letter-row height plus row gap when a letter row is hidden', () => {
    const { rerender } = render(<TestComponent />);

    act(() => {
      mockHideElements = { ...mockHideElements, row2: true };
      rerender(<TestComponent />);
    });

    expect(resizeWindowByHeightDelta).toHaveBeenCalledWith(-94);
  });
});
