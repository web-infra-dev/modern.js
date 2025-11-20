import {
  type RuntimePlugin,
  type TRuntimeContext,
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
import { mergeBackendOptions } from './i18n/backend';
import { useI18nextBackend } from './i18n/backend/middleware';
import {
  detectLanguageWithPriority,
  exportServerLngToWindow,
  mergeDetectionOptions,
} from './i18n/detection';
import { useI18nextLanguageDetector } from './i18n/detection/middleware';
import { getI18nextProvider, getInitReactI18next } from './i18n/instance';
import {
  ensureLanguageMatch,
  initializeI18nInstance,
  setupClonedInstance,
} from './i18n/utils';
import { detectLanguageFromPath } from './utils';

export type { I18nSdkLoader, I18nSdkLoadOptions } from '../shared/type';
export type { Resources } from './i18n/instance';

export interface I18nPluginOptions {
  entryName?: string;
  localeDetection?: BaseLocaleDetectionOptions;
  backend?: BaseBackendOptions;
  i18nInstance?: I18nInstance;
  changeLanguage?: (lang: string) => void;
  initOptions?: I18nInitOptions;
  [key: string]: any;
}

const getPathname = (context: TRuntimeContext) => {
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
      backend,
    } = options;
    const {
      localePathRedirect = false,
      i18nextDetector = true,
      languages = [],
      fallbackLanguage = 'en',
      detection,
    } = localeDetection || {};
    const { enabled: backendEnabled = false } = backend || {};
    let I18nextProvider: React.FunctionComponent<any> | null;

    api.onBeforeRender(async context => {
      let i18nInstance = await getI18nInstance(userI18nInstance);
      const initReactI18next = await getInitReactI18next();
      I18nextProvider = await getI18nextProvider();
      if (initReactI18next) {
        i18nInstance.use(initReactI18next);
      }

      const pathname = getPathname(context);

      if (i18nextDetector) {
        useI18nextLanguageDetector(i18nInstance);
      }

      const mergedDetection = mergeDetectionOptions(
        i18nextDetector,
        detection,
        localePathRedirect,
        userInitOptions,
      );
      const mergedBackend = mergeBackendOptions(backend, userInitOptions);

      if (backendEnabled) {
        useI18nextBackend(i18nInstance, mergedBackend);
      }

      const { finalLanguage } = await detectLanguageWithPriority(i18nInstance, {
        languages,
        fallbackLanguage,
        localePathRedirect,
        i18nextDetector,
        detection,
        userInitOptions,
        pathname,
        ssrContext: context.ssrContext,
      });

      await initializeI18nInstance(
        i18nInstance,
        finalLanguage,
        fallbackLanguage,
        languages,
        mergedDetection,
        mergedBackend,
        userInitOptions,
      );

      if (!isBrowser() && i18nInstance.cloneInstance) {
        i18nInstance = i18nInstance.cloneInstance();
        await setupClonedInstance(
          i18nInstance,
          finalLanguage,
          fallbackLanguage,
          languages,
          backendEnabled,
          backend,
          i18nextDetector,
          detection,
          localePathRedirect,
          userInitOptions,
        );
      }

      if (localePathRedirect) {
        await ensureLanguageMatch(i18nInstance, finalLanguage);
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

        useEffect(() => {
          if (localePathRedirect) {
            const currentPathname = getPathname(
              runtimeContext as TRuntimeContext,
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

        const contextValue = {
          language: lang,
          i18nInstance,
          entryName,
          languages,
          localePathRedirect,
          updateLanguage: setLang,
        };

        const appContent = (
          <ModernI18nProvider value={contextValue}>
            <App {...props} />
          </ModernI18nProvider>
        );

        return I18nextProvider ? (
          <I18nextProvider i18n={i18nInstance}>{appContent}</I18nextProvider>
        ) : (
          appContent
        );
      };
    });
  },
});

export { useModernI18n } from './context';
export { I18nLink } from './I18nLink';
export default i18nPlugin;
