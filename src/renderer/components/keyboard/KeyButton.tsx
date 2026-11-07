import React, { DragEvent, ReactElement, useEffect, useState } from 'react';

import type { KeyConfig } from '../../../shared/types';
import { getBasename } from '../../../shared/utils';
import { useIcon } from '../../hooks/useIcon';
import { IS_WINDOWS } from '../../platform';
import { KEY_DRAG_MIME, parseKeyDragPayload, serializeKeyDragPayload } from '../../state/keyDrag';
import { useAppState, useDispatch } from '../../state/store';

interface KeyButtonProps {
  keyId: string;
  tabId: string;
  keyConfig: KeyConfig | undefined;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  isHidden?: boolean;
  hideIcon?: boolean;
  hideText?: boolean;
}

/** Ctrl (Windows/Linux) or Cmd (macOS) held on drop means "copy, keep the original" */
function isCopyModifier(e: DragEvent<HTMLButtonElement>): boolean {
  return e.ctrlKey || e.metaKey;
}

function readDragData(dataTransfer: DataTransfer | null, type: string): string | null {
  try {
    return dataTransfer?.getData(type) ?? null;
  } catch {
    return null;
  }
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
}: KeyButtonProps): ReactElement {
  const state = useAppState();
  const dispatch = useDispatch();
  const [isDragOver, setIsDragOver] = useState(false);

  const filePath = keyConfig?.filePath;
  const label = keyConfig?.label || '';
  const description = keyConfig?.description || '';
  const tooltip = description ? `${label} - ${description}` : label;

  const icon = useIcon(keyConfig);

  // Only configured keys can be dragged, and only while drag & drop mode is on
  const canDrag = state.ui.isDragDropMode && !!filePath;

  const draggedKey = state.ui.dragKey;
  // A key drag is in progress somewhere on the keyboard (maybe on another tab)
  const isKeyDragActive = draggedKey !== null;
  const isDragging = !!draggedKey && draggedKey.tabId === tabId && draggedKey.keyId === keyId;

  const className = [
    'key-btn',
    isDragOver ? 'drag-over' : '',
    isDragging ? 'dragging' : '',
    isHidden ? 'hidden' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // The same button element is reused when the tab switches, so a local drop-target
  // highlight would otherwise follow the key position onto every other tab
  useEffect(() => {
    setIsDragOver(false);
  }, [tabId, keyId, isKeyDragActive]);

  const handleDragStart = (e: DragEvent<HTMLButtonElement>) => {
    if (!canDrag) {
      e.preventDefault();
      return;
    }
    // Remember the dragged key in the store so every key can react to it
    dispatch({ type: 'SET_KEY_DRAG', key: { tabId, keyId } });
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copyMove';
      // Payload is only readable on drop, see keyDrag.ts
      e.dataTransfer.setData(KEY_DRAG_MIME, serializeKeyDragPayload({ tabId, keyId }));
    }
  };

  const handleDragEnd = () => {
    dispatch({ type: 'SET_KEY_DRAG', key: null });
    setIsDragOver(false);
  };

  const handleDragOver = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (e.dataTransfer) {
      // Internal key drag: move, or copy when the copy modifier is held.
      // File manager drag: always copy the file onto this key.
      e.dataTransfer.dropEffect = isKeyDragActive && !isCopyModifier(e) ? 'move' : 'copy';
    }
    // A key is not a drop target for itself: dropping there does nothing
    setIsDragOver(!isDragging);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    // The transferred payload identifies the source; store state only drives drag feedback.
    const keyDragSource = parseKeyDragPayload(readDragData(e.dataTransfer, KEY_DRAG_MIME));
    dispatch({ type: 'SET_KEY_DRAG', key: null });
    if (keyDragSource) {
      dispatch({
        type: 'MOVE_KEY',
        from: keyDragSource,
        to: { tabId, keyId },
        copy: isCopyModifier(e),
      });
      return;
    }

    // External drag: a file dropped from the file manager configures this key
    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    const droppedPath = file.path;

    if (!droppedPath) return;

    if (IS_WINDOWS && droppedPath.toLowerCase().endsWith('.lnk')) {
      const shortcutInfo = await window.electronAPI.parseShortcut(droppedPath);
      if (shortcutInfo && shortcutInfo.filePath) {
        const newKeyConfig: KeyConfig = {
          tabId,
          id: keyId,
          label: getBasename(shortcutInfo.filePath),
          filePath: shortcutInfo.filePath,
          arguments: shortcutInfo.arguments,
          workingDirectory: shortcutInfo.workingDirectory,
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
      description: droppedPath,
    };

    dispatch({ type: 'UPDATE_KEY', key: newKeyConfig });
  };

  return (
    <button
      className={className}
      title={tooltip}
      draggable={canDrag}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className="key-btn-key">{keyId}</span>
      {filePath && (
        <>
          {icon && !hideIcon && <img className="key-btn-icon" src={icon} alt="" />}
          {!hideText && <span className="key-btn-text">{label}</span>}
        </>
      )}
    </button>
  );
}
