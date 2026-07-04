import {
  constrainWindowSizeToWorkArea,
  getCenteredWindowBounds,
  getCenteredWindowPosition,
  normalizeWindowSizeToWorkArea,
  shouldAllowWindowMovement,
  shouldAllowWindowResize,
  shouldPersistWindowSize,
} from '../windowBehavior';

describe('windowBehavior', () => {
  it('keeps lock-center authoritative over drag-drop mode for movement only', () => {
    const lockedDragDrop = { lockWindowCenter: true, isDragDropMode: true };

    expect(shouldAllowWindowMovement(lockedDragDrop)).toBe(false);
    expect(shouldAllowWindowResize(lockedDragDrop)).toBe(true);
    expect(shouldPersistWindowSize(lockedDragDrop)).toBe(true);
  });

  it('requires drag-drop mode before allowing window movement', () => {
    const unlockedNormal = { lockWindowCenter: false, isDragDropMode: false };

    expect(shouldAllowWindowMovement(unlockedNormal)).toBe(false);
    expect(shouldAllowWindowResize(unlockedNormal)).toBe(true);
    expect(shouldPersistWindowSize(unlockedNormal)).toBe(true);
  });

  it('allows movement, resizing, and size persistence when center lock is off and drag-drop is on', () => {
    const unlockedDragDrop = { lockWindowCenter: false, isDragDropMode: true };

    expect(shouldAllowWindowMovement(unlockedDragDrop)).toBe(true);
    expect(shouldAllowWindowResize(unlockedDragDrop)).toBe(true);
    expect(shouldPersistWindowSize(unlockedDragDrop)).toBe(true);
  });

  it('clamps oversized saved windows inside the current work area with margins', () => {
    expect(
      constrainWindowSizeToWorkArea({ width: 4000, height: 2000 }, { width: 1280, height: 720 }),
    ).toEqual({ width: 1248, height: 688 });
  });

  it('allows compact hidden-row windows to shrink below the old launcher height', () => {
    expect(
      constrainWindowSizeToWorkArea({ width: 300, height: 80 }, { width: 1280, height: 720 }),
    ).toEqual({ width: 480, height: 120 });
  });

  it('resets work-area-filled locked sizes to the default window size', () => {
    expect(
      normalizeWindowSizeToWorkArea(
        { width: 2048, height: 896 },
        { width: 2048, height: 896 },
        { resetWorkAreaFill: true },
      ),
    ).toEqual({ width: 1000, height: 600 });
  });

  it('keeps non-full user sizes when normalizing locked windows', () => {
    expect(
      normalizeWindowSizeToWorkArea(
        { width: 1200, height: 720 },
        { width: 2048, height: 896 },
        { resetWorkAreaFill: true },
      ),
    ).toEqual({ width: 1200, height: 720 });
  });

  it('falls back to the default window size for invalid dimensions', () => {
    expect(
      normalizeWindowSizeToWorkArea(
        { width: Number.NaN, height: 600 },
        { width: 2048, height: 896 },
      ),
    ).toEqual({ width: 1000, height: 600 });
  });

  it('centers using the current window size rather than stale cached positions', () => {
    const workArea = { x: 100, y: 50, width: 1200, height: 800 };

    expect(getCenteredWindowBounds({ width: 1000, height: 600 }, workArea)).toEqual({
      x: 200,
      y: 150,
      width: 1000,
      height: 600,
    });
    expect(getCenteredWindowBounds({ width: 600, height: 400 }, workArea)).toEqual({
      x: 400,
      y: 250,
      width: 600,
      height: 400,
    });
  });

  it('centers an existing window by position without changing its size', () => {
    const workArea = { x: 0, y: 0, width: 1920, height: 1080 };

    expect(getCenteredWindowPosition({ width: 900, height: 600 }, workArea)).toEqual({
      x: 510,
      y: 240,
    });
    expect(getCenteredWindowPosition({ width: 2400, height: 600 }, workArea)).toEqual({
      x: -240,
      y: 240,
    });
  });
});
