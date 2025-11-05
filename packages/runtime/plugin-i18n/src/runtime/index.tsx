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
import { detectLanguage, useI18nextLanguageDetector } from './i18n/detection';
import {
  exportServerLngToWindow,
  mergeDetectionOptions,
} from './i18n/detection/config';
import { getI18nextProvider, getInitReactI18next } from './i18n/instance';
import { getEntryPath } from './utils';

/**
 * Validate languages array configuration
 * @param languages - Array of language codes to validate
 * @returns true if all languages are valid, false otherwise
 */
const validateLanguages = (languages: string[]): boolean => {
  return languages.every(lang => typeof lang === 'string' && lang.length > 0);
};

/**
 * Get language from SSR data in a type-safe way
 * @param window - The window object
 * @returns The language from SSR data or undefined
 */
const getLanguageFromSSRData = (window: Window): string | undefined => {
  // Type-safe access to SSR data via global Window interface
  const ssrData = window._SSR_DATA;
  return ssrData?.data?.i18nData?.lng;
};

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
      localePathRedirect = false,
      i18nextDetector = true,
      languages = [],
      fallbackLanguage = 'en',
    } = localeDetection || {};

    // Validate languages configuration
    if (!validateLanguages(languages)) {
      console.warn(
        '[@modern-js/plugin-i18n] Invalid languages configuration. All language codes must be non-empty strings.',
        { languages },
      );
    }

    let I18nextProvider: React.FunctionComponent<any> | null;

    const detectLanguageFromPath = (
      pathname: string,
    ): {
      detected: boolean;
      language?: string;
    } => {
      if (!localePathRedirect) {
        return { detected: false };
      }

      const relativePath = pathname.replace(getEntryPath(entryName), '');
      const segments = relativePath.split('/').filter(Boolean);
      const firstSegment = segments[0];

      if (firstSegment && languages.includes(firstSegment)) {
        return { detected: true, language: firstSegment };
      }

      return { detected: false };
    };

    api.onBeforeRender(async context => {
      let i18nInstance = await getI18nInstance(userI18nInstance);
      const initReactI18next = await getInitReactI18next();
      I18nextProvider = await getI18nextProvider();

      if (initReactI18next) {
        i18nInstance.use(initReactI18next);
      }

      const getPathname = () => {
        if (isBrowser()) {
          return window.location.pathname;
        }
        return context.ssrContext?.request?.pathname || '/';
      };

      // Language detection priority: SSR data > path > i18next detector > fallback
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
        } catch (error) {}
      }

      // Priority 2: Path detection
      if (!detectedLanguage && localePathRedirect) {
        try {
          const pathname = getPathname();
          const pathDetection = detectLanguageFromPath(pathname);
          if (pathDetection.detected && pathDetection.language) {
            detectedLanguage = pathDetection.language;
          }
        } catch (error) {}
      }

      if (i18nextDetector) {
        useI18nextLanguageDetector(i18nInstance);
      }

      // Exclude 'path' from detection order to avoid conflict with manual path detection
      const mergedDetection = i18nextDetector
        ? mergeDetectionOptions(userInitOptions?.detection)
        : userInitOptions?.detection;
      if (localePathRedirect && mergedDetection?.order) {
        mergedDetection.order = mergedDetection.order.filter(
          (item: string) => item !== 'path',
        );
      }

      // Priority 3: i18next detector
      if (!detectedLanguage && i18nextDetector) {
        if (!i18nInstance.isInitialized) {
          const initialLng = userInitOptions?.lng || fallbackLanguage;
          const initOptions: any = {
            ...(userInitOptions || {}),
            lng: initialLng,
            fallbackLng: fallbackLanguage,
            supportedLngs: languages,
            detection: mergedDetection,
          };
          await i18nInstance.init(initOptions);
        }

        let detectorLang: string | undefined;
        try {
          if (isBrowser()) {
            detectorLang = detectLanguage(i18nInstance);
          } else {
            const request = context.ssrContext?.request;
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
        } catch (error) {}
      }

      // Priority 4: Use user config language or fallback
      const finalLanguage =
        detectedLanguage || userInitOptions?.lng || fallbackLanguage;

      if (!i18nInstance.isInitialized) {
        const initOptions: any = {
          ...(userInitOptions || {}),
          lng: finalLanguage,
          fallbackLng: fallbackLanguage,
          supportedLngs: languages,
          detection: mergedDetection,
        };
        await i18nInstance.init(initOptions);
      } else if (i18nInstance.language !== finalLanguage) {
        await i18nInstance.changeLanguage(finalLanguage);
      }

      // Clone instance for SSR
      if (!isBrowser() && i18nInstance.cloneInstance) {
        i18nInstance = i18nInstance.cloneInstance();
        if (i18nInstance.language !== finalLanguage) {
          await i18nInstance.changeLanguage(finalLanguage);
        }
      }

      // Ensure language is correct (critical for SSR)
      if (i18nInstance.language !== finalLanguage) {
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

        // Sync translator.language with i18nInstance.language
        if (i18nInstance?.language && i18nInstance.translator) {
          i18nInstance.translator.language = i18nInstance.language;
        }

        const getCurrentPathname = () => {
          if (isBrowser()) {
            return window.location.pathname;
          }
          return runtimeContext.request?.pathname || '/';
        };

        useEffect(() => {
          if (localePathRedirect) {
            const currentPathname = getCurrentPathname();
            const pathDetection = detectLanguageFromPath(currentPathname);
            if (pathDetection.detected && pathDetection.language) {
              const currentLang = pathDetection.language;
              if (currentLang !== lang) {
                setLang(currentLang);
                i18nInstance.changeLanguage(currentLang);
              }
            }
          } else {
            // Sync language when localePathRedirect is false (important for CSR)
            const instanceLang = i18nInstance.language;
            if (instanceLang && instanceLang !== lang) {
              setLang(instanceLang);
            }
          }
        }, []);
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
