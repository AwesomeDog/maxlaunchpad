import en from './en.json';
import zhCN from './zh-CN.json';

export const languages = [
  { code: 'en', resource: en, nativeName: 'English' },
  { code: 'zh-CN', resource: zhCN, nativeName: '简体中文' },
] as const;

export type LanguageCode = (typeof languages)[number]['code'];

export const languageCodes = languages.map(({ code }) => code);
