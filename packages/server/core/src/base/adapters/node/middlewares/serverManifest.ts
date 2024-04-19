import path from 'path';
import type { ServerRoute } from '@modern-js/types';
import {
  LOADABLE_STATS_FILE,
  MAIN_ENTRY_NAME,
  ROUTE_MANIFEST_FILE,
  SERVER_BUNDLE_DIRECTORY,
} from '@modern-js/utils';
import { Middleware, ServerEnv, ServerManifest } from '../../../../core/server';

async function getServerManifest(
  pwd: string,
  routes: ServerRoute[],
): Promise<ServerManifest> {
  const loaderBundles: Record<string, any> = {};
  const renderBundles: Record<string, any> = {};

  await Promise.all(
    routes.map(async route => {
      const entryName = route.entryName || MAIN_ENTRY_NAME;

      const loaderBundlePath = path.join(
        pwd,
        SERVER_BUNDLE_DIRECTORY,
        `${entryName}-server-loaders.js`,
      );

      const renderBundlePath = path.join(pwd, route.bundle || '');

      await Promise.allSettled([
        import(loaderBundlePath),
        import(renderBundlePath),
      ]).then(results => {
        const { status: loaderStatus } = results[0];

        if (loaderStatus === 'fulfilled') {
          loaderBundles[entryName] = results[0].value;
        }

        const { status: renderStatus } = results[1];

        if (renderStatus === 'fulfilled') {
          renderBundles[entryName] = results[1].value;
        }
      });
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
      const serverManifest = await getServerManifest(pwd, routes);

      c.set('serverManifest', serverManifest);
    }

    await next();
  };
}
