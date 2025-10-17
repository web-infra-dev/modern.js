import type { Context, Next, ServerPlugin } from '@modern-js/server-runtime';
import {
  type LocaleDetectionOptions,
  getLocaleDetectionOptions,
} from '../utils/config.js';

export interface I18nPluginOptions {
  localeDetection: LocaleDetectionOptions;
}

const getLanguageFromPath = (
  req: any,
  urlPath: string,
  languages: string[],
): string | null => {
  const url = new URL(req.url, `http://${req.headers.host}`);
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
  const url = new URL(req.url, `http://${req.headers.host}`);
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
  const localizedUrl =
    basePath === '/'
      ? newPathname + url.search
      : basePath + newPathname + url.search;

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
          enable,
          languages = [],
          fallbackLanguage = 'en',
        } = getLocaleDetectionOptions(entryName, options.localeDetection);
        const originUrlPath = route.urlPath;
        const urlPath = originUrlPath.endsWith('/')
          ? `${originUrlPath}*`
          : `${originUrlPath}/*`;
        if (enable) {
          middlewares.push({
            name: 'i18n-server-middleware',
            path: urlPath,
            handler: async (c: Context, next: Next) => {
              const language = getLanguageFromPath(c.req, urlPath, languages);
              if (!language) {
                const localizedUrl = buildLocalizedUrl(
                  c.req,
                  originUrlPath,
                  fallbackLanguage,
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
