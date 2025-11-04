import { isBrowser } from '@modern-js/runtime';
import { createContext, useCallback, useContext } from 'react';
import type { FC, ReactNode } from 'react';
import type { I18nInstance } from './i18n';
import { buildLocalizedUrl, getEntryPath } from './utils';

export interface ModernI18nContextValue {
  language: string;
  i18nInstance: I18nInstance;
  // Plugin configuration for useModernI18n hook
  entryName?: string;
  languages?: string[];
  localePathRedirect?: boolean;
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
}

// Safe hook wrapper to handle cases where router context is not available
const useRouterHooks = () => {
  try {
    // Dynamically import router hooks to avoid issues when router context is not available
    const {
      useLocation,
      useNavigate,
      useParams,
    } = require('@modern-js/runtime/router');
    return {
      navigate: useNavigate(),
      location: useLocation(),
      params: useParams(),
      hasRouter: true,
    };
  } catch (error) {
    // Router context not available, return fallback values
    return {
      navigate: null,
      location: null,
      params: {},
      hasRouter: false,
    };
  }
};

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
    entryName,
    languages,
    localePathRedirect,
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

        // Update i18n instance
        await i18nInstance.changeLanguage(newLang);

        // Update URL if locale detection is enabled, we're in browser, and router is available
        if (
          localePathRedirect &&
          isBrowser() &&
          hasRouter &&
          navigate &&
          location
        ) {
          const currentPath = location.pathname;
          const entryPath = getEntryPath(entryName);
          const relativePath = currentPath.replace(entryPath, '');

          // Build new path with updated language
          const newPath = buildLocalizedUrl(
            relativePath,
            newLang,
            languages || [],
          );
          const newUrl = entryPath + newPath + location.search + location.hash;

          // Navigate to new URL
          navigate(newUrl, { replace: true });
        } else if (localePathRedirect && isBrowser() && !hasRouter) {
          // Fallback: use window.history API when router is not available
          const currentPath = window.location.pathname;
          const entryPath = getEntryPath(entryName);
          const relativePath = currentPath.replace(entryPath, '');

          // Build new path with updated language
          const newPath = buildLocalizedUrl(
            relativePath,
            newLang,
            languages || [],
          );
          const newUrl =
            entryPath + newPath + window.location.search + window.location.hash;

          // Use history API to navigate without page reload
          window.history.pushState(null, '', newUrl);
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
      entryName,
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

  return {
    language: currentLanguage,
    changeLanguage,
    i18nInstance,
    supportedLanguages: languages || [],
    isLanguageSupported,
  };
};
