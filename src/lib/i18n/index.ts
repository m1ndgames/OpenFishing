import en from './en';
import de from './de';

export type Lang = 'en' | 'de';
export type Translations = typeof en;

export const SUPPORTED_LANGS: Lang[] = ['en', 'de'];
export const defaultLang: Lang = 'en';

export const translations: Record<Lang, Translations> = { en, de };
