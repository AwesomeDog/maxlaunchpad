import type { ReactElement } from 'react';
import { useCallback, useRef, useState } from 'react';

import { APP_NAME, DOCUMENTATION_URL } from '../../../shared/constants';
import type { KeyboardProfile } from '../../../shared/types';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useCloseOnWindowHide } from '../../hooks/useCloseOnWindowHide';
import { IS_MAC, IS_WINDOWS } from '../../platform';
import { useAppState, useDispatch } from '../../state/store';
import { SearchBox } from './SearchBox';

type MenuId = 'file' | 'view' | 'tools' | 'settings' | 'help' | null;

export function TopBar(): ReactElement {
  const state = useAppState();
  const dispatch = useDispatch();
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setOpenMenu(null), []);
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
      dispatch({ type: 'SET_ERROR', error: 'Failed to save configuration' });
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
      dispatch({ type: 'SET_ERROR', error: 'Failed to create new profile' });
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
      dispatch({ type: 'SET_ERROR', error: 'Failed to open profile' });
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
        error: 'Failed to save profile as new file',
      });
    }
  };

  const handleExit = () => {
    closeMenu();
    void window.electronAPI.exitApp();
  };

  const handleToggleDragDrop = () => {
    closeMenu();
    const newValue = !state.ui.isDragDropMode;
    dispatch({ type: 'SET_DRAG_DROP_MODE', enabled: newValue });
    void window.electronAPI.setDragDropMode(newValue);
  };

  const handleToggleLockCenter = () => {
    closeMenu();
    const newValue = !state.settings?.lockWindowCenter;
    dispatch({
      type: 'UPDATE_SETTINGS',
      settings: { lockWindowCenter: newValue },
    });
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

  return (
    <div className="main-menu" ref={menuRef}>
      {/* File menu */}
      <div
        className="menu-item"
        onClick={() => handleMenuClick('file')}
        onMouseEnter={() => handleMenuHover('file')}
      >
        File
        {openMenu === 'file' && (
          <div className="dropdown-menu">
            <div className="dropdown-item" onClick={handleNew}>
              New
            </div>
            <div className="dropdown-item" onClick={handleOpen}>
              Open...
            </div>
            <div className="dropdown-item" onClick={handleSaveAs}>
              Save As...
            </div>
            <div className="context-menu-separator" />
            <div className="dropdown-item" onClick={handleExit}>
              Exit
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
        View
        {openMenu === 'view' && (
          <div className="dropdown-menu">
            <div
              className="dropdown-item"
              onClick={handleToggleDragDrop}
              title="When enabled, the window stays visible and movable in this session"
            >
              <span className="menu-check">{state.ui.isDragDropMode ? '✓' : ''}</span>
              Drag & Drop Mode
            </div>
            <div
              className="dropdown-item"
              onClick={handleToggleLockCenter}
              title="When enabled, window centers and can't be dragged"
            >
              <span className="menu-check">{state.settings?.lockWindowCenter ? '✓' : ''}</span>
              Lock Window Center
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
        Tools
        {openMenu === 'tools' && (
          <div className="dropdown-menu">
            {(() => {
              const labels = IS_MAC
                ? {
                    user: 'Open Applications Folder (User)',
                    system: 'Open Applications Folder (System)',
                  }
                : IS_WINDOWS
                  ? {
                      user: 'Open Start Menu (User)',
                      system: 'Open Start Menu (All Users)',
                    }
                  : {
                      user: 'Open Applications Directory (User)',
                      system: 'Open Applications Directory (System)',
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
              Open My Config Folders
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
        Settings
        {openMenu === 'settings' && (
          <div className="dropdown-menu">
            <div className="dropdown-item" onClick={handleHotkey}>
              Hotkey
            </div>
            <div className="dropdown-item" onClick={handleOptions}>
              Options
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
        Help
        {openMenu === 'help' && (
          <div className="dropdown-menu">
            <div className="dropdown-item" onClick={handleDocumentation}>
              Documentation
            </div>
            <div className="dropdown-item" onClick={handleAbout}>
              About {APP_NAME}
            </div>
          </div>
        )}
      </div>

      {/* Search box */}
      <SearchBox />
    </div>
  );
}
