import type { ChangeEvent, FocusEvent, ReactElement } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';

import type { AppLanguage } from '../../../shared/types';
import { LANGUAGE_OPTIONS, normalizeLanguage } from '../../i18n';
import { useAppState, useDispatch } from '../../state/store';
import { Modal } from '../common/Modal';

export function OptionsModal(): ReactElement {
  const { i18n, t } = useTranslation();
  const state = useAppState();
  const dispatch = useDispatch();

  const [launchOnStartup, setLaunchOnStartup] = useState(state.settings?.launchOnStartup ?? false);
  const [startInTray, setStartInTray] = useState(state.settings?.startInTray ?? false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    state.settings?.theme ?? 'system',
  );
  const [language, setLanguage] = useState<AppLanguage>(
    normalizeLanguage(state.settings?.language),
  );
  const [customStyle, setCustomStyle] = useState<string>(state.settings?.customStyle ?? 'default');
  const [availableStyles, setAvailableStyles] = useState<string[]>([]);
  const cleanupLanguageSelectRef = useRef<(() => void) | null>(null);
  const lastCommittedLanguageRef = useRef<AppLanguage>(normalizeLanguage(state.settings?.language));

  useEffect(() => {
    if (state.settings) {
      setLaunchOnStartup(state.settings.launchOnStartup);
      setStartInTray(state.settings.startInTray);
      setTheme(state.settings.theme);
      setLanguage(normalizeLanguage(state.settings.language));
      lastCommittedLanguageRef.current = normalizeLanguage(state.settings.language);
      setCustomStyle(state.settings.customStyle);
    }
  }, [state.settings]);

  useEffect(() => {
    async function loadStyles() {
      try {
        const { styles } = await window.electronAPI.listStyles();
        // Sort styles: 'default' first, then alphabetically
        const sortedStyles = [...styles].sort((a, b) => {
          if (a === 'default') return -1;
          if (b === 'default') return 1;
          return a.localeCompare(b);
        });
        setAvailableStyles(sortedStyles);
      } catch (error) {
        const message =
          error instanceof Error
            ? t('errors.failedToLoadStylesWithMessage', { message: error.message })
            : t('errors.failedToLoadStyles');
        dispatch({ type: 'SET_ERROR', error: message });
      }
    }
    void loadStyles();
  }, [dispatch, t]);

  const handleLaunchOnStartupChange = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setLaunchOnStartup(checked);
    dispatch({
      type: 'UPDATE_SETTINGS',
      settings: { launchOnStartup: checked },
    });
  };

  const handleStartInTrayChange = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setStartInTray(checked);
    dispatch({
      type: 'UPDATE_SETTINGS',
      settings: { startInTray: checked },
    });
  };

  const handleThemeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'light' | 'dark' | 'system';
    setTheme(value);
    dispatch({
      type: 'UPDATE_SETTINGS',
      settings: { theme: value },
    });
  };

  const commitLanguage = useCallback(
    (value: AppLanguage) => {
      const normalized = normalizeLanguage(value);
      if (lastCommittedLanguageRef.current === normalized) {
        return;
      }
      lastCommittedLanguageRef.current = normalized;

      flushSync(() => {
        setLanguage(normalized);
        dispatch({
          type: 'UPDATE_SETTINGS',
          settings: { language: normalized },
        });
      });
      void i18n.changeLanguage(normalized);
    },
    [dispatch, i18n],
  );

  const setLanguageSelectRef = useCallback(
    (select: HTMLSelectElement | null) => {
      cleanupLanguageSelectRef.current?.();
      cleanupLanguageSelectRef.current = null;

      if (!select) {
        return;
      }

      const handleNativeLanguageCommit = () => {
        const nextLanguage = normalizeLanguage(select.value as AppLanguage);
        commitLanguage(nextLanguage);
        window.setTimeout(() => {
          commitLanguage(nextLanguage);
        }, 0);
      };

      select.addEventListener('input', handleNativeLanguageCommit);
      select.addEventListener('change', handleNativeLanguageCommit);
      select.addEventListener('blur', handleNativeLanguageCommit);
      cleanupLanguageSelectRef.current = () => {
        select.removeEventListener('input', handleNativeLanguageCommit);
        select.removeEventListener('change', handleNativeLanguageCommit);
        select.removeEventListener('blur', handleNativeLanguageCommit);
      };
    },
    [commitLanguage],
  );

  useEffect(() => {
    return () => {
      cleanupLanguageSelectRef.current?.();
      cleanupLanguageSelectRef.current = null;
    };
  }, []);

  const handleCustomStyleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCustomStyle(value);
    dispatch({
      type: 'UPDATE_SETTINGS',
      settings: { customStyle: value },
    });
  };

  const handleLanguageChange = (
    e: ChangeEvent<HTMLSelectElement> | FocusEvent<HTMLSelectElement>,
  ) => {
    const value = normalizeLanguage(e.currentTarget.value as AppLanguage);
    commitLanguage(value);
  };

  return (
    <Modal title={t('modals.options.title')}>
      <div className="modal-row">
        <div className="modifier-keys">
          <label>
            <input
              type="checkbox"
              checked={launchOnStartup}
              onChange={handleLaunchOnStartupChange}
            />
            {t('modals.options.launchOnStartup')}
          </label>
        </div>
      </div>

      <div className="modal-row">
        <div className="modifier-keys">
          <label>
            <input type="checkbox" checked={startInTray} onChange={handleStartInTrayChange} />
            {t('modals.options.startInTray')}
          </label>
        </div>
      </div>

      <div className="modal-row">
        <label>{t('modals.options.language')}:</label>
        <select
          ref={setLanguageSelectRef}
          value={language}
          onBlur={handleLanguageChange}
          onChange={handleLanguageChange}
          onInput={handleLanguageChange}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value === 'zh-CN'
                ? t('modals.options.languageChineseSimplified')
                : t('modals.options.languageEnglish')}
            </option>
          ))}
        </select>
      </div>

      <div className="modal-row">
        <label>{t('modals.options.theme')}:</label>
        <select value={theme} onChange={handleThemeChange}>
          <option value="system">{t('modals.options.themeSystem')}</option>
          <option value="light">{t('modals.options.themeLight')}</option>
          <option value="dark">{t('modals.options.themeDark')}</option>
        </select>
      </div>

      <div className="modal-row">
        <label>{t('modals.options.customStyle')}:</label>
        <select value={customStyle} onChange={handleCustomStyleChange}>
          {availableStyles.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
      </div>

      <div className="modal-actions">
        <button onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>
          {t('modals.common.close')}
        </button>
      </div>
    </Modal>
  );
}
