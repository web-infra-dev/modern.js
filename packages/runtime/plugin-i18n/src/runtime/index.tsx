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
import { mergeDetectionOptions } from './i18n/detection/config';
import { getI18nextProvider, getInitReactI18next } from './i18n/instance';
import { getEntryPath } from './utils';

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
    let I18nextProvider: React.FunctionComponent<any> | null;

    // Helper function to detect language from path
    // Returns: { detected: true, language: string } if language found in path
    //          { detected: false } if no language found in path
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

      // Check if first segment is a valid language
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

      // Get pathname from appropriate source
      const getPathname = () => {
        if (isBrowser()) {
          return window.location.pathname;
        }
        return context.ssrContext?.request?.pathname || '/';
      };

      // Step 1: Detect language with priority: path > i18next detector > fallback
      let detectedLanguage: string | undefined;

      // Priority 1: Path detection (if enabled)
      if (localePathRedirect) {
        const pathname = getPathname();
        const pathDetection = detectLanguageFromPath(pathname);
        if (pathDetection.detected && pathDetection.language) {
          detectedLanguage = pathDetection.language;
        }
      }

      // Step 2: Register detector and prepare detection options if enabled
      if (i18nextDetector) {
        useI18nextLanguageDetector(i18nInstance);
      }

      // Merge detection options and exclude 'path' if localePathRedirect is enabled
      // to avoid conflict with manual path detection
      const mergedDetection = i18nextDetector
        ? mergeDetectionOptions(userInitOptions?.detection)
        : userInitOptions?.detection;
      if (localePathRedirect && mergedDetection?.order) {
        mergedDetection.order = mergedDetection.order.filter(
          (item: string) => item !== 'path',
        );
      }

      // Step 3: Use i18next detector if path didn't detect (Priority 2)
      if (!detectedLanguage && i18nextDetector) {
        // Initialize with fallback language first to enable detector
        const initOptions: I18nInitOptions = {
          fallbackLng: fallbackLanguage,
          supportedLngs: languages,
          ...(userInitOptions || {}),
          detection: mergedDetection,
        };
        await i18nInstance.init(initOptions);

        // Use detector to detect language
        let detectorLang: string | undefined;
        if (isBrowser()) {
          detectorLang = detectLanguage(i18nInstance);
        } else {
          const request = context.ssrContext?.request;
          if (request) {
            detectorLang = detectLanguage(i18nInstance, request as any);
          }
        }

        // Validate detected language
        if (detectorLang) {
          if (languages.length === 0 || languages.includes(detectorLang)) {
            detectedLanguage = detectorLang;
          }
        }
      }

      // Priority 3: Use fallback language
      const finalLanguage = detectedLanguage || fallbackLanguage;

      // Step 4: Initialize i18n if not already initialized
      if (!i18nInstance.isInitialized) {
        const initOptions: I18nInitOptions = {
          lng: finalLanguage,
          fallbackLng: fallbackLanguage,
          supportedLngs: languages,
          ...(userInitOptions || {}),
          detection: mergedDetection,
        };
        await i18nInstance.init(initOptions);
      } else {
        // Update language if different
        if (i18nInstance.language !== finalLanguage) {
          await i18nInstance.changeLanguage(finalLanguage);
        }
      }

      // Clone instance for SSR if needed
      if (!isBrowser() && i18nInstance.cloneInstance) {
        i18nInstance = i18nInstance.cloneInstance();
      }

      context.i18nInstance = i18nInstance;
    });

    api.wrapRoot(App => {
      return props => {
        const runtimeContext = useRuntimeContext();
        const i18nInstance = (runtimeContext as any).i18nInstance;
        const [lang, setLang] = useState(i18nInstance.language);

        if (!isBrowser()) {
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
            const pathDetection = detectLanguageFromPath(currentPathname);
            if (pathDetection.detected && pathDetection.language) {
              const currentLang = pathDetection.language;
              if (currentLang !== lang) {
                setLang(currentLang);
                // Update i18n instance language
                i18nInstance.changeLanguage(currentLang);
              }
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
