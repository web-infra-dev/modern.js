import { isBrowser } from '@modern-js/runtime';
import type { BaseBackendOptions } from '../shared/type';
import type { I18nInitOptions, I18nInstance } from './i18n';
import { mergeBackendOptions } from './i18n/backend/config';
import { detectLanguage } from './i18n/detection';
import { mergeDetectionOptions } from './i18n/detection/config';
import {
  detectLanguageFromPath as detectLanguageFromPathUtil,
  getLanguageFromSSRData,
} from './utils';

/**
 * Language detection result
 */
export interface LanguageDetectionResult {
  detectedLanguage?: string;
  finalLanguage: string;
}

/**
 * Options for language detection
 */
export interface LanguageDetectionOptions {
  languages: string[];
  fallbackLanguage: string;
  localePathRedirect: boolean;
  i18nextDetector: boolean;
  userInitOptions?: I18nInitOptions;
  backend?: BaseBackendOptions;
  backendEnabled?: boolean;
  pathname: string;
  entryName?: string;
  ssrContext?: any;
}

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
    userInitOptions,
    backend,
    backendEnabled,
    pathname,
    entryName,
    ssrContext,
  } = options;

  let detectedLanguage: string | undefined;

  // Priority 1: SSR data
  if (isBrowser()) {
    try {
      const ssrLanguage = getLanguageFromSSRData(window);
      if (
        ssrLanguage &&
        (languages.length === 0 || languages.includes(ssrLanguage))
      ) {
        detectedLanguage = ssrLanguage;
      }
    } catch (error) {
      // Silently ignore errors
    }
  }

  // Priority 2: Path detection
  if (!detectedLanguage && localePathRedirect) {
    try {
      const pathDetection = detectLanguageFromPathUtil(
        pathname,
        entryName,
        languages,
        localePathRedirect,
      );
      if (pathDetection.detected && pathDetection.language) {
        detectedLanguage = pathDetection.language;
      }
    } catch (error) {
      // Silently ignore errors
    }
  }

  // Priority 3: i18next detector
  if (!detectedLanguage && i18nextDetector) {
    if (!i18nInstance.isInitialized) {
      const initialLng = userInitOptions?.lng || fallbackLanguage;
      const mergedDetection = mergeDetectionOptions(userInitOptions?.detection);
      if (localePathRedirect && mergedDetection?.order) {
        mergedDetection.order = mergedDetection.order.filter(
          (item: string) => item !== 'path',
        );
      }
      const mergeBackend = backendEnabled
        ? mergeBackendOptions(userInitOptions?.backend, backend)
        : userInitOptions?.backend;

      const initOptions: any = {
        ...(userInitOptions || {}),
        lng: initialLng,
        fallbackLng: fallbackLanguage,
        supportedLngs: languages,
        detection: mergedDetection,
        backend: mergeBackend,
        react: {
          ...((userInitOptions as any)?.react || {}),
          useSuspense: isBrowser()
            ? ((userInitOptions as any)?.react?.useSuspense ?? true)
            : false,
        },
      };
      await i18nInstance.init(initOptions);
    }

    let detectorLang: string | undefined;
    try {
      if (isBrowser()) {
        detectorLang = detectLanguage(i18nInstance);
      } else {
        const request = ssrContext?.request;
        if (request) {
          detectorLang = detectLanguage(i18nInstance, request as any);
        }
      }

      if (detectorLang) {
        if (languages.length === 0 || languages.includes(detectorLang)) {
          detectedLanguage = detectorLang;
        }
      } else if (i18nInstance.isInitialized && i18nInstance.language) {
        // Fallback to instance's current language if detector didn't detect
        const currentLang = i18nInstance.language;
        if (languages.length === 0 || languages.includes(currentLang)) {
          detectedLanguage = currentLang;
        }
      }
    } catch (error) {
      // Silently ignore errors
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
 * Ensure resources are loaded in SSR
 */
export const ensureResourcesLoaded = async (
  instance: I18nInstance,
  finalLanguage: string,
  userInitOptions?: I18nInitOptions,
): Promise<void> => {
  const nsArray = userInitOptions?.ns ||
    userInitOptions?.defaultNS || ['translation'];
  const namespaces = Array.isArray(nsArray) ? nsArray : [nsArray];
  const loadNamespaces = (instance as any).loadNamespaces;

  // First, try to explicitly load all namespaces
  if (loadNamespaces && typeof loadNamespaces === 'function') {
    try {
      await loadNamespaces(namespaces);
    } catch (error) {
      // Silently continue if loadNamespaces fails
    }
  }

  // Wait for backend to finish loading all resources
  const backendConnector = (instance as any).services?.backendConnector;
  if (backendConnector?.backend) {
    const maxWaitTime = 5000; // 5 seconds max wait
    const startTime = Date.now();
    await new Promise<void>(resolve => {
      const checkResources = () => {
        const now = Date.now();
        if (now - startTime > maxWaitTime) {
          // Timeout, resolve anyway to avoid hanging
          resolve();
          return;
        }

        // Check if all namespaces have resources loaded
        const hasResourceBundle = (instance as any).hasResourceBundle;
        const allLoaded = namespaces.every((ns: string) => {
          if (hasResourceBundle && typeof hasResourceBundle === 'function') {
            return hasResourceBundle(finalLanguage, ns) === true;
          }
          // Fallback: check if resource exists in store
          const store = (instance as any).store;
          if (store) {
            const resource = store.data[finalLanguage]?.[ns];
            return resource !== undefined && resource !== null;
          }
          return false;
        });

        // Also check backend connector state
        const backendState = backendConnector.state?.[finalLanguage];
        const backendDone =
          !backendState ||
          namespaces.every((ns: string) => {
            const state = backendState[ns];
            return state === 'loaded' || state === 'failed';
          });

        // All checks passed, resources are ready
        if (allLoaded && backendDone) {
          resolve();
        } else {
          // Check again after a short delay
          setTimeout(checkResources, 10);
        }
      };
      checkResources();
    });
  } else {
    // If no backend, just wait a bit for any async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50));
  }
};

/**
 * Merge detection and backend options
 */
export const mergeDetectionAndBackendOptions = (
  i18nextDetector: boolean,
  localePathRedirect: boolean,
  userInitOptions?: I18nInitOptions,
  backend?: BaseBackendOptions,
  backendEnabled?: boolean,
) => {
  // Exclude 'path' from detection order to avoid conflict with manual path detection
  const mergedDetection = i18nextDetector
    ? mergeDetectionOptions(userInitOptions?.detection)
    : userInitOptions?.detection;
  if (localePathRedirect && mergedDetection?.order) {
    mergedDetection.order = mergedDetection.order.filter(
      (item: string) => item !== 'path',
    );
  }

  // Merge backend config from CLI plugin with user's runtime config
  const mergeBackend = backendEnabled
    ? mergeBackendOptions(userInitOptions?.backend, backend)
    : userInitOptions?.backend;

  return { mergedDetection, mergeBackend };
};
