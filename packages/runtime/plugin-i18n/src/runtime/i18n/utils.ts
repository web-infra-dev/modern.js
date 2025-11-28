import { isBrowser } from '@modern-js/runtime';
import type { BaseBackendOptions } from '../../shared/type';
import { mergeBackendOptions } from './backend';
import { HttpBackendWithSave } from './backend/middleware';
import { useI18nextBackend } from './backend/middleware';
import { SdkBackend } from './backend/sdk-backend';
import { mergeDetectionOptions } from './detection';
import type { I18nInitOptions, I18nInstance } from './instance';
import {
  getActualI18nextInstance,
  isI18nInstance,
  isI18nWrapperInstance,
} from './instance';

export function assertI18nInstance(obj: any): asserts obj is I18nInstance {
  if (!isI18nInstance(obj)) {
    throw new Error('Object does not implement I18nInstance interface');
  }
}

/**
 * Build initialization options for i18n instance
 */
export const buildInitOptions = async (
  finalLanguage: string,
  fallbackLanguage: string,
  languages: string[],
  mergedDetection: any,
  mergedBackend: any,
  userInitOptions?: I18nInitOptions,
  useSuspense?: boolean,
  i18nInstance?: I18nInstance,
): Promise<I18nInitOptions> => {
  const defaultUseSuspense =
    useSuspense !== undefined
      ? useSuspense
      : isBrowser()
        ? (userInitOptions?.react?.useSuspense ?? true)
        : false;

  // If backend is already configured via useI18nextBackend (has _useChainedBackend),
  // we need to pass the chained backend config to init() so it can initialize properly
  const isChainedBackend = !!mergedBackend?._useChainedBackend;

  // If using chained backend, we need to pass the backend config to init()
  // but exclude it from userInitOptions to avoid conflicts
  // For non-chained backend, we also exclude it to ensure mergedBackend is used
  const sanitizedUserInitOptions = userInitOptions
    ? { ...userInitOptions, backend: undefined }
    : undefined;

  // Build base initOptions first, excluding backend to set it separately
  const { backend: _removedBackend, ...userOptionsWithoutBackend } =
    sanitizedUserInitOptions || {};

  const initOptions: I18nInitOptions = {
    lng: finalLanguage,
    fallbackLng: fallbackLanguage,
    supportedLngs: languages,
    detection: mergedDetection,
    initImmediate: sanitizedUserInitOptions?.initImmediate ?? true,
    react: {
      ...(sanitizedUserInitOptions?.react || {}),
      useSuspense: defaultUseSuspense,
    },
    // Spread user options (without backend) to allow user options to override
    ...userOptionsWithoutBackend,
  };

  // For chained backend, we need to pass the backend config to init()
  // The backend classes (Backend, SdkBackend) are already set via useI18nextBackend
  // but we need to pass the complete chained backend config to init()
  // IMPORTANT: For i18next-chained-backend, we need to pass backends array in init() options
  // because ChainedBackend reads it from initOptions.backend.backends during initialization
  // IMPORTANT: For non-chained backend, we need to pass the backend config to init() so i18next
  // can load resources from the configured loadPath
  // IMPORTANT: Set backend config AFTER spreading user options to ensure it's not overridden
  if (mergedBackend) {
    if (isChainedBackend && mergedBackend._chainedBackendConfig) {
      // Try to get backend classes from i18nInstance.options.backend.backends first
      // This avoids importing fs-backend in browser environment
      let HttpBackend: any;
      let SdkBackendClass: any;

      if (
        i18nInstance?.options?.backend?.backends &&
        Array.isArray(i18nInstance.options.backend.backends) &&
        i18nInstance.options.backend.backends.length >= 2
      ) {
        // Use the backend classes already set by useI18nextBackend
        HttpBackend = i18nInstance.options.backend.backends[0];
        SdkBackendClass = i18nInstance.options.backend.backends[1];
      } else {
        // Fallback: use backend classes from middleware
        // Build tools will automatically select the correct file (.node.ts for Node.js, .ts for browser)
        // HttpBackendWithSave is exported from both middleware.ts (browser) and middleware.node.ts (Node.js)
        HttpBackend = HttpBackendWithSave;
        SdkBackendClass = SdkBackend;
      }

      // For chained backend, pass the complete chained backend config structure
      // Note: HttpBackend and SdkBackendClass are already wrapped
      // with save methods to ensure i18next-chained-backend's refresh logic is triggered
      initOptions.backend = {
        backends: [HttpBackend, SdkBackendClass],
        backendOptions: mergedBackend._chainedBackendConfig.backendOptions,
        cacheHitMode: mergedBackend.cacheHitMode || 'refreshAndUpdateStore',
      };
    } else {
      // For non-chained backend, pass the backend config directly
      // This ensures i18next can load resources from the configured loadPath
      // Remove internal properties (_useChainedBackend, _chainedBackendConfig) before passing to init()
      const { _useChainedBackend, _chainedBackendConfig, ...cleanBackend } =
        mergedBackend || {};
      initOptions.backend = cleanBackend;
    }
  }

  return initOptions;
};

/**
 * Ensure i18n instance language matches the final detected language
 */
export const ensureLanguageMatch = async (
  i18nInstance: I18nInstance,
  finalLanguage: string,
): Promise<void> => {
  if (i18nInstance.language !== finalLanguage) {
    await i18nInstance.setLang?.(finalLanguage);
    await i18nInstance.changeLanguage?.(finalLanguage);
  }
};

