import path from 'path';
import type { Entrypoint, ServerRoute } from '@modern-js/types';
import {
  fs,
  ROUTE_SPEC_FILE,
  SERVER_BUNDLE_DIRECTORY,
  SERVER_WORKER_BUNDLE_DIRECTORY,
  getEntryOptions,
  isPlainObject,
  removeLeadingSlash,
  removeTailSlash,
  urlJoin,
} from '@modern-js/utils';
import type { AppNormalizedConfig } from '../../types';
import type { AppToolsContext } from '../../types/new';
import { isMainEntry } from '../../utils/routes';
import { walkDirectory } from './utils';

/**
 * Add base url for each server route.
 * @param baseUrl - Base url from server.baseUrl
 * @param routes - Server routes.
 * @returns Server routes with baseUrl prefixed.
 */
const applyBaseUrl = (
  baseUrl: string | string[] | undefined,
  routes: ServerRoute[],
): ServerRoute[] => {
  if (baseUrl) {
    if (Array.isArray(baseUrl)) {
      return baseUrl.reduce<ServerRoute[]>(
        (previous, current) => [...previous, ...applyBaseUrl(current, routes)],
        [],
      );
    } else {
      return routes.map(route => {
        const urlPath = urlJoin(baseUrl, route.urlPath);
        return {
          ...route,
          urlPath: urlPath === '/' ? urlPath : removeTailSlash(urlPath),
        };
      });
    }
  }

  return routes;
};

/**
 *
 * @param original - Original entrypoint route info.
 * @param routeOptions - Custom entrypoint route config from server.routes.
 * @returns
 */
const applyRouteOptions = (
  original: ServerRoute,
  routeOptions: {
    route?: string | string[];
    disableSpa?: boolean;
  },
): ServerRoute[] => {
  const { route, disableSpa } = routeOptions;

  original.isSPA = !disableSpa;

  // set entryPath as dir
  !original.isSPA && (original.entryPath = path.dirname(original.entryPath));

  let routes: ServerRoute[];

  if (route) {
    if (Array.isArray(route)) {
      routes = route.map(url => {
        if (isPlainObject(url)) {
          const { path: urlPath, ...other } = url as Record<string, string>;
          return {
            ...original,
            ...other,
            urlPath,
          };
        } else {
          return {
            ...original,
            urlPath: url,
          };
        }
      });
    } else if (isPlainObject(route)) {
      const { path: urlPath, ...other } = route as Record<string, string>;
      routes = [
        {
          ...original,
          ...other,
          urlPath,
        },
      ];
    } else {
      routes = [
        {
          ...original,
          urlPath: route,
        },
      ];
    }
  } else {
    routes = [original];
  }

  return routes;
};

/**
 * Collect routes from entrypoints.
 * @param entrypoints - Bundle entrypoints.
 * @param config - Normalized user config.
 * @returns entrypoint Routes
 */
const collectHtmlRoutes = (
  entrypoints: Entrypoint[],
  appContext: AppToolsContext<'shared'>,
  config: AppNormalizedConfig<'shared'>,
): ServerRoute[] => {
  const {
    source: { mainEntryName },
    html: { disableHtmlFolder },
    output: {
      distPath: { html: htmlPath } = {},
    },
    server: { baseUrl, routes, ssr, ssrByEntries, rsc },
    deploy,
  } = config;
  const { packageName } = appContext;
  const workerSSR = deploy?.worker?.ssr;

  let htmlRoutes = entrypoints.reduce<ServerRoute[]>(
    (previous, { entryName }) => {
      const isMain = isMainEntry(entryName, mainEntryName);
      const entryOptions = getEntryOptions(
        entryName,
        isMain,
        ssr,
        ssrByEntries,
        packageName,
      );
      const isSSR = Boolean(entryOptions);
      const isWorker = Boolean(workerSSR);
      // The http would open stream when stream ssr or enable ssr.preload
      const isStream =
        typeof entryOptions === 'object' && entryOptions.mode === 'stream';
      const { resHeaders } = routes?.[entryName] || ({} as any);
      const isRSC = !!rsc;

      let route: ServerRoute | ServerRoute[] = {
        urlPath: `/${isMain ? '' : entryName}`,
        entryName,
        entryPath: removeLeadingSlash(
          path.posix.normalize(
            `${htmlPath}/${entryName}${
              disableHtmlFolder ? '.html' : '/index.html'
            }`,
          ),
        ),
        isSPA: true,
        isStream: isStream || isRSC,
        isSSR,
        isRSC,
        responseHeaders: resHeaders,
        worker: isWorker
          ? `${SERVER_WORKER_BUNDLE_DIRECTORY}/${entryName}.js`
          : undefined,
        bundle:
          isSSR || isRSC
            ? `${SERVER_BUNDLE_DIRECTORY}/${entryName}.js`
            : undefined,
      };

      if (routes?.hasOwnProperty(entryName)) {
        const routeOptions = isPlainObject(routes[entryName])
          ? (routes[entryName] as {
              route: string | string[];
              disableSpa?: boolean;
            })
          : { route: routes[entryName] as string };

        route = applyRouteOptions(route, routeOptions);
      }

      return Array.isArray(route)
        ? [...previous, ...route]
        : [...previous, route];
    },
    [],
  );

  htmlRoutes = applyBaseUrl(baseUrl, htmlRoutes);

  return htmlRoutes;
};

/**
 * Collect static public file routes from config/public folder.
 * @param appContext - App context info.
 * @param config - normalized user config.
 * @returns Static public file routes.
 */
const collectStaticRoutes = (
  appContext: AppToolsContext<'shared'>,
  config: AppNormalizedConfig<'shared'>,
): ServerRoute[] => {
  const { appDirectory } = appContext;
  const {
    source: { configDir },
    server: { publicRoutes = {} },
  } = config;
  const publicFolder = path.resolve(appDirectory, configDir || '', 'public');

  const ignoreFiles = ['.gitkeep'];

  return fs.existsSync(publicFolder)
    ? walkDirectory(publicFolder)
        .filter(filePath => !ignoreFiles.includes(path.basename(filePath)))
        .map(filePath => {
          const urlPath = `${urlJoin(
            toPosix(filePath).slice(toPosix(publicFolder).length),
          )}`;

          return {
            urlPath: publicRoutes[removeLeadingSlash(urlPath)] || urlPath,
            isSPA: true,
            isSSR: false,
            entryPath: toPosix(
              path.relative(
                path.resolve(appDirectory, configDir || ''),
                filePath,
              ),
            ),
          };
        })
    : [];
};

export const getServerRoutes = (
  entrypoints: Entrypoint[],
  {
    appContext,
    config,
  }: {
    appContext: AppToolsContext<'shared'>;
    config: AppNormalizedConfig<'shared'>;
  },
): ServerRoute[] => [
  ...collectHtmlRoutes(entrypoints, appContext, config),
  ...collectStaticRoutes(appContext, config),
];

const toPosix = (pathStr: string) =>
  pathStr.split(path.sep).join(path.posix.sep);

export const getProdServerRoutes = (distDirectory: string) => {
  const routeJSON = path.join(distDirectory, ROUTE_SPEC_FILE);
  try {
    const { routes } = fs.readJSONSync(routeJSON);
    return routes;
  } catch (e) {
    throw new Error(
      `Failed to read routes from ${routeJSON}, please check if the file exists.`,
    );
  }
};
