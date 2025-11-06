import type { Context, Next, ServerPlugin } from '@modern-js/server-runtime';
import type { LocaleDetectionOptions } from '../shared/type';
import { getLocaleDetectionOptions } from '../shared/utils';

export interface I18nPluginOptions {
  localeDetection: LocaleDetectionOptions;
  resourcePathPrefixes?: string[];
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
          languages = [],
          fallbackLanguage = 'en',
        } = getLocaleDetectionOptions(entryName, options.localeDetection);
        const resourcePathPrefixes = options.resourcePathPrefixes || [];
        const originUrlPath = route.urlPath;
        const urlPath = originUrlPath.endsWith('/')
          ? `${originUrlPath}*`
          : `${originUrlPath}/*`;
        if (localePathRedirect) {
          middlewares.push({
            name: 'i18n-server-middleware',
            path: urlPath,
            handler: async (c: Context, next: Next) => {
              const url = new URL(
                c.req.url || '',
                `http://${c.req.header('host')}`,
              );
              const pathname = url.pathname;

              // Skip i18n resource requests to avoid redirecting them
              // These paths are used by i18next-http-backend to load translation files
              // The path prefixes are configurable via backend.loadPath option
              const isResourceRequest = resourcePathPrefixes.some(
                prefix =>
                  pathname.startsWith(`${prefix}/`) || pathname === prefix,
              );
              if (isResourceRequest) {
                await next();
                return;
              }

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
