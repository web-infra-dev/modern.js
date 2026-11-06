import { merge } from '@modern-js/runtime-utils/merge';
import {
  createRequestContext,
  reporterCtx,
} from '@modern-js/runtime-utils/node';
import { createStaticHandler } from '@modern-js/runtime-utils/router';
import {
  StaticRouterProvider,
  createStaticRouter,
} from '@modern-js/runtime-utils/router';
import {
  type RouteObject,
  createRoutesFromElements,
} from '@modern-js/runtime-utils/router';
import { time } from '@modern-js/runtime-utils/time';
import { LOADER_REPORTER_NAME } from '@modern-js/utils/universal/constants';
import type React from 'react';
import { useContext } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { RuntimePlugin } from '../../core';
import {
  InternalRuntimeContext,
  type ServerPayload,
  getGlobalEnableRsc,
  getGlobalLayoutApp,
  getGlobalRoutes,
} from '../../core/context';
import { setServerPayload } from '../../core/context/serverPayload/index.server';
import DeferredDataScripts from './DeferredDataScripts.node';
import {
  type RouterExtendsHooks,
  modifyRoutes as modifyRoutesHook,
  onBeforeCreateRoutes as onBeforeCreateRoutesHook,
} from './hooks';
import {
  RSCStaticRouter,
  createServerPayload,
  handleRSCRedirect,
  prepareRSCRoutes,
} from './rsc-router';
import type { RouterConfig } from './types';
import { createRouteObjectsFromConfig, renderRoutes, urlJoin } from './utils';

/**
 * While prerendering a page for partial prerendering, loaders do not run:
 * routes with data loaders are postponed by `DynamicBoundary` instead.
 * Loaders still resolve (to `null`) so that every matched route has loader
 * data and renders its element rather than a hydration fallback.
 */
const skippedLoader = () => null;
function withSkippedLoaders(routes: RouteObject[]): RouteObject[] {
  return routes.map(
    route =>
      ({
        ...route,
        loader: route.loader ? skippedLoader : undefined,
        children: route.children
          ? withSkippedLoaders(route.children)
          : undefined,
      }) as RouteObject,
  );
}

function createRemixRequest(request: Request) {
  const method = 'GET';
  const { headers } = request;

  return new Request(request.url, {
    method,
    headers,
    signal: request.signal,
  });
}

