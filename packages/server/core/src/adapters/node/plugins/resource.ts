import { createRequire } from 'node:module';
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
import { getRenderHandler } from '../../../plugins/render/inject';
import type {
  Middleware,
  MiddlewareHandler,
  ServerEnv,
  ServerManifest,
  ServerPlugin,
} from '../../../types';
import { uniqueKeyByRoute } from '../../../utils';
import {
  type SSRApplication,
  type SSRApplicationOptions,
  type SSRApplicationResources,
  createSSRApplication,
} from '../application';

export interface SSRResourceApplicationOptions
  extends Omit<SSRApplicationOptions, 'load'> {
  onReady: (application: SSRApplication) => void;
  /** Reacquire a compiled root in its existing runtime after selective invalidation. */
  reloadEntry?: (entry: string) => Promise<any>;
  /** Validate unpublished resources directly, without re-entering HTTP admission. */
  validate?: (resources: SSRApplicationResources) => Promise<void>;
}

export async function getHtmlTemplates(
  pwd: string,
  routes: ServerRoute[],
  options: { fresh?: boolean } = {},
) {
  // Only process routes with entryName, which are HTML template routes.
  // Public static file routes don't have entryName and shouldn't be processed here.
  const htmlRoutes = routes.filter(route => route.entryName);

  const htmls = await Promise.all(
    htmlRoutes.map(async route => {
      let html: string | undefined;
      try {
        const htmlPath = path.join(pwd, route.entryPath);
        html = options.fresh
          ? await fs.readFile(htmlPath, 'utf-8')
          : (await fileReader.readFile(htmlPath, 'utf-8'))?.toString();
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

async function assertCommonJS(filepath: string) {
  if (filepath.endsWith('.cjs')) return;
  if (filepath.endsWith('.mjs'))
    throw new Error(
      `Native ESM application entries cannot be reloaded: ${filepath}`,
    );
  let directory = path.dirname(filepath);
  for (;;) {
    const packagePath = path.join(directory, 'package.json');
    if (await fs.pathExists(packagePath)) {
      if ((await fs.readJSON(packagePath)).type === 'module')
        throw new Error(
          `Native ESM application entries cannot be reloaded: ${filepath}`,
        );
      return;
    }
    const parent = path.dirname(directory);
    if (parent === directory) return;
    directory = parent;
  }
}

const loadBundle = async (
  filepath: string,
  monitors?: Monitors,
  reloadable = false,
) => {
  if (!(await fs.pathExists(filepath))) {
    return undefined;
  }

  try {
    if (reloadable) {
      // Use the Node CJS cache even when Modern itself is served from ESM.
      const resolved = createRequire(path.resolve(filepath)).resolve(
        path.resolve(filepath),
      );
      await assertCommonJS(resolved);
      return createRequire(resolved)(resolved);
    }
    const module = await compatibleRequire(filepath, false);
    return module;
  } catch (e) {
    if (reloadable) throw e;
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
  options: {
    reloadable?: boolean;
    reloadEntry?: (entry: string) => Promise<any>;
  } = {},
): Promise<ServerManifest> {
  const loaderBundles: Record<string, any> = {};
  const renderBundles: Record<string, any> = {};

  const loaded = await Promise.allSettled(
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

        const renderBundle = options.reloadEntry
          ? await options.reloadEntry(entryName)
          : await loadBundle(renderBundlePath, monitors, options.reloadable);
        if (
          options.reloadable &&
          route.isSSR &&
          typeof (await renderBundle?.requestHandler) !== 'function'
        )
          throw new Error(`Invalid SSR entry: ${entryName}`);
        const loaderBundle =
          options.reloadEntry && (await fs.pathExists(loaderBundlePath))
            ? await options.reloadEntry(`${entryName}-server-loaders`)
            : await loadBundle(loaderBundlePath, monitors, options.reloadable);
        renderBundle && (renderBundles[entryName] = renderBundle);
        loaderBundle &&
          (loaderBundles[entryName] = loaderBundle?.loadModules
            ? await loaderBundle?.loadModules()
            : loaderBundle);
      }),
  );

  const errors = loaded.filter(result => result.status === 'rejected');
  if (errors.length)
    throw new AggregateError(
      errors.map(result => result.reason),
      'SSR bundle preparation failed',
    );
  const readManifest = async (filename: string) => {
    try {
      return await (options.reloadable
        ? fs.readJSON(filename)
        : compatibleRequire(filename));
    } catch (error) {
      if (
        options.reloadable &&
        (error as NodeJS.ErrnoException).code !== 'ENOENT'
      )
        throw error;
      return {};
    }
  };
  const loadableUri = path.join(pwd, LOADABLE_STATS_FILE);

  const loadableStats = await readManifest(loadableUri);

  const routesManifestUri = path.join(pwd, ROUTE_MANIFEST_FILE);

  const routeManifest = await readManifest(routesManifestUri);

  const nestedRoutesJsonPath = path.join(pwd, NESTED_ROUTE_SPEC_FILE);

  const nestedRoutesJson = await readManifest(nestedRoutesJsonPath);

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

export const injectResourcePlugin = (
  applicationOptions?: SSRResourceApplicationOptions,
): ServerPlugin => ({
  name: '@modern-js/plugin-inject-resource',

  setup(api) {
    api.onPrepare(async () => {
      const {
        middlewares,
        routes,
        distDirectory: pwd,
      } = api.getServerContext();

      if (applicationOptions) {
        if (applicationOptions.resolveScope && !applicationOptions.reloadEntry)
          throw new Error(
            'Scoped SSR requests require a compiled entry reloader',
          );
        const context = api.getServerContext();
        if (
          api.getServerConfig().server?.rsc ||
          routes.some(route => route.isRSC)
        ) {
          throw new Error(
            'SSR application updates support ordinary HTML SSR only',
          );
        }
        if (!context.getRenderOptions || !context.serverBase) {
          throw new Error(
            'SSR application requires the Modern render and server owners',
          );
        }
        let published: SSRApplicationResources | undefined;
        const application = await createSSRApplication({
          ...applicationOptions,
          load: async (rebuilding, entries) => {
            const selectedRoutes = entries
              ? routes.filter(route =>
                  entries.includes(route.entryName || MAIN_ENTRY_NAME),
                )
              : routes;
            if (
              entries?.some(
                entry =>
                  !selectedRoutes.some(
                    route => (route.entryName || MAIN_ENTRY_NAME) === entry,
                  ),
              )
            )
              throw new Error('Unknown SSR entry in update scope');
            if (entries && !applicationOptions.reloadEntry)
              throw new Error(
                'Selective SSR updates require a compiled entry reloader',
              );
            if (rebuilding && !entries) {
              // These are the declared application roots. The invalidator owns
              // transitive bundler/module state and must preserve shared modules.
              for (const route of selectedRoutes) {
                if (!route.bundle) continue;
                const roots = [
                  path.resolve(pwd!, route.bundle),
                  path.resolve(
                    pwd!,
                    SERVER_BUNDLE_DIRECTORY,
                    `${route.entryName || MAIN_ENTRY_NAME}-server-loaders.js`,
                  ),
                ];
                for (const filename of roots) {
                  if (!(await fs.pathExists(filename))) continue;
                  const require = createRequire(filename);
                  delete require.cache[require.resolve(filename)];
                }
              }
            }
            // allSettled prevents a failed loader from abandoning concurrent preparation.
            const loaded = await Promise.allSettled([
              getHtmlTemplates(pwd!, selectedRoutes, { fresh: true }),
              getServerManifest(pwd!, selectedRoutes, undefined, {
                reloadable: true,
                reloadEntry: entries
                  ? applicationOptions.reloadEntry
                  : undefined,
              }),
              getRenderHandler(context.getRenderOptions),
            ]);
            const failures = loaded.filter(
              result => result.status === 'rejected',
            );
            if (failures.length)
              throw new AggregateError(
                failures.map(result => result.reason),
                'SSR resource preparation failed',
              );
            const value = <T>(result: PromiseSettledResult<T>): T => {
              if (result.status === 'rejected') throw result.reason;
              return result.value;
            };
            const templates = {
              ...(entries ? published?.templates : {}),
              ...value(loaded[0]),
            };
            const loadedManifest = value(loaded[1]);
            // Publish fresh maps; active unrelated requests keep their old snapshot.
            const serverManifest = entries
              ? {
                  ...published?.serverManifest,
                  renderBundles: {
                    ...published?.serverManifest.renderBundles,
                    ...loadedManifest.renderBundles,
                  },
                  loaderBundles: {
                    ...published?.serverManifest.loaderBundles,
                    ...loadedManifest.loaderBundles,
                  },
                }
              : loadedManifest;
            const render = value(loaded[2]);
            for (const route of routes) {
              if (!route.entryName) continue;
              if (!templates[uniqueKeyByRoute(route)])
                throw new Error(`Missing SSR template: ${route.entryName}`);
              if (!route.isSSR) continue;
              const handler =
                await serverManifest.renderBundles?.[route.entryName]
                  ?.requestHandler;
              if (typeof handler !== 'function')
                throw new Error(`Invalid SSR entry: ${route.entryName}`);
              const loaderPath = path.join(
                pwd!,
                SERVER_BUNDLE_DIRECTORY,
                `${route.entryName}-server-loaders.js`,
              );
              if (await fs.pathExists(loaderPath)) {
                if (
                  typeof serverManifest.loaderBundles?.[route.entryName]
                    ?.handleRequest !== 'function'
                )
                  throw new Error(`Invalid SSR loader: ${route.entryName}`);
              }
            }
            const resources = { templates, serverManifest, render };
            await applicationOptions.validate?.(resources);
            published = resources;
            return resources;
          },
        });
        // Mounted before ServerBase installs plugin middlewares, including custom
        // pre/render middleware. Those must not capture resources before admission.
        context.serverBase.setRequestMiddleware(application.middleware);
        applicationOptions.onReady(application);
        return;
      }

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
