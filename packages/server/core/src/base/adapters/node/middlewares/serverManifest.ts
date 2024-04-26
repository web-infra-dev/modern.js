import path from 'path';
import type { ServerRoute, Logger } from '@modern-js/types';
import {
  LOADABLE_STATS_FILE,
  MAIN_ENTRY_NAME,
  ROUTE_MANIFEST_FILE,
  SERVER_BUNDLE_DIRECTORY,
} from '@modern-js/utils';
import { Middleware, ServerEnv, ServerManifest } from '../../../../core/server';

const dynamicImport = (filePath: string) => {
  try {
    const module = require(filePath);
    return Promise.resolve(module);
  } catch (e) {
    return Promise.reject(e);
  }
};

const loadBundle = async (filepath: string, logger: Logger) => {
  return dynamicImport(filepath).catch(e => {
    logger.error(`Load ${filepath} bundle failed`, e);
    return undefined;
  });
};

export async function getServerManifest(
  pwd: string,
  routes: ServerRoute[],
  logger: Logger,
): Promise<ServerManifest> {
  const loaderBundles: Record<string, any> = {};
  const renderBundles: Record<string, any> = {};

  await Promise.all(
    routes
      .filter(route => Boolean(route.bundle))
      .map(async route => {
        const entryName = route.entryName || MAIN_ENTRY_NAME;
        const renderBundlePath = path.join(pwd, route.bundle || '');
        const loaderBundlePath = path.join(
          pwd,
          SERVER_BUNDLE_DIRECTORY,
          `${entryName}-server-loaders.js`,
        );

        const renderBundle = await loadBundle(renderBundlePath, logger);
        const loaderBundle = await loadBundle(loaderBundlePath, logger);

        renderBundle && (renderBundles[entryName] = renderBundle);
        loaderBundle && (loaderBundles[entryName] = loaderBundle);
      }),
  );

  const loadableUri = path.join(pwd, LOADABLE_STATS_FILE);

  const loadableStats = await import(loadableUri).catch(_ => ({}));

  const routesManifestUri = path.join(pwd, ROUTE_MANIFEST_FILE);

  const routeManifest = await import(routesManifestUri).catch(_ => ({}));

  return {
    loaderBundles,
    renderBundles,
    loadableStats,
    routeManifest,
  };
}

export function injectServerManifest(
  pwd: string,
  routes?: ServerRoute[],
): Middleware<ServerEnv> {
  return async (c, next) => {
    if (routes && !c.get('serverManifest')) {
      const logger = c.get('logger');
      const serverManifest = await getServerManifest(pwd, routes, logger);

      c.set('serverManifest', serverManifest);
    }

    await next();
  };
}
