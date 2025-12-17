import React, { ReactElement } from 'react';

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
  return (
    <button
      className={`key-btn num-key-btn ${isSelected ? 'selected' : ''} ${isHidden ? 'hidden' : ''}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <span className="key-btn-key">{keyId}</span>
      {label && <span className="key-btn-text">{label}</span>}
    </button>
  );
}
