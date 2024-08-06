import path from 'path';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import type { Logger, ServerRoute } from '@modern-js/types';
import {
  LOADABLE_STATS_FILE,
  MAIN_ENTRY_NAME,
  NESTED_ROUTE_SPEC_FILE,
  ROUTE_MANIFEST_FILE,
  SERVER_BUNDLE_DIRECTORY,
  fs,
  compatibleRequire,
} from '@modern-js/utils';
import {
  Middleware,
  ServerEnv,
  ServerManifest,
  ServerPlugin,
} from '../../../types';

export async function getHtmlTemplates(pwd: string, routes: ServerRoute[]) {
  const htmls = await Promise.all(
    routes.map(async route => {
      let html: string | undefined;
      try {
        const htmlPath = path.join(pwd, route.entryPath);
        html = (await fileReader.readFile(htmlPath, 'utf-8'))?.toString();
      } catch (e) {
        // ignore error
      }
      return [route.entryName!, html];
    }) || [],
  );

  const templates: Record<string, string> = Object.fromEntries(htmls);

  return templates;
}

export function injectTemplates(
  pwd: string,
  routes?: ServerRoute[],
): Middleware<ServerEnv> {
  return async (c, next) => {
    if (routes && !c.get('templates')) {
      const templates = await getHtmlTemplates(pwd, routes);
      c.set('templates', templates);
    }

    await next();
  };
}

const loadBundle = async (filepath: string, logger: Logger) => {
  if (!(await fs.pathExists(filepath))) {
    return undefined;
  }

  try {
    const module = await compatibleRequire(filepath, false);
    return module;
  } catch (e) {
    logger.error(
      `Load ${filepath} bundle failed, error = %s`,
      e instanceof Error ? e.stack || e.message : e,
    );
    return undefined;
  }
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

  const loadableStats = await compatibleRequire(loadableUri).catch(_ => ({}));

  const routesManifestUri = path.join(pwd, ROUTE_MANIFEST_FILE);

  const routeManifest = await compatibleRequire(routesManifestUri).catch(
    _ => ({}),
  );

  const nestedRoutesJsonPath = path.join(pwd, NESTED_ROUTE_SPEC_FILE);

  const nestedRoutesJson = await import(nestedRoutesJsonPath).catch(_ => ({}));

  return {
    loaderBundles,
    renderBundles,
    loadableStats,
    routeManifest,
    nestedRoutesJson,
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

export const injectResourcePlugin = (): ServerPlugin => ({
  name: '@modern-js/plugin-inject-resource',

  setup(api) {
    return {
      async prepare() {
        const { middlewares, routes, distDirectory: pwd } = api.useAppContext();

        middlewares.push({
          name: 'inject-server-manifest',

          handler: injectServerManifest(pwd, routes),
        });

        middlewares.push({
          name: 'inject-html',

          handler: injectTemplates(pwd, routes),
        });
      },
    };
  },
});
