import React, { DragEvent, ReactElement, useState } from 'react';

import type { KeyConfig } from '../../../shared/types';
import { getBasename } from '../../../shared/utils';
import { useIcon } from '../../hooks/useIcon';
import { IS_WINDOWS } from '../../platform';
import { useDispatch } from '../../state/store';

interface KeyButtonProps {
  keyId: string;
  tabId: string;
  keyConfig: KeyConfig | undefined;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  isHidden?: boolean;
}

export function KeyButton({
  keyId,
  tabId,
  keyConfig,
  onClick,
  onContextMenu,
  isHidden,
}: KeyButtonProps): ReactElement {
  const dispatch = useDispatch();
  const [isDragOver, setIsDragOver] = useState(false);

  const filePath = keyConfig?.filePath;
  const label = keyConfig?.label || '';
  const description = keyConfig?.description || '';
  const tooltip = description ? `${label} - ${description}` : label;

  const icon = useIcon(keyConfig);

  const className = ['key-btn', isDragOver ? 'drag-over' : '', isHidden ? 'hidden' : '']
    .filter(Boolean)
    .join(' ');

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
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className="key-btn-key">{keyId}</span>
      {filePath && (
        <>
          {icon && <img className="key-btn-icon" src={icon} alt="" />}
          <span className="key-btn-text">{label}</span>
        </>
      )}
    </button>
  );
}