export const routerPlugin = (
  userConfig: Partial<RouterConfig> = {},
): RuntimePlugin<{
  extendHooks: RouterExtendsHooks;
}> => {
  return {
    name: '@modern-js/plugin-router',
    registryHooks: {
      modifyRoutes: modifyRoutesHook,
      onBeforeCreateRoutes: onBeforeCreateRoutesHook,
    },
    setup: api => {
      let finalRouteConfig: any = {};

      api.onBeforeRender(async (context, interrupt) => {
        const pluginConfig: Record<string, any> = api.getRuntimeConfig();
        const {
          basename = '',
          routesConfig,
          createRoutes,
        } = merge(pluginConfig.router || {}, userConfig);
        finalRouteConfig = {
          routes: getGlobalRoutes(),
          globalApp: getGlobalLayoutApp(),
          ...routesConfig,
        };
        // can not get routes config, skip wrapping React Router.
        // e.g. App.tsx as the entrypoint
        if (!finalRouteConfig.routes && !createRoutes) {
          return;
        }

        const enableRsc = getGlobalEnableRsc();

        if (enableRsc) {
          await prepareRSCRoutes(finalRouteConfig.routes);
        }

        const {
          request,
          mode: ssrMode,
          nonce,
          loaderFailureMode = 'errorBoundary',
          baseUrl,
        } = context.ssrContext!;
        const _basename =
          baseUrl === '/' ? urlJoin(baseUrl, basename) : baseUrl;

        const requestContext = createRequestContext(
          context.ssrContext?.loaderContext,
        );
        const hooks = api.getHooks();

        await hooks.onBeforeCreateRoutes.call(context);

        let routes: RouteObject[] = [];
        if (enableRsc) {
          routes = createRoutes
            ? createRoutes()
            : createRouteObjectsFromConfig({
                routesConfig: finalRouteConfig,
              });
        } else {
          routes = createRoutes
            ? createRoutes()
            : createRoutesFromElements(
                renderRoutes({
                  routesConfig: finalRouteConfig,
                  ssrMode,
                  props: {
                    nonce,
                  },
                }),
              );
        }

        routes = hooks.modifyRoutes.call(routes);

        const ppr = enableRsc ? undefined : context.ssrContext?.ppr;

        const { query } = createStaticHandler(
          ppr?.phase === 'prerender' ? withSkippedLoaders(routes) : routes,
          {
            basename: _basename,
          },
        );

        // We can't pass post request to query,due to post request would trigger react-router submit action.
        // But user maybe do not define action for page.
        const remixRequest = createRemixRequest(
          context.ssrContext!.request.raw,
        );

        // private api, pass to React Component in `wrapRoot`
        Object.defineProperty(context, 'routes', {
          get() {
            return routes;
          },
          enumerable: true,
        });

        // Resolves to a Response when the render must be interrupted (redirect).
        const runLoaders = async (): Promise<Response | undefined> => {
          const end = time();
          const routerContext = await query(remixRequest, {
            requestContext,
          });

          const cost = end();
          context.ssrContext?.onTiming?.(LOADER_REPORTER_NAME, cost);

          const isRSCNavigation =
            remixRequest.headers.get('x-rsc-tree') === 'true';
          if (routerContext instanceof Response) {
            // React Router would return a Response when redirects occur in loader.
            // Throw the Response to bail out and let the server handle it with an HTTP redirect
            if (enableRsc && isRSCNavigation) {
              return handleRSCRedirect(
                routerContext.headers,
                _basename,
                routerContext.status,
              );
            }
            return routerContext;
          }

          // Now `throw new Response` or `throw new Error` is same, both will be caught by errorBoundary by default
          // If loaderFailureMode is 'clientRender', we will downgrade to csr, and the loader will be request in client again
          const errors = Object.values(
            (routerContext.errors || {}) as Record<string, Error>,
          );
          if (
            // TODO: if loaderFailureMode is not 'errroBoundary', error log will not be printed.
            errors.length > 0 &&
            loaderFailureMode === 'clientRender'
          ) {
            routerContext.statusCode = 200;
            throw errors[0];
          }
          context.routerContext = routerContext;

          let payload: ServerPayload;
          if (enableRsc) {
            // In order to execute the client loader, refer to the ServerRouter implementation of react-router.
            if (isRSCNavigation) {
              for (const match of routerContext.matches) {
                if ((match.route as any).hasClientLoader) {
                  delete routerContext.loaderData[match.route.id];
                }
              }
            }

            payload = createServerPayload(routerContext, routes);
            setServerPayload(payload);
          }
          return undefined;
        };

        if (ppr?.phase === 'resume') {
          const { nonce: scriptNonce, useJsonScript } = context.ssrContext!;
          ppr.renderRouterData = () =>
            context.routerContext
              ? renderToStaticMarkup(
                  <DeferredDataScripts
                    nonce={scriptNonce}
                    context={context.routerContext}
                    useJsonScript={useJsonScript}
                  />,
                )
              : '';
          // The request handler sends the prelude first and awaits loaders
          // afterwards, see `core/server/ppr`.
          const pending = runLoaders();
          // Rejections are handled by the request handler awaiting `pending`.
          pending.catch(() => {});
          ppr.pendingBeforeRender = pending;
          return;
        }

        const response = await runLoaders();
        if (response) {
          return interrupt(response);
        }
      });

      api.wrapRoot(App => {
        // can not get routes config, skip wrapping React Router.
        // e.g. App.tsx as the entrypoint
        if (!finalRouteConfig) {
          return App;
        }

        const getRouteApp = () => {
          const enableRsc = getGlobalEnableRsc();
          return (props => {
            const context = useContext(InternalRuntimeContext);
            const { routerContext, ssrContext, routes } = context;
            const { nonce, mode, useJsonScript, ppr } = ssrContext!;
            // A page served from its prelude writes router data after the
            // prelude, see `core/server/ppr`. Otherwise it streams as usual.
            const injectRouterData =
              mode === 'stream' ||
              (mode === 'ppr' && ppr?.phase === 'resume' && !ppr.fromPrelude);
            const { basename } = routerContext!;

            const remixRouter = createStaticRouter(routes!, routerContext!);
            if (!enableRsc) {
              const routerWrapper = (
                <>
                  <StaticRouterProvider
                    router={remixRouter!}
                    context={routerContext!}
                    hydrate={false}
                  />

                  {injectRouterData && (
                    // ROUTER_DATA will inject in `packages/runtime/plugin-runtime/src/core/server/string/ssrData.ts` in string ssr
                    // So we can inject it only when streaming ssr
                    <DeferredDataScripts
                      nonce={nonce}
                      context={routerContext!}
                      useJsonScript={useJsonScript}
                    />
                  )}
                </>
              );
              return App ? <App>{routerWrapper}</App> : routerWrapper;
            } else {
              return App ? (
                <App>
                  <RSCStaticRouter basename={basename} />
                </App>
              ) : (
                <RSCStaticRouter basename={basename} />
              );
            }
          }) as React.FC<any>;
        };

        return getRouteApp();
      });
    },
  };
};

export const modifyRoutes = () => {
  // empty
};
