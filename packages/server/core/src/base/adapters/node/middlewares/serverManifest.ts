import path from 'path';
import type { ServerRoute } from '@modern-js/types';
import {
  LOADABLE_STATS_FILE,
  MAIN_ENTRY_NAME,
  ROUTE_MANIFEST_FILE,
  SERVER_BUNDLE_DIRECTORY,
} from '@modern-js/utils';
import {
  HonoMiddleware,
  ServerEnv,
  ServerManifest,
} from '../../../../core/server';

async function getServerManifest(
  pwd: string,
  routes: ServerRoute[],
): Promise<ServerManifest> {
  const loaderBundles: Record<string, any> = {};

  await Promise.all([
    routes.map(async route => {
      const entryName = route.entryName || MAIN_ENTRY_NAME;

      const loaderBundlePath = path.join(
        pwd,
        SERVER_BUNDLE_DIRECTORY,
        `${entryName}-server-loaders.js`,
      );

      const loaderBundle = await import(loaderBundlePath).catch(_ => undefined);

      loaderBundles[entryName] = loaderBundle;
    }),
  ]);

  const renderBundles: Record<string, any> = {};

  await Promise.all([
    routes
      .filter(route => Boolean(route.bundle))
      .map(async route => {
        const entryName = route.entryName || MAIN_ENTRY_NAME;

        const renderBundlePath = path.join(pwd, route.bundle || '');

        const renderBundle = await import(renderBundlePath).catch(
          _ => undefined,
        );

        renderBundles[entryName] = renderBundle;
      }),
  ]);

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
): HonoMiddleware<ServerEnv> {
  return async (c, next) => {
    if (routes && !c.get('serverManifest')) {
      const serverManifest = await getServerManifest(pwd, routes);

      c.set('serverManifest', serverManifest);
    }

    await next();
  };
}
