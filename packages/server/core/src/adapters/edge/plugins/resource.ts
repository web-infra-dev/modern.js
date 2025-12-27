import path from 'path';
import type { ServerRoute } from '@modern-js/types';
import {
  LOADABLE_STATS_FILE,
  MAIN_ENTRY_NAME,
  NESTED_ROUTE_SPEC_FILE,
  ROUTE_MANIFEST_FILE,
  SERVER_BUNDLE_DIRECTORY,
} from '@modern-js/utils';
import type {
  Middleware,
  ServerEnv,
  ServerManifest,
  ServerPlugin,
} from '../../../types';
import { uniqueKeyByRoute } from '../../../utils';
import { loadDeps } from '../helper';

export async function getHtmlTemplates(routes: ServerRoute[], deps: any) {
  const htmlRoutes = routes.filter(route => route.entryName);

  const htmls = await Promise.all(
    htmlRoutes.map(async route => {
      const html = await loadDeps(route.entryPath, deps);
      return [uniqueKeyByRoute(route), html];
    }) || [],
  );

  const templates: Record<string, string> = Object.fromEntries(htmls);

  return templates;
}

export function injectTemplates(
  htmlTemplatePromise: ReturnType<typeof getHtmlTemplates>,
  routes?: ServerRoute[],
): Middleware<ServerEnv> {
  return async (c, next) => {
    if (routes && !c.get('templates')) {
      const templates = await htmlTemplatePromise;
      c.set('templates', templates);
    }

    await next();
  };
}

export async function getServerManifest(
  routes: ServerRoute[],
  deps: any,
): Promise<ServerManifest> {
  const loaderBundles: Record<string, any> = {};
  const renderBundles: Record<string, any> = {};

  await Promise.all(
    routes
      .filter(route => Boolean(route.bundle))
      .map(async route => {
        const entryName = route.entryName || MAIN_ENTRY_NAME;

        const renderBundle = await loadDeps(route.bundle || '', deps);
        const loaderBundle = await loadDeps(
          path.join(SERVER_BUNDLE_DIRECTORY, `${entryName}-server-loaders.js`),
          deps,
        );

        renderBundle && (renderBundles[entryName] = renderBundle);
        loaderBundle &&
          (loaderBundles[entryName] = loaderBundle?.loadModules
            ? await loaderBundle?.loadModules()
            : loaderBundle);
      }),
  );

  const loadableStats = await loadDeps(LOADABLE_STATS_FILE, deps);
  const routeManifest = await loadDeps(ROUTE_MANIFEST_FILE, deps);
  const nestedRoutesJson = await loadDeps(NESTED_ROUTE_SPEC_FILE, deps);

  return {
    loaderBundles,
    renderBundles,
    loadableStats,
    routeManifest,
    nestedRoutesJson,
  };
}

export function injectServerManifest(
  manifestPromise: ReturnType<typeof getServerManifest>,
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

// not implemented for edge function now
// export async function getRscServerManifest(pwd: string) {
//   const rscServerManifest = await compatibleRequire(
//     path.join(pwd, 'bundles', 'react-server-manifest.json'),
//   ).catch(_ => undefined);
//   return rscServerManifest;
// }

// export async function getClientManifest(pwd: string) {
//   const rscClientManifest = await compatibleRequire(
//     path.join(pwd, 'react-client-manifest.json'),
//   ).catch(_ => undefined);
//   return rscClientManifest;
// }

// export async function getRscSSRManifest(pwd: string) {
//   const rscSSRManifest = await compatibleRequire(
//     path.join(pwd, 'react-ssr-manifest.json'),
//   ).catch(_ => undefined);
//   return rscSSRManifest;
// }

// export const injectRscManifestPlugin = (deps: any): ServerPlugin => ({
//   name: '@modern-js/plugin-inject-rsc-manifest',
//   setup(api) {
//     api.onPrepare(() => {
//       const { middlewares, distDirectory: pwd } = api.getServerContext();
//       const config = api.getServerConfig();
//       // only rsc project need inject rsc manifest
//       if (!config.server?.rsc) {
//         return;
//       }

//       // TODO: should inject in prepare stage, not first request
//       middlewares.push({
//         name: 'inject-rsc-manifest',
//         handler: (async (c, next) => {
//           if (!c.get('rscServerManifest')) {
//             const rscServerManifest = await getRscServerManifest(pwd!);
//             c.set('rscServerManifest', rscServerManifest);
//           }

//           if (!c.get('rscClientManifest')) {
//             const rscClientManifest = await getClientManifest(pwd!);
//             c.set('rscClientManifest', rscClientManifest);
//           }

//           if (!c.get('rscSSRManifest')) {
//             const rscSSRManifest = await getRscSSRManifest(pwd!);
//             c.set('rscSSRManifest', rscSSRManifest);
//           }

//           await next();
//         }) as MiddlewareHandler,
//       });
//     });
//   },
// });

export const injectResourcePlugin = (deps: any): ServerPlugin => ({
  name: '@modern-js/plugin-inject-resource',

  setup(api) {
    api.onPrepare(() => {
      const { middlewares, routes } = api.getServerContext();

      const manifestPromise = getServerManifest(routes, deps);
      const htmlTemplatePromise = getHtmlTemplates(routes || [], deps);

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
