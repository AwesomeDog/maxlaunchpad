import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import { APP_DESCRIPTION, APP_NAME } from '../../../shared/constants';
import { useDispatch } from '../../state/store';
import { Modal } from '../common/Modal';

interface AppInfo {
  name: string;
  version: string;
  gitCommitId: string;
}

export function AboutModal(): ReactElement {
  const dispatch = useDispatch();
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    window.electronAPI.getAppInfo().then(setAppInfo);
  }, []);

  return (
    <Modal title={`About ${APP_NAME}`} width={350}>
      {appInfo ? (
        <div>
          <div className="modal-row">
            <label>Application:</label>
            <span>{appInfo.name}</span>
          </div>

          <div className="modal-row">
            <label>Version:</label>
            <span>{appInfo.version}</span>
          </div>

          <div className="modal-row">
            <label>Git Commit:</label>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.9em',
                backgroundColor: 'var(--selected-background-color)',
                padding: '2px 6px',
                borderRadius: '3px',
              }}
            >
              {appInfo.gitCommitId}
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            fontSize: '1.2em',
            color: 'var(--text-color)',
          }}
        >
          Loading...
        </div>
      )}

      <div
        style={{
          margin: '20px 0',
          padding: '10px',
          backgroundColor: 'var(--selected-background-color)',
          borderRadius: '4px',
          fontSize: '0.9em',
          lineHeight: '1.5',
        }}
      >
        <p style={{ margin: 0 }}>{APP_DESCRIPTION}</p>
      </div>

      <div className="modal-actions">
        <button onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>Close</button>
      </div>
    </Modal>
  );
}
