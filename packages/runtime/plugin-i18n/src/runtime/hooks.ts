import { isBrowser } from '@modern-js/runtime';
import type { TRuntimeContext } from '@modern-js/runtime';
import type React from 'react';
import { useEffect, useRef } from 'react';
import type { I18nInstance } from './i18n';
import { cacheUserLanguage } from './i18n/detection';
import {
  buildLocalizedUrl,
  detectLanguageFromPath,
  getEntryPath,
  getPathname,
  shouldIgnoreRedirect,
  useRouterHooks,
} from './utils';

interface RuntimeContextWithI18n extends TRuntimeContext {
  i18nInstance?: I18nInstance;
}

function createMinimalI18nInstance(language: string): I18nInstance {
  const minimalInstance: I18nInstance = {
    language,
    isInitialized: false,
    init: () => {},
    use: () => {},
    createInstance: () => minimalInstance,
    services: {},
  };
  return minimalInstance;
}

export function createContextValue(
  lang: string,
  i18nInstance: I18nInstance | undefined,
  entryName: string | undefined,
  languages: string[],
  localePathRedirect: boolean,
  ignoreRedirectRoutes: string[] | ((pathname: string) => boolean) | undefined,
  setLang: (lang: string) => void,
) {
  const instance = i18nInstance || createMinimalI18nInstance(lang);
  return {
    language: lang,
    i18nInstance: instance,
    entryName,
    languages,
    localePathRedirect,
    ignoreRedirectRoutes,
    updateLanguage: setLang,
  };
}

export function useSdkResourcesLoader(
  i18nInstance: I18nInstance | undefined,
  setForceUpdate: React.Dispatch<React.SetStateAction<number>>,
) {
  useEffect(() => {
    if (!i18nInstance || !isBrowser()) {
      return;
    }

    const handleSdkResourcesLoaded = (event: Event) => {
      const customEvent = event as CustomEvent<{
        language: string;
        namespace: string;
      }>;
      const { language, namespace } = customEvent.detail;

      const triggerUpdate = (retryCount = 0) => {
        const store = (i18nInstance as any).store;
        const hasResource = store?.data?.[language]?.[namespace];

        if (hasResource || retryCount >= 10) {
          if (store?.data?.[language]?.[namespace]) {
            if (typeof store.emit === 'function') {
              store.emit('added', language, namespace);
            }
          }

          if (typeof i18nInstance.emit === 'function') {
            i18nInstance.emit('loaded', { language, namespace });
            i18nInstance.emit('loaded', language, namespace);
          }

          if (typeof i18nInstance.reloadResources === 'function') {
            i18nInstance
              .reloadResources(language, namespace)
              .then(() => {
                if (typeof i18nInstance.emit === 'function') {
                  i18nInstance.emit('loaded', { language, namespace });
                }
                setForceUpdate(prev => prev + 1);
              })
              .catch(() => {
                // Ignore errors from reloadResources
              });
          }

          if (typeof i18nInstance.emit === 'function') {
            i18nInstance.emit('languageChanged', language);
          }

          setForceUpdate(prev => prev + 1);
        } else {
          setTimeout(() => triggerUpdate(retryCount + 1), 10);
        }
      };

      triggerUpdate();
    };

    window.addEventListener(
      'i18n-sdk-resources-loaded',
      handleSdkResourcesLoaded,
    );

    return () => {
      window.removeEventListener(
        'i18n-sdk-resources-loaded',
        handleSdkResourcesLoaded,
      );
    };
  }, [i18nInstance, setForceUpdate]);
}

/**
 * Hook to handle client-side redirect for locale path redirect in static deployments
 * This ensures that when users access paths without language prefix, they are redirected
 * to the localized version of the path
 *
 * Note: This hook only runs in CSR (Client-Side Rendering) scenarios.
 * In SSR/SSG scenarios, server-side middleware handles redirects, so this hook is skipped.
 * We use process.env.MODERN_TARGET to ensure this code is only included in browser bundles.
 */
