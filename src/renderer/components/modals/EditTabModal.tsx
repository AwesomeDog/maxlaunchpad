import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { selectTabLabel } from '../../state/selectors';
import { useAppState, useDispatch } from '../../state/store';
import { Modal } from '../common/Modal';

interface EditTabModalProps {
  tabId: string;
}

export function EditTabModal({ tabId }: EditTabModalProps) {
  const { t } = useTranslation();
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
    <Modal title={t('modals.editTab.titleWithTab', { tabId })} width={400}>
      <div className="modal-row">
        <label>{t('modals.editTab.tabLabel')}</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('modals.editTab.tabDisplayName')}
          autoFocus
        />
      </div>

      <div className="modal-actions">
        <button onClick={handleSave}>{t('modals.common.save')}</button>
        <button onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>
          {t('modals.common.cancel')}
        </button>
      </div>
    </Modal>
  );
}
