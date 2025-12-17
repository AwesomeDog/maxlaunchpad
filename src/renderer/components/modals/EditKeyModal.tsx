import React, { useEffect, useMemo, useRef, useState } from 'react';

import type { InstalledApp, KeyConfig } from '../../../shared/types';
import { IS_WINDOWS } from '../../platform';
import { useDispatch } from '../../state/store';
import { Modal } from '../common/Modal';

interface EditKeyModalProps {
  keyConfig: KeyConfig;
}

export function EditKeyModal({ keyConfig }: EditKeyModalProps) {
  const dispatch = useDispatch();

  const [label, setLabel] = useState(keyConfig.label);
  const [filePath, setFilePath] = useState(keyConfig.filePath);
  const [args, setArgs] = useState(keyConfig.arguments ?? '');
  const [workingDirectory, setWorkingDirectory] = useState(keyConfig.workingDirectory ?? '');
  const [description, setDescription] = useState(keyConfig.description ?? '');
  const [runAsAdmin, setRunAsAdmin] = useState(keyConfig.runAsAdmin ?? false);
  const [iconPath, setIconPath] = useState(keyConfig.iconPath ?? '');

  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [appSearch, setAppSearch] = useState('');
  const [showAppDropdown, setShowAppDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const selectedItemRef = useRef<HTMLDivElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.electronAPI.listInstalledApps().then(({ apps: loadedApps }) => {
      setApps(loadedApps);
    });
  }, []);

  // Filter apps based on search (show all when empty, filter when typing)
  const filteredApps = useMemo(() => {
    const search = appSearch.trim().toLowerCase();
    return search ? apps.filter((app) => app.label.toLowerCase().includes(search)) : apps;
  }, [apps, appSearch]);

  // Reset selected index when filtered apps change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [filteredApps]);

  // Scroll selected item into view
  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showAppDropdown || filteredApps.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredApps.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredApps.length) % filteredApps.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredApps.length) {
          handleSelectApp(filteredApps[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowAppDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectApp = (app: InstalledApp) => {
    setLabel(app.label);
    setFilePath(app.filePath);
    setDescription(app.label);
    setAppSearch('');
    setShowAppDropdown(false);
    setSelectedIndex(-1);
  };

  const handleSave = () => {
    const updatedKey: KeyConfig = {
      tabId: keyConfig.tabId,
      id: keyConfig.id,
      label: label.trim(),
      filePath: filePath.trim(),
    };

    // Only include optional fields if they have values
    if (args.trim()) updatedKey.arguments = args.trim();
    if (workingDirectory.trim()) updatedKey.workingDirectory = workingDirectory.trim();
    if (description.trim()) updatedKey.description = description.trim();
    if (IS_WINDOWS && runAsAdmin) updatedKey.runAsAdmin = true;
    if (iconPath.trim()) updatedKey.iconPath = iconPath.trim();

    dispatch({ type: 'UPDATE_KEY', key: updatedKey });
    dispatch({ type: 'CLOSE_MODAL' });
  };

  return (
    <Modal title={`Edit Key: ${keyConfig.tabId} / ${keyConfig.id}`} width={550}>
      <div
        style={{
          padding: '12px',
          backgroundColor: 'var(--selected-background-color)',
          borderRadius: '6px',
          opacity: 0.9,
        }}
      >
        <div className="modal-row" style={{ marginBottom: 0 }}>
          <label>Quick Select</label>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <input
              type="text"
              value={appSearch}
              onChange={(e) => {
                setAppSearch(e.target.value);
                setShowAppDropdown(true);
              }}
              onFocus={() => setShowAppDropdown(true)}
              onBlur={() => setTimeout(() => setShowAppDropdown(false), 200)}
              onKeyDown={handleKeyDown}
              placeholder="(Optional) Search to auto-fill below..."
              style={{ width: '100%' }}
            />
            {showAppDropdown && filteredApps.length > 0 && (
              <div
                className="dropdown-menu"
                style={{
                  left: 0,
                  right: 0,
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {filteredApps.map((app, index) => (
                  <div
                    key={`${app.filePath}-${index}`}
                    ref={index === selectedIndex ? selectedItemRef : null}
                    className={`dropdown-item${index === selectedIndex ? ' selected' : ''}`}
                    onMouseDown={() => handleSelectApp(app)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {app.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="context-menu-separator" style={{ margin: '16px 0' }} />

      <div className="modal-row">
        <label>Label *</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Display name"
          autoFocus
        />
      </div>

      <div className="modal-row">
        <label>File Path *</label>
        <input
          type="text"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="Program path"
        />
      </div>

      <div className="modal-row">
        <label>Arguments</label>
        <input
          type="text"
          value={args}
          onChange={(e) => setArgs(e.target.value)}
          placeholder="Commandline arguments"
        />
      </div>

      <div className="modal-row">
        <label>Working Directory</label>
        <input
          type="text"
          value={workingDirectory}
          onChange={(e) => setWorkingDirectory(e.target.value)}
          placeholder="Working directory"
        />
      </div>

      <div className="modal-row">
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tooltip text"
        />
      </div>

      {IS_WINDOWS && (
        <div className="modal-row">
          <label>Run as Admin</label>
          <input
            type="checkbox"
            checked={runAsAdmin}
            onChange={(e) => setRunAsAdmin(e.target.checked)}
          />
          <span style={{ opacity: 0.5, fontSize: '12px', marginLeft: '8px' }}>
            Only enable if you understand the consequences
          </span>
        </div>
      )}

      <div className="modal-row">
        <label>Icon Path</label>
        <div style={{ display: 'flex', gap: '8px', flexGrow: 1 }}>
          <input
            type="text"
            value={iconPath}
            onChange={(e) => setIconPath(e.target.value)}
            placeholder="Custom icon path (file/url)"
            style={{ flexGrow: 1 }}
          />
          <input
            ref={iconInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setIconPath(file.path);
              }
              e.target.value = '';
            }}
          />
          <button type="button" onClick={() => iconInputRef.current?.click()}>
            Browse
          </button>
        </div>
      </div>

      <div className="modal-actions">
        <button onClick={handleSave} disabled={!label.trim() || !filePath.trim()}>
          Save
        </button>
        <button onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>Cancel</button>
      </div>
    </Modal>
  );
}
