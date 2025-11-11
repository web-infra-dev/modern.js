import {
  type RuntimePlugin,
  isBrowser,
  useRuntimeContext,
} from '@modern-js/runtime';
import type React from 'react';
import { useEffect, useState } from 'react';
import type { BaseLocaleDetectionOptions } from '../utils/config';
import { ModernI18nProvider } from './context';
import type { I18nInitOptions, I18nInstance } from './i18n';
import { getI18nInstance } from './i18n';
import { getI18nextProvider, getInitReactI18next } from './i18n/instance';
import { getEntryPath, getLanguageFromPath } from './utils';

export interface I18nPluginOptions {
  entryName?: string;
  localeDetection?: BaseLocaleDetectionOptions;
  i18nInstance?: I18nInstance;
  changeLanguage?: (lang: string) => void;
  initOptions?: I18nInitOptions;
}

export const i18nPlugin = (options: I18nPluginOptions): RuntimePlugin => ({
  name: '@modern-js/plugin-i18n',
  setup: api => {
    const {
      entryName,
      i18nInstance: userI18nInstance,
      initOptions: userInitOptions,
      localeDetection,
    } = options;
    const {
      localePathRedirect,
      languages = [],
      fallbackLanguage = 'en',
    } = localeDetection || {};
    let I18nextProvider: React.FunctionComponent<any> | null;

    // Helper function to detect language from path
    const detectLanguageFromPath = (pathname: string) => {
      if (localePathRedirect) {
        const relativePath = pathname.replace(getEntryPath(entryName), '');
        const detectedLang = getLanguageFromPath(
          relativePath,
          languages,
          fallbackLanguage,
        );
        // If no language is detected from path, use fallback language
        return detectedLang || fallbackLanguage;
      }
      return fallbackLanguage;
    };

    api.onBeforeRender(async context => {
      let i18nInstance = await getI18nInstance(userI18nInstance);
      const initReactI18next = await getInitReactI18next();
      I18nextProvider = await getI18nextProvider();
      if (initReactI18next) {
        i18nInstance.use(initReactI18next);
      }
      // Always detect language from path for consistency between SSR and client
      let initialLanguage = fallbackLanguage;
      if (localePathRedirect) {
        if (isBrowser()) {
          // In browser, get from window.location
          initialLanguage = detectLanguageFromPath(window.location.pathname);
        } else {
          // In SSR, get from request context
          const pathname = context.ssrContext?.request?.pathname || '/';
          initialLanguage = detectLanguageFromPath(pathname);
        }
      }
      if (!i18nInstance.isInitialized) {
        const initOptions: I18nInitOptions = {
          lng: initialLanguage,
          fallbackLng: fallbackLanguage,
          supportedLngs: languages,
          ...(userInitOptions || {}),
        };
        await i18nInstance.init(initOptions);
      }
      if (!isBrowser() && i18nInstance.cloneInstance) {
        i18nInstance = i18nInstance.cloneInstance();
      }
      if (localePathRedirect && i18nInstance.language !== initialLanguage) {
        // If instance is already initialized but language doesn't match the path, update it
        await i18nInstance.changeLanguage(initialLanguage);
      }
      context.i18nInstance = i18nInstance;
    });

    api.wrapRoot(App => {
      return props => {
        const runtimeContext = useRuntimeContext();
        const i18nInstance = (runtimeContext as any).i18nInstance;
        const [lang, setLang] = useState(i18nInstance.language);

        if (!isBrowser) {
          (i18nInstance as any).translator.language = i18nInstance.language;
        }

        // Get pathname from appropriate source based on environment
        const getCurrentPathname = () => {
          if (isBrowser()) {
            return window.location.pathname;
          } else {
            // In SSR, get pathname from request context
            return runtimeContext.request?.pathname || '/';
          }
        };

        // Initialize language from URL on mount (only when localeDetection is enabled)
        useEffect(() => {
          if (localePathRedirect) {
            const currentPathname = getCurrentPathname();
            const currentLang = detectLanguageFromPath(currentPathname);
            if (currentLang !== lang) {
              setLang(currentLang);
              // Update i18n instance language
              i18nInstance.changeLanguage(currentLang);
            }
          }
        }, []);

        // Context value contains language, i18nInstance, and plugin configuration
        // changeLanguage is now implemented in the useModernI18n hook
        const contextValue = {
          language: lang,
          i18nInstance,
          entryName,
          languages,
          localePathRedirect,
          updateLanguage: setLang,
        };

        if (I18nextProvider) {
          return (
            <I18nextProvider i18n={i18nInstance}>
              <ModernI18nProvider value={contextValue}>
                <App {...props} />
              </ModernI18nProvider>
            </I18nextProvider>
          );
        }

        return (
          <ModernI18nProvider value={contextValue}>
            <App {...props} />
          </ModernI18nProvider>
        );
      };
    });
  },
});

export { useModernI18n } from './context';
export { I18nLink } from './I18nLink';
export default i18nPlugin;
