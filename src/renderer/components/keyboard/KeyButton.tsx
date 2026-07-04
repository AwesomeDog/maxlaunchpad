import React, { DragEvent, ReactElement, useEffect, useRef, useState } from 'react';

import type { KeyConfig } from '../../../shared/types';
import { getBasename, getParentDirectory } from '../../../shared/utils';
import { useIcon } from '../../hooks/useIcon';
import { IS_WINDOWS } from '../../platform';
import type { KeyMoveLocation } from '../../state/store';
import { useDispatch } from '../../state/store';

interface KeyButtonProps {
  keyId: string;
  tabId: string;
  keyConfig: KeyConfig | undefined;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  isHidden?: boolean;
  hideIcon?: boolean;
  hideText?: boolean;
  onMoveKey?: (source: KeyMoveLocation, target: KeyMoveLocation) => void;
  onEdit?: () => void;
}

export function KeyButton({
  keyId,
  tabId,
  keyConfig,
  onClick,
  onContextMenu,
  isHidden,
  hideIcon,
  hideText,
  onMoveKey,
  onEdit,
}: KeyButtonProps): ReactElement {
  const dispatch = useDispatch();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMoveSource, setIsMoveSource] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const clickTimerRef = useRef<number | null>(null);
  const cleanupMoveRef = useRef<() => void>(() => {});
  const suppressClickRef = useRef(false);

  const filePath = keyConfig?.filePath;
  const label = keyConfig?.label || '';
  const description = keyConfig?.description || '';
  const tooltip = description ? `${label} - ${description}` : label;

  const icon = useIcon(keyConfig);
  const shouldHideIcon = Boolean(hideIcon);
  const shouldHideText = Boolean(hideText);

  const className = [
    'key-btn',
    isDragOver ? 'drag-over' : '',
    isMoveSource ? 'move-source' : '',
    isHidden ? 'hidden' : '',
    shouldHideIcon ? 'icons-hidden' : '',
    shouldHideText ? 'text-hidden' : '',
    shouldHideIcon && !shouldHideText ? 'text-only' : '',
    shouldHideText && !shouldHideIcon ? 'icon-only' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const clearPendingClick = () => {
    if (clickTimerRef.current !== null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
  };

  useEffect(
    () => () => {
      cleanupMoveRef.current();
      clearPendingClick();
    },
    [],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || !keyConfig?.filePath || isHidden || !onMoveKey) return;
    const moveKey: NonNullable<typeof onMoveKey> = onMoveKey;

    const button = e.currentTarget;
    const source: KeyMoveLocation = { tabId, keyId };
    const startX = e.clientX;
    const startY = e.clientY;
    let moving = false;
    let currentTarget: HTMLElement | null = null;

    const clearTarget = () => {
      currentTarget?.classList.remove('move-target');
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
      button.classList.remove('move-source');
      document.body.classList.remove('key-move-active');
      clearTarget();
      setIsMoveSource(false);
      cleanupMoveRef.current = () => {};
    };

    const findTarget = (clientX: number, clientY: number): HTMLElement | null => {
      const element = document.elementFromPoint(clientX, clientY);
      const candidate = element?.closest<HTMLElement>('.key-btn[data-tab-id][data-key-id]');
      if (!candidate || candidate.classList.contains('hidden')) return null;

      const targetTabId = candidate.dataset.tabId;
      const targetKeyId = candidate.dataset.keyId;
      if (!targetTabId || !targetKeyId) return null;
      if (targetTabId === source.tabId && targetKeyId === source.keyId) return null;
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
        currentTarget?.classList.add('move-target');
      }
    }

    function handlePointerUp(event: PointerEvent) {
      if (moving) {
        event.preventDefault();
        suppressClickRef.current = true;
        const target = findTarget(event.clientX, event.clientY);
        const targetTabId = target?.dataset.tabId;
        const targetKeyId = target?.dataset.keyId;
        if (targetTabId && targetKeyId) {
          moveKey(source, { tabId: targetTabId, keyId: targetKeyId });
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
      button.classList.add('move-source');
      document.body.classList.add('key-move-active');
      setIsMoveSource(true);
    }, 200);
  };

  const handleDragOver = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    const droppedPath = file.path;

    if (!droppedPath) return;

    if (IS_WINDOWS && droppedPath.toLowerCase().endsWith('.lnk')) {
      const shortcutInfo = await window.electronAPI.parseShortcut(droppedPath);
      if (shortcutInfo && shortcutInfo.filePath) {
        const workingDirectory =
          shortcutInfo.workingDirectory || getParentDirectory(shortcutInfo.filePath);
        const newKeyConfig: KeyConfig = {
          tabId,
          id: keyId,
          label: getBasename(shortcutInfo.filePath),
          filePath: shortcutInfo.filePath,
          arguments: shortcutInfo.arguments,
          workingDirectory,
          description: shortcutInfo.description, // Original .lnk path
        };
        dispatch({ type: 'UPDATE_KEY', key: newKeyConfig });
        return;
      }
      // If parsing failed, fall through to use .lnk path directly
    }

    const newKeyConfig: KeyConfig = {
      tabId,
      id: keyId,
      label: getBasename(droppedPath),
      filePath: droppedPath,
      workingDirectory: getParentDirectory(droppedPath),
      description: droppedPath,
    };

    dispatch({ type: 'UPDATE_KEY', key: newKeyConfig });
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
      clearPendingClick();
      return;
    }

    if (e.detail > 1) {
      clearPendingClick();
      return;
    }

    clearPendingClick();
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      onClick();
    }, 220);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    clearPendingClick();
    onEdit?.();
  };

  return (
    <button
      className={className}
      title={tooltip}
      data-key-id={keyId}
      data-tab-id={tabId}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={onContextMenu}
      onPointerDown={handlePointerDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className="key-btn-key">{keyId}</span>
      {filePath && (
        <>
          {icon && (
            <span className={`key-btn-icon-slot${shouldHideIcon ? ' content-hidden' : ''}`}>
              <img className="key-btn-icon" src={icon} alt="" />
            </span>
          )}
          {label && (
            <span className={`key-btn-text-slot${shouldHideText ? ' content-hidden' : ''}`}>
              <span className="key-btn-text" data-fit-text="key">
                {label}
              </span>
            </span>
          )}
        </>
      )}
    </button>
  );
}
