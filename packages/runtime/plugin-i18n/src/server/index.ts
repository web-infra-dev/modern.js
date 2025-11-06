import { promises as fs } from 'fs';
import path from 'path';
import type { Context, Next, ServerPlugin } from '@modern-js/server-runtime';
import type { ServerRoute } from '@modern-js/types';
import type { LocaleDetectionOptions } from '../shared/type';
import { getLocaleDetectionOptions } from '../shared/utils.js';

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

/**
 * Match locale JSON route from request
 * Only matches routes for JSON files in locales directory
 */
function matchLocaleJsonRoute(
  req: { path: string },
  routes: ServerRoute[],
): ServerRoute | undefined {
  const requestPath = req.path;

  // Only process JSON files
  if (!requestPath.endsWith('.json')) {
    return undefined;
  }

  // Sort routes by urlPath length (longest first) to match more specific routes first
  const sortedRoutes = [...routes].sort(
    (a, b) => b.urlPath.length - a.urlPath.length,
  );

  for (const route of sortedRoutes) {
    // Skip SSR routes and non-locales routes
    if (route.isSSR || !route.entryPath.startsWith('locales')) {
      continue;
    }

    // Only match JSON files
    if (!route.entryPath.endsWith('.json')) {
      continue;
    }

    const routeUrlPath = route.urlPath;

    // Exact match is preferred
    if (requestPath === routeUrlPath) {
      return route;
    }

    // Also support path that starts with route urlPath (for nested paths)
    // But ensure it's a valid path continuation (starts with / after the route path)
    if (requestPath.startsWith(routeUrlPath)) {
      // Check if the next character after routeUrlPath is '/' or end of string
      // This prevents partial matches like /locales matching /locale
      const remainingPath = requestPath.slice(routeUrlPath.length);
      if (remainingPath === '' || remainingPath.startsWith('/')) {
        return route;
      }
    }
  }
  return undefined;
}

/**
 * Create middleware to serve locale JSON files
 * Simplified version specifically for i18n JSON translation files
 */
function createLocaleStaticMiddleware(
  distDirectory: string,
  appDirectory: string | undefined,
  routes: ServerRoute[],
): (c: Context, next: Next) => Promise<any> {
  return async (c, next) => {
    const route = matchLocaleJsonRoute(c.req, routes);

    if (!route) {
      return await next();
    }

    try {
      // Try distDirectory first (for production builds where files are copied)
      let filename = path.join(distDirectory, route.entryPath);

      // Check if file exists in distDirectory
      let fileExists = false;
      try {
        await fs.access(filename);
        fileExists = true;
      } catch {
        // If not in distDirectory, try appDirectory (for dev mode or if not copied)
        if (appDirectory) {
          filename = path.join(appDirectory, route.entryPath);
          try {
            await fs.access(filename);
            fileExists = true;
          } catch {
            // File doesn't exist in either location
          }
        }
      }

      if (!fileExists) {
        return await next();
      }

      const data = await fs.readFile(filename);

      c.header('Content-Type', 'application/json; charset=utf-8');

      // Set response headers from route config if any
      if (route.responseHeaders) {
        Object.entries(route.responseHeaders).forEach(([k, v]) => {
          c.header(k, v as string);
        });
      }

      // Buffer is compatible with Hono's body method (same as static plugin)
      return c.body(data as any, 200);
    } catch (error) {
      // File not found or read error, continue to next middleware
      return await next();
    }
  };
}

export const i18nServerPlugin = (options: I18nPluginOptions): ServerPlugin => ({
  name: '@modern-js/plugin-i18n/server',
  setup: api => {
    api.onPrepare(() => {
      const { middlewares, routes, distDirectory, appDirectory } =
        api.getServerContext();

      // Add middleware to serve locale static files (e.g., locales/*.json)
      // This should run before other middlewares to handle static file requests
      if (distDirectory) {
        middlewares.unshift({
          name: 'i18n-locale-static',
          handler: createLocaleStaticMiddleware(
            distDirectory,
            appDirectory,
            routes,
          ),
        });
      }
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
