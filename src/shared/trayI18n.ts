import type { AppLanguage, LegacyAppLanguage } from './types';

interface TrayI18n {
  show: string;
  exit: string;
}

const TRAY_TRANSLATIONS: Record<AppLanguage, TrayI18n> = {
  'zh-CN': {
    show: '显示',
    exit: '退出',
  },
  en: {
    show: 'Show',
    exit: 'Exit',
  },
};

export function normalizeTrayLanguage(language: LegacyAppLanguage | undefined): AppLanguage {
  if (language === 'zh' || language === 'zh-CN') {
    return 'zh-CN';
  }
  return 'en';
}

export function getTrayI18n(language: LegacyAppLanguage | undefined): TrayI18n {
  return TRAY_TRANSLATIONS[normalizeTrayLanguage(language)];
}
