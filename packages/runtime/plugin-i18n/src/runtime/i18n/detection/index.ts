import { type TRuntimeContext, isBrowser } from '@modern-js/runtime';
import { detectLanguageFromPath } from '../../utils';
import type {
  I18nInitOptions,
  I18nInstance,
  LanguageDetectorOptions,
} from '../instance';
import { isI18nWrapperInstance } from '../instance';
import { mergeDetectionOptions as mergeDetectionOptionsUtil } from './config';
import {
  cacheUserLanguage,
  detectLanguage,
  readLanguageFromStorage,
} from './middleware';

// Re-export cacheUserLanguage for use in context
export { cacheUserLanguage };

export function exportServerLngToWindow(context: TRuntimeContext, lng: string) {
  context.__i18nData__ = { lng };
}

export const getLanguageFromSSRData = (window: Window): string | undefined => {
  try {
    const ssrData = window._SSR_DATA;
    // Check if SSR data exists and has valid structure
    if (!ssrData || !ssrData.data || !ssrData.data.i18nData) {
      return undefined;
    }
    const lng = ssrData.data.i18nData.lng;
    // Return language only if it's a non-empty string
    return typeof lng === 'string' && lng.trim() !== '' ? lng : undefined;
  } catch (error) {
    // If accessing window._SSR_DATA throws an error, return undefined
    return undefined;
  }
};

export interface BaseLanguageDetectionOptions {
  languages: string[];
  fallbackLanguage: string;
  localePathRedirect: boolean;
  i18nextDetector: boolean;
  detection?: LanguageDetectorOptions;
  userInitOptions?: I18nInitOptions;
  mergedBackend?: any;
}

export interface LanguageDetectionOptions extends BaseLanguageDetectionOptions {
  pathname: string;
  ssrContext?: any;
}

export interface LanguageDetectionResult {
  detectedLanguage?: string;
  finalLanguage: string;
}

/**
 * Normalize language code (e.g., 'zh-CN' -> 'zh', 'en-US' -> 'en')
 */
const normalizeLanguageCode = (language: string): string => {
  if (!language) {
    return language;
  }
  // Extract base language code (before hyphen)
  const baseLang = language.split('-')[0];
  return baseLang;
};

/**
 * Check if a language is supported
 * Also checks the base language code (e.g., 'zh-CN' matches 'zh')
 */
const isLanguageSupported = (
  language: string | undefined,
  supportedLanguages: string[],
): boolean => {
  if (!language) {
    return false;
  }
  if (supportedLanguages.length === 0) {
    return true;
  }
  // Check exact match first
  if (supportedLanguages.includes(language)) {
    return true;
  }
  // Check base language code match (e.g., 'zh-CN' matches 'zh')
  const baseLang = normalizeLanguageCode(language);
  if (baseLang !== language && supportedLanguages.includes(baseLang)) {
    return true;
  }
  return false;
};

/**
 * Get the supported language that matches the given language
 * Returns the exact match if available, otherwise returns the base language code match
 * Returns undefined if no match is found
 */
const getSupportedLanguage = (
  language: string | undefined,
  supportedLanguages: string[],
): string | undefined => {
  if (!language) {
    return undefined;
  }
  if (supportedLanguages.length === 0) {
    return language;
  }
  // Check exact match first
  if (supportedLanguages.includes(language)) {
    return language;
  }
  // Check base language code match (e.g., 'zh-CN' matches 'zh')
  const baseLang = normalizeLanguageCode(language);
  if (baseLang !== language && supportedLanguages.includes(baseLang)) {
    return baseLang;
  }
  return undefined;
};

/**
 * Priority 1: Detect language from SSR data
 * Try to get language from window._SSR_DATA first (both SSR and CSR projects)
 * Returns undefined if SSR data is not available or invalid
 */
const detectLanguageFromSSR = (languages: string[]): string | undefined => {
  if (!isBrowser()) {
    return undefined;
  }

  try {
    const ssrLanguage = getLanguageFromSSRData(window);
    if (ssrLanguage && isLanguageSupported(ssrLanguage, languages)) {
      return ssrLanguage;
    }
  } catch (error) {
    // Silently ignore errors
  }

  return undefined;
};

/**
 * Priority 2: Detect language from URL path
 * Only returns a language if the path explicitly contains a language prefix
 */
