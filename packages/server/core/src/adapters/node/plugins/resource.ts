import path from 'path';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import type { Logger, ServerRoute } from '@modern-js/types';
import {
  fs,
  LOADABLE_STATS_FILE,
  MAIN_ENTRY_NAME,
  NESTED_ROUTE_SPEC_FILE,
  ROUTE_MANIFEST_FILE,
  SERVER_BUNDLE_DIRECTORY,
  compatibleRequire,
  isProd,
} from '@modern-js/utils';
import type {
  Middleware,
  ServerEnv,
  ServerManifest,
  ServerPluginLegacy,
} from '../../../types';
import { uniqueKeyByRoute } from '../../../utils';

export async function getHtmlTemplates(pwd: string, routes: ServerRoute[]) {
  // Only process routes with entryName, which are HTML template routes.
  // Public static file routes don't have entryName and shouldn't be processed here.
  const htmlRoutes = routes.filter(route => route.entryName);

  const htmls = await Promise.all(
    htmlRoutes.map(async route => {
      let html: string | undefined;
      try {
        const htmlPath = path.join(pwd, route.entryPath);
        html = (await fileReader.readFile(htmlPath, 'utf-8'))?.toString();
      } catch (e) {
        // ignore error
      }
      return [uniqueKeyByRoute(route), html];
    }) || [],
  );

  const templates: Record<string, string> = Object.fromEntries(htmls);

  return templates;
}

export function injectTemplates(
  pwd: string,
  routes?: ServerRoute[],
  htmlTemplatePromise?: ReturnType<typeof getHtmlTemplates>,
): Middleware<ServerEnv> {
  return async (c, next) => {
    if (routes && !c.get('templates')) {
      const templates = await (htmlTemplatePromise ||
        getHtmlTemplates(pwd, routes));
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
        loaderBundle &&
          (loaderBundles[entryName] = loaderBundle?.loadModules
            ? await loaderBundle?.loadModules()
            : loaderBundle);
      }),
  );

  const loadableUri = path.join(pwd, LOADABLE_STATS_FILE);

  const loadableStats = await compatibleRequire(loadableUri).catch(_ => ({}));

  const routesManifestUri = path.join(pwd, ROUTE_MANIFEST_FILE);

  const routeManifest = await compatibleRequire(routesManifestUri).catch(
    _ => ({}),
  );

  const nestedRoutesJsonPath = path.join(pwd, NESTED_ROUTE_SPEC_FILE);

  const nestedRoutesJson = await compatibleRequire(nestedRoutesJsonPath).catch(
    _ => ({}),
  );

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
  manifestPromise?: Promise<ServerManifest>,
): Middleware<ServerEnv> {
  return async (c, next) => {
    if (routes && !c.get('serverManifest')) {
      const logger = c.get('logger');
      const serverManifest = await (manifestPromise ||
        getServerManifest(pwd, routes, logger));

      c.set('serverManifest', serverManifest);
    }

    await next();
  };
}

export async function getRscServerManifest(pwd: string) {
  const rscServerManifest = await compatibleRequire(
    path.join(pwd, 'bundles', 'react-server-manifest.json'),
  ).catch(_ => undefined);
  return rscServerManifest;
}

export async function getClientManifest(pwd: string) {
  const rscClientManifest = await compatibleRequire(
    path.join(pwd, 'react-client-manifest.json'),
  ).catch(_ => undefined);
  return rscClientManifest;
}

export async function getRscSSRManifest(pwd: string) {
  const rscSSRManifest = await compatibleRequire(
    path.join(pwd, 'react-ssr-manifest.json'),
  ).catch(_ => undefined);
  return rscSSRManifest;
}

export const injectRscManifestPlugin = (): ServerPluginLegacy => ({
  name: '@modern-js/plugin-inject-rsc-manifest',
  setup(api) {
    return {
      async prepare() {
        const { middlewares, distDirectory: pwd } = api.useAppContext();
        const config = api.useConfigContext();
        // only rsc project need inject rsc manifest
        if (!config.server?.rsc) {
          return;
        }

        // TODO: should inject in prepare stage, not first request
        middlewares.push({
          name: 'inject-rsc-manifest',
          handler: async (c, next) => {
            if (!c.get('rscServerManifest')) {
              const rscServerManifest = await getRscServerManifest(pwd);
              c.set('rscServerManifest', rscServerManifest);
            }

            if (!c.get('rscClientManifest')) {
              const rscClientManifest = await getClientManifest(pwd);
              c.set('rscClientManifest', rscClientManifest);
            }

            if (!c.get('rscSSRManifest')) {
              const rscSSRManifest = await getRscSSRManifest(pwd);
              c.set('rscSSRManifest', rscSSRManifest);
            }

            await next();
          },
        });
      },
    };
  },
});

export const injectResourcePlugin = (): ServerPluginLegacy => ({
  name: '@modern-js/plugin-inject-resource',

  setup(api) {
    return {
      async prepare() {
        const { middlewares, routes, distDirectory: pwd } = api.useAppContext();

        // In Production, should warmup server bundles on prepare.
        let htmlTemplatePromise:
          | ReturnType<typeof getHtmlTemplates>
          | undefined;
        let manifestPromise: Promise<ServerManifest> | undefined;

        if (isProd()) {
          manifestPromise = getServerManifest(pwd, routes || [], console);
          htmlTemplatePromise = getHtmlTemplates(pwd, routes || []);
        }

        middlewares.push({
          name: 'inject-server-manifest',

          handler: injectServerManifest(pwd, routes, manifestPromise),
        });

        middlewares.push({
          name: 'inject-html',

          handler: injectTemplates(pwd, routes, htmlTemplatePromise),
        });
      },
    };
  },
});
