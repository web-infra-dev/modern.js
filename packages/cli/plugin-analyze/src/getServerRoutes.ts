import path from 'path';
import fs from 'fs';
import type { NormalizedConfig, IAppContext } from '@modern-js/core';
import {
  urlJoin,
  isPlainObject,
  removeLeadingSlash,
  getEntryOptions,
  SERVER_BUNDLE_DIRECTORY,
  MAIN_ENTRY_NAME,
  removeTailSlash,
} from '@modern-js/utils';
import type { Entrypoint, ServerRoute } from '@modern-js/types';
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
  appContext: IAppContext,
  config: NormalizedConfig,
): ServerRoute[] => {
  const {
    output: { htmlPath, disableHtmlFolder, enableModernMode },
    server: { baseUrl, routes, ssr, ssrByEntries },
  } = config;

  const { packageName } = appContext;

  let htmlRoutes = entrypoints.reduce<ServerRoute[]>(
    (previous, { entryName }) => {
      const isSSR = Boolean(
        getEntryOptions(entryName, ssr, ssrByEntries, packageName),
      );

      let route: ServerRoute | ServerRoute[] = {
        urlPath: `/${entryName === MAIN_ENTRY_NAME ? '' : entryName}`,
        entryName,
        entryPath: removeLeadingSlash(
          path.posix.normalize(
            `${htmlPath!}/${entryName}${
              disableHtmlFolder ? '.html' : '/index.html'
            }`,
          ),
        ),
        isSPA: true,
        isSSR,
        enableModernMode: Boolean(enableModernMode),
        bundle: isSSR
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
  appContext: IAppContext,
  config: NormalizedConfig,
): ServerRoute[] => {
  const { appDirectory } = appContext;
  const {
    source: { configDir },
    server: { publicRoutes = {} },
  } = config;
  const publicFolder = path.resolve(appDirectory, configDir!, 'public');

  return fs.existsSync(publicFolder)
    ? walkDirectory(publicFolder).map(filePath => {
        const urlPath = `${urlJoin(
          toPosix(filePath).slice(toPosix(publicFolder).length),
        )}`;

        return {
          urlPath: publicRoutes[removeLeadingSlash(urlPath)] || urlPath,
          isSPA: true,
          isSSR: false,
          entryPath: toPosix(
            path.relative(path.resolve(appDirectory, configDir!), filePath),
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
    appContext: IAppContext;
    config: NormalizedConfig;
  },
): ServerRoute[] => [
  ...collectHtmlRoutes(entrypoints, appContext, config),
  ...collectStaticRoutes(appContext, config),
];

const toPosix = (pathStr: string) =>
  pathStr.split(path.sep).join(path.posix.sep);
