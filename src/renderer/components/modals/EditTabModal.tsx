import React, { useState } from 'react';

import { selectTabLabel } from '../../state/selectors';
import { useAppState, useDispatch } from '../../state/store';
import { Modal } from '../common/Modal';

interface EditTabModalProps {
  tabId: string;
}

export function EditTabModal({ tabId }: EditTabModalProps) {
  const state = useAppState();
  const dispatch = useDispatch();

  const currentLabel = selectTabLabel(state, tabId) ?? '';
  const [label, setLabel] = useState(currentLabel);

  const handleSave = () => {
    dispatch({ type: 'UPDATE_TAB', tabId, label: label.trim() });
    dispatch({ type: 'CLOSE_MODAL' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Modal title={`Edit Tab: ${tabId}`} width={400}>
      <div className="modal-row">
        <label>Tab Label</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tab Display Name"
          autoFocus
        />
      </div>

      <div className="modal-actions">
        <button onClick={handleSave}>Save</button>
        <button onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>Cancel</button>
      </div>
    </Modal>
  );
}
