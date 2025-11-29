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
  useI18nextLanguageDetector,
} from './middleware';

// Re-export cacheUserLanguage for use in context
export { cacheUserLanguage };

interface DetectorCacheEntry {
  instance: I18nInstance;
  isTemporary: boolean;
  configKey: string;
}

const detectorInstanceCache = new WeakMap<I18nInstance, DetectorCacheEntry>();

const DETECTOR_SAFE_OPTION_KEYS: string[] = [
  'lowerCaseLng',
  'nonExplicitSupportedLngs',
  'load',
  'partialBundledLanguages',
  'returnNull',
  'returnEmptyString',
  'returnObjects',
  'joinArrays',
  'keySeparator',
  'nsSeparator',
  'pluralSeparator',
  'contextSeparator',
  'fallbackNS',
  'ns',
  'defaultNS',
  'debug',
];

/**
 * Stable stringify that sorts object keys to ensure consistent output
 * regardless of property order
 */
const stableStringify = (value: any): string => {
  if (value === null || value === undefined) {
    return JSON.stringify(value);
  }

  if (typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    // Arrays maintain their order
    return `[${value.map(item => stableStringify(item)).join(',')}]`;
  }

  // For objects, sort keys and recursively stringify values
  const sortedKeys = Object.keys(value).sort();
  const sortedEntries = sortedKeys.map(key => {
    const stringifiedValue = stableStringify(value[key]);
    return `${JSON.stringify(key)}:${stringifiedValue}`;
  });

  return `{${sortedEntries.join(',')}}`;
};

const buildDetectorConfigKey = (
  languages: string[],
  fallbackLanguage: string,
  mergedDetection: LanguageDetectorOptions,
): string => {
  return stableStringify({
    languages,
    fallbackLanguage,
    detection: mergedDetection,
  });
};

const pickSafeDetectionOptions = (
  userInitOptions?: I18nInitOptions,
): Partial<I18nInitOptions> & Record<string, any> => {
  if (!userInitOptions) {
    return {};
  }
  const safeOptions: Partial<I18nInitOptions> & Record<string, any> = {};
  for (const key of DETECTOR_SAFE_OPTION_KEYS) {
    const value = (userInitOptions as any)[key];
    if (value !== undefined) {
      safeOptions[key] = value;
    }
  }
  if ((userInitOptions as any).interpolation) {
    safeOptions.interpolation = { ...(userInitOptions as any).interpolation };
  }
  return safeOptions;
};

const cleanupDetectorCacheEntry = (entry?: DetectorCacheEntry) => {
  if (!entry || !entry.isTemporary) {
    return;
  }
  const instance = entry.instance as any;
  try {
    instance?.removeAllListeners?.();
  } catch (error) {
    void error;
  }
  try {
    instance?.off?.('*');
  } catch (error) {
    void error;
  }
  try {
    instance?.services?.backendConnector?.backend?.stop?.();
  } catch (error) {
    void error;
  }
  try {
    instance?.services?.backendConnector?.backend?.close?.();
  } catch (error) {
    void error;
  }
};

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
interface DetectorInitResult {
  detectorInstance: I18nInstance;
  isTemporary: boolean;
}

const createDetectorInstance = (
  baseInstance: I18nInstance,
  configKey: string,
): { instance: I18nInstance; isTemporary: boolean } => {
  const cached = detectorInstanceCache.get(baseInstance);
  if (cached && cached.configKey === configKey) {
    return { instance: cached.instance, isTemporary: cached.isTemporary };
  }

  if (cached) {
    cleanupDetectorCacheEntry(cached);
    detectorInstanceCache.delete(baseInstance);
  }

  const createNewInstance = (): {
    instance: I18nInstance;
    isTemporary: boolean;
  } => {
    if (typeof baseInstance.createInstance === 'function') {
      try {
        const created = baseInstance.createInstance();
        if (created) {
          return { instance: created, isTemporary: true };
        }
      } catch (error) {
        void error;
      }
    }

    if (typeof baseInstance.cloneInstance === 'function') {
      try {
        const cloned = baseInstance.cloneInstance();
        if (cloned) {
          return { instance: cloned, isTemporary: true };
        }
      } catch (error) {
        void error;
      }
    }

    return { instance: baseInstance, isTemporary: false };
  };

  const created = createNewInstance();
  if (created.isTemporary) {
    detectorInstanceCache.set(baseInstance, {
      instance: created.instance,
      isTemporary: true,
      configKey,
    });
  }
  return created;
};

const initializeI18nForDetector = async (
  i18nInstance: I18nInstance,
  options: BaseLanguageDetectionOptions,
): Promise<DetectorInitResult> => {
  const mergedDetection = mergeDetectionOptions(
    options.i18nextDetector,
    options.detection,
    options.localePathRedirect,
    options.userInitOptions,
  );

  const configKey = buildDetectorConfigKey(
    options.languages,
    options.fallbackLanguage,
    mergedDetection,
  );

  const { instance, isTemporary } = createDetectorInstance(
    i18nInstance,
    configKey,
  );

  const safeUserOptions = pickSafeDetectionOptions(options.userInitOptions);

  // 仅初始化检测能力，不加载任何资源，避免与后续 backend 初始化冲突。
  const initOptions: I18nInitOptions = {
    ...safeUserOptions,
    fallbackLng: options.fallbackLanguage,
    supportedLngs: options.languages,
    detection: mergedDetection,
    initImmediate: true,
    react: {
      useSuspense: false,
    },
  };

  // 确保检测实例加载了语言探测插件
  useI18nextLanguageDetector(instance);

  if (!instance.isInitialized) {
    await instance.init(initOptions);
  } else if (isTemporary) {
    await instance.init(initOptions);
  }

  return { detectorInstance: instance, isTemporary };
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

  const { detectorInstance, isTemporary } = await initializeI18nForDetector(
    i18nInstance,
    options,
  );

  try {
    const request = options.ssrContext?.request;
    if (!isBrowser() && !request) {
      return undefined;
    }

    const detectorLang = detectLanguage(
      detectorInstance,
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
    if (detectorInstance.isInitialized && detectorInstance.language) {
      const currentLang = detectorInstance.language;
      if (isLanguageSupported(currentLang, options.languages)) {
        return currentLang;
      }
    }
  } catch (error) {
    // Silently ignore errors
  } finally {
    // 清理临时实例，避免影响后续正式初始化
    if (isTemporary && detectorInstance !== i18nInstance) {
      // 临时实例保存在缓存中，留待复用
      detectorInstanceCache.set(i18nInstance, {
        instance: detectorInstance,
        isTemporary: true,
        configKey: buildDetectorConfigKey(
          options.languages,
          options.fallbackLanguage,
          mergedDetection,
        ),
      });
    } else if (detectorInstance === i18nInstance) {
      // 作为兜底，防止 i18nInstance 被检测 init 污染
      (i18nInstance as any).isInitialized = false;
      delete (i18nInstance as any).language;
    }
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
