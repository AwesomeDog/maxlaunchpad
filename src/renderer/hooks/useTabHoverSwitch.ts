import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useAppState, useDispatch } from '../state/store';

/** How long the pointer has to rest on a tab number before the tab switches, in ms */
export const TAB_HOVER_SWITCH_DELAY_MS = 600;

/**
 * Lets a tab number button act as a "switch to this tab" target while a key is
 * being dragged: holding the dragged key over the number for a moment switches
 * the tab, so a key can be dragged to a slot on another tab in one gesture.
 *
 * Only reacts to internal key drags (see `ui.dragKey`); files dragged in from the
 * file manager are handled by the keys themselves.
 */
export function useTabHoverSwitch(tabId: string) {
  const state = useAppState();
  const dispatch = useDispatch();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDragTarget, setIsDragTarget] = useState(false);

  const isKeyDragActive = state.ui.dragKey !== null;
  const isActiveTab = state.ui.activeTabId === tabId;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Drop any pending switch as soon as the drag ends (e.g. cancelled with Esc)
  useEffect(() => {
    if (!isKeyDragActive) {
      clearTimer();
      setIsDragTarget(false);
    }
  }, [isKeyDragActive, clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      if (!isKeyDragActive) return;
      e.preventDefault();
      if (isActiveTab) return;

      setIsDragTarget(true);
      clearTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setIsDragTarget(false);
        dispatch({ type: 'SET_ACTIVE_TAB', tabId });
      }, TAB_HOVER_SWITCH_DELAY_MS);
    },
    [clearTimer, dispatch, isActiveTab, isKeyDragActive, tabId],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      if (!isKeyDragActive) return;
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
    },
    [isKeyDragActive],
  );

  const handleDragLeave = useCallback(() => {
    clearTimer();
    setIsDragTarget(false);
  }, [clearTimer]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      if (!isKeyDragActive) return;
      // Tab numbers only switch the view; releasing here cancels the drag
      e.preventDefault();
      clearTimer();
      setIsDragTarget(false);
    },
    [clearTimer, isKeyDragActive],
  );

  return { isDragTarget, handleDragEnter, handleDragOver, handleDragLeave, handleDrop };
}
