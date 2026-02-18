import path from 'path';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
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

/** Context passed to bundle loader strategies. */
export interface BundleLoaderContext {
  monitors?: Monitors;
}

/** Strategy for loading bundles that require custom handling (e.g. async startup). */
export type BundleLoaderStrategy = (
  filepath: string,
  context?: BundleLoaderContext,
) => Promise<unknown | undefined>;

const BUNDLE_LOADER_STRATEGIES_KEY = '__MODERN_JS_BUNDLE_LOADER_STRATEGIES__';

type GlobalWithBundleLoaderStrategies = typeof globalThis & {
  [BUNDLE_LOADER_STRATEGIES_KEY]?: BundleLoaderStrategy[];
};

const getBundleLoaderStrategyStore = (): BundleLoaderStrategy[] => {
  const globalState = globalThis as GlobalWithBundleLoaderStrategies;
  globalState[BUNDLE_LOADER_STRATEGIES_KEY] =
    globalState[BUNDLE_LOADER_STRATEGIES_KEY] || [];
  return globalState[BUNDLE_LOADER_STRATEGIES_KEY];
};

/** Register a bundle loader strategy. External plugins can use this to handle custom bundle formats. */
export function registerBundleLoaderStrategy(
  strategy: BundleLoaderStrategy,
): void {
  const strategies = getBundleLoaderStrategyStore();
  if (!strategies.includes(strategy)) {
    strategies.push(strategy);
  }
}

/** Get all registered bundle loader strategies. */
export function getBundleLoaderStrategies(): readonly BundleLoaderStrategy[] {
  return getBundleLoaderStrategyStore();
}

const isPromiseLike = (value: unknown): value is Promise<unknown> =>
  Boolean(value) &&
  (typeof value === 'object' || typeof value === 'function') &&
  'then' in (value as Promise<unknown>) &&
  typeof (value as Promise<unknown>).then === 'function';

const loadBundleModule = (filepath: string): unknown | Promise<unknown> => {
  try {
    return require(filepath);
  } catch (err: any) {
    if (err?.code === 'ERR_REQUIRE_ESM') {
      return compatibleRequire(filepath, false);
    }
    throw err;
  }
};

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

const loadBundle = async (
  filepath: string,
  monitors?: Monitors,
): Promise<any> => {
  if (!(await fs.pathExists(filepath))) {
    return undefined;
  }

  try {
    const module = loadBundleModule(filepath);
    if (!isPromiseLike(module)) {
      return module;
    }

    let moduleError: unknown;
    try {
      const resolvedModule = await module;
      if (resolvedModule !== undefined) {
        return resolvedModule;
      }
    } catch (err) {
      moduleError = err;
    }

    const context = monitors ? { monitors } : undefined;
    let strategyError: unknown;
    for (const strategy of getBundleLoaderStrategies()) {
      try {
        const result = await strategy(filepath, context);
        if (result !== undefined) {
          return result;
        }
      } catch (err) {
        strategyError = strategyError || err;
      }
    }

    if (moduleError) {
      throw moduleError;
    }
    if (strategyError) {
      throw strategyError;
    }
    return undefined;
  } catch (e) {
    if (monitors) {
      monitors.error(
        `Load ${filepath} bundle failed, error = %s`,
        e instanceof Error ? e.stack || e.message : e,
      );
    } else {
      console.error(
        `Load ${filepath} bundle failed, error = ${
          e instanceof Error ? e.stack || e.message : e
        }`,
      );
    }
    return undefined;
  }
};

export async function getServerManifest(
  pwd: string,
  routes: ServerRoute[],
  monitors?: Monitors,
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

        const renderBundle = await loadBundle(renderBundlePath, monitors);
        const loaderBundle = await loadBundle(loaderBundlePath, monitors);

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
    api.onPrepare(() => {
      const {
        middlewares,
        routes,
        distDirectory: pwd,
      } = api.getServerContext();

      // In Production, should warmup server bundles on prepare.
      let htmlTemplatePromise: ReturnType<typeof getHtmlTemplates> | undefined;
      let manifestPromise: Promise<ServerManifest> | undefined;

      if (isProd()) {
        manifestPromise = getServerManifest(pwd!, routes || [], undefined);
        htmlTemplatePromise = getHtmlTemplates(pwd!, routes || []);
      }

      middlewares.push({
        name: 'inject-server-manifest',

        handler: injectServerManifest(pwd!, routes, manifestPromise),
      });

      middlewares.push({
        name: 'inject-html',

        handler: injectTemplates(pwd!, routes, htmlTemplatePromise),
      });
    });
  },
});
