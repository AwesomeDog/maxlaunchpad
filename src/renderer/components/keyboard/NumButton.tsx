import React, { ReactElement } from 'react';

import { useTabHoverSwitch } from '../../hooks/useTabHoverSwitch';

interface NumButtonProps {
  keyId: string;
  label: string;
  isSelected: boolean;
  isHidden?: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function NumButton({
  keyId,
  label,
  isSelected,
  isHidden,
  onClick,
  onContextMenu,
}: NumButtonProps): ReactElement {
  // While a key is being dragged, resting on a tab number switches to that tab
  const { isDragTarget, handleDragEnter, handleDragOver, handleDragLeave, handleDrop } =
    useTabHoverSwitch(keyId);

  const className = [
    'key-btn num-key-btn',
    isSelected ? 'selected' : '',
    isDragTarget ? 'drag-target' : '',
    isHidden ? 'hidden' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={className}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className="key-btn-key">{keyId}</span>
      {label && <span className="key-btn-text">{label}</span>}
    </button>
  );
}
