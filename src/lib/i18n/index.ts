import en from './en';
import de from './de';
import nl from './nl';
import fr from './fr';
import es from './es';
import it from './it';
import pt from './pt';

export type Lang = 'en' | 'de' | 'nl' | 'fr' | 'es' | 'it' | 'pt';

// Keys are identical across all languages; only values differ.
// Map every key to string | readonly string[] so non-EN translations are accepted.
export type Translations = {
	[K in keyof typeof en]: (typeof en)[K] extends readonly string[] ? readonly string[] : string;
};

export const SUPPORTED_LANGS: Lang[] = ['en', 'de', 'nl', 'fr', 'es', 'it', 'pt'];
export const defaultLang: Lang = 'en';

export const translations: Record<Lang, Translations> = { en, de, nl, fr, es, it, pt };
