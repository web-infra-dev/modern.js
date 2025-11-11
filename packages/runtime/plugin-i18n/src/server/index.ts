import type { Context, Next, ServerPlugin } from '@modern-js/server-runtime';
import { detectLanguageFromRequest } from '../shared/detection.js';
import type { LocaleDetectionOptions } from '../shared/type';
import { getLocaleDetectionOptions } from '../shared/utils.js';

export interface I18nPluginOptions {
  localeDetection: LocaleDetectionOptions;
}

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
        } = getLocaleDetectionOptions(entryName, options.localeDetection);
        const originUrlPath = route.urlPath;
        const urlPath = originUrlPath.endsWith('/')
          ? `${originUrlPath}*`
          : `${originUrlPath}/*`;
        if (localePathRedirect) {
          middlewares.push({
            name: 'i18n-server-middleware',
            path: urlPath,
            handler: async (c: Context, next: Next) => {
              const language = getLanguageFromPath(c.req, urlPath, languages);
              if (!language) {
                // Try to detect language from request using the same detection config as client
                let detectedLanguage: string | null = null;
                if (i18nextDetector) {
                  // Create a compatible headers object
                  const headers = {
                    get: (name: string) => c.req.header(name) || null,
                  };
                  detectedLanguage = detectLanguageFromRequest(
                    {
                      url: c.req.url,
                      headers,
                    },
                    languages,
                    detection,
                  );
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
