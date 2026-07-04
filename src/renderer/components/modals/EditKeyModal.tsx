import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_FOLDER_ICON_URL } from '../../../shared/constants';
import type { InstalledApp, KeyConfig } from '../../../shared/types';
import { getBasename, getParentDirectory } from '../../../shared/utils';
import { IS_WINDOWS } from '../../platform';
import { useDispatch } from '../../state/store';
import { Modal } from '../common/Modal';

interface EditKeyModalProps {
  keyConfig: KeyConfig;
}

export function EditKeyModal({ keyConfig }: EditKeyModalProps) {
  const { t } = useTranslation();
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
    setWorkingDirectory(getParentDirectory(app.filePath));
    setDescription(app.label);
    setIconPath((current) => (current === DEFAULT_FOLDER_ICON_URL ? '' : current));
    setAppSearch('');
    setShowAppDropdown(false);
    setSelectedIndex(-1);
  };

  const applyPathSelection = async (selectedPath: string, kind: 'file' | 'folder' = 'file') => {
    if (IS_WINDOWS && selectedPath.toLowerCase().endsWith('.lnk')) {
      const shortcutInfo = await window.electronAPI.parseShortcut(selectedPath);
      if (shortcutInfo?.filePath) {
        setLabel(getBasename(shortcutInfo.filePath));
        setFilePath(shortcutInfo.filePath);
        setArgs(shortcutInfo.arguments ?? '');
        setWorkingDirectory(
          shortcutInfo.workingDirectory || getParentDirectory(shortcutInfo.filePath),
        );
        setDescription(shortcutInfo.description ?? selectedPath);
        setIconPath((current) => (current === DEFAULT_FOLDER_ICON_URL ? '' : current));
        return;
      }
    }

    setLabel(getBasename(selectedPath));
    setFilePath(selectedPath);
    setWorkingDirectory(kind === 'folder' ? selectedPath : getParentDirectory(selectedPath));
    setDescription(selectedPath);
    setIconPath((current) =>
      kind === 'folder'
        ? DEFAULT_FOLDER_ICON_URL
        : current === DEFAULT_FOLDER_ICON_URL
          ? ''
          : current,
    );
  };

  const handleSelectFile = async () => {
    const result = await window.electronAPI.selectFile(t('modals.editKey.selectFile'));
    if (!result.canceled && result.filePath) {
      await applyPathSelection(result.filePath);
    }
  };

  const handleSelectFolder = async () => {
    const result = await window.electronAPI.selectFolder(t('modals.editKey.selectFolder'));
    if (!result.canceled && result.filePath) {
      await applyPathSelection(result.filePath, 'folder');
    }
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
    <Modal
      title={t('modals.editKey.titleWithKey', {
        tabId: keyConfig.tabId,
        keyId: keyConfig.id,
      })}
      width={620}
    >
      <div className="modal-row modal-row-quick-select">
        <label>{t('modals.editKey.quickSelect')}</label>
        <div className="modal-field app-picker-field">
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
            placeholder={t('modals.editKey.quickSelectPlaceholder')}
          />
          {showAppDropdown && filteredApps.length > 0 && (
            <div
              className="dropdown-menu app-picker-dropdown"
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

      <div className="context-menu-separator" style={{ margin: '16px 0' }} />

      <div className="modal-row modal-row-file-actions">
        <span className="modal-row-label-spacer" aria-hidden="true" />
        <div className="file-picker-actions">
          <button type="button" onClick={() => void handleSelectFile()}>
            {t('modals.editKey.selectFile')}
          </button>
          <button type="button" onClick={() => void handleSelectFolder()}>
            {t('modals.editKey.selectFolder')}
          </button>
        </div>
      </div>

      <div className="modal-row">
        <label>{t('modals.editKey.labelRequired')}</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t('modals.editKey.labelPlaceholder')}
          autoFocus
        />
      </div>

      <div className="modal-row modal-row-path">
        <label>{t('modals.editKey.filePathRequired')}</label>
        <div className="path-picker">
          <input
            className="path-picker-input"
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder={t('modals.editKey.filePathPlaceholder')}
          />
        </div>
      </div>

      <div className="modal-row">
        <label>{t('modals.editKey.arguments')}</label>
        <input
          type="text"
          value={args}
          onChange={(e) => setArgs(e.target.value)}
          placeholder={t('modals.editKey.argumentsPlaceholder')}
        />
      </div>

      <div className="modal-row">
        <label>{t('modals.editKey.workingDirectory')}</label>
        <input
          type="text"
          value={workingDirectory}
          onChange={(e) => setWorkingDirectory(e.target.value)}
          placeholder={t('modals.editKey.workingDirectoryPlaceholder')}
        />
      </div>

      <div className="modal-row">
        <label>{t('modals.editKey.description')}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('modals.editKey.descriptionPlaceholder')}
        />
      </div>

      {IS_WINDOWS && (
        <div className="modal-row">
          <label>{t('modals.editKey.runAsAdmin')}</label>
          <input
            type="checkbox"
            checked={runAsAdmin}
            onChange={(e) => setRunAsAdmin(e.target.checked)}
          />
          <span style={{ opacity: 0.5, fontSize: '12px', marginLeft: '8px' }}>
            {t('modals.editKey.runAsAdminWarning')}
          </span>
        </div>
      )}

      <div className="modal-row">
        <label>{t('modals.editKey.iconPath')}</label>
        <div className="path-picker icon-path-picker">
          <input
            className="path-picker-input"
            type="text"
            value={iconPath}
            onChange={(e) => setIconPath(e.target.value)}
            placeholder={t('modals.editKey.iconPathPlaceholder')}
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
            {t('modals.editKey.browse')}
          </button>
        </div>
      </div>

      <div className="modal-actions">
        <button onClick={handleSave} disabled={!label.trim() || !filePath.trim()}>
          {t('modals.common.save')}
        </button>
        <button onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>
          {t('modals.common.cancel')}
        </button>
      </div>
    </Modal>
  );
}
