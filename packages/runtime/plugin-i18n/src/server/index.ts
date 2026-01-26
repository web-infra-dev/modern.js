import * as honoPkg from '@modern-js/server-core/hono';
const { languageDetector } = honoPkg;
import type { Context, Next, ServerPlugin } from '@modern-js/server-runtime';
import {
  DEFAULT_I18NEXT_DETECTION_OPTIONS,
  mergeDetectionOptions,
} from '../runtime/i18n/detection/config.js';
import type { LanguageDetectorOptions } from '../runtime/i18n/instance';
import type { LocaleDetectionOptions } from '../shared/type';
import { getLocaleDetectionOptions } from '../shared/utils.js';

export interface I18nPluginOptions {
  localeDetection: LocaleDetectionOptions;
  staticRoutePrefixes: string[];
}

/**
 * Convert i18next detection options to hono languageDetector options
 */
const convertToHonoLanguageDetectorOptions = (
  languages: string[],
  fallbackLanguage: string,
  detectionOptions?: LanguageDetectorOptions,
) => {
  // Merge user detection options with defaults
  const mergedDetection = detectionOptions
    ? mergeDetectionOptions(detectionOptions)
    : DEFAULT_I18NEXT_DETECTION_OPTIONS;

  // Get detection order, excluding 'path' and browser-only detectors
  const order = (mergedDetection.order || []).filter(
    (item: string) =>
      !['path', 'localStorage', 'navigator', 'htmlTag', 'subdomain'].includes(
        item,
      ),
  );

  // If no order specified, use default server-side order
  const detectionOrder =
    order.length > 0 ? order : ['querystring', 'cookie', 'header'];

  // Map i18next order to hono order
  const honoOrder = detectionOrder.map(item => {
    // Map 'querystring' to 'querystring', 'cookie' to 'cookie', 'header' to 'header'
    if (item === 'querystring') return 'querystring';
    if (item === 'cookie') return 'cookie';
    if (item === 'header') return 'header';
    return item;
  }) as ('querystring' | 'cookie' | 'header' | 'path')[];

  // Determine caches option
  // hono languageDetector expects: false | "cookie"[] | undefined
  const caches: false | ['cookie'] | undefined =
    mergedDetection.caches === false
      ? false
      : Array.isArray(mergedDetection.caches) &&
          !mergedDetection.caches.includes('cookie')
        ? false
        : (['cookie'] as ['cookie']);

  return {
    supportedLanguages: languages.length > 0 ? languages : [fallbackLanguage],
    fallbackLanguage,
    order: honoOrder,
    lookupQueryString:
      mergedDetection.lookupQuerystring ||
      DEFAULT_I18NEXT_DETECTION_OPTIONS.lookupQuerystring ||
      'lng',
    lookupCookie:
      mergedDetection.lookupCookie ||
      DEFAULT_I18NEXT_DETECTION_OPTIONS.lookupCookie ||
      'i18next',
    lookupFromHeaderKey:
      mergedDetection.lookupHeader ||
      DEFAULT_I18NEXT_DETECTION_OPTIONS.lookupHeader ||
      'accept-language',
    ...(caches !== undefined && { caches }),
    ignoreCase: true,
  };
};

/**
 * Check if the given pathname should ignore automatic locale redirect
 */
const shouldIgnoreRedirect = (
  pathname: string,
  urlPath: string,
  ignoreRedirectRoutes?: string[] | ((pathname: string) => boolean),
): boolean => {
  if (!ignoreRedirectRoutes) {
    return false;
  }

  // Remove urlPath prefix to get remaining path for matching
  const basePath = urlPath.replace('/*', '');
  const remainingPath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname;

  // Normalize path (ensure it starts with /)
  const normalizedPath = remainingPath.startsWith('/')
    ? remainingPath
    : `/${remainingPath}`;

  if (typeof ignoreRedirectRoutes === 'function') {
    return ignoreRedirectRoutes(normalizedPath);
  }

  // Check if pathname matches any of the ignore patterns
  return ignoreRedirectRoutes.some(pattern => {
    // Support both exact match and prefix match
    return (
      normalizedPath === pattern || normalizedPath.startsWith(`${pattern}/`)
    );
  });
};

/**
 * Check if the given pathname is a static resource request
 * This includes:
 * 1. Paths matching staticRoutePrefixes (from public directories)
 * 2. Standard static resource paths like /static/, /upload/
 * 3. Paths with language prefix like /en/static/, /zh/static/
 */
const isStaticResourceRequest = (
  pathname: string,
  staticRoutePrefixes: string[],
  languages: string[] = [],
): boolean => {
  // Check against staticRoutePrefixes (from public directories)
  if (
    staticRoutePrefixes.some(
      prefix => pathname.startsWith(`${prefix}/`) || pathname === prefix,
    )
  ) {
    return true;
  }

  // Check standard static resource paths
  const standardStaticPrefixes = ['/static/', '/upload/'];
  if (standardStaticPrefixes.some(prefix => pathname.startsWith(prefix))) {
    return true;
  }

  // Check paths with language prefix (e.g., /en/static/, /zh/static/)
  // Remove language prefix if present and check again
  const pathSegments = pathname.split('/').filter(Boolean);
  if (pathSegments.length > 0 && languages.includes(pathSegments[0])) {
    // biome-ignore lint/style/useTemplate: <explanation>
    const pathWithoutLang = '/' + pathSegments.slice(1).join('/');
    if (
      standardStaticPrefixes.some(prefix =>
        pathWithoutLang.startsWith(prefix),
      ) ||
      staticRoutePrefixes.some(
        prefix =>
          pathWithoutLang.startsWith(`${prefix}/`) ||
          pathWithoutLang === prefix,
      )
    ) {
      return true;
    }
  }

  return false;
};

