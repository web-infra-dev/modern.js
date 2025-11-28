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
 * Check if SSR data is valid (project is SSR)
 * For CSR projects, SSR data may not exist or be invalid
 */
const hasValidSSRData = (ssrContext?: any): boolean => {
  if (!isBrowser()) {
    return !!ssrContext;
  }

  try {
    const ssrData = window._SSR_DATA;
    return !!ssrData?.data?.i18nData?.lng;
  } catch (error) {
    return false;
  }
};

/**
 * Priority 1: Detect language from SSR data
 * Only use SSR data if it's valid (SSR project)
 * For CSR projects, this will return undefined
 */
const detectLanguageFromSSR = (languages: string[]): string | undefined => {
  if (!isBrowser()) {
    return undefined;
  }

  // For CSR projects, ignore SSR data
  if (!hasValidSSRData()) {
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
 * Detect language with priority:
 * - SSR projects: SSR data > path > i18next detector > fallback
 * - CSR projects: path > i18next detector > fallback (SSR data is ignored)
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

  const isSSRProject = hasValidSSRData(ssrContext);
  let detectedLanguage: string | undefined;

  // For CSR projects, prioritize i18next detector (reads from cookie/localStorage)
  // For SSR projects, prioritize SSR data first
  if (isSSRProject) {
    // Priority 1: SSR data (for SSR projects)
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
    if (!detectedLanguage) {
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
  } else {
    // For CSR projects, prioritize i18next detector first
    // Priority 1: i18next detector (reads from cookie/localStorage)
    if (i18nextDetector) {
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

    // Priority 2: Path detection
    if (!detectedLanguage) {
      detectedLanguage = detectLanguageFromPathPriority(
        pathname,
        languages,
        localePathRedirect,
      );
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
