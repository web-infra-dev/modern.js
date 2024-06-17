import React, { useContext } from 'react';
import { createStaticHandler } from '@modern-js/runtime-utils/remix-router';
import {
  createStaticRouter,
  StaticRouterProvider,
} from '@modern-js/runtime-utils/node/router';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { createRoutesFromElements } from '@modern-js/runtime-utils/router';
import {
  reporterCtx,
  createRequestContext,
} from '@modern-js/runtime-utils/node';
import { time } from '@modern-js/runtime-utils/time';
import { LOADER_REPORTER_NAME } from '@modern-js/utils/universal/constants';
import { JSX_SHELL_STREAM_END_MARK } from '../../common';
import { RuntimeReactContext } from '../../core';
import type { Plugin } from '../../core';
import { SSRServerContext } from '../../ssr/serverRender/types';
import type { RouteManifest, RouterConfig } from './types';
import { renderRoutes, urlJoin } from './utils';
import { modifyRoutes as modifyRoutesHook } from './hooks';
import DeferredDataScripts from './DeferredDataScripts.node';

// TODO: polish
function createFetchRequest(req: SSRServerContext['request']): Request {
  // const origin = `${req.protocol}://${req.get('host')}`;
  const origin = `${req.protocol}://${req.host}`;
  // Note: This had to take originalUrl into account for presumably vite's proxying
  const url = new URL(req.originalUrl || req.url, origin);

  const controller = new AbortController();

  const init = {
    method: req.method,
    headers: createFetchHeaders(req.headers),
    signal: controller.signal,
  };

  return new Request(url.href, init);
}

export function createFetchHeaders(
  requestHeaders: SSRServerContext['request']['headers'],
): Headers {
  const headers = new Headers();

  for (const [key, values] of Object.entries(requestHeaders || {})) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  return headers;
}

export const routerPlugin = ({
  basename = '',
  originalBaseUrl = '',
  routesConfig,
  createRoutes,
}: RouterConfig): Plugin => {
  return {
    name: '@modern-js/plugin-router',
    registerHook: {
      modifyRoutes: modifyRoutesHook,
    },
    setup: api => {
      return {
        async init({ context }, next) {
          // can not get routes config, skip wrapping React Router.
          // e.g. App.tsx as the entrypoint
          if (!routesConfig && !createRoutes) {
            return next({ context });
          }

          const {
            request,
            mode: ssrMode,
            nonce,
            loaderFailureMode = 'errorBoundary',
          } = context.ssrContext!;
          const baseUrl = originalBaseUrl || (request.baseUrl as string);
          const _basename =
            baseUrl === '/' ? urlJoin(baseUrl, basename) : baseUrl;
          const { reporter, serverTiming } = context.ssrContext!;
          const requestContext = createRequestContext(
            context.ssrContext?.loaderContext,
          );
          requestContext.set(reporterCtx, reporter);

          let routes = createRoutes
            ? createRoutes()
            : createRoutesFromElements(
                renderRoutes({
                  routesConfig,
                  ssrMode,
                  props: {
                    nonce,
                  },
                  reporter,
                }),
              );

          const runner = (api as any).useHookRunners();
          routes = runner.modifyRoutes(routes);

          const { query } = createStaticHandler(routes, {
            basename: _basename,
          });

          const remixRequest = createFetchRequest(request);

          const end = time();
          const routerContext = await query(remixRequest, {
            requestContext,
          });
          const cost = end();
          reporter?.reportTiming(LOADER_REPORTER_NAME, cost);
          serverTiming.addServeTiming(LOADER_REPORTER_NAME, cost);

          if (routerContext instanceof Response) {
            // React Router would return a Response when redirects occur in loader.
            // Throw the Response to bail out and let the server handle it with an HTTP redirect
            return routerContext as any;
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
          // set routeManifest in context to be consistent with csr context
          context.routeManifest = context.ssrContext!
            .routeManifest as RouteManifest;

          return next({ context });
        },
        hoc: ({ App, config }, next) => {
          // can not get routes config, skip wrapping React Router.
          // e.g. App.tsx as the entrypoint
          if (!routesConfig) {
            return next({ App, config });
          }

          const getRouteApp = () => {
            return (props => {
              const { remixRouter, routerContext, ssrContext } =
                useContext(RuntimeReactContext);

              const { nonce, mode } = ssrContext!;
              return (
                <App {...props}>
                  <StaticRouterProvider
                    router={remixRouter!}
                    context={routerContext!}
                    hydrate={false}
                  />
                  <DeferredDataScripts nonce={nonce} context={routerContext!} />
                  {mode === 'stream' && JSX_SHELL_STREAM_END_MARK}
                </App>
              );
            }) as React.FC<any>;
          };

          const RouteApp = getRouteApp();

          if (routesConfig?.globalApp) {
            return next({
              App: hoistNonReactStatics(RouteApp, routesConfig.globalApp),
              config,
            });
          }

          return next({
            App: RouteApp,
            config,
          });
        },
        pickContext: ({ context, pickedContext }, next) => {
          const { remixRouter } = context;

          // remixRouter is not existed in conventional routes
          if (!remixRouter) {
            return next({ context, pickedContext });
          }

          // only export partial common API from remix-router
          const router = {
            navigate: remixRouter.navigate,
            get location() {
              return remixRouter.state.location;
            },
          };

          return next({
            context,
            pickedContext: {
              ...pickedContext,
              router,
            },
          });
        },
      };
    },
  };
};

export const modifyRoutes = () => {
  // empty
};