const detectLanguageFromPathPriority = (
  pathname: string,
  languages: string[],
  localePathRedirect: boolean,
): string | undefined => {
  if (!localePathRedirect) {
    return undefined;
  }

  // If no languages are configured, cannot detect from path
  if (!languages || languages.length === 0) {
    return undefined;
  }

  // If pathname is empty or invalid, no language in path
  if (!pathname || pathname.trim() === '') {
    return undefined;
  }

  try {
    const pathDetection = detectLanguageFromPath(
      pathname,
      languages,
      localePathRedirect,
    );
    // Only return language if explicitly detected in path
    if (pathDetection.detected === true && pathDetection.language) {
      return pathDetection.language;
    }
  } catch (error) {
    // Silently ignore errors, return undefined
  }

  return undefined;
};

/**
 * Initialize i18n instance for detector if needed
 */
const initializeI18nForDetector = async (
  i18nInstance: I18nInstance,
  options: BaseLanguageDetectionOptions,
): Promise<void> => {
  if (i18nInstance.isInitialized) {
    return;
  }

  const mergedDetection = mergeDetectionOptions(
    options.i18nextDetector,
    options.detection,
    options.localePathRedirect,
    options.userInitOptions,
  );

  // Don't set lng explicitly when detector is enabled, let the detector find the language
  const userLng = options.userInitOptions?.lng;
  // Exclude backend from userInitOptions to avoid overriding mergedBackend
  // Backend should be set via mergedBackend which contains the properly merged configuration
  const {
    lng: _,
    backend: _removedBackend,
    ...restUserOptions
  } = options.userInitOptions || {};
  const initOptions: any = {
    ...restUserOptions,
    ...(userLng ? { lng: userLng } : {}),
    fallbackLng: options.fallbackLanguage,
    supportedLngs: options.languages,
    detection: mergedDetection,
    react: {
      ...((options.userInitOptions as any)?.react || {}),
      useSuspense: isBrowser()
        ? ((options.userInitOptions as any)?.react?.useSuspense ?? true)
        : false,
    },
  };

  // Set backend config from mergedBackend if available
  // This ensures default backend config (like loadPath) is preserved when user only provides sdk
  if (options.mergedBackend) {
    const isChainedBackend = !!options.mergedBackend?._useChainedBackend;
    if (isChainedBackend && options.mergedBackend._chainedBackendConfig) {
      // For chained backend, we need to get backend classes from i18nInstance.options.backend.backends
      // which were set by useI18nextBackend
      const savedBackendConfig = i18nInstance.options?.backend;
      if (
        savedBackendConfig?.backends &&
        Array.isArray(savedBackendConfig.backends)
      ) {
        initOptions.backend = {
          backends: savedBackendConfig.backends,
          backendOptions:
            options.mergedBackend._chainedBackendConfig.backendOptions,
          cacheHitMode:
            options.mergedBackend.cacheHitMode || 'refreshAndUpdateStore',
        };
      }
    } else {
      // For non-chained backend, pass the backend config directly
      // Remove internal properties before passing to init()
      const { _useChainedBackend, _chainedBackendConfig, ...cleanBackend } =
        options.mergedBackend || {};
      initOptions.backend = cleanBackend;
    }
  }

  await i18nInstance.init(initOptions);
};

/**
 * Priority 3: Detect language using i18next detector
 */
const detectLanguageFromI18nextDetector = async (
  i18nInstance: I18nInstance,
  options: BaseLanguageDetectionOptions & { ssrContext?: any },
): Promise<string | undefined> => {
  if (!options.i18nextDetector) {
    return undefined;
  }

  // Merge detection options to pass to detector
  const mergedDetection = mergeDetectionOptions(
    options.i18nextDetector,
    options.detection,
    options.localePathRedirect,
    options.userInitOptions,
  );

  await initializeI18nForDetector(i18nInstance, options);

  try {
    const request = options.ssrContext?.request;
    if (!isBrowser() && !request) {
      return undefined;
    }

    const detectorLang = detectLanguage(
      i18nInstance,
      request as any,
      mergedDetection,
    );

    // Use getSupportedLanguage to get the matching supported language
    // This handles both exact match and base language code match (e.g., 'zh-CN' -> 'zh')
    if (detectorLang) {
      const supportedLang = getSupportedLanguage(
        detectorLang,
        options.languages,
      );
      if (supportedLang) {
        return supportedLang;
      }
    }

    // Fallback to instance's current language if detector didn't detect
    if (i18nInstance.isInitialized && i18nInstance.language) {
      const currentLang = i18nInstance.language;
      if (isLanguageSupported(currentLang, options.languages)) {
        return currentLang;
      }
    }
  } catch (error) {
    // Silently ignore errors
  }

  return undefined;
};

