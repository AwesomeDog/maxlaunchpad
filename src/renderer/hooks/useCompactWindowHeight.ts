import { useEffect, useLayoutEffect, useRef } from 'react';

import type { HideElements } from '../../shared/types';
import { useAppState } from '../state/store';

type CompactRowKey = 'rowF' | 'row1' | 'row2' | 'row3';
type CompactHiddenRows = Record<CompactRowKey, boolean>;
type RowMeasurements = Partial<Record<CompactRowKey, number>>;

const COMPACT_ROW_KEYS: readonly CompactRowKey[] = ['rowF', 'row1', 'row2', 'row3'];
const LETTER_ROW_KEYS: readonly CompactRowKey[] = ['row1', 'row2', 'row3'];
const STARTUP_COMPACT_CHECK_DELAY_MS = 120;
const STARTUP_COMPACT_MAX_ATTEMPTS = 40;
const CUSTOM_STYLE_ID = 'custom-style';

function pickHiddenRows(hideElements: HideElements): CompactHiddenRows {
  return {
    rowF: hideElements.rowF,
    row1: hideElements.row1,
    row2: hideElements.row2,
    row3: hideElements.row3,
  };
}

function parseCssPx(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readGridRowGap(element: Element | null): number {
  if (!element) return 0;
  return parseCssPx(window.getComputedStyle(element).rowGap);
}

function getMaxChildHeight(element: HTMLElement, selector: string): number {
  return Array.from(element.querySelectorAll<HTMLElement>(selector)).reduce((maxHeight, child) => {
    return Math.max(maxHeight, child.getBoundingClientRect().height);
  }, 0);
}

function readRootCssPxVariable(name: string): number {
  return parseCssPx(window.getComputedStyle(document.documentElement).getPropertyValue(name));
}

function readRootCssNumberVariable(name: string, fallback: number): number {
  const value = Number.parseFloat(
    window.getComputedStyle(document.documentElement).getPropertyValue(name),
  );
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function writeRootCssPxVariable(name: string, value: number): number {
  if (Number.isFinite(value) && value > 0) {
    document.documentElement.style.setProperty(name, `${value}px`);
  }
  return value;
}

function getBaselineRowHeight(
  name: string,
  measuredValue: number,
  shouldRefreshBaseline: boolean,
): number {
  const existingValue = readRootCssPxVariable(name);
  if (shouldRefreshBaseline || existingValue <= 0) {
    return writeRootCssPxVariable(name, measuredValue);
  }
  return existingValue;
}

function measureVisibleRowContributions(shouldRefreshBaseline: boolean): RowMeasurements {
  const keyboardZone = document.querySelector('.keyboard-zone');
  const letterRows = document.querySelector('.letter-keys-row');
  const keyboardGap = readGridRowGap(keyboardZone);
  const letterGap = readGridRowGap(letterRows);
  const measurements: RowMeasurements = {};
  const letterRowHeights: Array<{ rowKey: CompactRowKey; height: number }> = [];

  const functionRow = document.querySelector<HTMLElement>('[data-layout-row="rowF"]');
  if (functionRow) {
    const functionRowHeight = Math.max(
      functionRow.getBoundingClientRect().height,
      getMaxChildHeight(functionRow, '.key-btn'),
    );
    const baselineFunctionRowHeight = getBaselineRowHeight(
      '--keyboard-f-row-height',
      functionRowHeight,
      shouldRefreshBaseline,
    );
    measurements.rowF = baselineFunctionRowHeight + keyboardGap;
  }

  for (const rowKey of LETTER_ROW_KEYS) {
    const row = document.querySelector<HTMLElement>(`[data-layout-row="${rowKey}"]`);
    if (row) {
      const letterRowHeight = Math.max(
        row.getBoundingClientRect().height,
        getMaxChildHeight(row, '.key-btn'),
      );
      letterRowHeights.push({ rowKey, height: letterRowHeight });
    }
  }

  const averageLetterRowHeight = average(letterRowHeights.map((row) => row.height));
  if (averageLetterRowHeight) {
    const baselineLetterRowHeight = getBaselineRowHeight(
      '--keyboard-letter-row-height',
      averageLetterRowHeight,
      shouldRefreshBaseline,
    );
    for (const row of letterRowHeights) {
      measurements[row.rowKey] = baselineLetterRowHeight + letterGap;
    }
  }

  return measurements;
}

function estimateFullLayoutRowContributions(): RowMeasurements {
  const keyboardZone = document.querySelector<HTMLElement>('.keyboard-zone');
  const letterRows = document.querySelector<HTMLElement>('.letter-keys-row');
  const numRow = document.querySelector<HTMLElement>('.num-keys-row');
  if (!keyboardZone || !letterRows) {
    return {};
  }

  const keyboardGap = readGridRowGap(keyboardZone);
  const letterGap = readGridRowGap(letterRows);
  const visibleLetterRowHeights = LETTER_ROW_KEYS.map((rowKey) =>
    document.querySelector<HTMLElement>(`[data-layout-row="${rowKey}"]`),
  )
    .filter((row): row is HTMLElement => Boolean(row))
    .map((row) => Math.max(row.getBoundingClientRect().height, getMaxChildHeight(row, '.key-btn')));
  const averageVisibleLetterRowHeight = average(visibleLetterRowHeights);
  const functionRow = document.querySelector<HTMLElement>('[data-layout-row="rowF"]');
  const measuredFunctionRowHeight = functionRow
    ? Math.max(
        functionRow.getBoundingClientRect().height,
        getMaxChildHeight(functionRow, '.key-btn'),
      )
    : 0;

  if (
    averageVisibleLetterRowHeight &&
    visibleLetterRowHeights.length > 0 &&
    visibleLetterRowHeights.length < LETTER_ROW_KEYS.length
  ) {
    const letterRowHeight =
      (averageVisibleLetterRowHeight * visibleLetterRowHeights.length) / LETTER_ROW_KEYS.length;
    const functionRowHeight =
      measuredFunctionRowHeight > 0
        ? Math.min(measuredFunctionRowHeight, letterRowHeight * 0.9)
        : letterRowHeight * 0.9;
    const baselineFunctionRowHeight = writeRootCssPxVariable(
      '--keyboard-f-row-height',
      functionRowHeight,
    );
    const baselineLetterRowHeight = writeRootCssPxVariable(
      '--keyboard-letter-row-height',
      letterRowHeight,
    );

    return {
      rowF: baselineFunctionRowHeight + keyboardGap,
      row1: baselineLetterRowHeight + letterGap,
      row2: baselineLetterRowHeight + letterGap,
      row3: baselineLetterRowHeight + letterGap,
    };
  }

  const letterPaddingTop = parseCssPx(window.getComputedStyle(letterRows).paddingTop);
  const keyboardHeight = keyboardZone.getBoundingClientRect().height;
  const measuredNumRowHeight = numRow?.getBoundingClientRect().height ?? 0;
  const numRowHeight = measuredNumRowHeight > 0 ? measuredNumRowHeight : 40;
  const functionFlex = readRootCssNumberVariable('--keyboard-f-row-flex', 0.6);
  const panelFlex = readRootCssNumberVariable('--keyboard-panel-row-flex', 3);
  const totalFlex = functionFlex + panelFlex;
  if (keyboardHeight <= 0 || totalFlex <= 0) {
    return {};
  }

  const availableGridHeight = Math.max(0, keyboardHeight - keyboardGap);
  const functionRowHeight = availableGridHeight * (functionFlex / totalFlex);
  const panelHeight = availableGridHeight - functionRowHeight;
  const letterRowsHeight = Math.max(0, panelHeight - numRowHeight);
  const letterRowHeight = Math.max(
    0,
    (letterRowsHeight - letterPaddingTop - letterGap * (LETTER_ROW_KEYS.length - 1)) /
      LETTER_ROW_KEYS.length,
  );

  const baselineFunctionRowHeight = writeRootCssPxVariable(
    '--keyboard-f-row-height',
    functionRowHeight,
  );
  const baselineLetterRowHeight = writeRootCssPxVariable(
    '--keyboard-letter-row-height',
    letterRowHeight,
  );

  return {
    rowF: baselineFunctionRowHeight + keyboardGap,
    row1: baselineLetterRowHeight + letterGap,
    row2: baselineLetterRowHeight + letterGap,
    row3: baselineLetterRowHeight + letterGap,
  };
}

function readBaselineRowContributions(): RowMeasurements {
  const keyboardZone = document.querySelector('.keyboard-zone');
  const letterRows = document.querySelector('.letter-keys-row');
  const keyboardGap = readGridRowGap(keyboardZone);
  const letterGap = readGridRowGap(letterRows);
  const functionRowHeight = readRootCssPxVariable('--keyboard-f-row-height');
  const letterRowHeight = readRootCssPxVariable('--keyboard-letter-row-height');
  const measurements: RowMeasurements = {};

  if (functionRowHeight > 0) {
    measurements.rowF = functionRowHeight + keyboardGap;
  }

  if (letterRowHeight > 0) {
    measurements.row1 = letterRowHeight + letterGap;
    measurements.row2 = letterRowHeight + letterGap;
    measurements.row3 = letterRowHeight + letterGap;
  }

  return measurements;
}

function hasBaselineRowHeights(): boolean {
  return (
    readRootCssPxVariable('--keyboard-f-row-height') > 0 &&
    readRootCssPxVariable('--keyboard-letter-row-height') > 0
  );
}

function average(values: number[]): number | null {
  const finiteValues = values.filter((value) => Number.isFinite(value) && value > 0);
  if (finiteValues.length === 0) return null;
  return finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length;
}

function getFallbackContribution(rowKey: CompactRowKey, measurements: RowMeasurements): number {
  const measured = measurements[rowKey];
  if (measured && measured > 0) {
    return measured;
  }

  const averageLetterRow = average(LETTER_ROW_KEYS.map((key) => measurements[key] ?? 0));
  if (rowKey === 'rowF') {
    if (averageLetterRow) {
      return Math.max(72, averageLetterRow * 0.72);
    }
    return Math.max(72, Math.round(window.innerHeight * 0.16));
  }

  if (averageLetterRow) {
    return averageLetterRow;
  }

  const functionRow = measurements.rowF;
  if (functionRow && functionRow > 0) {
    return Math.max(80, functionRow * 1.3);
  }

  return Math.max(80, Math.round(window.innerHeight * 0.22));
}

function hasHiddenRowsChanged(previous: CompactHiddenRows, next: CompactHiddenRows): boolean {
  return COMPACT_ROW_KEYS.some((rowKey) => previous[rowKey] !== next[rowKey]);
}

function hasAnyHiddenRow(hideElements: HideElements): boolean {
  return COMPACT_ROW_KEYS.some((rowKey) => hideElements[rowKey]);
}

function getCompactWindowContentDelta(): number | null {
  const panel = document.querySelector<HTMLElement>('.tabbed-keyboard-panel');
  const app = document.querySelector<HTMLElement>('.app-container');
  if (!panel || !app) {
    return null;
  }

  const appBottomPadding = parseCssPx(window.getComputedStyle(app).paddingBottom);
  const panelBottom = panel.getBoundingClientRect().bottom;
  if (!Number.isFinite(panelBottom) || panelBottom <= 0) {
    return null;
  }

  const desiredWindowHeight = panelBottom + appBottomPadding;
  return Math.round(desiredWindowHeight - window.innerHeight);
}

function isCustomStyleReady(customStyle: string | undefined): boolean {
  return !customStyle || Boolean(document.getElementById(CUSTOM_STYLE_ID));
}

function toWindowHeightDelta(cssPixelDelta: number): number {
  return Math.round(cssPixelDelta);
}

export function useCompactWindowHeight(): void {
  const state = useAppState();
  const hideElements = state.settings?.hideElements;
  const customStyle = state.settings?.customStyle;
  const previousHiddenRowsRef = useRef<CompactHiddenRows | null>(null);
  const measurementsRef = useRef<RowMeasurements>({});
  const hasRunStartupCompactionRef = useRef(false);

  useEffect(() => {
    if (!hideElements) {
      return;
    }

    let frame = 0;
    const updateMeasurements = () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      frame = window.requestAnimationFrame(() => {
        const shouldRefreshBaseline = !hasAnyHiddenRow(hideElements);
        const nextMeasurements = shouldRefreshBaseline
          ? measureVisibleRowContributions(true)
          : hasBaselineRowHeights()
            ? readBaselineRowContributions()
            : estimateFullLayoutRowContributions();
        measurementsRef.current = {
          ...measurementsRef.current,
          ...nextMeasurements,
        };
      });
    };

    updateMeasurements();
    window.addEventListener('resize', updateMeasurements);

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateMeasurements);
    const keyboardZone = document.querySelector('.keyboard-zone');
    const letterRows = document.querySelector('.letter-keys-row');
    if (keyboardZone) resizeObserver?.observe(keyboardZone);
    if (letterRows) resizeObserver?.observe(letterRows);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('resize', updateMeasurements);
      resizeObserver?.disconnect();
    };
  }, [hideElements]);

  useLayoutEffect(() => {
    if (!hideElements) {
      return;
    }

    const nextHiddenRows = pickHiddenRows(hideElements);
    const previousHiddenRows = previousHiddenRowsRef.current;
    previousHiddenRowsRef.current = nextHiddenRows;

    if (!previousHiddenRows || !hasHiddenRowsChanged(previousHiddenRows, nextHiddenRows)) {
      return;
    }

    let delta = 0;
    for (const rowKey of COMPACT_ROW_KEYS) {
      if (previousHiddenRows[rowKey] === nextHiddenRows[rowKey]) {
        continue;
      }

      const contribution = getFallbackContribution(rowKey, measurementsRef.current);
      delta += nextHiddenRows[rowKey] ? -contribution : contribution;
    }

    if (Math.abs(delta) >= 1) {
      void window.electronAPI.resizeWindowByHeightDelta(toWindowHeightDelta(delta));
    }
  }, [hideElements]);

  useEffect(() => {
    if (!hideElements || hasRunStartupCompactionRef.current) {
      return;
    }

    if (!hasAnyHiddenRow(hideElements)) {
      hasRunStartupCompactionRef.current = true;
      return;
    }

    let frame = 0;
    let timer = 0;
    let attempts = 0;
    let pendingWaitAttempts = 0;
    let isCancelled = false;
    let pendingResizeInnerHeight: number | null = null;

    const scheduleAttempt = () => {
      timer = window.setTimeout(() => {
        frame = window.requestAnimationFrame(() => {
          if (isCancelled) {
            return;
          }

          if (pendingResizeInnerHeight !== null) {
            if (window.innerHeight === pendingResizeInnerHeight) {
              pendingWaitAttempts += 1;
              if (pendingWaitAttempts >= STARTUP_COMPACT_MAX_ATTEMPTS) {
                hasRunStartupCompactionRef.current = true;
                return;
              }

              scheduleAttempt();
              return;
            }

            pendingResizeInnerHeight = null;
            pendingWaitAttempts = 0;
          }

          if (!isCustomStyleReady(customStyle)) {
            scheduleAttempt();
            return;
          }

          const delta = getCompactWindowContentDelta();
          if (delta === null) {
            scheduleAttempt();
            return;
          }

          attempts += 1;
          if (delta <= -2) {
            pendingResizeInnerHeight = window.innerHeight;
            pendingWaitAttempts = 0;
            void Promise.resolve(
              window.electronAPI.resizeWindowByHeightDelta(toWindowHeightDelta(delta)),
            )
              .catch((): void => undefined)
              .then(() => {
                if (isCancelled) {
                  return;
                }
                if (attempts >= STARTUP_COMPACT_MAX_ATTEMPTS) {
                  hasRunStartupCompactionRef.current = true;
                  return;
                }
                scheduleAttempt();
              });
            return;
          }

          if (attempts >= STARTUP_COMPACT_MAX_ATTEMPTS) {
            hasRunStartupCompactionRef.current = true;
            return;
          }

          scheduleAttempt();
        });
      }, STARTUP_COMPACT_CHECK_DELAY_MS);
    };

    scheduleAttempt();

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [hideElements, customStyle]);
}