/**
 * Initialize i18n instance if not already initialized
 */
export const initializeI18nInstance = async (
  i18nInstance: I18nInstance,
  finalLanguage: string,
  fallbackLanguage: string,
  languages: string[],
  mergedDetection: any,
  mergedBackend: any,
  userInitOptions?: I18nInitOptions,
  useSuspense?: boolean,
): Promise<void> => {
  if (!i18nInstance.isInitialized) {
    const initOptions = await buildInitOptions(
      finalLanguage,
      fallbackLanguage,
      languages,
      mergedDetection,
      mergedBackend,
      userInitOptions,
      useSuspense,
      i18nInstance,
    );

    // For i18next, backend configuration must be passed to init() via initOptions.backend
    // The backend class is already registered via useI18nextBackend, but the config (loadPath, etc.)
    // needs to be in initOptions.backend for init() to use it
    const actualInstance = getActualI18nextInstance(i18nInstance);
    const savedBackendConfig =
      actualInstance?.options?.backend || i18nInstance.options?.backend;
    const isChainedBackendFromSaved =
      savedBackendConfig?.backends &&
      Array.isArray(savedBackendConfig.backends);

    await i18nInstance.init(initOptions);

    if (mergedBackend) {
      if (isI18nWrapperInstance(i18nInstance) && actualInstance?.options) {
        if (isChainedBackendFromSaved && initOptions.backend) {
          actualInstance.options.backend = {
            ...initOptions.backend,
            backends: savedBackendConfig.backends,
          };
        } else if (initOptions.backend) {
          actualInstance.options.backend = {
            ...actualInstance.options.backend,
            ...initOptions.backend,
          };
        }
      }

      if (hasOptions(i18nInstance)) {
        if (isChainedBackendFromSaved && initOptions.backend) {
          i18nInstance.options.backend = {
            ...initOptions.backend,
            backends: savedBackendConfig.backends,
          };
        } else if (initOptions.backend) {
          i18nInstance.options.backend = {
            ...i18nInstance.options.backend,
            ...initOptions.backend,
          };
        }
      }
    }

    if (mergedBackend && hasOptions(i18nInstance)) {
      // For chained backend with cacheHitMode: 'refreshAndUpdateStore',
      // i18next-chained-backend automatically:
      // 1. Loads from the first backend (HTTP/FS) and displays immediately
      // 2. Asynchronously loads from the second backend (SDK) and updates the store
      // 3. Triggers 'loaded' event when SDK resources are loaded, which causes React to re-render
      //
      // Note: i18next.init() returns a Promise that resolves when the first backend loads.
      // For chained backend, it does NOT wait for the second backend (SDK) to load.
      // The SDK backend loads asynchronously and triggers 'loaded' event automatically.
      const defaultNS =
        initOptions.defaultNS || initOptions.ns || 'translation';
      const ns = Array.isArray(defaultNS) ? defaultNS[0] : defaultNS;

      let retries = 20;
      while (retries > 0) {
        // Get the actual i18next instance to access store property
        const actualInstance = getActualI18nextInstance(i18nInstance);
        const store = (actualInstance as any).store;
        if (store?.data?.[finalLanguage]?.[ns]) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        retries--;
      }
    }
  }
};

/**
 * Type guard to check if i18n instance has options property
 */
function hasOptions(instance: I18nInstance): instance is I18nInstance & {
  options: NonNullable<I18nInstance['options']>;
} {
  return instance.options !== undefined && instance.options !== null;
}

/**
 * Setup cloned instance for SSR with backend support
 */
export const setupClonedInstance = async (
  i18nInstance: I18nInstance,
  finalLanguage: string,
  fallbackLanguage: string,
  languages: string[],
  backendEnabled: boolean,
  backend: BaseBackendOptions | undefined,
  i18nextDetector: boolean,
  detection: any,
  localePathRedirect: boolean,
  userInitOptions: I18nInitOptions | undefined,
): Promise<void> => {
  const mergedBackend = mergeBackendOptions(backend, userInitOptions);
  // Check if SDK is configured (allows standalone SDK usage even without locales directory)
  const hasSdkConfig =
    typeof userInitOptions?.backend?.sdk === 'function' ||
    (mergedBackend?.sdk && typeof mergedBackend.sdk === 'function');

  if (backendEnabled || hasSdkConfig) {
    useI18nextBackend(i18nInstance, mergedBackend);
    if (mergedBackend && hasOptions(i18nInstance)) {
      i18nInstance.options.backend = {
        ...i18nInstance.options.backend,
        ...mergedBackend,
      };
    }

    if (i18nInstance.isInitialized) {
      await ensureLanguageMatch(i18nInstance, finalLanguage);
    } else {
      const mergedDetection = mergeDetectionOptions(
        i18nextDetector,
        detection,
        localePathRedirect,
        userInitOptions,
      );
      await initializeI18nInstance(
        i18nInstance,
        finalLanguage,
        fallbackLanguage,
        languages,
        mergedDetection,
        mergedBackend,
        userInitOptions,
        false, // SSR always uses false for useSuspense
      );
    }
  } else {
    await ensureLanguageMatch(i18nInstance, finalLanguage);
  }
};
