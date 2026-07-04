import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import type { AppLanguage, LegacyAppLanguage } from '../../shared/types';
import en from './en.json';
import zhCN from './zh-CN.json';

export const LANGUAGE_OPTIONS: ReadonlyArray<{ value: AppLanguage; label: string }> = [
  { value: 'zh-CN', label: '中文' },
  { value: 'en', label: 'English' },
];

export function normalizeLanguage(language: LegacyAppLanguage | undefined): AppLanguage {
  if (language === 'zh' || language === 'zh-CN') {
    return 'zh-CN';
  }
  return 'en';
}

const resources = {
  en: { translation: en },
  'zh-CN': { translation: zhCN },
};

const i18nInstance = i18n;

i18nInstance
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18nInstance;
