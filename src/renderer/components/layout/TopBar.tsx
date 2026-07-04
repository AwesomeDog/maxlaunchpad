import type { ReactElement } from 'react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { APP_NAME, DOCUMENTATION_URL } from '../../../shared/constants';
import type { HideElements, KeyboardProfile } from '../../../shared/types';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useCloseOnWindowHide } from '../../hooks/useCloseOnWindowHide';
import { IS_MAC, IS_WINDOWS } from '../../platform';
import { useAppState, useDispatch } from '../../state/store';
import { SearchBox } from './SearchBox';

type MenuId = 'file' | 'view' | 'tools' | 'settings' | 'help' | null;

export function TopBar(): ReactElement {
  const { t } = useTranslation();
  const state = useAppState();
  const dispatch = useDispatch();
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [hideSubmenuOpen, setHideSubmenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // After loading, settings is guaranteed to be non-null
  const settings = state.settings!;
  const hideElements = settings.hideElements;

  // Determine if menu should be visible
  const isMenuHidden = hideElements.menu;
  const shouldShowMenu = !isMenuHidden || state.ui.isAltPressed || openMenu !== null;

  const closeMenu = useCallback(() => {
    setOpenMenu(null);
    setHideSubmenuOpen(false);
  }, []);
  useClickOutside(menuRef, closeMenu);
  useCloseOnWindowHide(closeMenu);

  const handleMenuClick = (menuId: MenuId) => {
    setOpenMenu(openMenu === menuId ? null : menuId);
  };

  const handleMenuHover = (menuId: MenuId) => {
    if (openMenu !== null) {
      setOpenMenu(menuId);
    }
  };

  const flushCurrentConfig = async () => {
    if (!state.settings || !state.profile) {
      return;
    }

    try {
      await window.electronAPI.saveSettings(state.settings);
      await window.electronAPI.saveProfile(state.profile, state.settings.activeProfilePath);
      dispatch({ type: 'SET_CONFIG_DIRTY', dirty: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: t('errors.failedToSaveConfiguration') });
      throw error;
    }
  };

  const handleNew = async () => {
    closeMenu();
    if (!state.settings) {
      return;
    }

    try {
      await flushCurrentConfig();

      const result = await window.electronAPI.saveAsDialog();
      if (result.canceled || !result.filePath) {
        return;
      }

      const newProfile: KeyboardProfile = { tabs: [], keys: [] };
      const newSettings = {
        ...state.settings,
        activeProfilePath: result.filePath,
      };

      await window.electronAPI.saveSettings(newSettings);
      await window.electronAPI.saveProfile(newProfile, result.filePath);

      const { profile } = await window.electronAPI.loadConfig();
      dispatch({
        type: 'SET_CONFIG',
        settings: newSettings,
        profile,
      });
    } catch {
      dispatch({ type: 'SET_ERROR', error: t('errors.failedToCreateNewProfile') });
    }
  };

  const handleOpen = async () => {
    closeMenu();
    if (!state.settings) {
      return;
    }

    try {
      await flushCurrentConfig();

      const result = await window.electronAPI.openProfileDialog();
      if (result.canceled || !result.filePath) {
        return;
      }

      const newSettings = {
        ...state.settings,
        activeProfilePath: result.filePath,
      };
      await window.electronAPI.saveSettings(newSettings);

      const { settings, profile } = await window.electronAPI.loadConfig();
      dispatch({ type: 'SET_CONFIG', settings, profile });
    } catch {
      dispatch({ type: 'SET_ERROR', error: t('errors.failedToOpenProfile') });
    }
  };

  const handleSaveAs = async () => {
    closeMenu();
    if (!state.settings || !state.profile) {
      return;
    }

    try {
      await flushCurrentConfig();

      const result = await window.electronAPI.saveAsDialog();
      if (result.canceled || !result.filePath) {
        return;
      }

      await window.electronAPI.saveProfile(state.profile, result.filePath);

      const newSettings = {
        ...state.settings,
        activeProfilePath: result.filePath,
      };
      await window.electronAPI.saveSettings(newSettings);

      dispatch({
        type: 'SET_CONFIG',
        settings: newSettings,
        profile: state.profile,
      });
    } catch {
      dispatch({
        type: 'SET_ERROR',
        error: t('errors.failedToSaveProfileAs'),
      });
    }
  };

  const handleExit = () => {
    closeMenu();
    void window.electronAPI.exitApp();
  };

  const handleSelectDragDrop = () => {
    closeMenu();
    dispatch({ type: 'SET_DRAG_DROP_MODE', enabled: true });
    dispatch({
      type: 'UPDATE_SETTINGS',
      settings: { lockWindowCenter: false },
    });
    void window.electronAPI.setDragDropMode(true);
  };

  const handleSelectLockCenter = () => {
    closeMenu();
    dispatch({ type: 'SET_DRAG_DROP_MODE', enabled: false });
    dispatch({
      type: 'UPDATE_SETTINGS',
      settings: { lockWindowCenter: true },
    });
    void window.electronAPI.setLockWindowCenter(true);
  };

  const handleOpenUserApplicationsFolder = () => {
    closeMenu();
    if (IS_MAC) {
      void window.electronAPI.openPath('~/Applications');
    } else if (IS_WINDOWS) {
      void window.electronAPI.openPath('shell:programs');
    } else {
      void window.electronAPI.openPath('~/.local/share/applications');
    }
  };

  const handleOpenSystemApplicationsFolder = () => {
    closeMenu();
    if (IS_MAC) {
      void window.electronAPI.openPath('/Applications');
    } else if (IS_WINDOWS) {
      void window.electronAPI.openPath('shell:common programs');
    } else {
      void window.electronAPI.openPath('/usr/share/applications');
    }
  };

  const handleOpenMyConfigFolders = () => {
    closeMenu();
    // Open the config directory and the active profile in directory
    void window.electronAPI.openPath('myapp:configdir');
    if (state.settings?.activeProfilePath) {
      void window.electronAPI.openPath(state.settings.activeProfilePath, {
        showInFolder: true,
      });
    }
  };

  const handleHotkey = () => {
    closeMenu();
    dispatch({ type: 'OPEN_HOTKEY_SETTINGS_MODAL' });
  };

  const handleOptions = () => {
    closeMenu();
    dispatch({ type: 'OPEN_OPTIONS_MODAL' });
  };

  const handleDocumentation = () => {
    closeMenu();
    void window.electronAPI.launchProgram({
      tabId: '',
      id: '',
      label: '',
      filePath: DOCUMENTATION_URL,
    });
  };

  const handleAbout = () => {
    closeMenu();
    dispatch({ type: 'OPEN_ABOUT_MODAL' });
  };

  const handleToggleHideElement = (key: keyof HideElements) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      settings: {
        hideElements: {
          ...hideElements,
          [key]: !hideElements[key],
        },
      },
    });
  };

  // Don't render if menu is hidden and not showing
  if (!shouldShowMenu) {
    return <div className="main-menu menu-hidden" ref={menuRef} />;
  }

  return (
    <div className="main-menu" ref={menuRef}>
      {/* File menu */}
      <div
        className="menu-item"
        onClick={() => handleMenuClick('file')}
        onMouseEnter={() => handleMenuHover('file')}
      >
        {t('menu.file')}
        {openMenu === 'file' && (
          <div className="dropdown-menu">
            <div className="dropdown-item" onClick={handleNew}>
              {t('menu.new')}
            </div>
            <div className="dropdown-item" onClick={handleOpen}>
              {t('menu.open')}
            </div>
            <div className="dropdown-item" onClick={handleSaveAs}>
              {t('menu.saveAs')}
            </div>
            <div className="context-menu-separator" />
            <div className="dropdown-item" onClick={handleExit}>
              {t('menu.exit')}
            </div>
          </div>
        )}
      </div>

      {/* View menu */}
      <div
        className="menu-item"
        onClick={() => handleMenuClick('view')}
        onMouseEnter={() => handleMenuHover('view')}
      >
        {t('menu.view')}
        {openMenu === 'view' && (
          <div className="dropdown-menu">
            <div
              className="dropdown-item"
              onClick={handleSelectDragDrop}
              title={t('menu.dragDropModeTooltip')}
            >
              <span className="menu-check">{state.ui.isDragDropMode ? '✓' : ''}</span>
              {t('menu.dragDropMode')}
            </div>
            <div
              className="dropdown-item"
              onClick={handleSelectLockCenter}
              title={t('menu.centerWindowTooltip')}
            >
              <span className="menu-check">{state.settings?.lockWindowCenter ? '✓' : ''}</span>
              {t('menu.centerWindow')}
            </div>
            <div className="context-menu-separator" />
            {/* Hide Elements submenu */}
            <div
              className="dropdown-item dropdown-submenu"
              onMouseEnter={() => setHideSubmenuOpen(true)}
              onMouseLeave={() => setHideSubmenuOpen(false)}
            >
              <span className="menu-check"></span>
              {t('menu.hideElements')}
              <span className="submenu-arrow">▸</span>
              {hideSubmenuOpen && (
                <div className="dropdown-menu submenu">
                  <div
                    className="dropdown-item"
                    onClick={() => handleToggleHideElement('menu')}
                    title={t('menu.hideMenuBarTooltip')}
                  >
                    <span className="menu-check">{hideElements.menu ? '✓' : ''}</span>
                    {t('menu.hideMenuBar')}
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => handleToggleHideElement('buttonIcons')}
                    title={t('menu.hideButtonIconsTooltip')}
                  >
                    <span className="menu-check">{hideElements.buttonIcons ? '✓' : ''}</span>
                    {t('menu.hideButtonIcons')}
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => handleToggleHideElement('buttonText')}
                    title={t('menu.hideButtonTextTooltip')}
                  >
                    <span className="menu-check">{hideElements.buttonText ? '✓' : ''}</span>
                    {t('menu.hideButtonText')}
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => handleToggleHideElement('emptyButtons')}
                    title={t('menu.hideEmptyButtonsTooltip')}
                  >
                    <span className="menu-check">{hideElements.emptyButtons ? '✓' : ''}</span>
                    {t('menu.hideEmptyButtons')}
                  </div>
                  <div className="context-menu-separator" />
                  <div
                    className="dropdown-item"
                    onClick={() => handleToggleHideElement('rowF')}
                    title={t('menu.hideFunctionKeysTooltip')}
                  >
                    <span className="menu-check">{hideElements.rowF ? '✓' : ''}</span>
                    {t('menu.hideFunctionKeys')}
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => handleToggleHideElement('row1')}
                    title={t('menu.hideLetterKeysRow1Tooltip')}
                  >
                    <span className="menu-check">{hideElements.row1 ? '✓' : ''}</span>
                    {t('menu.hideLetterKeysRow1')}
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => handleToggleHideElement('row2')}
                    title={t('menu.hideLetterKeysRow2Tooltip')}
                  >
                    <span className="menu-check">{hideElements.row2 ? '✓' : ''}</span>
                    {t('menu.hideLetterKeysRow2')}
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => handleToggleHideElement('row3')}
                    title={t('menu.hideLetterKeysRow3Tooltip')}
                  >
                    <span className="menu-check">{hideElements.row3 ? '✓' : ''}</span>
                    {t('menu.hideLetterKeysRow3')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tools menu - platform-specific */}
      <div
        className="menu-item"
        onClick={() => handleMenuClick('tools')}
        onMouseEnter={() => handleMenuHover('tools')}
      >
        {t('menu.tools')}
        {openMenu === 'tools' && (
          <div className="dropdown-menu">
            {(() => {
              const labels = IS_MAC
                ? {
                    user: t('menu.openUserApps'),
                    system: t('menu.openSystemApps'),
                  }
                : IS_WINDOWS
                  ? {
                      user: t('menu.openStartMenuUser'),
                      system: t('menu.openStartMenuAll'),
                    }
                  : {
                      user: t('menu.openUserAppsDir'),
                      system: t('menu.openSystemAppsDir'),
                    };
              return (
                <>
                  <div className="dropdown-item" onClick={handleOpenUserApplicationsFolder}>
                    {labels.user}
                  </div>
                  <div className="dropdown-item" onClick={handleOpenSystemApplicationsFolder}>
                    {labels.system}
                  </div>
                </>
              );
            })()}
            <div className="context-menu-separator" />
            <div className="dropdown-item" onClick={handleOpenMyConfigFolders}>
              {t('menu.openConfigFolders')}
            </div>
          </div>
        )}
      </div>

      {/* Settings menu */}
      <div
        className="menu-item"
        onClick={() => handleMenuClick('settings')}
        onMouseEnter={() => handleMenuHover('settings')}
      >
        {t('menu.settings')}
        {openMenu === 'settings' && (
          <div className="dropdown-menu">
            <div className="dropdown-item" onClick={handleHotkey}>
              {t('menu.hotkeySettings')}
            </div>
            <div className="dropdown-item" onClick={handleOptions}>
              {t('menu.options')}
            </div>
          </div>
        )}
      </div>

      {/* Help menu */}
      <div
        className="menu-item"
        onClick={() => handleMenuClick('help')}
        onMouseEnter={() => handleMenuHover('help')}
      >
        {t('menu.help')}
        {openMenu === 'help' && (
          <div className="dropdown-menu">
            <div className="dropdown-item" onClick={handleDocumentation}>
              {t('menu.documentation')}
            </div>
            <div className="dropdown-item" onClick={handleAbout}>
              {t('menu.about')} {APP_NAME}
            </div>
          </div>
        )}
      </div>

      {/* Search box */}
      <SearchBox />
    </div>
  );
}
