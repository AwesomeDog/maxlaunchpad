import de from './de.json';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import ja from './ja.json';
import ko from './ko.json';
import ru from './ru.json';
import zhCN from './zh-CN.json';
import zhTW from './zh-TW.json';

export const languages = [
  { code: 'en', resource: en, nativeName: 'English' },
  { code: 'zh-CN', resource: zhCN, nativeName: '简体中文' },
  { code: 'zh-TW', resource: zhTW, nativeName: '繁體中文' },
  { code: 'fr', resource: fr, nativeName: 'Français' },
  { code: 'de', resource: de, nativeName: 'Deutsch' },
  { code: 'ja', resource: ja, nativeName: '日本語' },
  { code: 'ru', resource: ru, nativeName: 'Русский' },
  { code: 'es', resource: es, nativeName: 'Español' },
  { code: 'ko', resource: ko, nativeName: '한국어' },
] as const;

export type LanguageCode = (typeof languages)[number]['code'];

export const languageCodes = languages.map(({ code }) => code);
