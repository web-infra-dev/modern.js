export interface BaseLocaleDetectionOptions {
  localePathRedirect?: boolean;
  i18nextDetector?: boolean;
  languages?: string[];
  fallbackLanguage?: string;
}

export interface LocaleDetectionOptions extends BaseLocaleDetectionOptions {
  localeDetectionByEntry?: Record<string, BaseLocaleDetectionOptions>;
}

export interface BaseBackendOptions {
  enabled?: boolean;
  loadPath?: string;
  addPath?: string;
}

export interface BackendOptions extends BaseBackendOptions {
  backendOptionsByEntry?: Record<string, BaseBackendOptions>;
}
