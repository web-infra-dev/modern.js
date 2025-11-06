import {
  type RuntimePlugin,
  isBrowser,
  useRuntimeContext,
} from '@modern-js/runtime';
import type React from 'react';
import { useEffect, useState } from 'react';
import type {
  BaseBackendOptions,
  BaseLocaleDetectionOptions,
} from '../shared/type';
import { ModernI18nProvider } from './context';
import type { I18nInitOptions, I18nInstance } from './i18n';
import { getI18nInstance } from './i18n';
import {
  buildInitOptions,
  detectLanguageWithPriority,
  ensureResourcesLoaded,
  mergeDetectionAndBackendOptions,
} from './i18n-helpers';
import { useI18nextBackend } from './i18n/backend';
import { useI18nextLanguageDetector } from './i18n/detection';
import { exportServerLngToWindow } from './i18n/detection/config';
import { getI18nextProvider, getInitReactI18next } from './i18n/instance';
import { detectLanguageFromPath, validateLanguages } from './utils';

export interface I18nPluginOptions {
  entryName?: string;
  localeDetection?: BaseLocaleDetectionOptions;
  backend?: BaseBackendOptions; // Backend config for this entry (resolved in CLI plugin, undefined means disabled)
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
      backend, // Backend config for this entry (resolved in CLI plugin)
    } = options;
    const backendEnabled = backend?.enabled;

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

    api.onBeforeRender(async context => {
      let i18nInstance = await getI18nInstance(userI18nInstance);
      const initReactI18next = await getInitReactI18next();
      I18nextProvider = await getI18nextProvider();

      // Setup backend and react-i18next plugin
      if (backendEnabled) {
        useI18nextBackend(i18nInstance);
      }

      if (initReactI18next) {
        i18nInstance.use(initReactI18next);
      }

      // Get current pathname
      const getPathname = () => {
        if (isBrowser()) {
          return window.location.pathname;
        }
        return context.ssrContext?.request?.pathname || '/';
      };

      const pathname = getPathname();

      // Setup i18next language detector if enabled
      if (i18nextDetector) {
        useI18nextLanguageDetector(i18nInstance);
      }

      // Merge detection and backend options
      const { mergedDetection, mergeBackend } = mergeDetectionAndBackendOptions(
        i18nextDetector,
        localePathRedirect,
        userInitOptions,
        backend,
        backendEnabled,
      );

      // Detect language with priority: SSR data > path > i18next detector > fallback
      const { finalLanguage } = await detectLanguageWithPriority(i18nInstance, {
        languages,
        fallbackLanguage,
        localePathRedirect,
        i18nextDetector,
        userInitOptions,
        backend,
        backendEnabled,
        pathname,
        entryName,
        ssrContext: context.ssrContext,
      });

      // Initialize or update i18n instance
      if (!i18nInstance.isInitialized) {
        const initOptions = buildInitOptions({
          finalLanguage,
          fallbackLanguage,
          languages,
          userInitOptions,
          mergedDetection,
          mergeBackend,
        });
        await i18nInstance.init(initOptions);
        // In SSR, ensure resources are loaded after init
        if (!isBrowser()) {
          await ensureResourcesLoaded(
            i18nInstance,
            finalLanguage,
            userInitOptions,
          );
        }
      } else if (i18nInstance.language !== finalLanguage) {
        await i18nInstance.changeLanguage(finalLanguage);
        // In SSR, ensure resources are loaded after changeLanguage
        if (!isBrowser()) {
          await ensureResourcesLoaded(
            i18nInstance,
            finalLanguage,
            userInitOptions,
          );
        }
      }

      // Clone instance for SSR
      if (!isBrowser() && i18nInstance.cloneInstance) {
        i18nInstance = i18nInstance.cloneInstance();
        if (i18nInstance.language !== finalLanguage) {
          await i18nInstance.changeLanguage(finalLanguage);
        }
        // Ensure resources are loaded for cloned instance too
        await ensureResourcesLoaded(
          i18nInstance,
          finalLanguage,
          userInitOptions,
        );
      }

      // In SSR, export language to window for client-side hydration
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
            const pathDetection = detectLanguageFromPath(
              currentPathname,
              entryName,
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
