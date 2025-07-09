import { merge } from '@modern-js/runtime-utils/merge';
import {
  createRequestContext,
  reporterCtx,
} from '@modern-js/runtime-utils/node';
import {
  StaticRouterProvider,
  createStaticRouter,
} from '@modern-js/runtime-utils/node/router';
import { createStaticHandler } from '@modern-js/runtime-utils/remix-router';
import {
  type RouteObject,
  createRoutesFromElements,
} from '@modern-js/runtime-utils/router';
import { time } from '@modern-js/runtime-utils/time';
import { LOADER_REPORTER_NAME } from '@modern-js/utils/universal/constants';
import type React from 'react';
import { useContext } from 'react';
import { JSX_SHELL_STREAM_END_MARK } from '../../common';
import { RuntimeReactContext } from '../../core';
import type { RuntimePluginFuture } from '../../core';
import {
  type ServerPayload,
  getGlobalEnableRsc,
  getGlobalLayoutApp,
  getGlobalRoutes,
} from '../../core/context';
import { setServerPayload } from '../../core/context/serverPayload.server';
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

function createRemixReuqest(request: Request) {
  const method = 'GET';
  const { headers } = request;
  const controller = new AbortController();

  return new Request(request.url, {
    method,
    headers,
    signal: controller.signal,
  });
}

export const routerPlugin = (
  userConfig: Partial<RouterConfig> = {},
): RuntimePluginFuture<{
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
        } = context.ssrContext!;
        const { baseUrl } = request;
        const _basename =
          baseUrl === '/' ? urlJoin(baseUrl, basename) : baseUrl;
        const { reporter } = context.ssrContext!;
        const requestContext = createRequestContext(
          context.ssrContext?.loaderContext,
        );
        // TODO: we may remove it or put it to other runtime plugins in next version
        requestContext.set(reporterCtx, reporter);
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

        const { query } = createStaticHandler(routes, {
          basename: _basename,
        });

        // We can't pass post request to query,due to post request would trigger react-router submit action.
        // But user maybe do not define action for page.
        const remixRequest = createRemixReuqest(
          context.ssrContext!.request.raw,
        );

        const end = time();
        const routerContext = await query(remixRequest, {
          requestContext,
        });

        const cost = end();
        context.ssrContext?.onTiming?.(LOADER_REPORTER_NAME, cost);

        const isRSNavigation =
          remixRequest.headers.get('x-rsc-tree') === 'true';
        if (routerContext instanceof Response) {
          // React Router would return a Response when redirects occur in loader.
          // Throw the Response to bail out and let the server handle it with an HTTP redirect
          if (enableRsc && isRSNavigation) {
            return interrupt(
              handleRSCRedirect(
                routerContext.headers,
                _basename,
                routerContext.status,
              ),
            );
          } else {
            return interrupt(routerContext);
          }
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
          if (isRSNavigation) {
            for (const match of routerContext.matches) {
              if ((match.route as any).hasClientLoader) {
                delete routerContext.loaderData[match.route.id];
              }
            }
          }

          payload = createServerPayload(routerContext, routes);
          setServerPayload(payload);
        }

        // private api, pass to React Component in `wrapRoot`
        Object.defineProperty(context, 'routes', {
          get() {
            return routes;
          },
          enumerable: true,
        });
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
            const context = useContext(RuntimeReactContext);
            const { routerContext, ssrContext, routes } = context;
            const { nonce, mode, useJsonScript } = ssrContext!;
            const { basename } = routerContext!;

            const remixRouter = createStaticRouter(routes, routerContext!);
            if (!enableRsc) {
              const routerWrapper = (
                <>
                  <StaticRouterProvider
                    router={remixRouter!}
                    context={routerContext!}
                    hydrate={false}
                  />

                  {mode === 'stream' && (
                    // ROUTER_DATA will inject in `packages/runtime/plugin-runtime/src/core/server/string/ssrData.ts` in string ssr
                    // So we can inject it only when streaming ssr
                    <DeferredDataScripts
                      nonce={nonce}
                      context={routerContext!}
                      useJsonScript={useJsonScript}
                    />
                  )}
                  {mode === 'stream' && JSX_SHELL_STREAM_END_MARK}
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