export function useClientSideRedirect(
  i18nInstance: I18nInstance | undefined,
  localePathRedirect: boolean,
  languages: string[],
  fallbackLanguage: string,
  ignoreRedirectRoutes?: string[] | ((pathname: string) => boolean),
) {
  const hasRedirectedRef = useRef(false);
  // Get router hooks safely
  const { navigate, location, hasRouter } = useRouterHooks();

  useEffect(() => {
    if (process.env.MODERN_TARGET !== 'browser') {
      return;
    }
    if (!localePathRedirect || !i18nInstance) {
      return;
    }

    try {
      const ssrData = (window as any)._SSR_DATA;
      if (ssrData) {
        return;
      }
    } catch {
      // Ignore errors when checking SSR data
    }

    if (hasRedirectedRef.current) {
      return;
    }

    if (!i18nInstance.isInitialized) {
      return;
    }

    // Use router location if available, otherwise fallback to window.location
    const currentPathname =
      hasRouter && location ? location.pathname : window.location.pathname;
    const currentSearch =
      hasRouter && location ? location.search : window.location.search;
    const currentHash =
      hasRouter && location ? location.hash : window.location.hash;

    const entryPath = getEntryPath();
    const relativePath = currentPathname.replace(entryPath, '');

    if (shouldIgnoreRedirect(relativePath, languages, ignoreRedirectRoutes)) {
      return;
    }

    const pathDetection = detectLanguageFromPath(
      currentPathname,
      languages,
      localePathRedirect,
    );

    if (pathDetection.detected) {
      return;
    }

    const targetLanguage =
      i18nInstance.language || fallbackLanguage || languages[0] || 'en';

    const newPath = buildLocalizedUrl(relativePath, targetLanguage, languages);
    const newUrl = entryPath + newPath + currentSearch + currentHash;

    if (newUrl !== currentPathname + currentSearch + currentHash) {
      hasRedirectedRef.current = true;

      // Use navigate if router is available (similar to changeLanguage implementation)
      if (hasRouter && navigate && location) {
        navigate(newUrl, { replace: true });
      } else {
        // Fallback to window.location.replace for non-router scenarios
        // This ensures the new URL is properly recognized and translations are reloaded
        window.location.replace(newUrl);
      }
    }
  }, [
    navigate,
    location,
    hasRouter,
    localePathRedirect,
    i18nInstance,
    languages,
    fallbackLanguage,
    ignoreRedirectRoutes,
  ]);
}

export function useLanguageSync(
  i18nInstance: I18nInstance | undefined,
  localePathRedirect: boolean,
  languages: string[],
  runtimeContextRef: React.MutableRefObject<RuntimeContextWithI18n>,
  prevLangRef: React.MutableRefObject<string>,
  setLang: (lang: string) => void,
) {
  useEffect(() => {
    if (!i18nInstance) {
      return;
    }

    if (localePathRedirect) {
      const currentPathname = getPathname(runtimeContextRef.current);
      const pathDetection = detectLanguageFromPath(
        currentPathname,
        languages,
        localePathRedirect,
      );
      if (pathDetection.detected && pathDetection.language) {
        const currentLang = pathDetection.language;
        if (currentLang !== prevLangRef.current) {
          prevLangRef.current = currentLang;
          setLang(currentLang);
          i18nInstance.setLang?.(currentLang);
          i18nInstance.changeLanguage?.(currentLang);
          if (isBrowser()) {
            const detectionOptions = i18nInstance.options?.detection;
            cacheUserLanguage(i18nInstance, currentLang, detectionOptions);
          }
        }
      }
    } else {
      const instanceLang = i18nInstance.language;
      if (instanceLang && instanceLang !== prevLangRef.current) {
        prevLangRef.current = instanceLang;
        setLang(instanceLang);
      }
    }
  }, [
    i18nInstance,
    localePathRedirect,
    languages,
    runtimeContextRef,
    prevLangRef,
    setLang,
  ]);
}
