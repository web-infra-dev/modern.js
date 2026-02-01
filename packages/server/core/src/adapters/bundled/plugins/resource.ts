import path from 'path';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import type { Logger, Monitors, ServerRoute } from '@modern-js/types';
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
import { getBundledDep } from '../helper';

export async function getBundledHtmlTemplates(
  deps: Record<string, Promise<any>>,
  routes: ServerRoute[],
) {
  const htmlRoutes = routes.filter(route => route.entryName);

  const htmls = await Promise.all(
    htmlRoutes.map(async route => {
      const html = await getBundledDep(route.entryPath, deps);
      return [uniqueKeyByRoute(route), html];
    }) || [],
  );

  const templates: Record<string, string> = Object.fromEntries(htmls);

  return templates;
}

export function injectTemplates(
  htmlTemplatesPromise: ReturnType<typeof getBundledHtmlTemplates>,
  routes?: ServerRoute[],
): Middleware<ServerEnv> {
  return async (c, next) => {
    if (routes && !c.get('templates')) {
      const templates = await htmlTemplatesPromise;
      c.set('templates', templates);
    }

    await next();
  };
}

export async function getBundledServerManifest(
  deps: Record<string, Promise<any>>,
  routes: ServerRoute[],
): Promise<ServerManifest> {
  const loaderBundles: Record<string, any> = {};
  const renderBundles: Record<string, any> = {};

  await Promise.all(
    routes
      .filter(route => Boolean(route.bundle))
      .map(async route => {
        const entryName = route.entryName || MAIN_ENTRY_NAME;
        if (!route.bundleContent) {
          throw new Error(
            `Bundle content is not defined for route ${route.entryName}`,
          );
        }

        const renderBundle = await route.bundleContent();
        const loaderBundle = route.serverLoadersContent
          ? await route.serverLoadersContent()
          : undefined;

        renderBundle && (renderBundles[entryName] = renderBundle);
        loaderBundle &&
          (loaderBundles[entryName] = loaderBundle?.loadModules
            ? await loaderBundle?.loadModules()
            : loaderBundle);
      }),
  );

  const loadableStats = await getBundledDep(LOADABLE_STATS_FILE, deps).catch(
    _ => ({}),
  );
  const routeManifest = await getBundledDep(ROUTE_MANIFEST_FILE, deps).catch(
    _ => ({}),
  );
  const nestedRoutesJson = await getBundledDep(
    NESTED_ROUTE_SPEC_FILE,
    deps,
  ).catch(_ => ({}));

  return {
    loaderBundles,
    renderBundles,
    loadableStats,
    routeManifest,
    nestedRoutesJson,
  };
}

export function injectServerManifest(
  manifestPromise: ReturnType<typeof getBundledServerManifest>,
  routes?: ServerRoute[],
): Middleware<ServerEnv> {
  return async (c, next) => {
    if (routes && !c.get('serverManifest')) {
      const serverManifest = await manifestPromise;

      c.set('serverManifest', serverManifest);
    }

    await next();
  };
}

export async function getRscServerManifest(deps: Record<string, Promise<any>>) {
  const rscServerManifest = await getBundledDep(
    path.join('bundles', 'react-server-manifest.json'),
    deps,
  ).catch(_ => undefined);
  return rscServerManifest;
}

export async function getClientManifest(deps: Record<string, Promise<any>>) {
  const rscClientManifest = await getBundledDep(
    'react-client-manifest.json',
    deps,
  ).catch(_ => undefined);
  return rscClientManifest;
}

export async function getRscSSRManifest(deps: Record<string, Promise<any>>) {
  const rscSSRManifest = await getBundledDep(
    'react-ssr-manifest.json',
    deps,
  ).catch(_ => undefined);
  return rscSSRManifest;
}

export const injectRscManifestPlugin = (enableRsc: boolean): ServerPlugin => ({
  name: '@modern-js/plugin-inject-rsc-manifest',
  setup(api) {
    api.onPrepare(() => {
      const { middlewares, dependencies = {} } = api.getServerContext();
      // only rsc project need inject rsc manifest
      if (!enableRsc) {
        return;
      }

      // TODO: should inject in prepare stage, not first request
      middlewares.push({
        name: 'inject-rsc-manifest',
        handler: (async (c, next) => {
          if (!c.get('rscServerManifest')) {
            const rscServerManifest = await getRscServerManifest(dependencies);
            c.set('rscServerManifest', rscServerManifest);
          }

          if (!c.get('rscClientManifest')) {
            const rscClientManifest = await getClientManifest(dependencies);
            c.set('rscClientManifest', rscClientManifest);
          }

          if (!c.get('rscSSRManifest')) {
            const rscSSRManifest = await getRscSSRManifest(dependencies);
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
      const { middlewares, routes, dependencies = {} } = api.getServerContext();

      // In Production, should warmup server bundles on prepare.
      const htmlTemplatePromise = getBundledHtmlTemplates(
        dependencies,
        routes || [],
      );
      const manifestPromise = getBundledServerManifest(
        dependencies,
        routes || [],
      );

      middlewares.push({
        name: 'inject-server-manifest',
        handler: injectServerManifest(manifestPromise, routes),
      });

      middlewares.push({
        name: 'inject-html',
        handler: injectTemplates(htmlTemplatePromise, routes),
      });
    });
  },
});
