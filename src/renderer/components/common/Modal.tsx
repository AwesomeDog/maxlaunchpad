import React, { ReactNode } from 'react';

import { useDispatch } from '../../state/store';

interface ModalProps {
  title: string;
  onClose?: () => void;
  children: ReactNode;
  width?: number;
}

export function Modal({ title, onClose, children, width = 400 }: ModalProps) {
  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch({ type: 'CLOSE_MODAL' });
    onClose?.();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal-content"
        style={width !== 400 ? { width: `${width}px` } : undefined}
        role="dialog"
        aria-modal="true"
      >
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
