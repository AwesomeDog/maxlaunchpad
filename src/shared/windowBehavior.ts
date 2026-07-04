import { DEFAULT_WINDOW_SIZE } from './constants';
import type { WindowSize } from './types';

export interface WorkArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowInteractionState {
  lockWindowCenter: boolean;
  isDragDropMode: boolean;
}

const MIN_WINDOW_SIZE: WindowSize = { width: 480, height: 120 };
const WINDOW_EDGE_MARGIN = 16;

function clamp(value: number, min: number, max: number): number {
  if (max < min) return max;
  return Math.min(Math.max(Math.round(value), min), max);
}

export function shouldAllowWindowMovement(state: WindowInteractionState): boolean {
  return state.isDragDropMode && !state.lockWindowCenter;
}

export function shouldAllowWindowResize(state: WindowInteractionState): boolean {
  void state;
  return true;
}

export function shouldPersistWindowSize(state: WindowInteractionState): boolean {
  void state;
  return true;
}

export function constrainWindowSizeToWorkArea(
  size: WindowSize,
  workArea: Pick<WorkArea, 'width' | 'height'>,
): WindowSize {
  const availableWidth = Math.max(1, workArea.width - WINDOW_EDGE_MARGIN * 2);
  const availableHeight = Math.max(1, workArea.height - WINDOW_EDGE_MARGIN * 2);
  const minWidth = Math.min(MIN_WINDOW_SIZE.width, availableWidth);
  const minHeight = Math.min(MIN_WINDOW_SIZE.height, availableHeight);

  return {
    width: clamp(size.width, minWidth, availableWidth),
    height: clamp(size.height, minHeight, availableHeight),
  };
}

function isFiniteWindowSize(size: WindowSize | null | undefined): size is WindowSize {
  return Boolean(
    size &&
      Number.isFinite(size.width) &&
      Number.isFinite(size.height) &&
      size.width > 0 &&
      size.height > 0,
  );
}

export function normalizeWindowSizeToWorkArea(
  size: WindowSize | null | undefined,
  workArea: Pick<WorkArea, 'width' | 'height'>,
  options: { resetWorkAreaFill?: boolean } = {},
): WindowSize {
  const constrainedSize = constrainWindowSizeToWorkArea(
    isFiniteWindowSize(size) ? size : DEFAULT_WINDOW_SIZE,
    workArea,
  );

  if (options.resetWorkAreaFill) {
    const maxSize = constrainWindowSizeToWorkArea(
      { width: Number.MAX_SAFE_INTEGER, height: Number.MAX_SAFE_INTEGER },
      workArea,
    );

    if (constrainedSize.width >= maxSize.width - 1) {
      return constrainWindowSizeToWorkArea(DEFAULT_WINDOW_SIZE, workArea);
    }
  }

  return constrainedSize;
}

export function getCenteredWindowBounds(size: WindowSize, workArea: WorkArea): WorkArea {
  const constrainedSize = normalizeWindowSizeToWorkArea(size, workArea);

  return {
    x: Math.round(workArea.x + (workArea.width - constrainedSize.width) / 2),
    y: Math.round(workArea.y + (workArea.height - constrainedSize.height) / 2),
    width: constrainedSize.width,
    height: constrainedSize.height,
  };
}

export function getCenteredWindowPosition(
  size: WindowSize,
  workArea: Pick<WorkArea, 'x' | 'y' | 'width' | 'height'>,
): Pick<WorkArea, 'x' | 'y'> {
  return {
    x: Math.round(workArea.x + (workArea.width - size.width) / 2),
    y: Math.round(workArea.y + (workArea.height - size.height) / 2),
  };
}
