import {
  type RuntimeContext,
  type RuntimePlugin,
  isBrowser,
  useRuntimeContext,
} from '@modern-js/runtime';
import type React from 'react';
import { useEffect, useState } from 'react';
import type { BaseLocaleDetectionOptions } from '../shared/type';
import { ModernI18nProvider } from './context';
import type { I18nInitOptions, I18nInstance } from './i18n';
import { getI18nInstance } from './i18n';
import {
  detectLanguageWithPriority,
  exportServerLngToWindow,
  mergeDetectionOptions,
} from './i18n/detection';
import { useI18nextLanguageDetector } from './i18n/detection/middleware';
import { getI18nextProvider, getInitReactI18next } from './i18n/instance';
import { detectLanguageFromPath } from './utils';

export interface I18nPluginOptions {
  entryName?: string;
  localeDetection?: BaseLocaleDetectionOptions;
  i18nInstance?: I18nInstance;
  changeLanguage?: (lang: string) => void;
  initOptions?: I18nInitOptions;
}

const getPathname = (context: RuntimeContext) => {
  if (isBrowser()) {
    return window.location.pathname;
  }
  return context.ssrContext?.request?.pathname || '/';
};

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
      localePathRedirect = false,
      i18nextDetector = true,
      languages = [],
      fallbackLanguage = 'en',
    } = localeDetection || {};

    let I18nextProvider: React.FunctionComponent<any> | null;

    api.onBeforeRender(async context => {
      let i18nInstance = await getI18nInstance(userI18nInstance);
      const initReactI18next = await getInitReactI18next();
      I18nextProvider = await getI18nextProvider();
      if (initReactI18next) {
        i18nInstance.use(initReactI18next);
      }

      const pathname = getPathname(context);

      // Setup i18next language detector if enabled
      if (i18nextDetector) {
        useI18nextLanguageDetector(i18nInstance);
      }

      // Detect language with priority: SSR data > path > i18next detector > fallback
      const { finalLanguage } = await detectLanguageWithPriority(i18nInstance, {
        languages,
        fallbackLanguage,
        localePathRedirect,
        i18nextDetector,
        userInitOptions,
        pathname,
        ssrContext: context.ssrContext,
      });

      if (!i18nInstance.isInitialized) {
        // Merge detection options if i18nextDetector is enabled
        const { mergedDetection } = mergeDetectionOptions(
          i18nextDetector,
          localePathRedirect,
          userInitOptions,
        );

        const initOptions: I18nInitOptions = {
          lng: finalLanguage,
          fallbackLng: fallbackLanguage,
          supportedLngs: languages,
          detection: mergedDetection,
          ...(userInitOptions || {}),
        };
        await i18nInstance.init(initOptions);
      }
      if (!isBrowser() && i18nInstance.cloneInstance) {
        i18nInstance = i18nInstance.cloneInstance();
        if (i18nInstance.language !== finalLanguage) {
          await i18nInstance.changeLanguage(finalLanguage);
        }
      }
      if (localePathRedirect && i18nInstance.language !== finalLanguage) {
        // If instance is already initialized but language doesn't match the path, update it
        await i18nInstance.changeLanguage(finalLanguage);
      }

      if (!isBrowser()) {
        exportServerLngToWindow(context, finalLanguage);
      }
      context.i18nInstance = i18nInstance;
    });

    api.wrapRoot(App => {
      return props => {
        const runtimeContext = useRuntimeContext();
        const i18nInstance = (runtimeContext as any).i18nInstance;
        const initialLang =
          i18nInstance?.language || (localeDetection?.fallbackLanguage ?? 'en');
        const [lang, setLang] = useState(initialLang);

        if (i18nInstance?.language && i18nInstance.translator) {
          i18nInstance.translator.language = i18nInstance.language;
        }

        // Get pathname from appropriate source based on environment

        // Initialize language from URL on mount (only when localeDetection is enabled)
        useEffect(() => {
          if (localePathRedirect) {
            const currentPathname = getPathname(
              runtimeContext as RuntimeContext,
            );
            const pathDetection = detectLanguageFromPath(
              currentPathname,
              languages,
              localePathRedirect,
            );
            if (pathDetection.detected && pathDetection.language) {
              const currentLang = pathDetection.language;
              if (currentLang !== lang) {
                setLang(currentLang);
                i18nInstance.changeLanguage(currentLang);
              }
            }
          } else {
            const instanceLang = i18nInstance.language;
            if (instanceLang && instanceLang !== lang) {
              setLang(instanceLang);
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
