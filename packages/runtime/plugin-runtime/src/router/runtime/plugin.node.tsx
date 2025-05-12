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
import { getGlobalLayoutApp, getGlobalRoutes } from '../../core/context';
import DeferredDataScripts from './DeferredDataScripts.node';
import {
  type RouterExtendsHooks,
  modifyRoutes as modifyRoutesHook,
  onBeforeCreateRoutes as onBeforeCreateRoutesHook,
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

        let routes: RouteObject[] = createRoutes
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

        if (routerContext instanceof Response) {
          // React Router would return a Response when redirects occur in loader.
          // Throw the Response to bail out and let the server handle it with an HTTP redirect
          return interrupt(routerContext);
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

        const router = createStaticRouter(routes, routerContext);
        // routerContext is used in in css collector、handle status code、inject loader data in html
        context.routerContext = routerContext;

        // private api, pass to React Component in `wrapRoot`
        // in the browser, we not need to pass router, cause we create Router in `wrapRoot`
        // but in node, we need to pass router, cause we need run async function, it can only run in `beforeRender`
        // when we deprecated React 17, we can use Suspense to handle this async function
        // so the `remixRouter` has no type declare in RuntimeContext
        context.remixRouter = router;

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
          return (() => {
            const context = useContext(RuntimeReactContext);
            const { remixRouter, routerContext, ssrContext } = context;

            const { nonce, mode, useJsonScript } = ssrContext!;

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
