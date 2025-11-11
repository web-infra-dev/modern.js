export interface BaseLocaleDetectionOptions {
  localePathRedirect?: boolean;
  i18nextDetector?: boolean;
  languages?: string[];
  fallbackLanguage?: string;
}

export interface LocaleDetectionOptions extends BaseLocaleDetectionOptions {
  localeDetectionByEntry?: Record<string, BaseLocaleDetectionOptions>;
}
