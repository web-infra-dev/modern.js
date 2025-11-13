import { isBrowser } from '@modern-js/runtime';
import type { BaseBackendOptions } from '../../shared/type';
import { mergeBackendOptions } from './backend';
import { useI18nextBackend } from './backend/middleware';
import { mergeDetectionOptions } from './detection';
import type { I18nInitOptions, I18nInstance } from './instance';
import { isI18nInstance } from './instance';

export function assertI18nInstance(obj: any): asserts obj is I18nInstance {
  if (!isI18nInstance(obj)) {
    throw new Error('Object does not implement I18nInstance interface');
  }
}

/**
 * Build initialization options for i18n instance
 */
export const buildInitOptions = (
  finalLanguage: string,
  fallbackLanguage: string,
  languages: string[],
  mergedDetection: any,
  mergedBackend: any,
  userInitOptions?: I18nInitOptions,
  useSuspense?: boolean,
): I18nInitOptions => {
  const defaultUseSuspense =
    useSuspense !== undefined
      ? useSuspense
      : isBrowser()
        ? (userInitOptions?.react?.useSuspense ?? true)
        : false;

  return {
    lng: finalLanguage,
    fallbackLng: fallbackLanguage,
    supportedLngs: languages,
    detection: mergedDetection,
    backend: mergedBackend,
    ...(userInitOptions || {}),
    react: {
      ...(userInitOptions?.react || {}),
      useSuspense: defaultUseSuspense,
    },
  };
};

/**
 * Ensure i18n instance language matches the final detected language
 */
export const ensureLanguageMatch = async (
  i18nInstance: I18nInstance,
  finalLanguage: string,
): Promise<void> => {
  if (i18nInstance.language !== finalLanguage) {
    await i18nInstance.changeLanguage(finalLanguage);
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
    const initOptions = buildInitOptions(
      finalLanguage,
      fallbackLanguage,
      languages,
      mergedDetection,
      mergedBackend,
      userInitOptions,
      useSuspense,
    );
    await i18nInstance.init(initOptions);
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
  if (backendEnabled) {
    useI18nextBackend(i18nInstance);
    const mergedBackend = mergeBackendOptions(backend, userInitOptions);
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
