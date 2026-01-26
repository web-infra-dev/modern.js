import { isBrowser } from '@modern-js/runtime';
import { createContext, useCallback, useContext, useMemo } from 'react';
import type { FC, ReactNode } from 'react';
import type { I18nInstance } from './i18n';
import type { SdkBackend } from './i18n/backend/sdk-backend';
import { cacheUserLanguage } from './i18n/detection';
import {
  buildLocalizedUrl,
  detectLanguageFromPath,
  getEntryPath,
  shouldIgnoreRedirect,
  useRouterHooks,
} from './utils';

export interface ModernI18nContextValue {
  language: string;
  i18nInstance: I18nInstance;
  // Plugin configuration for useModernI18n hook
  entryName?: string;
  languages?: string[];
  localePathRedirect?: boolean;
  ignoreRedirectRoutes?: string[] | ((pathname: string) => boolean);
  // Callback to update language in context
  updateLanguage?: (newLang: string) => void;
}

const ModernI18nContext = createContext<ModernI18nContextValue | null>(null);

export interface ModernI18nProviderProps {
  children: ReactNode;
  value: ModernI18nContextValue;
}

export const ModernI18nProvider: FC<ModernI18nProviderProps> = ({
  children,
  value,
}) => {
  return (
    <ModernI18nContext.Provider value={value}>
      {children}
    </ModernI18nContext.Provider>
  );
};

export interface UseModernI18nReturn {
  language: string;
  changeLanguage: (newLang: string) => Promise<void>;
  i18nInstance: I18nInstance;
  supportedLanguages: string[];
  isLanguageSupported: (lang: string) => boolean;
  // Indicates if translation resources for current language are ready to use
  isResourcesReady: boolean;
}

/**
 * Hook for accessing i18n functionality in Modern.js applications.
 *
 * This hook provides:
 * - Current language from URL params or i18n context
 * - changeLanguage function that updates both i18n instance and URL
 * - Direct access to the i18n instance
 * - List of supported languages
 * - Helper function to check if a language is supported
 *
 * @param options - Optional configuration to override context settings
 * @returns Object containing i18n functionality and utilities
 */
export const useModernI18n = (): UseModernI18nReturn => {
  const context = useContext(ModernI18nContext);
  if (!context) {
    throw new Error('useModernI18n must be used within a ModernI18nProvider');
  }

  const {
    language: contextLanguage,
    i18nInstance,
    languages,
    localePathRedirect,
    ignoreRedirectRoutes,
    updateLanguage,
  } = context;

  // Get router hooks safely
  const { navigate, location, hasRouter } = useRouterHooks();

  // Get current language from context (which reflects the actual current language)
  // URL params might be stale after language changes, so we prioritize the context language
  const currentLanguage = contextLanguage;

  /**
   * Changes the current language and updates the URL accordingly.
   *
   * This function:
   * 1. Updates the i18n instance language
   * 2. Updates the URL by replacing the language prefix in the current path
   * 3. Triggers a navigation to the new URL
   *
   * @param newLang - The new language code to switch to
   */
  const changeLanguage = useCallback(
    async (newLang: string) => {
      try {
        // Validate language
        if (!newLang || typeof newLang !== 'string') {
          throw new Error('Language must be a non-empty string');
        }

        await i18nInstance?.setLang?.(newLang);
        await i18nInstance?.changeLanguage?.(newLang);

        if (isBrowser()) {
          const detectionOptions = i18nInstance.options?.detection;
          cacheUserLanguage(i18nInstance, newLang, detectionOptions);
        }

        if (
          localePathRedirect &&
          isBrowser() &&
          hasRouter &&
          navigate &&
          location
        ) {
          const currentPath = location.pathname;
          const entryPath = getEntryPath();
          const relativePath = currentPath.replace(entryPath, '');

          // Check if the path already contains the target language
          const pathLanguage = detectLanguageFromPath(
            currentPath,
            languages || [],
            localePathRedirect,
          );

          // If path already has the target language, skip redirect
          if (pathLanguage.detected && pathLanguage.language === newLang) {
            return;
          }

          if (
            !shouldIgnoreRedirect(
              relativePath,
              languages || [],
              ignoreRedirectRoutes,
            )
          ) {
            const newPath = buildLocalizedUrl(
              relativePath,
              newLang,
              languages || [],
            );
            const newUrl =
              entryPath + newPath + location.search + location.hash;

            await navigate(newUrl, { replace: true });
          }
        } else if (localePathRedirect && isBrowser() && !hasRouter) {
          const currentPath = window.location.pathname;
          const entryPath = getEntryPath();
          const relativePath = currentPath.replace(entryPath, '');

          // Check if the path already contains the target language
          const pathLanguage = detectLanguageFromPath(
            currentPath,
            languages || [],
            localePathRedirect,
          );

          // If path already has the target language, skip redirect
          if (pathLanguage.detected && pathLanguage.language === newLang) {
            return;
          }

          if (
            !shouldIgnoreRedirect(
              relativePath,
              languages || [],
              ignoreRedirectRoutes,
            )
          ) {
            const newPath = buildLocalizedUrl(
              relativePath,
              newLang,
              languages || [],
            );
            const newUrl =
              entryPath +
              newPath +
              window.location.search +
              window.location.hash;

            window.history.pushState(null, '', newUrl);
          }
        }

        // Update language state after URL update
        if (updateLanguage) {
          updateLanguage(newLang);
        }
      } catch (error) {
        console.error('Failed to change language:', error);
        throw error;
      }
    },
    [
      i18nInstance,
      updateLanguage,
      localePathRedirect,
      ignoreRedirectRoutes,
      languages,
      hasRouter,
      navigate,
      location,
    ],
  );

  // Helper function to check if a language is supported
  const isLanguageSupported = useCallback(
    (lang: string) => {
      return languages?.includes(lang) || false;
    },
    [languages],
  );

  // Check if current language resources are ready
  // This checks if all required namespaces for the current language are loaded
  const isResourcesReady = useMemo(() => {
    if (!i18nInstance?.isInitialized) {
      return false;
    }

    // Get backend instance
    const backend = i18nInstance?.services?.backend as SdkBackend | undefined;

    // If using SDK backend, check loading state
    if (backend && typeof backend.isLoading === 'function') {
      // Check if any resource for current language is loading
      const loadingResources = backend.getLoadingResources();
      const isCurrentLanguageLoading = loadingResources.some(
        ({ language }) => language === currentLanguage,
      );
      if (isCurrentLanguageLoading) {
        return false;
      }
    }

    // Check if resources exist in store
    const store = (i18nInstance as any).store;
    if (!store?.data) {
      return false;
    }

    const langData = store.data[currentLanguage];
    if (!langData || typeof langData !== 'object') {
      return false;
    }

    // Get required namespaces
    const options = i18nInstance.options;
    const namespaces = options?.ns || options?.defaultNS || ['translation'];
    const requiredNamespaces = Array.isArray(namespaces)
      ? namespaces
      : [namespaces];

    // Check if all required namespaces are loaded
    return requiredNamespaces.every(ns => {
      const nsData = langData[ns];
      return (
        nsData && typeof nsData === 'object' && Object.keys(nsData).length > 0
      );
    });
  }, [currentLanguage, i18nInstance]);

  return {
    language: currentLanguage,
    changeLanguage,
    i18nInstance,
    supportedLanguages: languages || [],
    isLanguageSupported,
    isResourcesReady,
  };
};
