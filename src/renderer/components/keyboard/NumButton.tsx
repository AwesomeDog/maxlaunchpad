import React, { ReactElement, useEffect, useRef, useState } from 'react';

interface NumButtonProps {
  keyId: string;
  label: string;
  isSelected: boolean;
  isHidden?: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onMoveTab?: (sourceTabId: string, targetTabId: string) => void;
}

export function NumButton({
  keyId,
  label,
  isSelected,
  isHidden,
  onClick,
  onContextMenu,
  onMoveTab,
}: NumButtonProps): ReactElement {
  const [isMoveSource, setIsMoveSource] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const cleanupMoveRef = useRef<() => void>(() => {});
  const suppressClickRef = useRef(false);

  useEffect(() => () => cleanupMoveRef.current(), []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || isHidden || !onMoveTab) return;
    const moveTab: NonNullable<typeof onMoveTab> = onMoveTab;

    const button = e.currentTarget;
    const sourceTabId = keyId;
    const startX = e.clientX;
    const startY = e.clientY;
    let moving = false;
    let currentTarget: HTMLElement | null = null;

    const clearTarget = () => {
      currentTarget?.classList.remove('tab-move-target');
      currentTarget = null;
    };

    const cleanup = () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerCancel);
      button.classList.remove('tab-move-source');
      document.body.classList.remove('tab-move-active');
      clearTarget();
      setIsMoveSource(false);
      cleanupMoveRef.current = () => {};
    };

    const findTarget = (clientX: number, clientY: number): HTMLElement | null => {
      const element = document.elementFromPoint(clientX, clientY);
      const candidate = element?.closest<HTMLElement>('.num-key-btn[data-tab-id]');
      if (!candidate || candidate.classList.contains('hidden')) return null;

      const targetTabId = candidate.dataset.tabId;
      if (!targetTabId || targetTabId === sourceTabId) return null;
      return candidate;
    };

    function handlePointerMove(event: PointerEvent) {
      if (!moving) {
        if (Math.hypot(event.clientX - startX, event.clientY - startY) > 8) {
          if (longPressTimerRef.current !== null) {
            window.clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        }
        return;
      }

      event.preventDefault();
      const nextTarget = findTarget(event.clientX, event.clientY);
      if (nextTarget !== currentTarget) {
        clearTarget();
        currentTarget = nextTarget;
        currentTarget?.classList.add('tab-move-target');
      }
    }

    function handlePointerUp(event: PointerEvent) {
      if (moving) {
        event.preventDefault();
        suppressClickRef.current = true;
        const target = findTarget(event.clientX, event.clientY);
        const targetTabId = target?.dataset.tabId;
        if (targetTabId) {
          moveTab(sourceTabId, targetTabId);
        }
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }
      cleanup();
    }

    function handlePointerCancel() {
      cleanup();
    }

    cleanupMoveRef.current = cleanup;
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerCancel);
    longPressTimerRef.current = window.setTimeout(() => {
      moving = true;
      suppressClickRef.current = true;
      button.classList.add('tab-move-source');
      document.body.classList.add('tab-move-active');
      setIsMoveSource(true);
    }, 200);
  };

  return (
    <button
      className={`key-btn num-key-btn ${isSelected ? 'selected' : ''} ${
        isMoveSource ? 'tab-move-source' : ''
      } ${isHidden ? 'hidden' : ''}`}
      data-tab-id={keyId}
      onClick={(e) => {
        if (suppressClickRef.current) {
          e.preventDefault();
          e.stopPropagation();
          suppressClickRef.current = false;
          return;
        }
        onClick();
      }}
      onContextMenu={onContextMenu}
      onPointerDown={handlePointerDown}
    >
      <span className="num-key-number">{keyId}</span>
      {label && (
        <span className="num-key-label" data-fit-text="tab">
          {label}
        </span>
      )}
    </button>
  );
}
