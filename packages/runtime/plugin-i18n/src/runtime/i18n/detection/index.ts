import { type TRuntimeContext, isBrowser } from '@modern-js/runtime';
import { detectLanguageFromPath } from '../../utils';
import type {
  I18nInitOptions,
  I18nInstance,
  LanguageDetectorOptions,
} from '../instance';
import { mergeDetectionOptions as mergeDetectionOptionsUtil } from './config';
import { cacheUserLanguage, detectLanguage } from './middleware';

// Re-export cacheUserLanguage for use in context
export { cacheUserLanguage };

export function exportServerLngToWindow(context: TRuntimeContext, lng: string) {
  context.__i18nData__ = { lng };
}

export const getLanguageFromSSRData = (window: Window): string | undefined => {
  const ssrData = window._SSR_DATA;
  return ssrData?.data?.i18nData?.lng as string | undefined;
};

export interface BaseLanguageDetectionOptions {
  languages: string[];
  fallbackLanguage: string;
  localePathRedirect: boolean;
  i18nextDetector: boolean;
  detection?: LanguageDetectorOptions;
  userInitOptions?: I18nInitOptions;
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
 * Check if a language is supported
 */
const isLanguageSupported = (
  language: string | undefined,
  supportedLanguages: string[],
): boolean => {
  if (!language) {
    return false;
  }
  return (
    supportedLanguages.length === 0 || supportedLanguages.includes(language)
  );
};

/**
 * Priority 1: Detect language from SSR data
 */
const detectLanguageFromSSR = (languages: string[]): string | undefined => {
  if (!isBrowser()) {
    return undefined;
  }

  try {
    const ssrLanguage = getLanguageFromSSRData(window);
    if (isLanguageSupported(ssrLanguage, languages)) {
      return ssrLanguage;
    }
  } catch (error) {
    // Silently ignore errors
  }

  return undefined;
};

/**
 * Priority 2: Detect language from URL path
 */
const detectLanguageFromPathPriority = (
  pathname: string,
  languages: string[],
  localePathRedirect: boolean,
): string | undefined => {
  if (!localePathRedirect) {
    return undefined;
  }

  try {
    const pathDetection = detectLanguageFromPath(
      pathname,
      languages,
      localePathRedirect,
    );
    if (pathDetection.detected && pathDetection.language) {
      return pathDetection.language;
    }
  } catch (error) {
    // Silently ignore errors
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
  const { lng: _, ...restUserOptions } = options.userInitOptions || {};
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

    if (detectorLang && isLanguageSupported(detectorLang, options.languages)) {
      return detectorLang;
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
 * Detect language with priority: SSR data > path > i18next detector > fallback
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

  // Priority 1: SSR data
  let detectedLanguage = detectLanguageFromSSR(languages);

  // Priority 2: Path detection
  if (!detectedLanguage) {
    detectedLanguage = detectLanguageFromPathPriority(
      pathname,
      languages,
      localePathRedirect,
    );
  }

  // Priority 3: i18next detector
  if (!detectedLanguage) {
    detectedLanguage = await detectLanguageFromI18nextDetector(i18nInstance, {
      languages,
      fallbackLanguage,
      localePathRedirect,
      i18nextDetector,
      detection,
      userInitOptions,
      ssrContext,
    });
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
  const mergedDetection = i18nextDetector
    ? mergeDetectionOptionsUtil(detection, userInitOptions?.detection)
    : userInitOptions?.detection;
  if (localePathRedirect && mergedDetection?.order) {
    mergedDetection.order = mergedDetection.order.filter(
      (item: string) => item !== 'path',
    );
  }

  return mergedDetection;
};
