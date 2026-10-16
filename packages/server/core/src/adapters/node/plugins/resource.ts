import path from 'path';
import type { FileReader } from '@modern-js/runtime-utils/fileReader';
import type { Monitors, ServerRoute } from '@modern-js/types';
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
  MiddlewareHandler,
  ServerEnv,
  ServerManifest,
  ServerPlugin,
} from '../../../types';
import { uniqueKeyByRoute } from '../../../utils';

export async function getHtmlTemplates(
  pwd: string,
  routes: ServerRoute[],
  reader: FileReader,
) {
  // Only process routes with entryName, which are HTML template routes.
  // Public static file routes don't have entryName and shouldn't be processed here.
  const htmlRoutes = routes.filter(route => route.entryName);

  const htmls = await Promise.all(
    htmlRoutes.map(async route => {
      let html: string | undefined;
      try {
        const htmlPath = path.join(pwd, route.entryPath);
        html = (await reader.readFile(htmlPath, 'utf-8'))?.toString();
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
  routes: ServerRoute[] | undefined,
  reader: FileReader,
  htmlTemplatePromise?: ReturnType<typeof getHtmlTemplates>,
): Middleware<ServerEnv> {
  return async (c, next) => {
    if (routes && !c.get('templates')) {
      const templates = await (htmlTemplatePromise ||
        getHtmlTemplates(pwd, routes, reader));
      c.set('templates', templates);
    }

    await next();
  };
}

function reportBundleError(
  filepath: string,
  error: unknown,
  monitors?: Monitors,
) {
  const detail = error instanceof Error ? error.stack || error.message : error;
  if (monitors) {
    monitors.error(`Load ${filepath} bundle failed, error = %s`, detail);
  } else {
    console.error(`Load ${filepath} bundle failed, error = ${detail}`);
  }
}

const loadBundle = async (
  filepath: string,
  monitors?: Monitors,
  { required = false, failOnError = false } = {},
) => {
  // Required bundles go through the module loader even when absent, preserving
  // its original error code, message and stack. Optional bundles may be absent.
  if (!required && !failOnError && !(await fs.pathExists(filepath))) {
    return undefined;
  }

  try {
    if (!required && failOnError) {
      try {
        await fs.access(filepath);
      } catch (e) {
        const code = (e as NodeJS.ErrnoException)?.code;
        if (code === 'ENOENT' || code === 'ENOTDIR') {
          return undefined;
        }
        // pathExists also returns false for access errors. In strict warmup,
        // only actual absence is optional, not permissions or other I/O errors.
        throw e;
      }
    }
    const module = await compatibleRequire(filepath, false);
    return module;
  } catch (e) {
    reportBundleError(filepath, e, monitors);
    if (failOnError) {
      throw e;
    }
    return undefined;
  }
};

export async function getServerManifest(
  pwd: string,
  routes: ServerRoute[],
  monitors?: Monitors,
  { failOnError = false } = {},
): Promise<ServerManifest> {
  const loaderBundles: Record<string, any> = {};
  const renderBundles: Record<string, any> = {};

  await Promise.all(
    routes
      .filter(route => Boolean(route.bundle))
      .map(async route => {
        // SSG can attach a bundle path even to static-file routes. A declared
        // path alone does not make that route a required SSR render entry.
        const failOnBundleError = failOnError && Boolean(route.isSSR);
        const entryName = route.entryName || MAIN_ENTRY_NAME;
        const renderBundlePath = path.join(pwd, route.bundle || '');
        const loaderBundlePath = path.join(
          pwd,
          SERVER_BUNDLE_DIRECTORY,
          `${entryName}-server-loaders.js`,
        );

        const renderBundle = await loadBundle(renderBundlePath, monitors, {
          required: failOnBundleError,
          failOnError: failOnBundleError,
        });
        const loaderBundle = await loadBundle(loaderBundlePath, monitors, {
          failOnError: failOnBundleError,
        });

        renderBundle && (renderBundles[entryName] = renderBundle);
        if (loaderBundle) {
          try {
            loaderBundles[entryName] = loaderBundle.loadModules
              ? await loaderBundle.loadModules()
              : loaderBundle;
          } catch (e) {
            if (failOnBundleError) {
              reportBundleError(loaderBundlePath, e, monitors);
            }
            throw e;
          }
        }
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
      const monitors = c.get('monitors');
      const serverManifest = await (manifestPromise ||
        getServerManifest(pwd, routes, monitors));

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

export const injectRscManifestPlugin = (enableRsc: boolean): ServerPlugin => ({
  name: '@modern-js/plugin-inject-rsc-manifest',
  setup(api) {
    api.onPrepare(() => {
      const { middlewares, distDirectory: pwd } = api.getServerContext();
      // only rsc project need inject rsc manifest
      if (!enableRsc) {
        return;
      }

      // TODO: should inject in prepare stage, not first request
      middlewares.push({
        name: 'inject-rsc-manifest',
        handler: (async (c, next) => {
          if (!c.get('rscServerManifest')) {
            const rscServerManifest = await getRscServerManifest(pwd!);
            c.set('rscServerManifest', rscServerManifest);
          }

          if (!c.get('rscClientManifest')) {
            const rscClientManifest = await getClientManifest(pwd!);
            c.set('rscClientManifest', rscClientManifest);
          }

          if (!c.get('rscSSRManifest')) {
            const rscSSRManifest = await getRscSSRManifest(pwd!);
            c.set('rscSSRManifest', rscSSRManifest);
          }

          await next();
        }) as MiddlewareHandler,
      });
    });
  },
});

export const injectResourcePlugin = (): ServerPlugin => ({
  name: '@modern-js/plugin-inject-resource',

  setup(api) {
    api.onPrepare(async () => {
      const {
        middlewares,
        fileReader: reader,
        routes,
        distDirectory: pwd,
      } = api.getServerContext();

      // In Production, should warmup server bundles on prepare.
      let htmlTemplatePromise: ReturnType<typeof getHtmlTemplates> | undefined;
      let manifestPromise: Promise<ServerManifest> | undefined;

      if (isProd()) {
        const warmupRoutes = routes || [];
        // Keep CSR-only and RSC startup behavior unchanged. Only await the
        // existing classic SSR warmup; do not eagerly import lazy route modules.
        const failOnError =
          warmupRoutes.some(route => route.isSSR && route.bundle) &&
          !warmupRoutes.some(route => route.isRSC);
        manifestPromise = getServerManifest(pwd!, warmupRoutes, undefined, {
          failOnError,
        });
        htmlTemplatePromise = getHtmlTemplates(pwd!, routes || [], reader);
        if (failOnError) {
          await manifestPromise;
        }
      }

      middlewares.push({
        name: 'inject-server-manifest',

        handler: injectServerManifest(pwd!, routes, manifestPromise),
      });

      middlewares.push({
        name: 'inject-html',

        handler: injectTemplates(pwd!, routes, reader, htmlTemplatePromise),
      });
    });
  },
});