const getLanguageFromPath = (
  req: any,
  urlPath: string,
  languages: string[],
): string | null => {
  const url = new URL(req.url, `http://${req.header().host}`);
  const pathname = url.pathname;

  // Remove urlPath prefix to get remaining path
  // urlPath format is /lang/*, need to remove /lang part
  const basePath = urlPath.replace('/*', '');
  const remainingPath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname;

  const segments = remainingPath.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (languages.includes(firstSegment)) {
    return firstSegment;
  }

  return null;
};

const buildLocalizedUrl = (
  req: any,
  urlPath: string,
  language: string,
  languages: string[],
): string => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Remove urlPath prefix to get remaining path
  const basePath = urlPath.replace('/*', '');
  const remainingPath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname;

  const segments = remainingPath.split('/').filter(Boolean);

  if (segments.length > 0 && languages.includes(segments[0])) {
    // Replace existing language prefix
    segments[0] = language;
  } else {
    // If path doesn't start with language, add language prefix
    segments.unshift(language);
  }

  const newPathname = `/${segments.join('/')}`;
  // Handle root path case to avoid double slashes like //en
  const suffix = `${url.search}${url.hash}`;
  const localizedUrl =
    basePath === '/' ? newPathname + suffix : basePath + newPathname + suffix;

  return localizedUrl;
};

export const i18nServerPlugin = (options: I18nPluginOptions): ServerPlugin => ({
  name: '@modern-js/plugin-i18n/server',
  setup: api => {
    api.onPrepare(() => {
      const { middlewares, routes } = api.getServerContext();

      // Collect all non-root entry paths for cross-entry path detection
      const entryPaths = new Set<string>();
      routes.forEach(route => {
        if (route.entryName && route.urlPath && route.urlPath !== '/') {
          const pathSegments = route.urlPath.split('/').filter(Boolean);
          if (pathSegments.length > 0) {
            entryPaths.add(`/${pathSegments[0]}`);
          }
        }
      });

      routes.map(route => {
        const { entryName } = route;
        if (!entryName) {
          return;
        }
        if (!options.localeDetection) {
          return;
        }
        const {
          localePathRedirect,
          i18nextDetector = true,
          languages = [],
          fallbackLanguage = 'en',
          detection,
          ignoreRedirectRoutes,
        } = getLocaleDetectionOptions(entryName, options.localeDetection);
        const staticRoutePrefixes = options.staticRoutePrefixes;
        const originUrlPath = route.urlPath;
        const urlPath = originUrlPath.endsWith('/')
          ? `${originUrlPath}*`
          : `${originUrlPath}/*`;
        if (localePathRedirect) {
          // Add languageDetector middleware before the redirect handler
          if (i18nextDetector) {
            const detectorOptions = convertToHonoLanguageDetectorOptions(
              languages,
              fallbackLanguage,
              detection,
            );
            const detectorHandler = languageDetector(detectorOptions);
            middlewares.push({
              name: 'i18n-language-detector',
              path: urlPath,
              handler: async (c: Context, next: Next) => {
                const url = new URL(c.req.url);
                const pathname = url.pathname;

                // For static resource requests, skip language detection
                if (
                  isStaticResourceRequest(
                    pathname,
                    staticRoutePrefixes,
                    languages,
                  )
                ) {
                  return await next();
                }

                // If basePath is '/', check if path belongs to another entry
                if (originUrlPath === '/') {
                  const pathSegments = pathname.split('/').filter(Boolean);
                  if (pathSegments.length > 0) {
                    const firstSegment = `/${pathSegments[0]}`;
                    if (entryPaths.has(firstSegment)) {
                      return await next();
                    }
                  }
                }

                return detectorHandler(c, next);
              },
            });
          }

          middlewares.push({
            name: 'i18n-server-middleware',
            path: urlPath,
            handler: async (c: Context, next: Next) => {
              const url = new URL(c.req.url);
              const pathname = url.pathname;

              // For static resource requests, skip i18n processing
              if (
                isStaticResourceRequest(
                  pathname,
                  staticRoutePrefixes,
                  languages,
                )
              ) {
                return await next();
              }

              // Check if this route should ignore automatic redirect
              if (
                shouldIgnoreRedirect(pathname, urlPath, ignoreRedirectRoutes)
              ) {
                return await next();
              }

              // If basePath is '/', check if path belongs to another entry
              if (originUrlPath === '/') {
                const pathSegments = pathname.split('/').filter(Boolean);
                if (pathSegments.length > 0) {
                  const firstSegment = `/${pathSegments[0]}`;
                  if (entryPaths.has(firstSegment)) {
                    return await next();
                  }
                }
              }

              const language = getLanguageFromPath(c.req, urlPath, languages);
              if (!language) {
                // Get detected language from languageDetector middleware
                let detectedLanguage: string | null = null;
                if (i18nextDetector) {
                  detectedLanguage = c.get('language') || null;
                }
                // Use detected language or fallback to fallbackLanguage
                const targetLanguage = detectedLanguage || fallbackLanguage;
                const localizedUrl = buildLocalizedUrl(
                  c.req,
                  originUrlPath,
                  targetLanguage,
                  languages,
                );
                return c.redirect(localizedUrl);
              }
              await next();
            },
          });
        }
      });
    });
  },
});

export default i18nServerPlugin;