/**
 * Detect language with priority:
 * Priority 1: SSR data (try window._SSR_DATA first, works for both SSR and CSR)
 * Priority 2: Path detection
 * Priority 3: i18next detector (reads from cookie/localStorage)
 * Priority 4: User config language or fallback
 */
export const detectLanguageWithPriority = async (
  i18nInstance: I18nInstance,
  options: LanguageDetectionOptions,
): Promise<LanguageDetectionResult> => {
  const {
    languages,
    fallbackLanguage,
    localePathRedirect,
    i18nextDetector,
    detection,
    userInitOptions,
    pathname,
    ssrContext,
  } = options;

  let detectedLanguage: string | undefined;

  // Priority 1: Try SSR data first (works for both SSR and CSR projects)
  // For CSR projects, if SSR data exists in window, use it; otherwise continue to next priority
  detectedLanguage = detectLanguageFromSSR(languages);

  // Priority 2: Path detection
  if (!detectedLanguage) {
    detectedLanguage = detectLanguageFromPathPriority(
      pathname,
      languages,
      localePathRedirect,
    );
  }

  // Priority 3: i18next detector (reads from cookie/localStorage)
  if (!detectedLanguage && i18nextDetector) {
    if (isI18nWrapperInstance(i18nInstance)) {
      detectedLanguage = readLanguageFromStorage(
        mergeDetectionOptions(
          i18nextDetector,
          detection,
          localePathRedirect,
          userInitOptions,
        ),
      );
    } else {
      detectedLanguage = await detectLanguageFromI18nextDetector(i18nInstance, {
        languages,
        fallbackLanguage,
        localePathRedirect,
        i18nextDetector,
        detection,
        userInitOptions,
        mergedBackend: options.mergedBackend,
        ssrContext,
      });
    }
  }

  // Priority 4: Use user config language or fallback
  const finalLanguage =
    detectedLanguage || userInitOptions?.lng || fallbackLanguage;

  return { detectedLanguage, finalLanguage };
};

/**
 * Options for building i18n init options
 */
export interface BuildInitOptionsParams {
  finalLanguage: string;
  fallbackLanguage: string;
  languages: string[];
  userInitOptions?: I18nInitOptions;
  mergedDetection?: any;
  mergeBackend?: any;
}

/**
 * Build i18n initialization options
 */
export const buildInitOptions = (
  params: BuildInitOptionsParams,
): I18nInitOptions => {
  const {
    finalLanguage,
    fallbackLanguage,
    languages,
    userInitOptions,
    mergedDetection,
    mergeBackend,
  } = params;

  return {
    ...(userInitOptions || {}),
    lng: finalLanguage,
    fallbackLng: fallbackLanguage,
    supportedLngs: languages,
    detection: mergedDetection,
    backend: mergeBackend,
    react: {
      useSuspense: isBrowser(),
    },
  } as any;
};

/**
 * Merge detection and backend options
 */
export const mergeDetectionOptions = (
  i18nextDetector: boolean,
  detection?: LanguageDetectorOptions,
  localePathRedirect?: boolean,
  userInitOptions?: I18nInitOptions,
) => {
  // Exclude 'path' from detection order to avoid conflict with manual path detection
  let mergedDetection: LanguageDetectorOptions;
  if (i18nextDetector) {
    // mergeDetectionOptionsUtil always returns an object with default options
    mergedDetection = mergeDetectionOptionsUtil(
      detection,
      userInitOptions?.detection,
    );
  } else {
    // If detector is disabled, use user options or empty object
    mergedDetection = userInitOptions?.detection || {};
  }

  // Ensure mergedDetection is always an object (should not be undefined after above)
  if (!mergedDetection || typeof mergedDetection !== 'object') {
    mergedDetection = {};
  }

  if (localePathRedirect && mergedDetection.order) {
    mergedDetection.order = mergedDetection.order.filter(
      (item: string) => item !== 'path',
    );
  }

  return mergedDetection;
};
