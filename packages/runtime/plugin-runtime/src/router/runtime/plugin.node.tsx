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
import { createRoutesFromElements } from '@modern-js/runtime-utils/router';
import { time } from '@modern-js/runtime-utils/time';
import { LOADER_REPORTER_NAME } from '@modern-js/utils/universal/constants';
import type React from 'react';
import { useContext } from 'react';
import { JSX_SHELL_STREAM_END_MARK } from '../../common';
import { RuntimeReactContext } from '../../core';
import type { Plugin } from '../../core';
import { getGlobalLayoutApp, getGlobalRoutes } from '../../core/context';
import DeferredDataScripts from './DeferredDataScripts.node';
import {
  beforeCreateRoutes as beforeCreateRoutesHook,
  modifyRoutes as modifyRoutesHook,
} from './hooks';
import type { RouterConfig } from './types';
import { renderRoutes, urlJoin } from './utils';

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
): Plugin => {
  return {
    name: '@modern-js/plugin-router',
    registerHook: {
      modifyRoutes: modifyRoutesHook,
      beforeCreateRoutes: beforeCreateRoutesHook,
    },
    setup: api => {
      let finalRouteConfig: any = {};

      return {
        async beforeRender(context, interrupt) {
          const pluginConfig: Record<string, any> =
            api.useRuntimeConfigContext();
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
          requestContext.set(reporterCtx, reporter);
          const runner = (api as any).useHookRunners();

          await runner.beforeCreateRoutes(context);

          let routes = createRoutes
            ? createRoutes()
            : createRoutesFromElements(
                renderRoutes({
                  routesConfig: finalRouteConfig,
                  ssrMode,
                  props: {
                    nonce,
                  },
                  reporter,
                }),
              );

          routes = runner.modifyRoutes(routes);

          const { query } = createStaticHandler(routes, {
            basename: _basename,
          });

          // We can't pass post request to query,due to post request would triger react-router submit action.
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

          if (routerContext instanceof Response) {
            // React Router would return a Response when redirects occur in loader.
            // Throw the Response to bail out and let the server handle it with an HTTP redirect

            return interrupt(routerContext);
          }

          if (
            routerContext.statusCode >= 500 &&
            routerContext.statusCode < 600 &&
            loaderFailureMode === 'clientRender'
          ) {
            routerContext.statusCode = 200;
            throw (routerContext.errors as Error[])[0];
          }

          const router = createStaticRouter(routes, routerContext);
          context.remixRouter = router;
          context.routerContext = routerContext;
          context.routes = routes;
        },
        wrapRoot: App => {
          // can not get routes config, skip wrapping React Router.
          // e.g. App.tsx as the entrypoint
          if (!finalRouteConfig) {
            return App;
          }

          const getRouteApp = () => {
            return (() => {
              const context = useContext(RuntimeReactContext);
              const { remixRouter, routerContext, ssrContext } = context;

              const { nonce, mode } = ssrContext!;

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
                    />
                  )}
                  {mode === 'stream' && JSX_SHELL_STREAM_END_MARK}
                </>
              );

              return App ? <App>{routerWrapper}</App> : routerWrapper;
            }) as React.FC<any>;
          };

          return getRouteApp();
        },
      };
    },
  };
};

export const modifyRoutes = () => {
  // empty
};
