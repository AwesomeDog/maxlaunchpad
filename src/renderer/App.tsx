import './styles/global.css';

import { useEffect } from 'react';

import { VirtualKeyboard } from './components/keyboard/VirtualKeyboard';
import { TopBar } from './components/layout/TopBar';
import { AboutModal } from './components/modals/AboutModal';
import { EditKeyModal } from './components/modals/EditKeyModal';
import { EditTabModal } from './components/modals/EditTabModal';
import { HotkeySettingsModal } from './components/modals/HotkeySettingsModal';
import { OptionsModal } from './components/modals/OptionsModal';
import { useConfigSync } from './hooks/useConfigSync';
import { useCustomStyle } from './hooks/useCustomStyle';
import { useErrorDialog } from './hooks/useErrorDialog';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { useTheme } from './hooks/useTheme';
import { useWindowBehavior } from './hooks/useWindowBehavior';
import { useWindowTitle } from './hooks/useWindowTitle';
import { AppStateProvider, useAppState, useDispatch } from './state/store';

function AppContent() {
  const state = useAppState();
  const dispatch = useDispatch();

  useConfigSync();

  useErrorDialog();

  useKeyboardNav();

  useTheme();

  useCustomStyle();

  useWindowBehavior();

  useWindowTitle();

  useEffect(() => {
    async function load() {
      try {
        const { settings, profile } = await window.electronAPI.loadConfig();
        dispatch({ type: 'SET_CONFIG', settings, profile });
      } catch {
        dispatch({ type: 'SET_ERROR', error: 'Failed to load configuration' });
      }
    }
    void load();
  }, [dispatch]);

  if (state.ui.isLoading) {
    return (
      <div className="app-container">
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
      </div>
    );
  }

  const renderModal = () => {
    switch (state.ui.modal.type) {
      case 'editKey':
        return <EditKeyModal keyConfig={state.ui.modal.key} />;
      case 'editTab':
        return <EditTabModal tabId={state.ui.modal.tabId} />;
      case 'hotkeySettings':
        return <HotkeySettingsModal />;
      case 'options':
        return <OptionsModal />;
      case 'about':
        return <AboutModal />;
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <TopBar />
      <VirtualKeyboard />

      {renderModal()}
    </div>
  );
}

export function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}
