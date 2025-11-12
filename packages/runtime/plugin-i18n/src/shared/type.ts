import type { LanguageDetectorOptions } from '../runtime/i18n/instance';

export interface BaseLocaleDetectionOptions {
  localePathRedirect?: boolean;
  i18nextDetector?: boolean;
  languages?: string[];
  fallbackLanguage?: string;
  detection?: LanguageDetectorOptions;
}

export interface LocaleDetectionOptions extends BaseLocaleDetectionOptions {
  localeDetectionByEntry?: Record<string, BaseLocaleDetectionOptions>;
}
